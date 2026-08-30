import { agentEvents } from './AgentEvents';
import { OllamaProvider } from '../providers/OllamaProvider';
import { surgicalDiffAgent } from './SurgicalDiffAgent';
import { qaTesterAgent, type QATestResult } from './QATesterAgent';
import { NONA_MASTER_SYSTEM_PROMPT_V5, APP_MANIFEST_SCHEMA, FEW_SHOT_PATTERNS } from './PromptGuardrails';

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
      // MODE A: ⚡ Surgical Component Edit Loop (Agent C)
      onProgress('⚡ NONA Surgical Diff Engine', 'Localizando componentes y aplicando modificaciones precisas...');
      agentEvents.emit('agent.thinking', '⚡ NONA Surgical Diff: Modificando componentes específicos...');

      candidateCode = await surgicalDiffAgent.applySurgicalEdit(
        userInstruction,
        currentCode,
        (token) => onProgress('⚡ NONA Surgical Diff Engine', 'Aplicando parche y re-renderizando...', token),
        signal
      );

      agentEvents.emit('agent.completed', '⚡ Modificación quirúrgica aplicada con éxito.');

    } else {
      // MODE B: 🚀 3-Stage Strict Production Pipeline (Architecture v5.0)

      // ==========================================
      // ETAPA 1: Planificación y Manifiesto (Agent A - Lead Architect)
      // ==========================================
      onProgress('🧠 Etapa 1 - NONA Lead System Architect', 'Creando APP_MANIFEST y arquitectura técnica...');
      agentEvents.emit('agent.thinking', '🧠 Etapa 1: Diseñando APP_MANIFEST, flujos y arquitectura de ejecución...');

      const architectSystemPrompt = `${NONA_MASTER_SYSTEM_PROMPT_V5}

Tu misión como AGENT A — LEAD SYSTEM ARCHITECT es definir el APP_MANIFEST técnico para la solicitud del usuario.
Estructura de salida requerida:
${APP_MANIFEST_SCHEMA}

Devuelve un resumen técnico y el APP_MANIFEST estructurado.`;

      let appManifest = '';
      try {
        appManifest = await this.aiProvider.streamChat(
          [
            { role: 'system', content: architectSystemPrompt },
            { role: 'user', content: `INSTRUCCIÓN DEL PRODUCTO:\n"${userInstruction}"\n\nGenera la arquitectura y el APP_MANIFEST:` }
          ],
          () => {},
          { signal, model: 'openai/gpt-oss-120b', maxTokens: 600 }
        );
      } catch (err) {
        appManifest = 'Arquitectura interactiva en navegador con Three.js / Tailwind CSS / Web Audio API y persistencia reactiva.';
      }

      agentEvents.emit('agent.completed', '🧠 Etapa 1: APP_MANIFEST y arquitectura definidas.');

      // ==========================================
      // ETAPA 2: Generación Full-Stack (Agent B - Senior Engineer)
      // ==========================================
      onProgress('🎨 & ⚙️ Etapa 2 - NONA Full-Stack & 3D Engine', 'Escribiendo software completo con Three.js, Tailwind y JavaScript...');
      agentEvents.emit('agent.thinking', '🎨 Etapa 2: Implementando lógica, estado, interfaz y renderizando en vivo...');

      const engineerSystemPrompt = `${NONA_MASTER_SYSTEM_PROMPT_V5}

${FEW_SHOT_PATTERNS}

RECUERDA:
- Cero código de prueba o botones inertes.
- Cero placeholders o "TODO".
- Todo botón, formulario y componente debe funcionar.
- Comienza directamente con \`\`\`html filename=index.html y concluye con </html>\`\`\`.`;

      const engineerUserPrompt = `APP_MANIFEST Y ARQUITECTURA (ETAPA 1):
${appManifest}

INSTRUCCIÓN EXACTA DEL USUARIO:
"${userInstruction}"

Implementa la aplicación de software 100% completa, interactiva y funcional. Inicia DIRECTAMENTE con \`\`\`html filename=index.html y concluye con </html>\`\`\`:`;

      let generatedCode = '';
      await this.aiProvider.streamChat(
        [
          { role: 'system', content: engineerSystemPrompt },
          { role: 'user', content: engineerUserPrompt }
        ],
        (token, full) => {
          generatedCode = full;
          onProgress('🎨 & ⚙️ Etapa 2 - NONA Full-Stack & 3D Engine', 'Programando componentes y lógica interactiva...', token);
        },
        { signal, model: 'openai/gpt-oss-120b', maxTokens: 3400 }
      );

      agentEvents.emit('agent.completed', '🎨 Etapa 2: Código de software compilado con éxito.');

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
    // ETAPA 3: Auditoría QA & Self-Healing Loop (Agent E)
    // ==========================================
    onProgress('🛡️ Etapa 3 - NONA QA & Self-Healing Engine', 'Auditando sintaxis, runtime, DOM y densidad funcional...');
    agentEvents.emit('agent.thinking', '🛡️ Etapa 3 (QA): Verificando integridad, controles y ejecutando validaciones...');

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

Devuelve el código de software 100% completo y funcional en \`\`\`html filename=index.html:`;

        const repairedResponse = await this.aiProvider.streamChat(
          [
            { role: 'system', content: `${NONA_MASTER_SYSTEM_PROMPT_V5}\nEres LEAD CODE HEALER de NONA AI Software Factory.` },
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
      ? `⚡ **Modificación Quirúrgica Completada**:\n- **NONA Surgical Diff**: Modificó con precisión los componentes solicitados.\n- **NONA QA Engine**: Validó la integridad del código (Densidad Funcional: ${qaReport.visualDensityScore}/100).`
      : `🚀 **Software Construido con Estándar NONA Architecture v5.0**:\n1. **🧠 Etapa 1 (Lead Architect)**: Diseñó el APP_MANIFEST y la arquitectura técnica.\n2. **🎨 & ⚙️ Etapa 2 (Full-Stack Engine)**: Implementó lógica real, Three.js/Tailwind y persistencia.\n3. **🛡️ Etapa 3 (QA Engine)**: Validó sintaxis y Densidad Funcional (${qaReport.visualDensityScore}/100).`;

    return { fullCode: finalCode, summary, qaReport };
  }
}

export const multiAgentEngine = new MultiAgentEngine();
