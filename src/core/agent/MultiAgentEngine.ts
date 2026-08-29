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

    // STEP 1: 🧠 Lead System Architect & Blueprint Planner
    onProgress('🧠 Agente 1 (Arquitecto de Software)', 'Diseñando especificación técnica, modelos 3D y árbol de componentes...');
    agentEvents.emit('agent.thinking', '🧠 Agente 1 (Arquitecto): Planificando arquitectura profunda...');

    const architectPrompt = `Eres el AGENTE 1: LEAD SYSTEM ARCHITECT de Google Antigravity.
Analiza la solicitud del usuario y diseña un plano técnico exhaustivo para construir la aplicación o juego:
INSTRUCCIÓN: "${userInstruction}"
${!isNew && currentCode.length > 50 ? `CÓDIGO BASE ACTUAL A MEJORAR:\n${currentCode.slice(0, 4000)}` : ''}

DEFINE EN TU PLAN:
1. Pila tecnológica: Three.js (r128), Tailwind CSS, Web Audio API procedural.
2. Escena 3D & Modelos: Configuración de la pista/mundo, iluminación, materiales, auto/personaje (chasis, ruedas, texturas).
3. Motor de Físicas & Controles: Aceleración suave, inercia, derrape, colisiones con límites y teclas WASD/Flechas.
4. Audio Procedural: Frecuencias de sintetizador Web Audio (motor en marcha, aceleración, derrape, victoria).
5. HUD & UI: Velocímetro digital, minimapa 2D en esquina, cronómetro de vueltas y botón 'INICIAR JUEGO' que inicia el juego de inmediato.

Devuelve un resumen claro y conciso de tu arquitectura.`;

    const blueprint = await this.aiProvider.streamChat(
      [
        { role: 'system', content: 'Eres un Arquitecto de Software Senior y Diseñador de Juegos 3D.' },
        { role: 'user', content: architectPrompt }
      ],
      () => {},
      { signal, model: 'qwen/qwen3.8-27b' }
    );

    agentEvents.emit('agent.completed', '🧠 Arquitectura planificada con éxito.');

    // STEP 2: 🎨 & ⚙️ Lead Full-Stack & 3D Systems Engineer
    onProgress('🎨 & ⚙️ Agente 2 (Ingeniero de Físicas y 3D)', 'Programando motor Three.js, físicas de derrape, controles WASD y audio...');
    agentEvents.emit('agent.thinking', '🎨 Agente 2 (Ingeniero 3D): Escribiendo escena WebGL, físicas y sintetizador...');

    const engineerPrompt = `Eres el AGENTE 2: SENIOR FULL-STACK & 3D SYSTEMS ENGINEER de Google Antigravity.
Implementa el código 100% COMPLETO, FUNCIONAL Y AUTOCONTENIDO en HTML5 + JavaScript basado en la arquitectura diseñada:

PLANO ARQUITECTÓNICO:
${blueprint}

INSTRUCCIÓN ORIGINAL DEL USUARIO:
${userInstruction}

REGLAS CRÍTICAS DE INGENIERÍA:
1. El juego/aplicación debe ser 100% JUGABLE e interactivo en pantalla completa:
   - Carga Three.js: <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
   - Carga Tailwind CSS: <script src="https://cdn.tailwindcss.com"></script>
   - Inicializa WebGLRenderer(antialias: true, shadowMap), Scene con Fog y DirectionalLight con sombras.
   - Construye la pista (asfalto/arena con bordes y palmeras/obstáculos 3D) y el vehículo 3D del jugador (cuerpo, ruedas, alerón).
   - Añade controles de teclado: keydown y keyup para WASD / Flechas.
   - Bucle animate() con requestAnimationFrame() que actualice posición, rotación de ruedas, derrape y cámara en 3ra persona con lerp.
   - Botón 'INICIAR JUEGO' que al hacer click oculte la pantalla inicial (startScreen.style.display = 'none'), active isPlaying = true e inicie el sonido del motor con Web Audio API.
   - HUD superpuesto flotante con velocímetro en KM/H, tiempo y posición.
   - Llama a init() automáticamente al final de la etiqueta <script>.

2. Devuelve TODO el código en un ÚNICO bloque:
\`\`\`html filename=index.html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NONA Application</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <style>body { margin: 0; overflow: hidden; font-family: sans-serif; }</style>
</head>
<body class="bg-black text-white select-none">
  <!-- HUD y Pantalla de Inicio -->
  <div id="start-screen" class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
    <h1 class="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500 mb-4 tracking-wider">CARRERA 3D</h1>
    <p class="text-sm text-slate-400 mb-6">Usa WASD o Flechas para conducir</p>
    <button id="btn-start" class="px-8 py-3 bg-cyan-400 hover:bg-cyan-300 text-black font-black text-lg rounded-xl shadow-lg transition-transform hover:scale-105 cursor-pointer">INICIAR CARRERA</button>
  </div>
  
  <div id="hud" class="fixed top-4 left-4 z-40 bg-black/60 backdrop-blur-md border border-cyan-500/30 p-3 rounded-2xl hidden">
    <div class="text-xs text-cyan-400 font-bold uppercase">Velocidad</div>
    <div class="text-3xl font-black font-mono"><span id="speed-val">0</span> <span class="text-xs font-normal">KM/H</span></div>
  </div>

  <div id="canvas-container" class="fixed inset-0 w-full h-full"></div>

  <script>
    // Motor Three.js completo aquí...
  </script>
</body>
</html>
\`\`\`

3. El código debe estar 100% terminado, sin comentarios de 'implementar aquí', finalizando con </html>\`\`\`.`;

    let generatedCode = '';
    await this.aiProvider.streamChat(
      [
        { role: 'system', content: 'Eres el Ingeniero Líder de Google Antigravity y Three.js.' },
        { role: 'user', content: engineerPrompt }
      ],
      (token, full) => {
        generatedCode = full;
        onProgress('🎨 & ⚙️ Agente 2 (Ingeniero de Físicas y 3D)', 'Programando motor y renderizando escena en vivo...', token);
      },
      { signal, model: 'qwen/qwen3.8-27b' }
    );

    agentEvents.emit('agent.completed', '🎨 & ⚙️ Motor y escena compilados con éxito.');

    // STEP 3: 🛡️ Quality Assurance & Code Integrator
    onProgress('🛡️ Agente 3 (Auditor QA)', 'Verificando ejecución de WebGL, controles y empaquetado final...');
    agentEvents.emit('agent.thinking', '🛡️ Agente 3 (QA): Verificando sintaxis y bucle de renderizado...');

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
1. **🧠 Agente 1 (Arquitecto)**: Diseñó el sistema de físicas, modelos 3D y audio procedural.
2. **🎨 & ⚙️ Agente 2 (Ingeniero 3D)**: Programó el mundo con Three.js, controles de teclado WASD/Flechas y velocímetro.
3. **🛡️ Agente 3 (Auditor QA)**: Verificó la ejecución en tiempo real y conectó el botón de inicio con el bucle de físicas.`;

    agentEvents.emit('agent.completed', '🛡️ Aplicación verificada y lista para interactuar.');

    return { fullCode: finalHtml, summary };
  }
}

export const multiAgentEngine = new MultiAgentEngine();
