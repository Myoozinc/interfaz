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

    // 0.5. Domain: 3D Creative Studio, Modeling, CAD & Geometry (Spline / Blender / CAD / Geometry Creator)
    if (
      matchesPattern(/\b(figura|figuras|geometr[ií]a|geometr[ií]as|modelado|modelar|escena 3d|estudio 3d|diseño 3d|diseno 3d|cad|creador 3d|editor 3d|visualizador 3d|spline|escultura 3d|malla|mallas|mesh|meshes|pol[ií]gono|pol[ií]gonos)\b/i) ||
      (matchesPattern(/\b(3d|3-d)\b/i) && matchesPattern(/\b(crear|generar|editor|estudio|studio|diseñar|disenar|geometr|forma|figura|herramienta|cubo|esfera|cono|toro)\b/i))
    ) {
      return {
        id: 'agent_3d_studio_master',
        name: '3D Creative Studio & Geometry CAD Architect',
        domain: 'Estudio de Modelado 3D, Geometría, Escena & CAD WebGL',
        icon: 'Box',
        badgeColor: 'bg-violet-100 text-violet-800 border-violet-200',
        recommendedLibraries: [
          'three',
          'three/addons/controls/OrbitControls',
          'lucide-react',
          'clsx',
          'tailwind-merge'
        ],
        guardrails: [
          'ARQUITECTURA REACT MULTI-ARCHIVO: Generar "index.html", "src/App.tsx", "src/components/Toolbar.tsx", "src/components/InspectorPanel.tsx", "src/components/GeometryCanvas.tsx", "src/components/StatusBar.tsx", "src/components/PresetSelector.tsx".',
          'VIEWPORT THREE.JS PROFESIONAL: Renderizado WebGL con antialias: true, shadowMap activado, OrbitControls con enableDamping = true (dampingFactor = 0.05). Suelo con THREE.GridHelper reflectante sobre plano sutil y luz de estudio de 3 puntos (KeyLight direccional, FillLight suave, RimLight trasera de contra y AmbientLight).',
          'CATÁLOGO EXTENSO DE PRIMITIVAS 3D: Generar al menos 8 primitivas seleccionables: Cubo (BoxGeometry), Esfera (SphereGeometry), Cilindro (CylinderGeometry), Cono (ConeGeometry), Toro/Donut (TorusGeometry), Dodecaedro (DodecahedronGeometry), Nudo Toroidal (TorusKnotGeometry), Cápsula o Icosaedro.',
          'PANEL INSPECTOR DE PROPIEDADES EN TIEMPO REAL: Barra lateral o dock flotante con sliders numéricos y lectura viva de: Posición (X, Y, Z), Rotación (X, Y, Z en grados o radianes), Escala (X, Y, Z), selector de color hexadecimal/paleta visual, Rugosidad (Roughness 0-1), Metalicidad (Metalness 0-1), Wireframe toggle, y Opacidad.',
          'LISTA DE OBJETOS Y JERARQUÍA DE ESCENA: Panel con lista de formas creadas en la escena, indicando el objeto actualmente seleccionado para edición, con botón para duplicar, cambiar nombre o eliminar la figura.',
          'PRESETS Y ENTORNOS DE ESCENA: Mínimo 4 presets visuales aplicables con 1 clic (ej: "Estudio Minimalista", "Cyberpunk Neón", "Oro & Obsidiana", "Atardecer Pastel") que ajusten luces, fondo y materiales.',
          'BARRA DE ACCIONES Y CAPTURA: Botón de descarga de captura PNG (renderer.domElement.toDataURL), botón de auto-rotación de escena con control de velocidad, botón para resetear cámara a vista isométrica o frontal, y contador en vivo de vértices/polígonos.',
          'ESTÉTICA PREMIUM Y GLASSMORPHISM: Interfaz estilo Spline / Linear con bg-slate-950, paneles bg-slate-900/80 backdrop-blur-xl border border-slate-800/80, acentos violeta/índigo, e iconos Lucide en cada herramienta.'
        ],
        systemPromptAdditions: `Eres el AGENTE LEAD EN MODELADO 3D, GEOMETRÍA Y ESTUDIOS CREATIVOS de NONA.
Posees maestría en Three.js, shaders, cálculo de mallas paramétricas, sistemas de luces de estudio y diseño de interfaces CAD/Spline.
REGLAS DE ARQUITECTURA:
- Diseña un estudio 3D completo de nivel profesional (estilo Spline / Blender Web), NUNCA un prototipo simplista.
- Incluye barra de herramientas de geometrías (Cubo, Esfera, Cilindro, Cono, Toro, Dodecaedro, Nudo Toroidal, etc.), panel inspector de propiedades en tiempo real (transformaciones X/Y/Z, color, metalicidad, rugosidad, wireframe), lista de objetos de la escena, barra de estado con contador de polígonos/vértices y presets de atmósfera.
- Viewport con OrbitControls fluidos con amortiguación, iluminación de 3 puntos y cuadrícula reflectante de suelo.
- Captura de pantalla PNG de alta resolución descargable directamente por el usuario.`
      };
    }

    // 1. Domain: 3D Gaming, Racing & WebGL (Cars, Kart, Cyberpunk, 3D Worlds)
    if (
      matchesPattern(/\b(carrera|carreras|racing|auto|autos|autom[oó]vil|autom[oó]viles|coche|coches|carro|carros|conducir|manejar|drift|kart|karts|veh[ií]culo|veh[ií]culos|fps|shooter|nave espacial|naves espaciales|combate espacial|asteroides|gravedad cero)\b/i) ||
      (matchesPattern(/\b(juego|videojuego|mundo virtual)\b/i) && matchesPattern(/\b(3d|3-d)\b/i))
    ) {
      const isNavalGame = matchesPattern(/\b(barco|barcos|hundir|naval|flota|battleship|mar|oceano|oc[eé]ano|submarino|torpedo|ca[ñn]on)\b/i);
      const isRacingGame = matchesPattern(/\b(carrera|carreras|auto|autos|coche|coches|carro|carros|veh[ií]culo|kart|mario kart|derrape|drift|pista|velocidad)\b/i);
      const isSpaceGame = matchesPattern(/\b(espacio|espacial|galaxia|asteroide|asteroides|nave|naves|star|laser|l[aá]ser)\b/i);

      return {
        id: 'agent_threejs_master',
        name: isNavalGame ? 'Three.js Naval 3D Fleet Architect' : 'Three.js & WebGL 3D Master Architect',
        domain: isNavalGame ? 'Hundir la Flota 3D, Batalla Naval & Físicas WebGL' : 'Videojuegos 3D, Carreras, Físicas & WebGL',
        icon: 'Gamepad2',
        badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200',
        recommendedLibraries: [
          'three',
          'three/addons/controls/OrbitControls',
          'cannon-es',
          'lucide-react',
          'clsx',
          'tailwind-merge'
        ],
        guardrails: [
          'ARQUITECTURA REACT O STANDALONE 3D ROBUSTA: Generar "index.html", "src/App.tsx" o estructura modular 100% interactiva con Three.js sin scripts externos rotos.',
          isNavalGame
            ? 'SIMULACIÓN NAVAL HUNDIR BARCOS 3D: Implementar océano 3D animado, cuadrícula naval 10x10 táctica, buques 3D detallados (Portaaviones, Acorazado, Crucero, Submarino, Destructor), disparo de cañones con proyectiles parabólicos, partículas de salpicadura de agua y explosión de fuego, turno de IA enemiga y HUD de radar táctico.'
            : isRacingGame
            ? 'SIMULACIÓN DE CARRERAS: Ensamblar vehículo 3D detallado con THREE.Group (chasis, cabina, alerón, faros y 4 ruedas giratorias), pista de carreras con curvas, velocímetro digital HUD, aceleración/frenado suave y audio procedural de motor.'
            : isSpaceGame
            ? 'SIMULACIÓN ESPACIAL 3D: Nave estelar maniobrable, campo de asteroides procedural, disparo de láseres de plasma y HUD de radar orbital.'
            : 'BUCLE DE ANIMACIÓN Y RENDER 60 FPS: Loop requestAnimationFrame continuo, iluminación con DirectionalLight y AmbientLight, sombras y cámara fluida.',
          'AUDIO PROCEDURAL WEB AUDIO API: Generar efectos de sonido procedurales sin archivos de audio externos (disparos, explosiones, motor, oleaje o impactos usando OscillatorNode y GainNode con Web Audio seguro tras interacción).',
          'HUD TÁCTICO INTERACTIVO: Superposición elegante con Tailwind CSS (puntuación, radar, vida, munición, botón de reinicio y pantalla de victoria/derrota).',
          'CONTRATO DE SALIDA OBLIGATORIO: Devolver estrictamente el objeto JSON con la clave "files" (array de { "path": string, "content": string }) y "explanation".'
        ],
        systemPromptAdditions: `Eres el AGENTE ESPECIALISTA EN 3D Y VIDEOJUEGOS de NONA.
Posees maestría absoluta en Three.js, shaders GLSL, simulación física, sistemas de partículas (fuego, humo, chispas, agua) y Web Audio API.

${isNavalGame ? `ESPECIALIZACIÓN NAVAL (HUNDIR LA FLOTA / BATTLESHIP 3D):
- Renderiza un océano 3D animado con plano ondulante en azul marino profundo (#0f172a a #0284c7).
- Tablero naval 10x10 con celdas seleccionables y coordenadas (A-J, 1-10).
- Flota 3D detallada con buques de guerra geométricos (chasis naval gris acorazado, torretas de cañones cilíndricas, puente de mando, mástiles).
- Mecánica de combate: Selección de celda -> Animación de disparo de cañón -> Proyectil 3D volando -> Salpicadura de agua si falla (Miss) o Explosión ardiente de partículas rojas/naranjas si impacta (Hit).
- Almirante IA enemigo que dispara en su turno con lógica de búsqueda táctica.
- HUD Táctico: Pantalla de radar circular giratorio, barra de buques restantes y efectos de sonido de cañonazos y oleaje marino con Web Audio.` : isRacingGame ? `ESPECIALIZACIÓN EN CARRERAS Y VEHÍCULOS:
- Vehículo 3D detallado con THREE.Group (chasis, cabina reflectante, alerón, faros emisivos y 4 ruedas giratorias).
- Físicas con inercia, aceleración, derrape y fricción a 60 FPS.
- HUD con velocímetro digital, barra de turbo y controles táctiles + teclado.` : `ESPECIALIZACIÓN EN VIDEOJUEGOS 3D INTERACTIVOS:
- Escena 3D completa con iluminación cinemática, sombras y controles de cámara fluidos.
- Entorno interactivo con loop de juego a 60 FPS y efectos visuales de partículas.
- HUD informativo moderno superpuesto con Tailwind CSS.`}`
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
          'MODULARIDAD DE AUDIO: Separar la interfaz en módulos (ej: "src/components/PianoKeyboard.tsx", "src/components/StepSequencer.tsx", "src/components/WaveformVisualizer.tsx", "src/components/KnobControl.tsx").',
          'DESBLOQUEO DE AUDIOCONTEXT: Iniciar o resumir el AudioContext de forma segura en la primera interacción de usuario (click/tap) para evitar el bloqueo del navegador.',
          'PROTECCIÓN DE SALIDA: Conectar siempre un GainNode limitador maestro para prevenir distorsión y clipeo en los altavoces.',
          'ENVOLVENTE ADSR & FILTRO: Implementar Attack, Decay, Sustain, Release y perillas de frecuencia de corte (Cutoff) y resonancia suave.',
          'VISUALIZADOR EN VIVO: Renderizar un osciloscopio o analizador FFT de ondas en tiempo real sobre un elemento Canvas 2D con gradiente brillante neón.',
          'CONTRATO DE SALIDA OBLIGATORIO: Devolver estrictamente el objeto JSON con la clave "files" (array de { "path": string, "content": string }) y "explanation".'
        ],
        systemPromptAdditions: `Eres el AGENTE ESPECIALISTA EN WEB AUDIO Y DSP de NONA.
Tu código produce sintetizadores de grado profesional estilo Ableton / Teenage Engineering, secuenciadores de pasos y analizadores de frecuencia en tiempo real.
REGLAS DE ARQUITECTURA:
- Construye el proyecto como una aplicación React multi-archivo limpia con Tailwind CSS dark mode y glassmorphism.
- Diseña interfaces táctiles con teclado interactivo, perillas rotatorias de filtro y visualizador de onda fluorescente con AnalyserNode.
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
          'chart.js/auto',
          'lucide-react',
          'clsx',
          'tailwind-merge',
          '@supabase/supabase-js'
        ],
        guardrails: [
          'ARQUITECTURA REACT MULTI-ARCHIVO: Generar "index.html", "src/App.tsx", "src/components/KPICards.tsx", "src/components/AnalyticsChart.tsx", "src/components/DataTable.tsx", "src/components/Sidebar.tsx", "src/components/TopNav.tsx".',
          'ESTÉTICA ENTERPRISE LINEAR / STRIPE: Dark mode refinado (bg-slate-950, card bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl), acentos índigo y esmeralda, tipografía monoespaciada para cantidades monetarias y métricas.',
          'TARJETAS DE KPI CON SPARKLINE: Mínimo 4 métricas principales (Ingresos, Usuarios Activos, Conversión, Churn) con badge porcentual de tendencia (+14.2% / -2.1%), icono vectorial y micro-gráfico de tendencia.',
          'GRÁFICO INTERACTIVO: Visualización con Chart.js o SVG interactivo con filtro temporal reactivo (7 Días, 30 Días, 1 Año, Todo) y selector de métrica (Ventas, Tráfico, Conversiones).',
          'TABLA DE DATOS COMPLETA: Búsqueda en vivo por texto, ordenamiento interactivo por columnas, selector de estado (Completado, Pendiente, Cancelado), paginación y modal para crear nuevo registro.',
          'CONTRATO DE SALIDA OBLIGATORIO: Devolver estrictamente el objeto JSON con la clave "files" (array de { "path": string, "content": string }) y "explanation".'
        ],
        systemPromptAdditions: `Eres el AGENTE ESPECIALISTA EN PRODUCTO SAAS Y DASHBOARDS de NONA.
Creas experiencias web empresariales modernas de clase mundial estilo Stripe, Linear y Vercel.
REGLAS DE ARQUITECTURA:
- Estructura el software en componentes React modulares ("src/App.tsx", "src/components/*.tsx").
- Utiliza paletas de colores sofisticadas (Slate, Indigo, Emerald), modo oscuro impecable, navegación lateral colapsable y tablas con filtros reales.
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
          'ARQUITECTURA REACT MULTI-ARCHIVO: Generar "index.html", "src/App.tsx", "src/components/ArcadeCanvas.tsx", "src/components/GameHUD.tsx", "src/components/GameOverModal.tsx", "src/components/TouchControls.tsx".',
          'BUCLE DE JUEGO A 60 FPS: requestAnimationFrame con delta-time, actualización de físicas continuas y renderizado limpio en Canvas 2D.',
          'SISTEMA DE PARTÍCULAS Y JUICE: Explosiones de partículas de colores al romper bloques o eliminar enemigos, sacudida de pantalla (screen shake) y efectos visuales de feedback.',
          'CONTROLES DUALES Y PERSISTENCIA: Manejo fluido de teclado (WASD / Flechas) + controles táctiles en pantalla para móviles. Récord histórico (High Score) guardado en localStorage.',
          'CONTRATO DE SALIDA OBLIGATORIO: Devolver estrictamente el objeto JSON con la clave "files" (array de { "path": string, "content": string }) y "explanation".'
        ],
        systemPromptAdditions: `Eres el AGENTE ESPECIALISTA EN JUEGOS 2D Y ARCADE de NONA.
Generas bucles de juego impecables a 60 FPS en HTML5 Canvas con detección de colisiones, interfaz reactiva, pantalla de Game Over y efectos de partículas.
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
          'ARQUITECTURA REACT MULTI-ARCHIVO: Generar "index.html", "src/App.tsx", "src/components/ProductGrid.tsx", "src/components/ProductCard.tsx", "src/components/CartDrawer.tsx", "src/components/CheckoutModal.tsx", "src/components/CategoryFilter.tsx".',
          'EXPERIENCIA STOREFRONT APPLE/SHOPIFY: Banner hero con gradiente y llamada a la acción, rejilla de productos con imágenes estéticas, badges de descuento ("-25%", "Top Seller"), selector de variantes (color/talla) y calificación con estrellas.',
          'CARRITO LATERAL DESLIZABLE (DRAWER): Panel lateral con animación fluida, listado de artículos, botones de +/- cantidad, eliminación, campo de cupón de descuento y cálculo automático de subtotal, envío e impuestos.',
          'CHECKOUT MODAL CON CONFETTI: Flujo de pago simulado en 2 pasos (datos de envío y tarjeta mock) con validación reactiva y explosión de confetti con canvas-confetti al confirmar.',
          'CONTRATO DE SALIDA OBLIGATORIO: Devolver estrictamente el objeto JSON con la clave "files" (array de { "path": string, "content": string }) y "explanation".'
        ],
        systemPromptAdditions: `Eres el AGENTE ESPECIALISTA EN E-COMMERCE de NONA.
Diseñas tiendas en línea premium estilo Apple Store y Shopify con tarjetas de producto con zoom hover, selector de variantes, carrito lateral deslizable y pasarela de pago interactiva.
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
        'ARQUITECTURA REACT MULTI-ARCHIVO: Generar obligatoriamente "index.html", "src/App.tsx", y componentes modulares en "src/components/*.tsx" adaptados al caso de uso (ej: Navbar, Hero, Services/Catalog, BookingModal/FormModal, Pricing, Testimonials, Footer; o Workspace/ControlPanel si es una herramienta técnica).',
        'DISEÑO RICO Y COMPLETO: Prohibido prototipos de un solo botón o páginas vacías. Diseñar una experiencia profunda con navegación, secciones ricas de contenido, interactividad completa (modales funcionales, filtrado, reservas o cálculos reactivos) y alta calidad visual.',
        'INTERACTIVIDAD Y ATENCIÓN AL DETALLE: Lógica 100% operativa, modales reactivos con confirmación, validación de formularios, estados de carga y retroalimentación táctil (active:scale-95).',
        'ESTÉTICA PREMIUM LINEAR / VERCEL / APPLE: Dark mode o paletas elegantes acordes al negocio, glassmorphism sutil (backdrop-blur-xl border border-slate-800/80), tipografía nítida e iconos vectoriales de Lucide en cada botón o elemento interactivo.',
        'CONTRATO DE SALIDA OBLIGATORIO: Devolver estrictamente el objeto JSON con la clave "files" (array de { "path": string, "content": string }) y "explanation". Prohibido código en un solo HTML monolítico o scripts de CDN.'
      ],
      systemPromptAdditions: `Eres el LEAD SOFTWARE ARCHITECT de NONA.
Diseñas software y aplicaciones web modernas, modulares, completas, 100% interactivas y visualmente deslumbrantes (estándar Linear, Vercel, Apple).
REGLAS DE ARQUITECTURA:
- Estructura la aplicación como un proyecto React modular multi-archivo ("index.html", "src/App.tsx", "src/components/*.tsx").
- Adapta los componentes a la naturaleza del producto: para sitios web y servicios crea Navbar, Hero, Catálogo/Servicios interactivos, Modal de reservas/contacto, Reseñas y Footer. Para dashboards o herramientas técnicas crea Workspace, Paneles de control y métricas.
- Responde estrictamente en formato JSON con la clave "files".`
    };
  }
}

export const domainMetaAgentFactory = new DomainMetaAgentFactory();
