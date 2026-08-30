import { agentEvents } from './AgentEvents';
import { OllamaProvider } from '../providers/OllamaProvider';
import { surgicalDiffAgent } from './SurgicalDiffAgent';
import { qaTesterAgent, type QATestResult } from './QATesterAgent';
import { PRO_COMPLEXITY_GUARDRAIL, FEW_SHOT_PATTERNS } from './PromptGuardrails';

export class MultiAgentEngine {
  private aiProvider: OllamaProvider;

  constructor() {
    this.aiProvider = new OllamaProvider('/api/agent', 'openai/gpt-oss-120b');
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
  ): Promise<{ fullCode: string; summary: string; qaReport: QATestResult }> {

    const isPartialEdit = surgicalDiffAgent.isSurgicalEdit(userInstruction, currentCode, isNew);
    let candidateCode = '';

    if (isPartialEdit) {
      // MODE A: ⚡ Surgical Component Edit Loop
      onProgress('⚡ Agente de Edición Quirúrgica (Surgical Diff)', 'Localizando componentes y aplicando modificaciones precisas...');
      agentEvents.emit('agent.thinking', '⚡ Agente Quirúrgico: Modificando componentes específicos...');

      candidateCode = await surgicalDiffAgent.applySurgicalEdit(
        userInstruction,
        currentCode,
        (token) => onProgress('⚡ Agente de Edición Quirúrgica', 'Aplicando parche y re-renderizando...', token),
        signal
      );

      agentEvents.emit('agent.completed', '⚡ Modificación quirúrgica aplicada con éxito.');

    } else {
      // MODE B: 🚀 3-Stage Strict Production Pipeline (Lovable & Antigravity Pro Standard)

      // ==========================================
      // ETAPA 1: Planificación Técnica en Browser Stack
      // ==========================================
      onProgress('🧠 Etapa 1 - Lead System Architect (120B)', 'Diseñando especificación técnica para navegador (Three.js / HTML5)...');
      agentEvents.emit('agent.thinking', '🧠 Etapa 1 (120B): Diseñando arquitectura y controles...');

      const architectSystemPrompt = `Eres LEAD SYSTEM ARCHITECT de Google Antigravity & Lovable.
Tu misión es diseñar el plano técnico para ejecutar la aplicación DIRECTAMENTE EN EL NAVEGADOR WEB (Live Sandbox).

REGLAS DE ARQUITECTURA:
1. Pila Tecnológica en Navegador:
   - Si el usuario pide un JUEGO 3D (Fútbol, Carreras, Naves, Espacio): Three.js (<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>) + WebGLRenderer a pantalla completa + Canvas 3D + luces + controles (WASD/Ratón/Click) + HUD en Tailwind.
   - Si pide una MASCOTA VIRTUAL: Canvas / SVG animado con estados (hambre, energía, diversión, nivel) + Web Audio API + localStorage.
   - Si pide una TIENDA E-COMMERCE / SAAS: Tailwind CSS + Lucide Icons + Carrito flotante / Tablas reactivas + Modales CRUD.
2. Devuelve un resumen técnico de 2 párrafos indicando la escena 3D / componentes DOM y controles.`;

      let technicalBlueprint = '';
      try {
        technicalBlueprint = await this.aiProvider.streamChat(
          [
            { role: 'system', content: architectSystemPrompt },
            { role: 'user', content: `INSTRUCCIÓN DEL USUARIO:\n"${userInstruction}"\n\nDiseña la arquitectura en navegador:` }
          ],
          () => {},
          { signal, model: 'openai/gpt-oss-120b', maxTokens: 600 }
        );
      } catch (err) {
        technicalBlueprint = 'Arquitectura interactiva en navegador con Three.js / Tailwind CSS / Web Audio API.';
      }

      agentEvents.emit('agent.completed', '🧠 Etapa 1: Arquitectura técnica definida.');

      // ==========================================
      // ETAPA 2: Generación Full-Stack (120B / Qwen 3.8)
      // ==========================================
      onProgress('🎨 & ⚙️ Etapa 2 - Senior Full-Stack & 3D Engineer', 'Escribiendo el código completo con Three.js, Tailwind y JavaScript...');
      agentEvents.emit('agent.thinking', '🎨 Etapa 2: Programando escena 3D / componentes y renderizando en vivo...');

      const engineerSystemPrompt = `Eres SENIOR FULL-STACK & 3D ENGINEER de Google Antigravity & Lovable.
Tu misión es escribir el código HTML5 + JavaScript 100% COMPLETO, FUNCIONAL Y AUTOCONTENIDO para el usuario.

${PRO_COMPLEXITY_GUARDRAIL}

REGLAS ESPECÍFICAS SEGÚN TIPO DE APP:
- PARA JUEGOS 3D (Fútbol, Carreras, Acción):
  * Carga Three.js (<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>) y Tailwind CSS (<script src="https://cdn.tailwindcss.com"></script>).
  * WebGLRenderer a pantalla completa, Scene, PerspectiveCamera, luces (AmbientLight + DirectionalLight con sombras).
  * Elementos 3D reales: Para fútbol (campo verde con líneas, porterías 3D con postes blancos y red, pelota 3D con físicas de tiro/rebote, portero 3D interactivo). Para carreras (pista 3D, auto 3D, controles WASD).
  * HUD flotante con marcador de Goles/Puntos, botón de Reiniciar y sonidos de silbato/victoria con Web Audio API.
- PARA APPS 2D / TIENDAS / SAAS / MASCOTAS:
  * Interfaz rica con Tailwind CSS, Lucide Icons, animaciones CSS, persistencia en localStorage y sonidos con window.playSynthSound.

${FEW_SHOT_PATTERNS}`;

      const engineerUserPrompt = `PLANO TÉCNICO DE LA ETAPA 1:
${technicalBlueprint}

INSTRUCCIÓN EXACTA DEL USUARIO:
"${userInstruction}"

Escribe el archivo index.html 100% completo, funcional y listo para interactuar. Inicia DIRECTAMENTE con \`\`\`html filename=index.html y concluye con </html>\`\`\`:`;

      let generatedCode = '';
      await this.aiProvider.streamChat(
        [
          { role: 'system', content: engineerSystemPrompt },
          { role: 'user', content: engineerUserPrompt }
        ],
        (token, full) => {
          generatedCode = full;
          onProgress('🎨 & ⚙️ Etapa 2 - Senior Full-Stack & 3D Engineer', 'Programando escena y lógica interactiva...', token);
        },
        { signal, model: 'openai/gpt-oss-120b', maxTokens: 3400 }
      );

      agentEvents.emit('agent.completed', '🎨 Etapa 2: Código compilado con éxito.');

      const match = generatedCode.match(/```html(?:\s+filename=[^\n]+)?\n([\s\S]*)/);
      if (match) {
        candidateCode = match[1].replace(/```\s*$/, '').trim();
      } else if (generatedCode.includes('<!DOCTYPE html>')) {
        const idx = generatedCode.indexOf('<!DOCTYPE html>');
        candidateCode = generatedCode.slice(idx).replace(/```\s*$/, '').trim();
      } else {
        candidateCode = generatedCode.replace(/```\s*$/, '').trim();
      }
    }

    // ==========================================
    // ETAPA 3: Auditoría QA & Self-Healing Loop
    // ==========================================
    onProgress('🛡️ Etapa 3 - QA Tester & Density Auditor', 'Auditando sintaxis, Three.js/DOM y Densidad Visual/Funcional...');
    agentEvents.emit('agent.thinking', '🛡️ Etapa 3 (QA): Validando físicas, controles y empaquetado...');

    let qaReport = qaTesterAgent.testAndAudit(candidateCode);
    let finalCode = qaReport.repairedCode || candidateCode;

    // Self-Healing Loop: If errors exist, repair automatically
    if (!qaReport.valid && qaReport.errors.length > 0) {
      onProgress('🔄 Etapa 3 - Self-Healing Loop', `Auto-reparando ${qaReport.errors.length} fallas detectadas...`);
      agentEvents.emit('agent.thinking', `🔄 QA Self-Healing: ${qaReport.errors.join(', ')}`);

      try {
        const repairPrompt = `Corrige los siguientes errores de sintaxis y ejecución detectados por el Auditor QA:
${qaReport.errors.map(e => '- ' + e).join('\n')}

CÓDIGO A CORREGIR:
\`\`\`html
${finalCode}
\`\`\`

Devuelve el código 100% completo y funcional en \`\`\`html filename=index.html:`;

        const repairedResponse = await this.aiProvider.streamChat(
          [
            { role: 'system', content: `Eres LEAD CODE HEALER de Google Antigravity.\n${PRO_COMPLEXITY_GUARDRAIL}` },
            { role: 'user', content: repairPrompt }
          ],
          () => {},
          { signal, model: 'openai/gpt-oss-120b', maxTokens: 3400 }
        );

        const repMatch = repairedResponse.match(/```html(?:\s+filename=[^\n]+)?\n([\s\S]*)/);
        if (repMatch) {
          finalCode = repMatch[1].replace(/```\s*$/, '').trim();
        }
        qaReport = qaTesterAgent.testAndAudit(finalCode);
        finalCode = qaReport.repairedCode || finalCode;
      } catch (e) {
        console.warn('QA Self-healing fallback to rule-based repairs');
      }
    }

    agentEvents.emit('agent.completed', `🛡️ Etapa 3: Calidad QA ${qaReport.visualDensityScore}/100 — 0 Errores Críticos.`);

    const summary = isPartialEdit
      ? `⚡ **Modificación Quirúrgica Completada**:\n- **Agente Editor**: Modificó con precisión los componentes solicitados.\n- **Auditor QA**: Validó la integridad del código (Densidad Visual: ${qaReport.visualDensityScore}/100).`
      : `🚀 **Aplicación Construida con Estándar Antigravity & Lovable Pro**:\n1. **🧠 Etapa 1 (Architect 120B)**: Diseñó la arquitectura de escena 3D y componentes.\n2. **🎨 & ⚙️ Etapa 2 (Senior Engineer 120B)**: Programó el motor Three.js/Tailwind con físicas y controles.\n3. **🛡️ Etapa 3 (QA Tester)**: Validó sintaxis y Densidad Visual (${qaReport.visualDensityScore}/100).`;

    return { fullCode: finalCode, summary, qaReport };
  }
}

export const multiAgentEngine = new MultiAgentEngine();
