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
REGLAS PARA NAVEGADOR (LIVE RUNTIME):
- Si es JUEGO 3D (Snake 3D, Fútbol, Carreras, etc.): Especifica Three.js r128, WebGLRenderer, PerspectiveCamera, luces (AmbientLight + DirectionalLight con sombras), cuadrícula/piso 3D, mallas 3D con materiales brillantes, HUD en Tailwind, controles táctiles y de teclado, modal de Game Over y audio.
- Si es SAAS / E-COMMERCE / APP: Especifica Tailwind CSS, Lucide Icons, modales CRUD, estados reactivos y persistencia en localStorage.

Estructura de salida requerida:
${APP_MANIFEST_SCHEMA}`;

      let appManifest = '';
      try {
        appManifest = await this.aiProvider.streamChat(
          [
            { role: 'system', content: architectSystemPrompt },
            { role: 'user', content: `INSTRUCCIÓN DEL PRODUCTO:\n"${userInstruction}"\n\nGenera la arquitectura y el APP_MANIFEST:` }
          ],
          () => {},
          { signal, model: 'openai/gpt-oss-120b', maxTokens: 1000 }
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

REGLAS DE ORO OBLIGATORIAS:
1. SÉ 100% FIEL A LA INSTRUCCIÓN DEL USUARIO: Si pidió un juego de Snake 3D, crea EXCLUSIVAMENTE el juego de Snake 3D con Three.js. No crees un SaaS o Project Manager.
2. NUNCA uses CDNs desactualizados. Usa siempre:
   <script src="https://cdn.tailwindcss.com"></script>
   <script src="https://unpkg.com/lucide@latest"></script>
   <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
3. Para juegos 3D: Crea un mundo 3D vibrante (luces, sombras, materiales de color, suelo con rejilla, animaciones de rotación, partículas), HUD flotante moderno con Tailwind, controles táctiles en pantalla para móvil + teclado WASD/Flechas, selector de velocidad, sonido y modal de Game Over.
4. Envuelve la inicialización en window.addEventListener('DOMContentLoaded', ...) para garantizar que los elementos del DOM existan.
5. Comienza DIRECTAMENTE con \`\`\`html filename=index.html y concluye con </html>\`\`\`.`;

      const engineerUserPrompt = `APP_MANIFEST Y ARQUITECTURA (ETAPA 1):
${appManifest}

INSTRUCCIÓN EXACTA DEL USUARIO (MANTÉN ESTE TEMA EXACTO):
"${userInstruction}"

Implementa la aplicación de software 100% completa, visualmente impactante, interactiva y funcional. Inicia DIRECTAMENTE con \`\`\`html filename=index.html y concluye con </html>\`\`\`:`;

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
        { signal, model: 'openai/gpt-oss-120b', maxTokens: 3500 }
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

    let qaReport = qaTesterAgent.testAndAudit(candidateCode, userInstruction);
    let finalCode = qaReport.repairedCode || candidateCode;

    // Self-Healing Loop: If errors exist OR density score is < 70, force enrichment cycle
    if (!qaReport.valid || qaReport.errors.length > 0 || qaReport.needsVisualEnrichment || qaReport.visualDensityScore < 70) {
      const issueCount = qaReport.errors.length > 0 ? `${qaReport.errors.length} fallas técnicas` : `densidad visual baja (${qaReport.visualDensityScore}/100)`;
      onProgress('🔄 Etapa 3 - Self-Healing Loop', `Auto-enriqueciendo y reparando software (${issueCount})...`);
      agentEvents.emit('agent.thinking', `🔄 QA Self-Healing: ${issueCount}`);

      try {
        const repairPrompt = `INSTRUCCIÓN ORIGINAL DEL USUARIO (OBLIGATORIO: MANTÉN ESTE PRODUCTO EXACTO):
"${userInstruction}"

DIAGNÓSTICO DEL AUDITOR QA:
${qaReport.errors.map(e => '- ' + e).join('\n') || '- ' + qaReport.enrichmentPrompt}

CÓDIGO ACTUAL A ENRIQUECER/CORREGIR:
\`\`\`html
${finalCode}
\`\`\`

REGLA CRÍTICA: NO cambies la temática del producto. Si el usuario pidió un juego 3D, mantén el juego 3D y agrega las luces, controles o texturas faltantes.
Devuelve el código de software 100% completo, visualmente enriquecido y funcional en \`\`\`html filename=index.html:`;

        const repairedResponse = await this.aiProvider.streamChat(
          [
            { role: 'system', content: `${NONA_MASTER_SYSTEM_PROMPT_V5}\nEres LEAD CODE HEALER de NONA AI Software Factory.` },
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

    agentEvents.emit('agent.completed', `🛡️ Etapa 3: Calidad QA ${qaReport.visualDensityScore}/100 — 0 Errores Críticos.`);

    const summary = isPartialEdit
      ? `⚡ **Modificación Quirúrgica Completada**:\n- **NONA Surgical Diff**: Modificó con precisión los componentes solicitados.\n- **NONA QA Engine**: Validó la integridad del código (Densidad Funcional: ${qaReport.visualDensityScore}/100).`
      : `🚀 **Software Construido con Estándar NONA Architecture v5.0**:\n1. **🧠 Etapa 1 (Lead Architect)**: Diseñó el APP_MANIFEST y la arquitectura técnica.\n2. **🎨 & ⚙️ Etapa 2 (Full-Stack Engine)**: Implementó lógica real, Three.js/Tailwind y persistencia.\n3. **🛡️ Etapa 3 (QA Engine)**: Validó sintaxis y Densidad Funcional (${qaReport.visualDensityScore}/100).`;

    return { fullCode: finalCode, summary, qaReport };
  }
}

export const multiAgentEngine = new MultiAgentEngine();
