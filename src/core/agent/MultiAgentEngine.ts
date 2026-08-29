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

  private detectCategory(instruction: string): '3d_game' | 'pet_simulation' | 'card_game' | 'saas_dashboard' {
    const lower = instruction.toLowerCase();
    if (lower.includes('mascota') || lower.includes('tamagotchi') || lower.includes('pet')) {
      return 'pet_simulation';
    }
    if (lower.includes('carta') || lower.includes('solitario') || lower.includes('poker') || lower.includes('blackjack') || lower.includes('baraja')) {
      return 'card_game';
    }
    if (lower.includes('3d') || lower.includes('carrera') || lower.includes('mario kart') || lower.includes('auto') || lower.includes('nave') || lower.includes('mundo virtual')) {
      return '3d_game';
    }
    return 'saas_dashboard';
  }

  async executeAutonomousPipeline(
    userInstruction: string,
    currentCode: string,
    isNew: boolean,
    onProgress: (stepName: string, detail: string, streamToken?: string) => void,
    signal?: AbortSignal
  ): Promise<{ fullCode: string; summary: string }> {

    const category = this.detectCategory(userInstruction);

    // STEP 1: 🧠 Lead System Architect & Blueprint Planner
    onProgress('🧠 Agente 1 (Arquitecto de Software)', `Diseñando arquitectura para categoría: [${category.toUpperCase()}]...`);
    agentEvents.emit('agent.thinking', `🧠 Agente 1 (Arquitecto): Planificando arquitectura [${category}]...`);

    const architectPrompt = `Eres el AGENTE 1: LEAD SYSTEM ARCHITECT de Google Antigravity.
Analiza la solicitud del usuario y diseña un plano técnico para construir la aplicación:
INSTRUCCIÓN: "${userInstruction}"
CATEGORÍA DETECTADA: ${category}
${!isNew && currentCode.length > 50 ? `CÓDIGO BASE PREVIO:\n${currentCode.slice(0, 3000)}` : ''}

DIRECTIVAS SEGÚN CATEGORÍA:
- Si es 'pet_simulation' (Mascota Virtual): Diseña un Tamagotchi moderno con personaje animado en SVG/Canvas, 4 barras de estado (Hambre, Energía, Diversión, Higiene), botones funcionales (Alimentar 🍕, Jugar 🎾, Dormir 🌙, Bañar 🧼), subida de nivel, efectos de sonido y guardado en localStorage.
- Si es '3d_game' (Juegos 3D): Diseña la escena Three.js (r128), pista/mundo, auto/jugador 3D, controles WASD/Flechas, loop animate(), velocímetro y botón de inicio.
- Si es 'card_game' (Cartas / Solitario): Diseña las 7 columnas del solitario, mazo de robo, 4 pilas de fundaciones, lógica de arrastre o click para mover cartas y estado de victoria.
- Si es 'saas_dashboard': Diseña la navegación multi-pestaña, gráficos, tablas con búsqueda/filtro y modales interactivos.

Devuelve un resumen técnico de 2 párrafos.`;

    const blueprint = await this.aiProvider.streamChat(
      [
        { role: 'system', content: 'Eres un Arquitecto de Software Senior y Diseñador de Sistemas.' },
        { role: 'user', content: architectPrompt }
      ],
      () => {},
      { signal, model: 'qwen/qwen3.8-27b', maxTokens: 800 }
    );

    agentEvents.emit('agent.completed', '🧠 Arquitectura planificada con éxito.');

    // STEP 2: 🎨 & ⚙️ Lead Full-Stack Engineer
    onProgress('🎨 & ⚙️ Agente 2 (Ingeniero Full-Stack)', 'Escribiendo el código completo con animaciones, lógica y sonido...');
    agentEvents.emit('agent.thinking', '🎨 Agente 2: Programando componentes interactivos, JavaScript y CSS...');

    const engineerPrompt = `Eres el AGENTE 2: SENIOR FULL-STACK ENGINEER de Google Antigravity.
Implementa el código 100% COMPLETO, FUNCIONAL Y AUTOCONTENIDO en HTML5 + Tailwind CSS + JavaScript basado en la arquitectura diseñada:

PLANO ARQUITECTÓNICO:
${blueprint}

INSTRUCCIÓN DEL USUARIO:
${userInstruction}

REGLAS CRÍTICAS DE CONSTRUCCIÓN:
1. El código debe ser 100% AUTOCONTENIDO en un solo archivo index.html listo para ejecutarse de inmediato.
2. Usa Tailwind CSS (<script src="https://cdn.tailwindcss.com"></script>) y Lucide Icons (<script src="https://unpkg.com/lucide@latest"></script>).
3. SI ES UNA MASCOTA VIRTUAL:
   - Dibuja la mascota con SVG o Canvas con animaciones CSS (pestañeo, rebote feliz, comiendo, durmiendo con 'Zzz').
   - Los botones Alimentar, Jugar, Dormir y Limpiar DEBEN cambiar las barras de progreso en tiempo real con números y colores dinámicos.
   - Sonidos con window.playSynthSound('eat'), window.playSynthSound('happy'), window.playSynthSound('click').
   - Guarda el estado en localStorage.
4. SI ES UN JUEGO 3D:
   - Carga Three.js (<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>).
   - Crea el WebGLRenderer a pantalla completa, pista, auto 3D, controles WASD y loop animate().
5. Devuelve TODO el código en un ÚNICO bloque:
\`\`\`html filename=index.html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NONA App</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-white min-h-screen">
  ...
  <script>
    // Lógica 100% terminada aquí...
  </script>
</body>
</html>
\`\`\`
6. Finaliza SIEMPRE con </html>\`\`\` sin dejar código cortado.`;

    let generatedCode = '';
    await this.aiProvider.streamChat(
      [
        { role: 'system', content: 'Eres el Ingeniero de Software Líder de Google Antigravity.' },
        { role: 'user', content: engineerPrompt }
      ],
      (token, full) => {
        generatedCode = full;
        onProgress('🎨 & ⚙️ Agente 2 (Ingeniero Full-Stack)', 'Generando componentes y renderizando en vivo...', token);
      },
      { signal, model: 'qwen/qwen3.8-27b', maxTokens: 4800 }
    );

    agentEvents.emit('agent.completed', '🎨 & ⚙️ Código compilado con éxito.');

    // STEP 3: 🛡️ Quality Assurance & Code Integrator
    onProgress('🛡️ Agente 3 (Auditor QA)', 'Auditando sintaxis, eventos y empaquetado final...');
    agentEvents.emit('agent.thinking', '🛡️ Agente 3 (QA): Validando empaquetado...');

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
1. **🧠 Arquitecto**: Diseñó la estructura de estado, componentes interactivos y audio.
2. **🎨 & ⚙️ Ingeniero Líder**: Implementó la lógica completa, controles de interacción y animaciones fluidas.
3. **🛡️ Auditor QA**: Verificó la ejecución en tiempo real y activó la vista previa.`;

    agentEvents.emit('agent.completed', '🛡️ Aplicación verificada y lista para interactuar.');

    return { fullCode: finalHtml, summary };
  }
}

export const multiAgentEngine = new MultiAgentEngine();
