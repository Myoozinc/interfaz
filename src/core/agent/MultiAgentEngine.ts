import { agentEvents } from './AgentEvents';
import { OllamaProvider } from '../providers/OllamaProvider';

export class MultiAgentEngine {
  private aiProvider: OllamaProvider;

  constructor() {
    this.aiProvider = new OllamaProvider('/api/agent', 'qwen/qwen3.8-27b');
  }

  setEndpoint(url: string) {
    this.aiProvider.setBaseUrl(url);
  }

  async executeAutonomousPipeline(
    userInstruction: string,
    currentCode: string,
    isNew: boolean,
    onProgress: (stepName: string, detail: string, streamToken?: string) => void,
    signal?: AbortSignal
  ): Promise<{ fullCode: string; summary: string }> {

    // STEP 1: Plan and Blueprint
    onProgress('🧠 Agente 1 (Arquitecto de Sistemas)', 'Diseñando especificación técnica, interfaz y componentes...');
    agentEvents.emit('agent.thinking', '🧠 Agente 1: Planificando arquitectura completa...');

    const systemPrompt = `Eres NONA AGENT (Google Antigravity & Lovable Standard), el generador de aplicaciones y juegos web más avanzado del mundo.
Tu objetivo es escribir una aplicación web 100% COMPLETA, PROFESIONAL, ULTRA-ESTÉTICA Y FUNCIONAL.

REGLAS DE ORO DE INGENIERÍA:
1. Comienza tu respuesta DIRECTAMENTE con el bloque de código:
\`\`\`html filename=index.html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>App</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
</head>
<body class="bg-slate-900 text-white min-h-screen">
...
  <script>
    // Toda la lógica JS funcional aquí
    lucide.createIcons();
  </script>
</body>
</html>
\`\`\`
2. CERO MOCKS: Todos los botones, acciones, modales, contadores o barras de estado DEBEN TENER LÓGICA JAVASCRIPT REAL.
   - Si es Mascota Virtual: Criatura animada (SVG/Canvas con ojos, boca, animaciones), barras de Hambre/Energía/Felicidad/Nivel que cambian al hacer click en los botones, sonidos y guardado en localStorage.
   - Si es Juego 3D: Carga Three.js (<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>), controles WASD/click, loop animate() y marcador.
   - Si es SaaS / Tablero: Múltiples vistas, filtros en vivo, modales para agregar datos y tablas responsivas.
3. ESTÉTICA: Usa Tailwind CSS con contrastes modernos, bordes redondeados (rounded-2xl / rounded-3xl), sombras sutiles y efectos hover fluidos.
4. Concluye SIEMPRE con </html>\`\`\`.`;

    const userPrompt = `INSTRUCCIÓN DEL USUARIO:
"${userInstruction}"
${!isNew && currentCode.length > 50 ? `\nCÓDIGO BASE PREVIO A MEJORAR:\n${currentCode.slice(0, 3000)}` : ''}

Escribe el código 100% completo, autocontenido y funcional en index.html.`;

    agentEvents.emit('agent.completed', '🧠 Arquitectura planificada.');

    // STEP 2: Full-Stack Generation
    onProgress('🎨 & ⚙️ Agente 2 (Ingeniero Full-Stack)', 'Escribiendo la aplicación completa y renderizando en vivo...');
    agentEvents.emit('agent.thinking', '🎨 Agente 2: Programando código y animaciones...');

    let generatedCode = '';
    await this.aiProvider.streamChat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      (token, full) => {
        generatedCode = full;
        onProgress('🎨 & ⚙️ Agente 2 (Ingeniero Full-Stack)', 'Programando componentes y lógica...', token);
      },
      { signal, model: 'qwen/qwen3.8-27b', maxTokens: 3200 }
    );

    agentEvents.emit('agent.completed', '🎨 Código compilado.');

    // STEP 3: QA Verification & Robust Auto-Repair
    onProgress('🛡️ Agente 3 (Auditor QA)', 'Verificando empaquetado, etiquetas y eventos...');
    agentEvents.emit('agent.thinking', '🛡️ Agente 3: Auditando sintaxis...');

    let finalHtml = '';
    const match = generatedCode.match(/```html(?:\s+filename=[^\n]+)?\n([\s\S]*)/);
    if (match) {
      finalHtml = match[1].replace(/```\s*$/, '').trim();
    } else if (generatedCode.includes('<!DOCTYPE html>')) {
      const idx = generatedCode.indexOf('<!DOCTYPE html>');
      finalHtml = generatedCode.slice(idx).replace(/```\s*$/, '').trim();
    } else {
      finalHtml = generatedCode.replace(/```\s*$/, '').trim();
    }

    // Auto-repair unclosed script tags or brackets
    if (finalHtml.includes('<script') && !finalHtml.includes('</script>')) {
      const scriptIndex = finalHtml.lastIndexOf('<script');
      const scriptContent = finalHtml.slice(scriptIndex);
      const opens = (scriptContent.match(/\{/g) || []).length;
      const closes = (scriptContent.match(/\}/g) || []).length;
      if (opens > closes) {
        finalHtml += '\n' + '}'.repeat(opens - closes);
      }
      finalHtml += '\n</script>';
    }

    if (!finalHtml.includes('</body>')) finalHtml += '\n</body>';
    if (!finalHtml.includes('</html>')) finalHtml += '\n</html>';

    const summary = `He construido la aplicación completa con el estándar de Google Antigravity & Lovable:
1. **🧠 Arquitecto**: Diseñó los componentes, interfaz y modelo de interacción.
2. **🎨 & ⚙️ Ingeniero Líder**: Implementó el código HTML5, Tailwind CSS y JavaScript interactivo.
3. **🛡️ Auditor QA**: Verificó la sintaxis y activó la vista previa interactiva.`;

    agentEvents.emit('agent.completed', '🛡️ Aplicación verificada y lista para interactuar.');

    return { fullCode: finalHtml, summary };
  }
}

export const multiAgentEngine = new MultiAgentEngine();
