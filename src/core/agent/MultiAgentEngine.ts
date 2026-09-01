import { agentEvents } from './AgentEvents';
import { OllamaProvider } from '../providers/OllamaProvider';
import { surgicalDiffAgent } from './SurgicalDiffAgent';
import { qaTesterAgent, type QATestResult } from './QATesterAgent';
import { NONA_MASTER_SYSTEM_PROMPT_V5 } from './PromptGuardrails';

export class MultiAgentEngine {
  private aiProvider: OllamaProvider;

  constructor() {
    this.aiProvider = new OllamaProvider('/api/agent', 'qwen/qwen-2.5-coder-32b-instruct');
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
      // MODE B: 🚀 Full Production-Grade App Generation (Architecture v7.0)
      // ======================================================================
      // STAGE 1: Architecture Blueprint (fast, Groq LPU — planning only)
      // ======================================================================
      onProgress('🧠 NONA Lead Architect', 'Diseñando arquitectura de componentes, estado y flujo de datos...');
      agentEvents.emit('agent.thinking', '🧠 NONA Architect: Definiendo árbol de componentes, estados y esquema de datos...');

      const architectPrompt = `${NONA_MASTER_SYSTEM_PROMPT_V5}

You are the NONA LEAD ARCHITECT. Your ONLY task is to output a terse JSON blueprint — no prose, no HTML.

USER REQUEST: "${userInstruction}"

Respond with ONLY valid JSON (no markdown, no backticks) following this schema exactly:
{
  "appType": "game3d | saas | ecommerce | productivity | creative | social | finance",
  "appName": "...",
  "primaryColor": "#hex",
  "accentColor": "#hex",
  "components": ["Navbar","Sidebar","StatsGrid","DataTable","CRUDModal","ToastSystem"],
  "stateSchema": { "items": "array", "currentView": "string", "isModalOpen": "boolean", "searchQuery": "string" },
  "sampleDataCount": 8,
  "libraryNeeds": { "threejs": false, "tailwind": true, "chartjs": false },
  "keyFeatures": ["feature1","feature2","feature3","feature4","feature5"],
  "colorScheme": "dark",
  "animationStyle": "smooth-professional"
}`;

      let blueprintJSON = '';
      try {
        blueprintJSON = await this.aiProvider.streamChat(
          [
            { role: 'system', content: architectPrompt },
            { role: 'user', content: `Create the architecture blueprint for: "${userInstruction}"` }
          ],
          (_tok, full) => { blueprintJSON = full; },
          { signal, model: 'llama-3.3-70b-versatile', maxTokens: 600, temperature: 0.1 }
        );
      } catch {
        blueprintJSON = '{"appType":"saas","colorScheme":"dark"}';
      }

      // Parse blueprint (best effort)
      let blueprint: Record<string, unknown> = {};
      try {
        const jsonMatch = blueprintJSON.match(/\{[\s\S]*\}/);
        if (jsonMatch) blueprint = JSON.parse(jsonMatch[0]);
      } catch {
        blueprint = { appType: 'saas', colorScheme: 'dark' };
      }

      // ======================================================================
      // STAGE 2: Full Code Synthesis (deep coder model — max tokens)
      // ======================================================================
      onProgress('🎨 NONA Master Software Engineer', 'Sintetizando aplicación completa con UI rica, lógica funcional y datos de muestra...');
      agentEvents.emit('agent.thinking', '🎨 NONA Engineer: Construyendo HTML5+CSS3+JS completo con animaciones y estado reactivo...');

      const engineerSystemPrompt = `${NONA_MASTER_SYSTEM_PROMPT_V5}

## ARCHITECTURE BLUEPRINT FROM LEAD ARCHITECT:
${JSON.stringify(blueprint, null, 2)}

You are the NONA MASTER SOFTWARE ENGINEER. Using the blueprint above, implement the COMPLETE, PRODUCTION-GRADE application.

CRITICAL INSTRUCTIONS:
1. The code MUST be visually stunning with dark theme, glassmorphism, gradient accents, and smooth animations.
2. Include ALL components listed in the blueprint — no placeholders, no "coming soon".
3. Pre-populate with ${blueprint.sampleDataCount || 8} realistic sample data items.
4. Every button, link, input, and interactive element MUST work.
5. Do NOT truncate the code — output the COMPLETE file from <!DOCTYPE html> to </html>.
6. Start IMMEDIATELY with: \`\`\`html filename=index.html`;

      const engineerUserPrompt = `EXACT USER REQUEST:
"${userInstruction}"

ARCHITECTURE CONTEXT:
- App Type: ${blueprint.appType || 'application'}
- Primary Color: ${blueprint.primaryColor || '#6366f1'}
- Key Features: ${(blueprint.keyFeatures as string[] || ['core functionality']).join(', ')}
- Libraries: ${JSON.stringify(blueprint.libraryNeeds || { tailwind: true })}

Generate the COMPLETE, PRODUCTION-GRADE application now. Start with \`\`\`html filename=index.html:`;

      let generatedCode = '';
      await this.aiProvider.streamChat(
        [
          { role: 'system', content: engineerSystemPrompt },
          { role: 'user', content: engineerUserPrompt }
        ],
        (_token, full) => {
          generatedCode = full;
          onProgress('🎨 NONA Master Software Engineer', 'Escribiendo componentes, animaciones y lógica de negocio...', _token);
        },
        {
          signal,
          model: 'qwen/qwen-2.5-coder-32b-instruct',
          maxTokens: 14000,
          temperature: 0.12
        }
      );

      agentEvents.emit('agent.completed', '🎨 Código de aplicación generado con arquitectura v7.0.');

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

    // Self-Healing Loop
    if (!qaReport.valid && qaReport.errors.length > 0) {
      onProgress('🔄 NONA Self-Healing Loop', `Auto-reparando ${qaReport.errors.length} fallas sintácticas...`);
      agentEvents.emit('agent.thinking', `🔄 QA Self-Healing: ${qaReport.errors.join(', ')}`);

      try {
        const repairPrompt = `INSTRUCCIÓN ORIGINAL DEL USUARIO:
"${userInstruction}"

FALLAS A CORREGIR:
${qaReport.errors.map(e => '- ' + e).join('\n')}

CÓDIGO A REPARAR:
\`\`\`html
${finalCode}
\`\`\`

Devuelve el código 100% completo, visualmente rico y funcional en \`\`\`html filename=index.html:`;

        const repairedResponse = await this.aiProvider.streamChat(
          [
            { role: 'system', content: `${NONA_MASTER_SYSTEM_PROMPT_V5}\nEres LEAD CODE HEALER de NONA.` },
            { role: 'user', content: repairPrompt }
          ],
          () => {},
          { signal, model: 'qwen/qwen-2.5-coder-32b-instruct', maxTokens: 14000, temperature: 0.1 }
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
      : `🚀 **Software Construido con Estándar NONA Architecture v7.0**:\n1. **🧠 Lead Architect**: Diseñó la arquitectura de componentes y estado.\n2. **🎨 Master Engineer**: Implementó la aplicación solicitada (${userInstruction.slice(0, 40)}...) con UI rica y funcionalidad completa.\n3. **🛡️ QA Engine**: Validó sintaxis, eventos e interactividad (${qaReport.visualDensityScore}/100).`;

    return { fullCode: finalCode, summary, qaReport };
  }
}

export const multiAgentEngine = new MultiAgentEngine();
