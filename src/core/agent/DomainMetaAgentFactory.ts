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
    // 1. Filtrar historial: considerar EXCLUSIVAMENTE mensajes del usuario (role === 'user'),
    // NUNCA mensajes de bienvenida ni respuestas del asistente o sistema (Bug 1).
    const userHistoryMessages = history.filter(
      m => m.role === 'user' && m.content && m.content.trim().length > 0
    );

    // 2. Normalizar instrucción del usuario con máxima prioridad
    const userText = userInstruction.toLowerCase().trim();

    // 3. Ignorar currentCode si es el scaffold starter por defecto (Lienzo Listo, Lienzo limpio, AURA.store, etc.)
    const isStarterCode = !currentCode ||
      currentCode.includes('Lienzo Listo') ||
      currentCode.includes('Lienzo limpio') ||
      currentCode.includes('AURA.store') ||
      currentCode.trim().length < 60;
    const validCurrentCode = isStarterCode ? '' : currentCode.slice(0, 1500).toLowerCase();

    // 4. Contexto secundario (únicamente mensajes del usuario + adjuntos + código existente real)
    const secondaryContext = (
      userHistoryMessages.slice(-2).map(m => m.content).join(' ') + ' ' +
      attachments.map(a => a.name + ' ' + (a.title || '') + ' ' + (a.description || '')).join(' ') + ' ' +
      validCurrentCode
    ).toLowerCase();

    // Helper de coincidencia por expresión regular con límites de palabra (\b)
    const matchesPattern = (regex: RegExp): boolean => {
      // 1. Alta prioridad: evaluar en la instrucción actual del usuario
      if (regex.test(userText)) return true;
      // 2. Solo evaluar en contexto previo si la instrucción del usuario es muy corta o un seguimiento vago
      // y NO introduce un nuevo tema independiente o utilidad común (calculadora, formulario, etc.)
      const isGenericFollowUp = userText.length < 25 && /(m[aá]s|agr[eé]gale|cambia|color|fix|arregla|ponle|hazlo)/i.test(userText);
      if (isGenericFollowUp && regex.test(secondaryContext)) return true;
      return false;
    };

    // 0. Domain: 3D Aerial Combat, Dogfight & Flight Simulator (Planes, Jets, Warbirds)
    if (
      matchesPattern(/\b(avi[oó]n|aviones|vuelo|volar|a[eé]reo|a[eé]rea|combate a[eé]reo|guerra de aviones|piloto|caza|cazas|dogfight|jet|jets|helic[oó]ptero|f-16|f-22|spitfire)\b/i)
    ) {
      return {
        id: 'agent_flight_combat',
        name: 'Ace Flight & 3D Dogfight Architect',
        domain: 'Combate Aéreo 3D, Guerra de Aviones & Simulador de Vuelo WebGL',
        icon: 'Plane',
        badgeColor: 'bg-sky-100 text-sky-800 border-sky-200',
        recommendedLibraries: [
          'three',
          'lucide-react',
          'clsx',
          'tailwind-merge'
        ],
        guardrails: [
          'ARQUITECTURA REACT MULTI-ARCHIVO: Generar "index.html" y "src/App.tsx" como componente raíz modular con Tailwind CSS.',
          'MODULARIDAD COMPONENCIAL: Separar la lógica en componentes modulares (ej: "src/components/FlightCanvas.tsx" para el viewport Three.js WebGL, "src/components/FlightHUD.tsx" para retícula/altímetro/velocímetro, "src/components/TouchFlightControls.tsx" para controles táctiles móviles).',
          'MODELADO AERONÁUTICO DETALLADO: Ensamblar un caza 3D con THREE.Group que incluya fuselaje aerodinámico cónico, alas en delta con alerones, cabina reflectante, timón de cola vertical, ametralladoras dobles en las alas y tobera con llama emisiva de turbina.',
          'FÍSICAS DE VUELO REALES: Avance continuo hacia adelante en la dirección del avión, pitch (cabeceo) al subir/bajar, y roll (alabeo) al virar. Cámara en tercera persona suave que sigue al avión.',
          'SISTEMA DE COMBATE Y DISPAROS: Proyectiles láser o balas de ametralladora disparadas con [ESPACIO] o botón [DISPARAR], con sonido sintetizado Web Audio API.',
          'ENEMIGOS Y EXPLOSIONES: Spawnea cazas enemigos en el cielo. Al impactarlos con disparos, reducir su salud y producir explosiones de partículas 3D con sonido y sumar puntos al score.',
          'HUD TÁCTICO: Retícula / mira central, altímetro, velocímetro y contador de bajas.',
          'CONTRATO DE SALIDA OBLIGATORIO: Devolver estrictamente el objeto JSON con la clave "files" (array de { "path": string, "content": string }) y "explanation". Prohibido código en HTML monolítico o scripts de CDN.'
        ],
        systemPromptAdditions: `Eres el AGENTE ESPECIALISTA EN COMBATE AÉREO Y SIMULACIÓN DE VUELO 3D de NONA.
Posees maestría en Three.js, física aerodinámica de vuelo aéreo/espacial, sistemas de partículas para disparos/explosiones/postcombustión, y Web Audio API.
REGLAS DE ARQUITECTURA:
- Diseña la aplicación como un proyecto React modular multi-archivo ("index.html", "src/App.tsx", "src/components/*.tsx").
- El jugador controla un avión caza militar 3D (fuselaje, cabina, alas en delta, turbina con llama brillante).
- Puede maniobrar (pitch, roll, yaw), acelerar con turbo, disparar ráfagas de ametralladora y destruir cazas enemigos en pleno vuelo.
- HUD táctico con mira central de puntería, altímetro, velocímetro y contador de bajas.
- Controles duales: Teclado (WASD/Flechas + Espacio) y botones táctiles en pantalla para móviles.
- Respuesta en formato JSON estricto con la clave "files".`
      };
    }

    // 1. Domain: 3D Gaming, Racing & WebGL (Cars, Kart, Cyberpunk, 3D Worlds)
    if (
      matchesPattern(/\b(carrera|carreras|racing|auto|autos|autom[oó]vil|autom[oó]viles|coche|coches|carro|carros|conducir|manejar|drift|kart|karts|veh[ií]culo|veh[ií]culos|three\.?js|webgl|shader|shaders|mundo virtual|fps)\b/i) ||
      matchesPattern(/\b(3d|3-d)\b/i) ||
      matchesPattern(/\b(nave espacial|naves espaciales|combate espacial|asteroides|gravedad cero)\b/i)
    ) {
      return {
        id: 'agent_threejs_master',
        name: 'Three.js & WebGL 3D Master Architect',
        domain: 'Videojuegos 3D, Carreras, Físicas & WebGL',
        icon: 'Gamepad2',
        badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200',
        recommendedLibraries: [
          'three',
          'cannon-es',
          'lucide-react',
          'clsx',
          'tailwind-merge'
        ],
        guardrails: [
          'ARQUITECTURA REACT MULTI-ARCHIVO: Generar "index.html" y "src/App.tsx" con Tailwind CSS dark mode.',
          'MODULARIDAD COMPONENCIAL: Dividir la aplicación en componentes (ej: "src/components/RaceCanvas.tsx" para el renderer Three.js y loop 60 FPS, "src/components/SpeedometerHUD.tsx" para velocímetro y odómetro digital, "src/components/TouchControls.tsx" para controles en pantalla).',
          'PROHIBIDO MODELAR VEHÍCULOS COMO UNA SOLA CAJA: Si es un juego de carreras o vehículos, ensamblar siempre un THREE.Group con chasis, cabina con material reflectante, alerón trasero, faros emisivos y 4 ruedas cilíndricas giratorias.',
          'FÍSICAS Y MOVIMIENTO REAL: Implementar variables de velocidad, aceleración, frenado y fricción. En el bucle de animación, actualizar continuamente la posición y hacer que la cámara siga al jugador suavemente.',
          'CONTROLES DUALES CONTINUOS: Implementar mapa booleano keys = { forward: false, backward: false, left: false, right: false } con eventos keydown/keyup Y botones en pantalla con mousedown/mouseup y touchstart/touchend continuos para que nunca se quede inmóvil.',
          'AUDIO PROCEDURAL: Incluir sonido de motor sintetizado con Web Audio API (OscillatorNode sawtooth modulado por la velocidad tras interacción del usuario).',
          'CONTRATO DE SALIDA OBLIGATORIO: Devolver estrictamente el objeto JSON con la clave "files" (array de { "path": string, "content": string }) y "explanation". Cero scripts externos de CDN.'
        ],
        systemPromptAdditions: `Eres el AGENTE ESPECIALISTA EN 3D Y VIDEOJUEGOS de NONA.
Posees maestría absoluta en Three.js, simulación física de vehículos, shaders GLSL, partículas para estelas/nitro, y Web Audio API.
REGLAS DE ARQUITECTURA:
- Estructura el proyecto en archivos modulares React ("src/App.tsx", "src/components/*.tsx").
- Construye un vehículo 3D detallado ensamblado con THREE.Group (chasis, alerón, cabina/asiento, volante, tubos de escape y 4 ruedas cilíndricas que rotan).
- Si el usuario solicita estilo Mario Kart o arcade: genera un mundo vibrante con cielo azul soleado, colinas verdes, bordes a cuadros rojos/blancos y monedas coleccionables.
- Si el usuario solicita estilo Cyberpunk / Neón: genera una autopista nocturna infinita con rascacielos oscuros, faros y estelas de neón cyan/magenta.
- Controles fluidos con teclado (WASD / Flechas) y botones táctiles en pantalla.`
      };
    }

    // 2. Domain: Audio DSP & Synthesizers
    if (
      matchesPattern(/\b(audio|sintetizador|sintetizadores|synth|synths|m[uú]sica|piano|ondas|frecuencia|ecualizador|sonido|oscilador|osciladores|dsp|tone\.?js|web audio)\b/i)
    ) {
      return {
        id: 'agent_audiodsp_master',
        name: 'Web Audio API & DSP Sound Architect',
        domain: 'Síntesis de Audio, Música & DSP',
        icon: 'Music',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        recommendedLibraries: [
          'tone',
          'lucide-react',
          'clsx',
          'tailwind-merge'
        ],
        guardrails: [
          'ARQUITECTURA REACT MULTI-ARCHIVO: Generar "index.html", "src/App.tsx" y componentes modulares en "src/components/*.tsx".',
          'MODULARIDAD DE AUDIO: Separar la interfaz en módulos (ej: "src/components/PianoKeyboard.tsx", "src/components/WaveformVisualizer.tsx", "src/components/KnobControl.tsx").',
          'DESBLOQUEO DE AUDIOCONTEXT: Nunca iniciar el AudioContext antes de una interacción de usuario (click/tap) para evitar el bloqueo del navegador.',
          'PROTECCIÓN DE SALIDA: Conectar siempre un GainNode limitador maestro para prevenir distorsión y clipeo en los altavoces.',
          'ENVOLVENTE ADSR: Implementar Attack, Decay, Sustain, Release suave para evitar chasquidos acústicos.',
          'VISUALIZADOR EN VIVO: Renderizar un osciloscopio o analizador FFT de ondas en tiempo real sobre un elemento Canvas 2D.',
          'CONTRATO DE SALIDA OBLIGATORIO: Devolver estrictamente el objeto JSON con la clave "files" (array de { "path": string, "content": string }) y "explanation".'
        ],
        systemPromptAdditions: `Eres el AGENTE ESPECIALISTA EN WEB AUDIO Y DSP de NONA.
Tu código produce sintetizadores de grado profesional, secuenciadores de pasos y analizadores de frecuencia en tiempo real.
REGLAS DE ARQUITECTURA:
- Construye el proyecto como una aplicación React multi-archivo limpia con Tailwind CSS.
- Diseña interfaces hápticas, con teclas de piano animadas, perillas de filtro resonante y visualizadores de onda con AnalyserNode.
- Responde estrictamente en formato JSON con la clave "files".`
      };
    }

    // 3. Domain: SaaS, FinTech & Analytics Dashboard
    if (
      matchesPattern(/\b(dashboard|dashboards|saas|finanzas|fintech|crypto|anal[ií]tica|m[eé]tricas|crm|gr[aá]fico|gr[aá]ficos|estad[ií]sticas|kpi|kpis)\b/i)
    ) {
      return {
        id: 'agent_saas_fintech',
        name: 'FinTech SaaS & Data Product Architect',
        domain: 'SaaS Empresarial, FinTech & Métricas',
        icon: 'BarChart3',
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
        recommendedLibraries: [
          'chart.js',
          'lucide-react',
          'clsx',
          'tailwind-merge',
          '@supabase/supabase-js'
        ],
        guardrails: [
          'ARQUITECTURA REACT MULTI-ARCHIVO: Generar "index.html", "src/App.tsx" con diseño enterprise en Tailwind CSS.',
          'MODULARIDAD SAAS: Componentes limpios separados (ej: "src/components/KPICards.tsx", "src/components/AnalyticsChart.tsx", "src/components/DataTable.tsx", "src/components/Sidebar.tsx").',
          'MÉTRICAS DINÁMICAS: Incluir filtros por fecha (Hoy, 7D, 30D, 1A) con actualización de datos simulados o en tiempo real.',
          'TARJETAS DE KPI: Mostrar porcentajes de variación verde/rojo, iconos vectoriales de Lucide y sparklines.',
          'TABLA DE DATOS: Búsqueda reactiva, ordenamiento por columnas, estados de paginación y diseño de estado vacío elegante.',
          'CONTRATO DE SALIDA OBLIGATORIO: Devolver estrictamente el objeto JSON con la clave "files" (array de { "path": string, "content": string }) y "explanation".'
        ],
        systemPromptAdditions: `Eres el AGENTE ESPECIALISTA EN PRODUCTO SAAS Y DASHBOARDS de NONA.
Creas experiencias web empresariales modernas estilo Stripe, Linear y Vercel.
REGLAS DE ARQUITECTURA:
- Estructura el software en componentes React modulares ("src/App.tsx", "src/components/*.tsx").
- Utiliza paletas de colores sofisticadas (Slate, Indigo, Emerald), modo oscuro impecable y gráficos interactivos con Chart.js o SVG.
- Responde estrictamente en formato JSON con la clave "files".`
      };
    }

    // 4. Domain: 2D Arcade & Physics Canvas Game
    if (
      matchesPattern(/\b(arcade|2d|mario|pacman|tetris|pong|flappy|plataformas|juego 2d|videojuego 2d|canvas 2d)\b/i)
    ) {
      return {
        id: 'agent_canvas2d_master',
        name: 'HTML5 2D Canvas & Physics Game Master',
        domain: 'Videojuegos 2D, Arcade & Físicas Canvas',
        icon: 'Gamepad2',
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
        recommendedLibraries: [
          'canvas-confetti',
          'lucide-react',
          'clsx',
          'tailwind-merge'
        ],
        guardrails: [
          'ARQUITECTURA REACT MULTI-ARCHIVO: Generar "index.html", "src/App.tsx" y componentes separados en "src/components/*.tsx".',
          'MODULARIDAD ARCADE: Separar el juego (ej: "src/components/ArcadeCanvas.tsx" para el loop de juego, "src/components/GameHUD.tsx" para puntuación y vidas, "src/components/GameOverModal.tsx" para Game Over).',
          'BUCLE DE JUEGO A 60 FPS: requestAnimationFrame con limpieza en cada fotograma mediante ctx.clearRect(0, 0, width, height).',
          'CONTROLES Y PERSISTENCIA: Manejar teclas presionadas en un set/objeto para permitir movimientos diagonales fluidos, y High Score persistido en localStorage.',
          'EFECTOS Y FEEDBACK: Partículas en colisiones, vibración visual de pantalla y pantalla de Game Over con botón de reinicio instantáneo.',
          'CONTRATO DE SALIDA OBLIGATORIO: Devolver estrictamente el objeto JSON con la clave "files" (array de { "path": string, "content": string }) y "explanation".'
        ],
        systemPromptAdditions: `Eres el AGENTE ESPECIALISTA EN JUEGOS 2D Y ARCADE de NONA.
Generas bucles de juego impecables a 60 FPS en HTML5 Canvas con detección de colisiones, interfaz reactiva y efectos de partículas.
REGLAS DE ARQUITECTURA:
- Estructura en archivos modulares React ("src/App.tsx", "src/components/*.tsx").
- Controles multi-dispositivo (teclas físicas WASD/flechas y botones táctiles en pantalla).
- Responde estrictamente en formato JSON con la clave "files".`
      };
    }

    // 5. Domain: E-Commerce & Interactive Storefront
    if (
      matchesPattern(/\b(tienda|tiendas|carrito|ecommerce|e-commerce|checkout|cat[aá]logo|storefront|pasarela de pago)\b/i) ||
      (matchesPattern(/\b(productos|comprar)\b/i) && !matchesPattern(/\b(juego|game|3d|vuelo)\b/i))
    ) {
      return {
        id: 'agent_ecommerce_master',
        name: 'Modern E-Commerce Experience Architect',
        domain: 'Comercio Electrónico, Carrito & Checkout',
        icon: 'ShoppingBag',
        badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
        recommendedLibraries: [
          'lucide-react',
          'canvas-confetti',
          'clsx',
          'tailwind-merge',
          '@supabase/supabase-js'
        ],
        guardrails: [
          'ARQUITECTURA REACT MULTI-ARCHIVO: Generar "index.html" y "src/App.tsx" con Tailwind CSS premium.',
          'MODULARIDAD E-COMMERCE: Separar en componentes modulares (ej: "src/components/ProductGrid.tsx", "src/components/ProductCard.tsx", "src/components/CartDrawer.tsx", "src/components/CheckoutModal.tsx").',
          'ESTADO REACTIVO DEL CARRITO: Carrito de compra reactivo con badge de contador en el botón superior, incremento/decremento de cantidades y cálculo de subtotales.',
          'MODAL DE CHECKOUT: Modal interactivo con validación de campos, simulación de pasarela de pago y confirmación festiva con confetti.',
          'FILTROS Y BÚSQUEDA: Filtros por categoría y barra de búsqueda instantánea.',
          'CONTRATO DE SALIDA OBLIGATORIO: Devolver estrictamente el objeto JSON con la clave "files" (array de { "path": string, "content": string }) y "explanation".'
        ],
        systemPromptAdditions: `Eres el AGENTE ESPECIALISTA EN E-COMMERCE de NONA.
Diseñas tiendas en línea estilo Apple Store y Shopify con tarjetas de producto con zoom hover, selector de variantes, carrito lateral deslizable y pasarela de pago simulada.
REGLAS DE ARQUITECTURA:
- Estructura modular en archivos React ("src/App.tsx", "src/components/*.tsx").
- Responde estrictamente en formato JSON con la clave "files".`
      };
    }

    // 6. Default Domain: Full-Stack Creative Architect (Calculators, Productivity, Tools, Utilities, Web Apps)
    return {
      id: 'agent_fullstack_architect',
      name: 'Full-Stack Senior Creative Architect',
      domain: 'Arquitectura Web, Herramientas & Aplicaciones Interactivas',
      icon: 'Cpu',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      recommendedLibraries: [
        'lucide-react',
        'canvas-confetti',
        'clsx',
        'tailwind-merge',
        '@supabase/supabase-js'
      ],
      guardrails: [
        'ARQUITECTURA REACT MULTI-ARCHIVO: Generar "index.html" y "src/App.tsx" como componente raíz React interactivo con Tailwind CSS.',
        'MODULARIDAD LIMPIA: Separar la interfaz en componentes reutilizables en "src/components/*.tsx" (ej: Display, Controls, History, Toolbar, Settings).',
        'LÓGICA 100% OPERATIVA: Toda la interactividad solicitada (cálculos matemáticos, historial de operaciones, atajos de teclado, animaciones hápticas) debe funcionar al 100% sin botones inertes.',
        'DISEÑO VISUAL DE ALTA FIDELIDAD: Paletas modernas de Tailwind (Slate/Zinc/Indigo), tipografía nítida monoespaciada para valores numéricos, sombras sutiles y accesibilidad.',
        'CONTRATO DE SALIDA OBLIGATORIO: Devolver estrictamente el objeto JSON con la clave "files" (array de { "path": string, "content": string }) y "explanation". Prohibido código en un solo HTML monolítico o scripts de CDN.'
      ],
      systemPromptAdditions: `Eres el LEAD SOFTWARE ARCHITECT de NONA.
Diseñas software moderno, modular, limpio, 100% interactivo y visualmente atractivo.
REGLAS DE ARQUITECTURA:
- Estructura la aplicación como un proyecto React modular multi-archivo ("index.html", "src/App.tsx", "src/components/*.tsx").
- Todas las interacciones deben responder inmediatamente al usuario con transiciones suaves y atajos de teclado donde aplique.
- Responde estrictamente en formato JSON con la clave "files".`
    };
  }
}

export const domainMetaAgentFactory = new DomainMetaAgentFactory();
