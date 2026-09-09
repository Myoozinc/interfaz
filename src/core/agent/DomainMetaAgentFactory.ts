import type { ChatMessage, ChatAttachment } from '../../types';

export interface DomainExpertAgent {
  id: string;
  name: string;
  domain: string;
  icon: string;
  badgeColor: string;
  systemPromptAdditions: string;
  recommendedLibraries: string[];
  guardrails: string[];
}

export class DomainMetaAgentFactory {
  /**
   * Analyzes user request, chat history, attachments and project context
   * to determine the exact engineering domain and dynamically instantiate
   * a specialized AI expert agent.
   */
  public analyzeAndInstantiateExpert(
    userInstruction: string,
    history: ChatMessage[] = [],
    attachments: ChatAttachment[] = [],
    currentCode: string = ''
  ): DomainExpertAgent {
    const combinedText = (
      userInstruction + ' ' +
      history.slice(-3).map(m => m.content).join(' ') + ' ' +
      attachments.map(a => a.name + ' ' + (a.title || '') + ' ' + (a.description || '')).join(' ') + ' ' +
      (currentCode ? currentCode.slice(0, 1500) : '')
    ).toLowerCase();

    // 1. Domain: 3D Gaming, Racing & WebGL
    if (
      combinedText.includes('carrera') ||
      combinedText.includes('carreras') ||
      combinedText.includes('racing') ||
      combinedText.includes('auto') ||
      combinedText.includes('autos') ||
      combinedText.includes('coche') ||
      combinedText.includes('coches') ||
      combinedText.includes('carro') ||
      combinedText.includes('conducir') ||
      combinedText.includes('manejar') ||
      combinedText.includes('drift') ||
      combinedText.includes('kart') ||
      combinedText.includes('vehiculo') ||
      combinedText.includes('three.js') ||
      combinedText.includes('threejs') ||
      combinedText.includes('3d') ||
      combinedText.includes('webgl') ||
      combinedText.includes('shader') ||
      combinedText.includes('nave') ||
      combinedText.includes('espacial') ||
      combinedText.includes('mundo virtual') ||
      combinedText.includes('fps') ||
      combinedText.includes('gravedad')
    ) {
      return {
        id: 'agent_threejs_master',
        name: 'Three.js & WebGL 3D Master Architect',
        domain: 'Videojuegos 3D, Carreras, Físicas & WebGL',
        icon: 'Gamepad2',
        badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200',
        recommendedLibraries: [
          'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
          'https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.min.js',
          'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js'
        ],
        guardrails: [
          'Garantizar que el canvas ocupe el 100% de la ventana con renderer.setSize(window.innerWidth, window.innerHeight)',
          'Añadir siempre listener de window.resize para actualizar camera.aspect y camera.updateProjectionMatrix()',
          'Añadir iluminación ambiental e iluminación direccional para evitar geometrías en negro',
          'PROHIBIDO MODELAR VEHÍCULOS COMO UNA SOLA CAJA: Si es un juego de carreras o vehículos, ensamblar siempre un THREE.Group con chasis, cabina con material reflectante, alerón trasero, faros emisivos y 4 ruedas cilíndricas giratorias',
          'FÍSICAS Y MOVIMIENTO REAL: Implementar variables de velocidad, aceleración, frenado y fricción. En el bucle de animación, actualizar continuamente la posición y hacer que la cámara siga al jugador suavemente',
          'CONTROLES DUALES CONTINUOS: Implementar mapa booleano keys = { forward: false, backward: false, left: false, right: false } con eventos keydown/keyup Y botones en pantalla con mousedown/mouseup y touchstart/touchend continuos para que nunca se quede inmóvil',
          'AUDIO PROCEDURAL: Incluir sonido de motor sintetizado con Web Audio API (OscillatorNode sawtooth modulado por la velocidad)',
          'Crear un overlay de inicio ("Haz clic para Iniciar Carrera") para desbloquear el AudioContext y activar el loop'
        ],
        systemPromptAdditions: `Eres el AGENTE ESPECIALISTA EN 3D Y VIDEOJUEGOS de NONA.
Posees maestría absoluta en Three.js (r128), simulación física de vehículos, shaders GLSL, sistemas de partículas para estelas y nitro, y Web Audio API.
REGLA CRÍTICA PARA JUEGOS DE CARRERAS:
- Nunca crees un cubo plano inerte. Construye un coche cyberpunk detallado con 4 ruedas de cilindro que giran con la velocidad, alerón, faros de neón y cámara en tercera persona que sigue al vehículo.
- Los controles deben responder al instante tanto con teclado (WASD / Flechas) como con botones táctiles en pantalla con eventos de presión continua para que el vehículo acelere, frene y gire fluidamente a 60 FPS.`
      };
    }

    // 2. Domain: Audio DSP & Synthesizers
    if (
      combinedText.includes('audio') ||
      combinedText.includes('sintetizador') ||
      combinedText.includes('synth') ||
      combinedText.includes('música') ||
      combinedText.includes('piano') ||
      combinedText.includes('ondas') ||
      combinedText.includes('frecuencia') ||
      combinedText.includes('ecualizador') ||
      combinedText.includes('sonido') ||
      combinedText.includes('oscilador') ||
      combinedText.includes('dsp')
    ) {
      return {
        id: 'agent_audiodsp_master',
        name: 'Web Audio API & DSP Sound Architect',
        domain: 'Síntesis de Audio, Música & DSP',
        icon: 'Music',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        recommendedLibraries: [
          'https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.js',
          'https://cdn.tailwindcss.com'
        ],
        guardrails: [
          'Nunca iniciar el AudioContext antes de una interacción de usuario (click/tap) para evitar el bloqueo del navegador',
          'Conectar siempre un GainNode limitador maestro para prevenir distorsión y clipeo en los altavoces',
          'Implementar envolvente ADSR (Attack, Decay, Sustain, Release) suave para evitar chasquidos acústicos',
          'Renderizar un osciloscopio o analizador FFT de ondas en tiempo real sobre un elemento Canvas 2D'
        ],
        systemPromptAdditions: `Eres el AGENTE ESPECIALISTA EN WEB AUDIO Y DSP de NONA.
Tu código produce sintetizadores de grado profesional, cajas de ritmos secuenciadoras de 16 pasos y analizadores de frecuencia en tiempo real.
Diseña interfaces hápticas, con teclas de piano animadas, perillas de filtro resonante y visualizadores de onda con AnalyserNode.`
      };
    }

    // 3. Domain: SaaS, FinTech & Analytics Dashboard
    if (
      combinedText.includes('dashboard') ||
      combinedText.includes('saas') ||
      combinedText.includes('finanzas') ||
      combinedText.includes('crypto') ||
      combinedText.includes('analítica') ||
      combinedText.includes('métricas') ||
      combinedText.includes('crm') ||
      combinedText.includes('tabla') ||
      combinedText.includes('gráfico') ||
      combinedText.includes('estadísticas')
    ) {
      return {
        id: 'agent_saas_fintech',
        name: 'FinTech SaaS & Data Product Architect',
        domain: 'SaaS Empresarial, FinTech & Métricas',
        icon: 'BarChart3',
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
        recommendedLibraries: [
          'https://cdn.jsdelivr.net/npm/chart.js',
          'https://cdn.tailwindcss.com',
          'https://unpkg.com/lucide@latest'
        ],
        guardrails: [
          'Incluir filtros dinámicos por fecha (Hoy, 7D, 30D, 1A) con actualización de datos simulados en vivo',
          'Diseñar tarjetas de KPI con porcentajes de variación verde/rojo y sparklines',
          'Tabla de datos con búsqueda en tiempo real, ordenamiento por columnas y estado vacío elegante'
        ],
        systemPromptAdditions: `Eres el AGENTE ESPECIALISTA EN PRODUCTO SAAS Y DASHBOARDS de NONA.
Creas experiencias web empresariales modernas estilo Stripe, Linear y Vercel. Utiliza paletas de colores sofisticadas (Slate, Indigo, Emerald), modo oscuro impecable y gráficos interactivos con Chart.js.`
      };
    }

    // 4. Domain: 2D Arcade & Physics Canvas Game
    if (
      combinedText.includes('arcade') ||
      combinedText.includes('2d') ||
      combinedText.includes('mario') ||
      combinedText.includes('pacman') ||
      combinedText.includes('tetris') ||
      combinedText.includes('pong') ||
      combinedText.includes('flappy') ||
      combinedText.includes('plataformas') ||
      combinedText.includes('disparar') ||
      combinedText.includes('juego 2d')
    ) {
      return {
        id: 'agent_canvas2d_master',
        name: 'HTML5 2D Canvas & Physics Game Master',
        domain: 'Videojuegos 2D, Arcade & Físicas Canvas',
        icon: 'Gamepad2',
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
        recommendedLibraries: [
          'https://cdn.tailwindcss.com',
          'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.4/dist/confetti.browser.min.js'
        ],
        guardrails: [
          'Limpiar el canvas en cada fotograma con ctx.clearRect(0, 0, width, height)',
          'Manejar teclas presionadas en un set/objeto para permitir movimientos diagonales fluidos',
          'Sistema de puntuación más alta (High Score) guardada en localStorage',
          'Efectos de partículas en colisiones y pantalla de Game Over con botón de reinicio instantáneo'
        ],
        systemPromptAdditions: `Eres el AGENTE ESPECIALISTA EN JUEGOS 2D Y ARCADE de NONA.
Generas bucles de juego impecables a 60 FPS en HTML5 Canvas con detección de colisiones AABB o circular, pantallas de Game Over y efectos de partículas de celebración.`
      };
    }

    // 5. Domain: E-Commerce & Interactive Storefront
    if (
      combinedText.includes('tienda') ||
      combinedText.includes('carrito') ||
      combinedText.includes('ecommerce') ||
      combinedText.includes('e-commerce') ||
      combinedText.includes('comprar') ||
      combinedText.includes('checkout') ||
      combinedText.includes('productos') ||
      combinedText.includes('catálogo')
    ) {
      return {
        id: 'agent_ecommerce_master',
        name: 'Modern E-Commerce Experience Architect',
        domain: 'Comercio Electrónico, Carrito & Checkout',
        icon: 'ShoppingBag',
        badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
        recommendedLibraries: [
          'https://cdn.tailwindcss.com',
          'https://unpkg.com/lucide@latest',
          'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.4/dist/confetti.browser.min.js'
        ],
        guardrails: [
          'Estado reactivo de carrito de compra con badge de contador en el botón superior',
          'Modal de checkout con validación de campos, cálculo de impuestos/envío y confirmación con confeti',
          'Filtros por categoría y barra de búsqueda reactiva instantánea'
        ],
        systemPromptAdditions: `Eres el AGENTE ESPECIALISTA EN E-COMMERCE de NONA.
Diseñas tiendas en línea estilo Apple Store / Shopify con tarjetas de producto con zoom hover, selector de variantes de color, carrito deslizable lateral y pasarela de pago simulada.`
      };
    }

    // Default Domain: Full-Stack Creative Architect
    return {
      id: 'agent_fullstack_architect',
      name: 'Full-Stack Senior Creative Architect',
      domain: 'Arquitectura Web & Aplicaciones Interactivas',
      icon: 'Cpu',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      recommendedLibraries: [
        'https://cdn.tailwindcss.com',
        'https://unpkg.com/lucide@latest',
        'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.4/dist/confetti.browser.min.js'
      ],
      guardrails: [
        'Asegurar código modular, libre de errores sintácticos y 100% ejecutable en el navegador',
        'Validar eventos de botones y accesibilidad responsive en móviles y escritorio',
        'Diseño visual pulido con tipografía clara y sombras sutiles'
      ],
      systemPromptAdditions: `Eres el LEAD SOFTWARE ARCHITECT de NONA.
Diseñas software moderno, limpio, interactivo y visualmente atractivo. Todas las interacciones deben responder inmediatamente al usuario con animaciones y transiciones suaves.`
    };
  }
}

export const domainMetaAgentFactory = new DomainMetaAgentFactory();
