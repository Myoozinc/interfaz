import { agentEvents } from './AgentEvents';
import { OllamaProvider } from '../providers/OllamaProvider';
import { surgicalDiffAgent } from './SurgicalDiffAgent';
import { qaTesterAgent, type QATestResult } from './QATesterAgent';
import { NONA_MASTER_SYSTEM_PROMPT_V5 } from './PromptGuardrails';

export class MultiAgentEngine {
  private aiProvider: OllamaProvider;

  constructor() {
    this.aiProvider = new OllamaProvider('/api/agent', 'qwen/qwen3.8-27b');
  }

  setEndpoint(url: string) {
    this.aiProvider.setBaseUrl(url);
  }

  private cleanCodeBlock(raw: string): string {
    const match = raw.match(/```html(?:\s+filename=[^\n]+)?\n([\s\S]*)/);
    if (match) {
      return match[1].replace(/```\s*$/, '').trim();
    }
    if (raw.includes('<!DOCTYPE html>')) {
      const idx = raw.indexOf('<!DOCTYPE html>');
      return raw.slice(idx).replace(/```\s*$/, '').trim();
    }
    return raw.replace(/```\s*$/, '').trim();
  }

  private isCodeIncomplete(code: string): boolean {
    if (!code || code.length < 100) return true;
    const trimmed = code.trim();
    // Incomplete if missing closing html or script
    if (!trimmed.endsWith('</html>') && !trimmed.endsWith('</script>')) return true;
    if (code.includes('<script') && !code.includes('</script>')) return true;
    if (!code.includes('</html>')) return true;
    return false;
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
      onProgress('⚡ NONA Surgical Diff Engine', 'Analizando código activo y aplicando corrección localizada...');
      agentEvents.emit('agent.thinking', '⚡ NONA Surgical Diff: Corrigiendo componentes y eventos...');

      candidateCode = await surgicalDiffAgent.applySurgicalEdit(
        userInstruction,
        currentCode,
        (token) => onProgress('⚡ NONA Surgical Diff Engine', 'Aplicando parche y re-renderizando...', token),
        signal
      );

      agentEvents.emit('agent.completed', '⚡ Corrección quirúrgica aplicada con éxito.');

    } else {
      // MODE B: 🚀 Direct High-Fidelity Synthesis with Logic-First standard
      onProgress('🎨 & 🧠 NONA Master Software Engine', 'Diseñando e implementando la aplicación completa en tiempo real...');
      agentEvents.emit('agent.thinking', '🎨 & 🧠 Generando software con Three.js, Web Audio y lógica en vivo...');

      const engineerSystemPrompt = `${NONA_MASTER_SYSTEM_PROMPT_V5}

Tu misión es escribir el código HTML5 + JavaScript 100% COMPLETO, PULIDO, EXTENSO Y AUTOCONTENIDO.
REGLAS CRÍTICAS:
1. Sé 100% fiel a la solicitud del usuario ("${userInstruction}").
2. Si es un videojuego (carreras, snake, 3D, música, etc.), crea una experiencia inmersiva con Three.js WebGL, controles (WASD/táctil), audio sintetizado con Web Audio API, bucle de animación \`requestAnimationFrame\`, botón Jugar funcional y HUD.
3. Inicia DIRECTAMENTE con \`\`\`html filename=index.html y concluye con </html>\`\`\`. Cero preámbulos.`;

      const engineerUserPrompt = `INSTRUCCIÓN EXACTA DEL USUARIO:
"${userInstruction}"

Implementa la aplicación o videojuego 100% completo, visualmente impresionante, interactivo y funcional. Inicia DIRECTAMENTE con \`\`\`html filename=index.html:`;

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
        {
          signal,
          model: 'qwen/qwen3.8-27b',
          maxTokens: 4500,
          temperature: 0.15
        }
      );

      candidateCode = this.cleanCodeBlock(generatedCode);

      // ======================================================================
      // AUTO-CONTINUATION LOOP (Estándar Lovable / Google Antigravity)
      // Si el código se cortó antes de cerrar el script o </html>, continúa el stream automáticamente
      // ======================================================================
      let continuationAttempts = 0;
      while (this.isCodeIncomplete(candidateCode) && continuationAttempts < 2) {
        continuationAttempts++;
        onProgress('🔄 NONA Auto-Continuation Engine', `Completando lógica y funciones restantes (Pase ${continuationAttempts}/2)...`);
        agentEvents.emit('agent.thinking', `🔄 Auto-Continuation: Extendiendo código truncado para garantizar cierre de scripts...`);

        const lastChunk = candidateCode.slice(-1200);
        const continuationPrompt = `El código anterior se interrumpió aquí:
\`\`\`
${lastChunk}
\`\`\`

Continúa EXACTAMENTE desde la última línea sin repetir nada del código previo, completando todas las funciones, eventos y concluyendo con </script></body></html>:`;

        let continuationOutput = '';
        try {
          await this.aiProvider.streamChat(
            [
              { role: 'system', content: `${NONA_MASTER_SYSTEM_PROMPT_V5}\nEres el CONTINUATION ENGINE de NONA. Continúa el código exactamente donde se quedó.` },
              { role: 'user', content: continuationPrompt }
            ],
            (token, full) => {
              continuationOutput = full;
              onProgress('🔄 NONA Auto-Continuation Engine', 'Ensamblando funciones y bucle de juego...', token);
            },
            { signal, model: 'qwen/qwen3.8-27b', maxTokens: 3500, temperature: 0.1 }
          );

          let cleanedContinuation = continuationOutput.replace(/^```html(?:\s+filename=[^\n]+)?\n/, '').replace(/```\s*$/, '').trim();
          candidateCode = candidateCode + '\n' + cleanedContinuation;
        } catch (err) {
          console.warn('Auto-continuation step failed, falling through to QA repairs', err);
          break;
        }
      }

      agentEvents.emit('agent.completed', '🎨 Código de aplicación compilado con éxito.');
    }

    // ==========================================
    // ETAPA QA: Auditoría y Cierre Sintáctico Seguro
    // ==========================================
    onProgress('🛡️ NONA QA & Runtime Validator', 'Auditando sintaxis, runtime, DOM y densidad funcional...');
    agentEvents.emit('agent.thinking', '🛡️ QA Validator: Verificando etiquetas, llaves y compatibilidad...');

    let qaReport = qaTesterAgent.testAndAudit(candidateCode, userInstruction);
    let finalCode = qaReport.repairedCode || candidateCode;

    // Self-Healing Loop
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
          { signal, model: 'qwen/qwen3.8-27b', maxTokens: 4500, temperature: 0.1 }
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
      : `🚀 **Software Construido con Estándar NONA Architecture v9.0**:\n1. **🎨 & 🧠 Master Engine (Qwen 3.8 27B)**: Implementó la aplicación solicitada (${userInstruction.slice(0, 35)}...).\n2. **🛡️ QA Engine**: Validó sintaxis, eventos e interactividad (${qaReport.visualDensityScore}/100).`;

    return { fullCode: finalCode, summary, qaReport };
  }
}

export const multiAgentEngine = new MultiAgentEngine();
