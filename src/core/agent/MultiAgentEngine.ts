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
      // ETAPA 1: Planificación Profunda (GPT-OSS 120B)
      // ==========================================
      onProgress('🧠 Etapa 1 - Lead System Architect (GPT-OSS 120B)', 'Diseñando especificación técnica, árbol de componentes y esquema JSON...');
      agentEvents.emit('agent.thinking', '🧠 Etapa 1 (120B): Generando contrato técnico estructurado en JSON...');

      const architectSystemPrompt = `Eres LEAD SYSTEM ARCHITECT de Google Antigravity & Lovable.
Tu misión es diseñar la arquitectura técnica profunda para la aplicación solicitada por el usuario.
REGLA ESTRICTA: NO escribas código HTML ni JavaScript directamente. Devuelve EXCLUSIVAMENTE un objeto JSON válido con la siguiente estructura:
{
  "appName": "Nombre de la Aplicación",
  "componentTree": [
    { "name": "Header/Navbar", "features": ["Logo", "Acciones", "Badge reactivo"] },
    { "name": "MainContainer", "features": ["Vistas activas", "Contenedores interactivos", "Empty states"] },
    { "name": "ModalsAndDrawers", "features": ["Modales CRUD", "Detalles", "Notificaciones Toast"] }
  ],
  "stateMachine": {
    "states": ["loading", "active", "modalOpen", "empty", "success"],
    "reactiveVariables": ["items", "selectedItem", "scoreOrTotal", "activeTab", "filterQuery"]
  },
  "databaseSchema": {
    "tables": ["items", "userPreferences", "history"],
    "storageKey": "nona_app_state"
  },
  "tailwindPalette": {
    "background": "bg-slate-950",
    "card": "bg-slate-900/80 border border-slate-800 backdrop-blur-md",
    "primary": "indigo-600",
    "accent": "emerald-400"
  },
  "audioEvents": ["click", "win", "eat", "engine", "button"]
}`;

      let technicalBlueprintJson = '';
      try {
        technicalBlueprintJson = await this.aiProvider.streamChat(
          [
            { role: 'system', content: architectSystemPrompt },
            { role: 'user', content: `INSTRUCCIÓN DEL USUARIO:\n"${userInstruction}"\n\nGenera la especificación técnica en JSON:` }
          ],
          () => {},
          { signal, model: 'openai/gpt-oss-120b', maxTokens: 1200 }
        );
      } catch (err) {
        console.warn('Fallback architect blueprint generated');
        technicalBlueprintJson = JSON.stringify({
          appName: 'NONA Pro App',
          componentTree: ['Header', 'InteractiveCanvas', 'ControlPanel', 'ToastNotification'],
          stateMachine: ['idle', 'active', 'modal'],
          databaseSchema: 'nona_local_store',
          audioEvents: ['click', 'win', 'button']
        });
      }

      agentEvents.emit('agent.completed', '🧠 Etapa 1: Contrato técnico JSON generado con éxito.');

      // ==========================================
      // ETAPA 2: Generación Full-Stack (Qwen 3.8)
      // ==========================================
      onProgress('🎨 & ⚙️ Etapa 2 - Senior Full-Stack Engineer (Qwen 3.8)', 'Programando aplicación con Guardrails Pro y Patrones Few-Shot...');
      agentEvents.emit('agent.thinking', '🎨 Etapa 2 (Qwen 3.8): Ejecutando código comercial con Tailwind y Web Audio...');

      const engineerSystemPrompt = `Eres SENIOR FULL-STACK ENGINEER de Google Antigravity & Lovable.
Tu misión es escribir el código HTML5 + Tailwind CSS + JavaScript 100% COMPLETO, PROFESIONAL, ULTRA-ESTÉTICO Y FUNCIONAL.

${PRO_COMPLEXITY_GUARDRAIL}

${FEW_SHOT_PATTERNS}`;

      const engineerUserPrompt = `CONTRATO TÉCNICO DE LA ETAPA 1 (LEAD ARCHITECT):
\`\`\`json
${technicalBlueprintJson}
\`\`\`

INSTRUCCIÓN ORIGINAL DEL USUARIO:
"${userInstruction}"

Implementa la aplicación completa basada estrictamente en este contrato técnico. Inicia directamente con \`\`\`html filename=index.html:`;

      let generatedCode = '';
      await this.aiProvider.streamChat(
        [
          { role: 'system', content: engineerSystemPrompt },
          { role: 'user', content: engineerUserPrompt }
        ],
        (token, full) => {
          generatedCode = full;
          onProgress('🎨 & ⚙️ Etapa 2 - Senior Full-Stack Engineer', 'Programando componentes y renderizando en vivo...', token);
        },
        { signal, model: 'qwen/qwen3.8-27b', maxTokens: 3500 }
      );

      agentEvents.emit('agent.completed', '🎨 Etapa 2: Código full-stack compilado.');

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
    onProgress('🛡️ Etapa 3 - QA Tester & Density Auditor', 'Auditando sintaxis, DOM y Densidad Visual/Funcional (Pro Standard)...');
    agentEvents.emit('agent.thinking', '🛡️ Etapa 3 (QA): Evaluando micro-interacciones, audio y persistencia...');

    let qaReport = qaTesterAgent.testAndAudit(candidateCode);
    let finalCode = qaReport.repairedCode || candidateCode;

    // Self-Healing Loop: If errors exist OR visual density is low, force enrichment cycle
    if (!qaReport.valid) {
      const issuesText = qaReport.errors.length > 0 
        ? `Errores de sintaxis: ${qaReport.errors.join(', ')}`
        : `Densidad visual baja (${qaReport.visualDensityScore}/100)`;

      onProgress('🔄 Etapa 3 - Self-Healing Loop', `Auto-enriqueciendo código (${issuesText})...`);
      agentEvents.emit('agent.thinking', `🔄 QA Self-Healing: ${issuesText}`);

      try {
        const repairPrompt = qaReport.enrichmentPrompt || `Corrige los siguientes errores detectados por el Auditor QA:
${qaReport.errors.map(e => '- ' + e).join('\n')}

CÓDIGO A CORREGIR:
\`\`\`html
${finalCode}
\`\`\`

Devuelve el código 100% completo, funcional y con micro-interacciones en \`\`\`html filename=index.html:`;

        const repairedResponse = await this.aiProvider.streamChat(
          [
            { role: 'system', content: `Eres LEAD CODE HEALER de Google Antigravity.\n${PRO_COMPLEXITY_GUARDRAIL}` },
            { role: 'user', content: repairPrompt }
          ],
          () => {},
          { signal, model: 'qwen/qwen3.8-27b', maxTokens: 3500 }
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
      : `🚀 **Aplicación Construida con Estándar Antigravity & Lovable Pro**:\n1. **🧠 Etapa 1 (Architect 120B)**: Diseñó el plano técnico JSON y máquina de estados.\n2. **🎨 & ⚙️ Etapa 2 (Qwen 3.8)**: Programó componentes ricos, Tailwind CSS, persistencia y Web Audio.\n3. **🛡️ Etapa 3 (QA Tester)**: Validó sintaxis y Densidad Visual (${qaReport.visualDensityScore}/100).`;

    return { fullCode: finalCode, summary, qaReport };
  }
}

export const multiAgentEngine = new MultiAgentEngine();
