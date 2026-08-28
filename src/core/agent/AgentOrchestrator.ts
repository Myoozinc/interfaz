import type { FullStackProject, ToolCall } from '../types';
import { OllamaProvider } from '../providers/OllamaProvider';
import { ToolRegistry } from './ToolRegistry';
import { agentEvents } from './AgentEvents';

export class AgentOrchestrator {
  private aiProvider: OllamaProvider;
  private toolRegistry: ToolRegistry;

  constructor() {
    this.aiProvider = new OllamaProvider('/api/agent', 'qwen/qwen3.8-27b');
    this.toolRegistry = new ToolRegistry();
  }

  setEndpoint(url: string) {
    this.aiProvider.setBaseUrl(url);
  }

  setModel(model: string) {
    this.aiProvider.setDefaultModel(model);
  }

  private isNewAppRequest(instruction: string): boolean {
    const lower = instruction.toLowerCase().trim();
    const creationKeywords = [
      'haz una', 'haz un', 'crea una', 'crea un', 'crear', 'hacer', 'desarrolla',
      'construye', 'quiero una', 'quiero un', 'quiero hacer', 'nuevo proyecto',
      'juego de', 'app de', 'saas de', 'plataforma de', 'simulador de'
    ];
    const isModification = [
      'cambia', 'modifica', 'agrega', 'añade', 'elimina', 'quita', 'pon de color',
      'corrige', 'arregla', 'ajusta', 'reemplaza', 'mejora este', 'actualiza'
    ].some(k => lower.startsWith(k));

    if (isModification) return false;
    return creationKeywords.some(k => lower.includes(k));
  }

  async run(
    userInstruction: string,
    project: FullStackProject,
    onProgress: (text: string, isThinking?: boolean) => void,
    options?: {
      images?: string[];
      links?: string[];
      signal?: AbortSignal;
    }
  ): Promise<{ responseText: string; updatedProject: FullStackProject }> {
    agentEvents.emit('agent.started', `Iniciando arquitectura con Qwen 3.8: "${userInstruction.slice(0, 45)}..."`);

    const mainFile = project.files['index.html'] || Object.values(project.files)[0];
    let currentCode = mainFile?.content || '';

    const isNew = this.isNewAppRequest(userInstruction) || currentCode.length < 50 || currentCode.includes('Lienzo Listo');

    const hasImages = (options?.images || []).length > 0;
    const hasLinks = (options?.links || []).length > 0;

    let instructionAugmented = userInstruction;
    if (hasLinks) {
      instructionAugmented += `\nENLACES Y REFERENCIAS: ${options!.links!.join(', ')}`;
    }
    if (hasImages) {
      instructionAugmented += `\n[Analiza las capturas adjuntas y replica/corrige la interfaz fielmente]`;
    }

    const systemPrompt = `Eres NONA AI ARCHITECT, una fábrica de software e inteligencia artificial de clase mundial potenciada por Qwen 3.8.

REGLAS DE ARQUITECTURA:
1. SI EL USUARIO PIDE UN JUEGO 3D O MUNDO VIRTUAL:
   - Usa Three.js (https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js).
   - Crea un juego 100% jugable: inicializa Scene, PerspectiveCamera, WebGLRenderer(antialias: true, shadowMap), Lights (Ambient + Directional con sombras), suelo/pista 3D con texturas o materiales, jugador 3D (malla de auto/nave/personaje), obstáculos o rivales con IA simple, controles de teclado WASD/Flechas (keydown/keyup), bucle animate() con requestAnimationFrame() actualizando física, velocidad, rotación y cámara en tercera persona, minimapa 2D en esquina, y HUD superpuesto (Velocímetro, Vueltas, Puntuación, Botón Iniciar/Reiniciar).
   - Añade efectos de sonido sintéticos con Web Audio API (sonido de motor, aceleración, colisión y victoria).

2. SI EL USUARIO PIDE UN SAAS, DASHBOARD O APP:
   - Usa Tailwind CSS (https://cdn.tailwindcss.com) y Lucide Icons (https://unpkg.com/lucide@latest).
   - Crea una interfaz ultra-moderna y completa: sidebar navegable, múltiples vistas dinámicas (Analytics, Gestión, Configuración), gráficos interactivos (con Canvas o Chart.js), modales funcionales para crear/editar registros, filtros de búsqueda en tiempo real, persistencia con LocalStorage y feedback visual con toasts.

3. FORMATO DE SALIDA OBLIGATORIO:
   - Inicia con una breve explicación CONVERSACIONAL (2-3 párrafos) resumiendo la aplicación, controles y características.
   - Inserta TODO el código en un ÚNICO bloque \`\`\`html filename=index.html que contenga <!DOCTYPE html> completo y funcional.
   - NUNCA generes una landing page vacía cuando el usuario pida un juego o una aplicación. El código debe ser 100% interactivo y ejecutable de inmediato.`;

    const userPrompt = !isNew
      ? `MODIFICA LA SIGUIENTE APLICACIÓN EXISTENTE SEGÚN LA INSTRUCCIÓN:
\`\`\`html
${currentCode.slice(0, 6000)}
\`\`\`

INSTRUCCIÓN: ${instructionAugmented}
Genera la explicación conversacional y el bloque de código actualizado completo \`\`\`html filename=index.html.`
      : `CREA DESDE CERO LA SIGUIENTE APLICACIÓN O JUEGO 100% COMPLETO Y FUNCIONAL:
${instructionAugmented}

Genera la explicación conversacional y el bloque de código completo \`\`\`html filename=index.html listo para ejecutar o jugar.`;

    agentEvents.emit('agent.thinking', hasImages ? 'Analizando imagen multimodal...' : 'Qwen 3.8 programando aplicación completa...');

    let fullText = '';
    try {
      fullText = await this.aiProvider.streamChat(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt, images: options?.images }
        ],
        (chunk, full, isThinking) => {
          if (isThinking) {
            onProgress(chunk, true);
          } else {
            let chatDisplay = full;
            if (chatDisplay.includes('```html')) {
              const parts = chatDisplay.split('```html');
              chatDisplay = parts[0].trim() + '\n\n*(⚡ Generando motor de la aplicación y renderizando en vivo...)*';
            }
            onProgress(chatDisplay || full, false);
          }
        },
        { signal: options?.signal, model: 'qwen/qwen3.8-27b' }
      );
    } catch (err: any) {
      agentEvents.emit('agent.error', `Error en motor Qwen 3.8: ${err.message}`);
      throw err;
    }

    // 2. Parse Code Blocks and apply to Workspace Files
    let blocksFound = 0;
    const codeBlockRegex = /```(\w+)?(?:\s+filename=([^\n]+))?\n([\s\S]*?)```/g;
    let match;

    while ((match = codeBlockRegex.exec(fullText)) !== null) {
      blocksFound++;
      const lang = match[1] || 'html';
      const filename = match[2];
      const code = match[3].trim();

      const targetPath = filename || (
        lang === 'sql' ? 'schema.sql' : 
        lang === 'json' ? 'package.json' : 
        'index.html'
      );

      const toolCall: ToolCall = {
        id: 'tc_' + Date.now() + '_' + blocksFound,
        name: 'project_write_file',
        arguments: { path: targetPath, content: code }
      };

      await this.toolRegistry.executeTool(toolCall, project);
    }

    // Robust Fallback: Handles unclosed codeblocks or raw HTML output
    if (blocksFound === 0) {
      let rawCode = '';
      const openBlockMatch = fullText.match(/```(?:html)?(?:\s+filename=[^\n]+)?\s*\n([\s\S]+)/i);
      if (openBlockMatch) {
        rawCode = openBlockMatch[1];
      } else if (fullText.includes('<!DOCTYPE html>') || fullText.includes('<html')) {
        const start = fullText.indexOf('<!DOCTYPE html>') !== -1 ? fullText.indexOf('<!DOCTYPE html>') : fullText.indexOf('<html');
        rawCode = fullText.slice(start);
      }

      if (rawCode.trim().length > 20) {
        rawCode = rawCode.replace(/```\s*$/, '').trim();
        if (!rawCode.includes('</html>')) {
          if (rawCode.includes('<script') && !rawCode.includes('</script>')) {
            rawCode += '\n</script>';
          }
          if (rawCode.includes('<body') && !rawCode.includes('</body>')) {
            rawCode += '\n</body>';
          }
          rawCode += '\n</html>';
        }

        await this.toolRegistry.executeTool({
          id: 'tc_' + Date.now(),
          name: 'project_write_file',
          arguments: { path: 'index.html', content: rawCode }
        }, project);
        blocksFound++;
      }
    }

    // 3. Build & Validation Step
    const buildResult = await this.toolRegistry.executeTool({
      id: 'tc_build_' + Date.now(),
      name: 'build_project',
      arguments: {}
    }, project);

    if (buildResult.success) {
      agentEvents.emit('agent.completed', 'Aplicación generada y verificada con Qwen 3.8.');
    }

    // 4. Format Clean Conversational Response for Chat
    let conversationalResponse = fullText;
    if (fullText.includes('```html')) {
      const parts = fullText.split('```html');
      conversationalResponse = parts[0].trim();
      if (!conversationalResponse) {
        conversationalResponse = 'He programado y estructurado la aplicación solicitada con éxito.';
      }
    } else if (fullText.includes('<!DOCTYPE html>')) {
      const idx = fullText.indexOf('<!DOCTYPE html>');
      conversationalResponse = fullText.slice(0, idx).trim() || 'Aplicación generada con éxito.';
    }

    return { responseText: conversationalResponse, updatedProject: project };
  }
}

export const agentOrchestrator = new AgentOrchestrator();
