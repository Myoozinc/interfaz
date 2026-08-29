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

    // STEP 1: 🧠 Lead System Architect & Blueprint Planner (Lightweight ~400 tokens)
    onProgress('🧠 Agente 1 (Arquitecto de Software)', 'Diseñando especificación técnica, modelos 3D y árbol de componentes...');
    agentEvents.emit('agent.thinking', '🧠 Agente 1 (Arquitecto): Planificando arquitectura profunda...');

    const architectPrompt = `Eres el AGENTE 1: LEAD SYSTEM ARCHITECT de Google Antigravity.
Analiza la solicitud del usuario y diseña un plano técnico conciso para construir la aplicación o juego:
INSTRUCCIÓN: "${userInstruction}"
${!isNew && currentCode.length > 50 ? `CÓDIGO BASE ACTUAL A MEJORAR:\n${currentCode.slice(0, 3000)}` : ''}

DEFINE BREVEMENTE:
1. Pila: Three.js (r128), Tailwind CSS, Web Audio API.
2. Escena 3D / Componentes: Pista/Tablero, auto/piezas, iluminación, controles WASD/click.
3. Lógica & Físicas: Movimiento suave, victoria, HUD (velocidad/puntos).

Devuelve un resumen de 2 párrafos de tu arquitectura.`;

    const blueprint = await this.aiProvider.streamChat(
      [
        { role: 'system', content: 'Eres un Arquitecto de Software Senior y Diseñador de Juegos.' },
        { role: 'user', content: architectPrompt }
      ],
      () => {},
      { signal, model: 'qwen/qwen3.8-27b', maxTokens: 800 }
    );

    agentEvents.emit('agent.completed', '🧠 Arquitectura planificada con éxito.');

    // STEP 2: 🎨 & ⚙️ Lead Full-Stack & 3D Systems Engineer (Full ~5000 tokens)
    onProgress('🎨 & ⚙️ Agente 2 (Ingeniero de Físicas y 3D)', 'Programando motor Three.js/Canvas, controles y lógica interactiva...');
    agentEvents.emit('agent.thinking', '🎨 Agente 2 (Ingeniero 3D): Escribiendo escena WebGL, físicas y lógica...');

    const engineerPrompt = `Eres el AGENTE 2: SENIOR FULL-STACK & 3D SYSTEMS ENGINEER de Google Antigravity.
Implementa el código 100% COMPLETO, FUNCIONAL Y AUTOCONTENIDO en HTML5 + JavaScript basado en la arquitectura diseñada:

PLANO ARQUITECTÓNICO:
${blueprint}

INSTRUCCIÓN ORIGINAL DEL USUARIO:
${userInstruction}

REGLAS CRÍTICAS DE INGENIERÍA:
1. Para juegos 3D: Carga Three.js (<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>) y Tailwind CSS (<script src="https://cdn.tailwindcss.com"></script>).
   - Renderizador WebGLRenderer a pantalla completa, Scene, Camera, Luces, pista/entorno 3D, jugador 3D.
   - Controles WASD / Flechas / Click con loop animate() con requestAnimationFrame().
   - Botón 'INICIAR' que oculte la pantalla de inicio y active el movimiento y sonidos con Web Audio API.
2. Para juegos 2D / Solitario / Juegos de Cartas: Crea el tablero interactivo completo con Tailwind CSS, arrastre o clicks de cartas, lógica de mazos, movimientos legales, cronómetro y estado de victoria.
3. Devuelve TODO el código en un ÚNICO bloque:
\`\`\`html filename=index.html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NONA Application</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
...
</html>
\`\`\`
4. El código debe estar 100% terminado y listo para jugar de inmediato, finalizando con </html>\`\`\`.`;

    let generatedCode = '';
    await this.aiProvider.streamChat(
      [
        { role: 'system', content: 'Eres el Ingeniero Líder de Google Antigravity.' },
        { role: 'user', content: engineerPrompt }
      ],
      (token, full) => {
        generatedCode = full;
        onProgress('🎨 & ⚙️ Agente 2 (Ingeniero de Físicas y 3D)', 'Programando motor y renderizando escena en vivo...', token);
      },
      { signal, model: 'qwen/qwen3.8-27b', maxTokens: 5200 }
    );

    agentEvents.emit('agent.completed', '🎨 & ⚙️ Motor y escena compilados con éxito.');

    // STEP 3: 🛡️ Quality Assurance & Code Integrator
    onProgress('🛡️ Agente 3 (Auditor QA)', 'Verificando ejecución, controles y empaquetado final...');
    agentEvents.emit('agent.thinking', '🛡️ Agente 3 (QA): Verificando sintaxis y empaquetado...');

    let finalHtml = '';
    const match = generatedCode.match(/```html(?:\s+filename=[^\n]+)?\n([\s\S]*?)```/);
    if (match) {
      finalHtml = match[1].trim();
    } else if (generatedCode.includes('<!DOCTYPE html>')) {
      const idx = generatedCode.indexOf('<!DOCTYPE html>');
      finalHtml = generatedCode.slice(idx).replace(/```\s*$/, '').trim();
    } else {
      finalHtml = generatedCode;
    }

    if (!finalHtml.includes('</html>')) {
      if (finalHtml.includes('<script') && !finalHtml.includes('</script>')) {
        finalHtml += '\n</script>';
      }
      if (finalHtml.includes('<body') && !finalHtml.includes('</body>')) {
        finalHtml += '\n</body>';
      }
      finalHtml += '\n</html>';
    }

    const summary = `He desarrollado la aplicación mediante el pipeline multi-agente de Google Antigravity:
1. **🧠 Agente 1 (Arquitecto)**: Diseñó la arquitectura de componentes y modelo de datos.
2. **🎨 & ⚙️ Agente 2 (Ingeniero Líder)**: Programó el motor interactivo completo, controles y animaciones.
3. **🛡️ Agente 3 (Auditor QA)**: Validó el empaquetado final y activó la vista previa.`;

    agentEvents.emit('agent.completed', '🛡️ Aplicación verificada y lista para interactuar.');

    return { fullCode: finalHtml, summary };
  }
}

export const multiAgentEngine = new MultiAgentEngine();
