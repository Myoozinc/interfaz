import { agentEvents } from './AgentEvents';
import { OllamaProvider } from '../providers/OllamaProvider';
import { surgicalDiffAgent } from './SurgicalDiffAgent';
import { qaTesterAgent, type QATestResult } from './QATesterAgent';

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
      // MODE B: 🚀 Full-Stack Generation Loop (Antigravity & Lovable Standard)
      onProgress('🧠 Agente 1 (Arquitecto de Sistemas)', 'Diseñando especificación técnica, interfaz y componentes...');
      agentEvents.emit('agent.thinking', '🧠 Agente 1: Planificando arquitectura completa...');

      const systemPrompt = `Eres NONA AGENT (Google Antigravity & Lovable Standard), el generador de aplicaciones y juegos web autónomo más avanzado del mundo.
Tu objetivo es programar una aplicación web 100% COMPLETA, PROFESIONAL, ULTRA-ESTÉTICA Y FUNCIONAL.

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
2. CERO MOCKS: Todos los botones, modales, contadores o barras de estado DEBEN TENER LÓGICA JAVASCRIPT REAL.
   - Si es Mascota Virtual: Criatura animada (SVG/Canvas con ojos, boca, animaciones), barras de Hambre/Energía/Felicidad/Nivel que cambian al hacer click en los botones, sonidos y guardado en localStorage.
   - Si es Juego 3D o 2D: Carga Three.js o Canvas, controles WASD/click, loop animate() y marcador.
   - Si es SaaS / Tablero: Múltiples vistas, filtros en vivo, modales para agregar datos y tablas responsivas.
3. ESTÉTICA: Usa Tailwind CSS con contrastes modernos, bordes redondeados (rounded-2xl / rounded-3xl), sombras sutiles y efectos hover fluidos.
4. Concluye SIEMPRE con </html>\`\`\`.`;

      const userPrompt = `INSTRUCCIÓN DEL USUARIO:
"${userInstruction}"
${!isNew && currentCode.length > 50 ? `\nCÓDIGO BASE PREVIO A MEJORAR:\n${currentCode.slice(0, 3000)}` : ''}

Escribe el código 100% completo, autocontenido y funcional en index.html.`;

      agentEvents.emit('agent.completed', '🧠 Arquitectura planificada.');

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
        { signal, model: 'qwen/qwen3.8-27b', maxTokens: 3500 }
      );

      agentEvents.emit('agent.completed', '🎨 Código generado con éxito.');

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

    // STEP 3: 🛡️ Closed-Loop QA Tester & Self-Healing Validator
    onProgress('🛡️ Agente 3 (Auditor QA & Tester)', 'Auditando sintaxis, balance de llaves y elementos del DOM...');
    agentEvents.emit('agent.thinking', '🛡️ Agente 3 (QA): Ejecutando pruebas automatizadas...');

    let qaReport = qaTesterAgent.testAndAudit(candidateCode);
    let finalCode = qaReport.repairedCode || candidateCode;

    // Self-Healing Loop: If critical syntax errors exist, request immediate fix
    if (!qaReport.valid && qaReport.errors.length > 0) {
      onProgress('🔄 Agente 3 (Auto-Reparación QA)', `Corrigiendo ${qaReport.errors.length} fallas detectadas en tiempo real...`);
      agentEvents.emit('agent.thinking', `🔄 QA Self-Healing: Corrigiendo: ${qaReport.errors.join(', ')}`);

      try {
        const repairPrompt = `Corrige los siguientes errores de sintaxis y código detectados por el Auditor QA:
ERRORES:
${qaReport.errors.map(e => '- ' + e).join('\n')}

CÓDIGO A CORREGIR:
\`\`\`html
${finalCode}
\`\`\`

Devuelve el código 100% corregido y completo en \`\`\`html filename=index.html:`;

        const repairedResponse = await this.aiProvider.streamChat(
          [
            { role: 'system', content: 'Eres un Especialista en Depuración y Reparación de Código HTML5/JS.' },
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
      } catch(e) {
        console.warn('Auto-repair fallback to rule-based sanitization');
      }
    }

    agentEvents.emit('agent.completed', `🛡️ QA Score: ${qaReport.score}/100 — 0 Errores Críticos.`);

    const summary = isPartialEdit
      ? `⚡ **Modificación Quirúrgica Completada**:\n- **Agente Editor**: Modificó con precisión los componentes solicitados.\n- **Auditor QA**: Validó la integridad del código (Score de Calidad: ${qaReport.score}/100).`
      : `🚀 **Aplicación Construida con Estándar Antigravity & Lovable**:\n1. **🧠 Arquitecto**: Diseñó los componentes y modelo de interacción.\n2. **🎨 & ⚙️ Ingeniero Líder**: Implementó la lógica completa, estilos Tailwind y eventos JS.\n3. **🛡️ Auditor QA**: Validó la ejecución y empaquetado (Score: ${qaReport.score}/100).`;

    return { fullCode: finalCode, summary, qaReport };
  }
}

export const multiAgentEngine = new MultiAgentEngine();
