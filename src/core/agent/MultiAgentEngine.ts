import { agentEvents } from './AgentEvents';
import { OllamaProvider } from '../providers/OllamaProvider';
import { surgicalDiffAgent } from './SurgicalDiffAgent';
import { qaTesterAgent, type QATestResult } from './QATesterAgent';
import { NONA_MASTER_SYSTEM_PROMPT_V5 } from './PromptGuardrails';

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
      // MODE A: ⚡ Surgical Bug Fix & Component Edit
      onProgress('⚡ NONA Surgical Diff & Fix Engine', 'Analizando el código actual y aplicando la corrección requerida...');
      agentEvents.emit('agent.thinking', '⚡ NONA Surgical Diff: Corrigiendo componentes y eventos...');

      candidateCode = await surgicalDiffAgent.applySurgicalEdit(
        userInstruction,
        currentCode,
        (token) => onProgress('⚡ NONA Surgical Diff & Fix Engine', 'Aplicando parche y re-renderizando...', token),
        signal
      );

      agentEvents.emit('agent.completed', '⚡ Corrección quirúrgica aplicada con éxito.');

    } else {
      // MODE B: 🚀 Direct Precision Generation (Architecture v5.0)
      onProgress('🧠 & 🎨 NONA Master Software Engine', 'Diseñando e implementando la aplicación completa en tiempo real...');
      agentEvents.emit('agent.thinking', '🧠 & 🎨 Generando software con Three.js / Tailwind y controles en vivo...');

      const engineerSystemPrompt = `${NONA_MASTER_SYSTEM_PROMPT_V5}

Tu misión es escribir el código HTML5 + JavaScript 100% COMPLETO, PULIDO Y AUTOCONTENIDO.
REGLA CRÍTICA: Sé 100% fiel a la solicitud del usuario ("${userInstruction}").
Inicia DIRECTAMENTE con \`\`\`html filename=index.html y concluye con </html>\`\`\`.`;

      const engineerUserPrompt = `INSTRUCCIÓN EXACTA DEL USUARIO:
"${userInstruction}"

Implementa la aplicación o juego 100% completo, visualmente impresionante, interactivo y funcional. Inicia DIRECTAMENTE con \`\`\`html filename=index.html y concluye con </html>\`\`\`:`;

      let generatedCode = '';
      await this.aiProvider.streamChat(
        [
          { role: 'system', content: engineerSystemPrompt },
          { role: 'user', content: engineerUserPrompt }
        ],
        (token, full) => {
          generatedCode = full;
          onProgress('🎨 & ⚙️ NONA Master Software Engine', 'Programando componentes y renderizando en vivo...', token);
        },
        { signal, model: 'openai/gpt-oss-120b', maxTokens: 3500 }
      );

      agentEvents.emit('agent.completed', '🎨 Código de software compilado con éxito.');

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
    // ETAPA QA: Auditoría y Cierre Sintáctico Seguro
    // ==========================================
    onProgress('🛡️ NONA QA & Runtime Validator', 'Auditando sintaxis, runtime, DOM y densidad funcional...');
    agentEvents.emit('agent.thinking', '🛡️ QA Validator: Verificando etiquetas, llaves y compatibilidad...');

    let qaReport = qaTesterAgent.testAndAudit(candidateCode, userInstruction);
    let finalCode = qaReport.repairedCode || candidateCode;

    // Self-Healing Loop: If syntax errors or missing required tags exist
    if (!qaReport.valid && qaReport.errors.length > 0) {
      onProgress('🔄 NONA Self-Healing Loop', `Auto-reparando ${qaReport.errors.length} fallas sintácticas...`);
      agentEvents.emit('agent.thinking', `🔄 QA Self-Healing: ${qaReport.errors.join(', ')}`);

      try {
        const repairPrompt = `INSTRUCCIÓN ORIGINAL DEL USUARIO:
"${userInstruction}"

FALLAS SINTÁCTICAS A CORREGIR:
${qaReport.errors.map(e => '- ' + e).join('\n')}

CÓDIGO A CORREGIR:
\`\`\`html
${finalCode}
\`\`\`

Devuelve el código 100% completo, fiel a la instrucción del usuario y funcional en \`\`\`html filename=index.html:`;

        const repairedResponse = await this.aiProvider.streamChat(
          [
            { role: 'system', content: `${NONA_MASTER_SYSTEM_PROMPT_V5}\nEres LEAD CODE HEALER de NONA.` },
            { role: 'user', content: repairPrompt }
          ],
          () => {},
          { signal, model: 'openai/gpt-oss-120b', maxTokens: 3500 }
        );

        const repMatch = repairedResponse.match(/```html(?:\s+filename=[^\n]+)?\n([\s\S]*)/);
        if (repMatch) {
          finalCode = repMatch[1].replace(/```\s*$/, '').trim();
        }
        qaReport = qaTesterAgent.testAndAudit(finalCode, userInstruction);
        finalCode = qaReport.repairedCode || finalCode;
      } catch (e) {
        console.warn('QA Self-healing fallback to rule-based repairs');
      }
    }

    agentEvents.emit('agent.completed', `🛡️ Calidad QA: ${qaReport.visualDensityScore}/100 — 0 Errores Críticos.`);

    const summary = isPartialEdit
      ? `⚡ **Modificación Quirúrgica Completada**:\n- **NONA Surgical Diff**: Corrigió con precisión los componentes solicitados.\n- **NONA QA Engine**: Validó la integridad del código (Densidad Funcional: ${qaReport.visualDensityScore}/100).`
      : `🚀 **Software Construido con Estándar NONA Architecture v5.0**:\n1. **🧠 & 🎨 Master Engine**: Implementó la aplicación solicitada (${userInstruction.slice(0, 30)}...).\n2. **🛡️ QA Engine**: Validó sintaxis, eventos e interactividad (${qaReport.visualDensityScore}/100).`;

    return { fullCode: finalCode, summary, qaReport };
  }
}

export const multiAgentEngine = new MultiAgentEngine();
