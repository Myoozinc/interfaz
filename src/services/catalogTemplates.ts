/**
 * Catálogo de plantillas de NONA: 12 apps profesionales y 20 juegos completos.
 * Los archivos de cada plantilla viven en /public/templates/<id>.json y su portada en /public/templates/<id>.jpg;
 * se descargan solo al cargarla, para no inflar el bundle principal.
 * Cada plantilla se verificó en el banco de pruebas (sin errores de consola, capturas revisadas).
 */
import type { FileItem, ProjectTemplate } from '../types';

interface CatalogMeta {
  id: string; group: 'Apps' | 'Juegos'; name: string; description: string; icon: string; category: string;
  tags: string[]; highlights?: string; lines: number; fileCount: number;
}

const META: CatalogMeta[] = [
  {
    "id": "panel-ventas",
    "group": "Apps",
    "name": "Pulso — Panel de ventas",
    "description": "Panel de ventas para una tienda online de café y accesorios: ingresos, pedidos, productos y clientes de los últimos 7, 30 o 90 días, con detalle de cada pedido.",
    "icon": "Activity",
    "category": "Negocios",
    "tags": [
      "Dashboard",
      "Ventas",
      "E-commerce",
      "Analítica",
      "Pedidos"
    ],
    "highlights": "KPIs con variación por periodo · Gráfico de ingresos con tooltip · Pedidos con filtros y ficha lateral · Ranking de productos y canales",
    "lines": 1765,
    "fileCount": 16
  },
  {
    "id": "crm-clientes",
    "group": "Apps",
    "name": "Cartera — CRM para agencias",
    "description": "CRM para una agencia pequeña: pipeline de oportunidades por etapas con arrastrar y soltar, fichas de contacto con historial y notas, y tareas de seguimiento con fecha.",
    "icon": "BriefcaseBusiness",
    "category": "Negocios",
    "tags": [
      "CRM",
      "Ventas",
      "Pipeline",
      "Clientes",
      "Agencia"
    ],
    "highlights": "Pipeline arrastrable con importe por etapa · Ficha de contacto con actividad y notas · Tareas de seguimiento con vencimiento · Búsqueda global",
    "lines": 1830,
    "fileCount": 16
  },
  {
    "id": "tareas-equipo",
    "group": "Apps",
    "name": "Ritmo — proyectos y tareas en equipo",
    "description": "Gestor de proyectos para equipos pequeños: tablero kanban arrastrable, vista de lista y resumen de avance por proyecto, con responsables, prioridades, fechas límite y subtareas.",
    "icon": "KanbanSquare",
    "category": "Productividad",
    "tags": [
      "Kanban",
      "Tareas",
      "Proyectos",
      "Equipos",
      "Productividad"
    ],
    "highlights": "Tablero kanban arrastrable · Ficha de tarea con subtareas · Filtros Mis tareas / Esta semana · Resumen de carga del equipo",
    "lines": 1737,
    "fileCount": 16
  },
  {
    "id": "asistente-ia",
    "group": "Apps",
    "name": "Redacta — asistente de escritura con IA",
    "description": "Asistente de escritura para pequeños negocios: elige una plantilla (post, email, ficha de producto, respuesta a reseña u oferta), rellena los datos y la IA redacta el texto en directo, con variantes, edición, historial y un chat libre.",
    "icon": "Feather",
    "category": "Productividad",
    "tags": [
      "IA",
      "Escritura",
      "Marketing",
      "Plantillas",
      "Chat"
    ],
    "highlights": "5 plantillas con campos guiados, tono y longitud · Generación en directo con variantes · Editar, copiar y guardar en el historial · Chat libre con el perfil de tu negocio",
    "lines": 1440,
    "fileCount": 14
  },
  {
    "id": "finanzas",
    "group": "Apps",
    "name": "Cuentas Claras — finanzas personales",
    "description": "Controla tu dinero en euros: saldo total y por cuenta, movimientos con categoría, presupuestos mensuales con aviso al pasarte y exportación a CSV.",
    "icon": "Wallet",
    "category": "Estilo de vida",
    "tags": [
      "Finanzas",
      "Presupuestos",
      "Gastos",
      "Ahorro",
      "Dashboard"
    ],
    "highlights": "Saldo por cuenta y evolución mensual · Gastos por categoría en dona · Presupuestos con aviso al pasarte · Filtros por mes y exportar CSV",
    "lines": 1412,
    "fileCount": 15
  },
  {
    "id": "app-fitness",
    "group": "Apps",
    "name": "Pulso Fit — entrenamiento y progreso",
    "description": "App de gimnasio para seguir tus rutinas: sesiones con temporizador de series y descansos, registro de pesos por serie, historial y gráficos de progreso con objetivos semanales editables.",
    "icon": "Dumbbell",
    "category": "Estilo de vida",
    "tags": [
      "Fitness",
      "Gimnasio",
      "Entrenamiento",
      "Temporizador",
      "Móvil"
    ],
    "highlights": "Anillos de objetivo semanal y racha · Sesión con temporizador de series y descansos · Registro de pesos y récords · Progreso con gráficos",
    "lines": 1610,
    "fileCount": 16
  },
  {
    "id": "tienda-online",
    "group": "Apps",
    "name": "Objeto — Tienda online",
    "description": "Tienda online de tecnología y diseño con catálogo filtrable, ficha de producto con variantes, carrito lateral con códigos de descuento y checkout en tres pasos hasta la confirmación del pedido.",
    "icon": "ShoppingBag",
    "category": "Tiendas",
    "tags": [
      "E-commerce",
      "Catálogo",
      "Carrito",
      "Checkout"
    ],
    "highlights": "Filtros y búsqueda · Ficha con variantes y galería · Carrito con cupones · Checkout en 3 pasos",
    "lines": 1424,
    "fileCount": 15
  },
  {
    "id": "menu-restaurante",
    "group": "Apps",
    "name": "Brasa — Carta digital para pedir en mesa",
    "description": "Carta digital de un asador para pedir desde el móvil en la mesa: platos con alérgenos y personalización, pedido con número de mesa, envío a cocina con seguimiento en vivo y aviso al camarero.",
    "icon": "Flame",
    "category": "Tiendas",
    "tags": [
      "Restaurante",
      "Carta digital",
      "Pedidos",
      "Hostelería",
      "Mobile-first"
    ],
    "highlights": "Carta por categorías con alérgenos · Plato con punto, extras y notas · Pedido por mesa y envío a cocina · Seguimiento y llamada al camarero",
    "lines": 1283,
    "fileCount": 14
  },
  {
    "id": "reservas-barberia",
    "group": "Apps",
    "name": "Navaja & Co. — reservas de barbería",
    "description": "Web de reservas para una barbería: servicios con precio y duración, equipo de barberos, reserva en 4 pasos con huecos libres reales, gestión de tus citas y agenda del día para el dueño.",
    "icon": "Scissors",
    "category": "Negocios",
    "tags": [
      "Reservas",
      "Citas",
      "Barbería",
      "Agenda",
      "Negocio local"
    ],
    "highlights": "Reserva en 4 pasos con huecos reales · Mis citas: cambiar hora o cancelar · Agenda del día por barbero · Próximo hueco libre en portada",
    "lines": 1616,
    "fileCount": 14
  },
  {
    "id": "landing-cafe",
    "group": "Apps",
    "name": "Tueste Norte · Web de cafetería",
    "description": "Web de una cafetería de especialidad con tostador propio: carta con precios, origen de los granos, horario y mapa, reserva de mesa con confirmación y tienda de café en grano con carrito.",
    "icon": "Coffee",
    "category": "Webs",
    "tags": [
      "Cafetería",
      "Landing",
      "Reservas",
      "Tienda",
      "Restaurante"
    ],
    "highlights": "Carta por pestañas · Reserva de mesa validada · Tienda de granos con carrito · Mapa y horario en vivo",
    "lines": 1252,
    "fileCount": 15
  },
  {
    "id": "portafolio",
    "group": "Apps",
    "name": "Lucía Marín · Estudio — portafolio creativo",
    "description": "Portafolio de una diseñadora y fotógrafa: proyectos filtrables por disciplina en rejilla o índice, página de proyecto con galería y ficha, servicios con calculadora de presupuesto y contacto con validación.",
    "icon": "Aperture",
    "category": "Webs",
    "tags": [
      "Portafolio",
      "Fotografía",
      "Diseño",
      "Estudio creativo",
      "Galería"
    ],
    "highlights": "Rejilla o índice filtrable por disciplina · Proyecto con galería a pantalla completa · Calculadora de presupuesto · Editor de proyectos",
    "lines": 1336,
    "fileCount": 15
  },
  {
    "id": "blog-revista",
    "group": "Apps",
    "name": "Sobremesa — Revista de cocina y viajes",
    "description": "Revista digital de gastronomía y viajes con portada editorial, secciones, buscador y vista de lectura con barra de progreso, tamaño de letra ajustable y lista para leer luego.",
    "icon": "BookOpen",
    "category": "Webs",
    "tags": [
      "Blog",
      "Revista",
      "Editorial",
      "Newsletter"
    ],
    "highlights": "Portada editorial · Lectura con progreso y tamaño de letra · Guardar para luego · Búsqueda y newsletter",
    "lines": 1287,
    "fileCount": 16
  },
  {
    "id": "kart-rally",
    "group": "Juegos",
    "name": "Kart Rally",
    "description": "Carrera de karts 3D a tres vueltas contra cinco rivales con IA en circuitos procedurales: derrapa para ganar mini-turbos, abre cajas sorpresa y lanza cáscaras para llegar primero a la meta.",
    "icon": "Flag",
    "category": "Carros",
    "tags": [
      "3D",
      "Arcade",
      "Carreras",
      "Karts",
      "IA"
    ],
    "highlights": "↑ / W: acelerar · ↓ / S: frenar · ← → / A D: girar · Shift / X: derrapar · Espacio: usar objeto · Esc / P: pausa",
    "lines": 1882,
    "fileCount": 17
  },
  {
    "id": "neon-highway",
    "group": "Juegos",
    "name": "Neon Highway",
    "description": "Corre de noche por una autopista synthwave infinita bajo un sol retro: esquiva el tráfico al límite, encadena combos, quema nitro y desbloquea bólidos de neón.",
    "icon": "CarFront",
    "category": "Carros",
    "tags": [
      "3D",
      "Arcade",
      "Synthwave",
      "Carreras",
      "Infinito"
    ],
    "highlights": "← → / A D: cambiar de carril · ↑ / W: acelerar · ↓ / S: frenar · Espacio: nitro · Esc / P: pausa",
    "lines": 2196,
    "fileCount": 14
  },
  {
    "id": "drift-kings",
    "group": "Juegos",
    "name": "Drift Kings",
    "description": "Derrapes nocturnos en 3D por un touge de montaña, un puerto lleno de neones y una autopista urbana: encadena combos con multiplicador, clava los puntos de clip, roza el tráfico y deja el asfalto lleno de humo.",
    "icon": "CarFront",
    "category": "Carros",
    "tags": [
      "3D",
      "Arcade",
      "Carreras",
      "Drift",
      "Neón"
    ],
    "highlights": "↑ / W: acelerar · ↓ / S: frenar · ← → / A D: girar y contravolante · Espacio: freno de mano · Shift / N: nitro · Esc / P: pausa",
    "lines": 1809,
    "fileCount": 15
  },
  {
    "id": "monster-truck",
    "group": "Juegos",
    "name": "Monster Truck",
    "description": "Conduce un monster truck por colinas infinitas del desierto, la nieve y la luna: salta rampas, haz mortales, recoge monedas y combustible, y mejora tu camión en el garaje.",
    "icon": "Truck",
    "category": "Carros",
    "tags": [
      "2D",
      "Física",
      "Arcade",
      "Colinas",
      "Mejoras"
    ],
    "highlights": "→ / ↑ / D / W: acelerar (en el aire: girar atrás) · ← / ↓ / A / S: frenar y reversa (en el aire: girar adelante) · Espacio: nitro · Esc / P: pausa",
    "lines": 1897,
    "fileCount": 15
  },
  {
    "id": "police-chase",
    "group": "Juegos",
    "name": "Persecución Nocturna",
    "description": "Huye por una ciudad 3D bajo la lluvia mientras patrullas con sirenas te embisten: roba botín, sube el nivel de búsqueda hasta cinco estrellas y sobrevive incluso al helicóptero.",
    "icon": "Siren",
    "category": "Carros",
    "tags": [
      "3D",
      "Arcade",
      "Persecución",
      "Policía",
      "Ciudad",
      "IA"
    ],
    "highlights": "↑ / W: acelerar · ↓ / S: frenar/reversa · ← → / A D: girar · Espacio / Shift: nitro · Esc / P: pausa",
    "lines": 1891,
    "fileCount": 17
  },
  {
    "id": "sky-ace",
    "group": "Juegos",
    "name": "Sky Ace: As del Cielo",
    "description": "Combate aéreo 3D al atardecer sobre un océano de islas: derriba oleadas de cazas, interceptores y bombarderos con tu ametralladora y misiles con fijación de blanco.",
    "icon": "Plane",
    "category": "Aviones",
    "tags": [
      "3D",
      "Arcade",
      "Combate aéreo",
      "Disparos",
      "Oleadas"
    ],
    "highlights": "Flechas/WASD: pilotar · Espacio: ametralladora · X/M: misil · Shift: turbo · P/Esc: pausa",
    "lines": 2227,
    "fileCount": 14
  },
  {
    "id": "retro-1942",
    "group": "Juegos",
    "name": "Escuadrón 1942",
    "description": "Shoot'em up vertical de arcade retro sobre el Pacífico: derriba escuadrones, esquiva con el rizo y hunde a la fortaleza voladora al final de cada nivel.",
    "icon": "Plane",
    "category": "Aviones",
    "tags": [
      "2D",
      "Arcade",
      "Retro",
      "Pixel art",
      "Shoot'em up"
    ],
    "highlights": "Flechas/WASD mover · disparo automático · Espacio rizo evasivo · X bomba · P/Esc pausa",
    "lines": 1891,
    "fileCount": 14
  },
  {
    "id": "piloto-carga",
    "group": "Juegos",
    "name": "Piloto de Carga",
    "description": "Pilota un robusto avión de carga entre valles nevados en una mañana despejada: sigue los anillos de ruta, vigila el combustible y el viento, y aterriza en pistas de montaña para cobrar cada entrega y mejorar tu avión.",
    "icon": "PlaneLanding",
    "category": "Aviones",
    "tags": [
      "3D",
      "Simulación arcade",
      "Vuelo",
      "Misiones",
      "Mejoras"
    ],
    "highlights": "Flechas/WASD: pilotar · Shift: turbo · Espacio: flaps/frenos · P/Esc: pausa",
    "lines": 1843,
    "fileCount": 15
  },
  {
    "id": "planeador",
    "group": "Juegos",
    "name": "Planeador: Valle Dorado",
    "description": "Vuela sin motor sobre un valle infinito al atardecer: cabalga térmicas doradas para ganar altura, esquiva aves y recoge anillos y estrellas para llegar más lejos que nunca.",
    "icon": "Plane",
    "category": "Aviones",
    "tags": [
      "3D",
      "Vuelo",
      "Planeador",
      "Relajante",
      "Distancia"
    ],
    "highlights": "Flechas/WASD: cabeceo y alabeo · Espacio/Shift: ráfaga · P/Esc: pausa",
    "lines": 1894,
    "fileCount": 20
  },
  {
    "id": "bombero-aereo",
    "group": "Juegos",
    "name": "Bombero Aéreo",
    "description": "Pilota un hidroavión cisterna sobre un bosque en llamas: carga agua rasando el lago, suelta la cortina sobre el fuego y salva cada hectárea antes de que el viento propague el incendio.",
    "icon": "Flame",
    "category": "Aviones",
    "tags": [
      "3D",
      "Arcade",
      "Simulación",
      "Aviones",
      "Rescate"
    ],
    "highlights": "Flechas/WASD: virar y subir/bajar · Espacio: soltar agua · Shift: turbo · rasa el lago para cargar · P/Esc: pausa",
    "lines": 1838,
    "fileCount": 14
  },
  {
    "id": "voxel-craft",
    "group": "Juegos",
    "name": "VoxelCraft",
    "description": "Explora, excava y construye en un mundo infinito de cubos con ciclo día/noche. Sobrevive a las criaturas nocturnas cumpliendo objetivos, o da rienda suelta a tu imaginación en modo creativo.",
    "icon": "Box",
    "category": "Mundos",
    "tags": [
      "3D",
      "Sandbox",
      "Primera persona",
      "Construcción",
      "Supervivencia",
      "Procedural"
    ],
    "highlights": "WASD/flechas mover y girar, ratón mirar, clic izq. romper/atacar, clic der. o E colocar, 1-9 bloque, Espacio saltar, V volar (creativo), Esc pausa",
    "lines": 1933,
    "fileCount": 14
  },
  {
    "id": "isla-perdida",
    "group": "Juegos",
    "name": "Isla Perdida",
    "description": "Sobrevive en una isla tropical procedural de aguas turquesa: tala palmeras, pica rocas y recoge fruta, fabrica herramientas y fogatas, y resiste las noches invadidas por cangrejos hasta que llegue el rescate.",
    "icon": "TreePalm",
    "category": "Mundos",
    "tags": [
      "3D",
      "Supervivencia",
      "Tercera persona",
      "Crafteo",
      "Día y noche"
    ],
    "highlights": "↑ ↓ / W S: caminar · ← → / A D: girar · Shift: correr · Espacio: talar / picar / atacar · E: comer · 1-4: crear · Esc / P: pausa",
    "lines": 1707,
    "fileCount": 14
  },
  {
    "id": "galaxia",
    "group": "Juegos",
    "name": "Galaxia: Frontera Estelar",
    "description": "Explora un sistema solar procedural entre nebulosas y planetas anillados: mina asteroides, comercia en la estación, mejora tu nave y sobrevive a las flotas piratas.",
    "icon": "Rocket",
    "category": "Mundos",
    "tags": [
      "3D",
      "Espacio",
      "Exploración",
      "Minería",
      "Comercio",
      "Disparos"
    ],
    "highlights": "↑/W: propulsión · ↓/S: frenar · ←→/AD: girar · Espacio: láser · Shift: turbo · E: atracar · P/Esc: pausa",
    "lines": 1903,
    "fileCount": 19
  },
  {
    "id": "abismo",
    "group": "Juegos",
    "name": "Abismo: Expedición Abisal",
    "description": "Pilota un submarino hacia la oscuridad del fondo marino: ilumina con tu foco criaturas bioluminiscentes, rescata tesoros con el sonar y mejora el casco para bajar cada vez más profundo.",
    "icon": "Anchor",
    "category": "Mundos",
    "tags": [
      "3D",
      "Exploración",
      "Submarino",
      "Océano",
      "Mejoras",
      "Supervivencia"
    ],
    "highlights": "Flechas/WASD: navegar · Espacio: sonar · X/J: torpedo · Shift: turbo · E: taller (en superficie) · P/Esc: pausa",
    "lines": 1801,
    "fileCount": 17
  },
  {
    "id": "reino-pixel",
    "group": "Juegos",
    "name": "Reino Pixel",
    "description": "RPG de acción top-down en pixel art: recorre el pueblo, el bosque y la mazmorra, cumple misiones, corta slimes y murciélagos con tu espada y derrota al Rey Gólem.",
    "icon": "Sword",
    "category": "Mundos",
    "tags": [
      "2D",
      "RPG",
      "Pixel art",
      "Aventura",
      "Acción"
    ],
    "highlights": "Flechas/WASD mover · Espacio/J espada · Shift/K esquivar · E/Enter hablar y abrir · Q poción · P/Esc pausa",
    "lines": 1688,
    "fileCount": 14
  },
  {
    "id": "torre-defensa",
    "group": "Juegos",
    "name": "Torre Defensa",
    "description": "Defiende el Núcleo de cristal en un tablero 3D flotante: construye cañones, láseres, torres de hielo y lanzamisiles, mejóralos y resiste 20 oleadas con jefes colosales.",
    "icon": "Castle",
    "category": "Arcade",
    "tags": [
      "3D",
      "Estrategia",
      "Tower Defense",
      "Oleadas"
    ],
    "highlights": "Clic/toque en casillas para construir o seleccionar · Flechas/WASD mueven el cursor · 1-4 elige torre · Espacio construye/mejora · X vende · N oleada · F velocidad x2 · Esc pausa",
    "lines": 1936,
    "fileCount": 14
  },
  {
    "id": "salto-estelar",
    "group": "Juegos",
    "name": "Salto Estelar",
    "description": "Plataformas espaciales con niveles procedurales infinitos: salta entre asteroides con doble salto y dash, aplasta alienígenas, recoge fragmentos de estrella y alcanza el portal de cada sector.",
    "icon": "Rocket",
    "category": "Arcade",
    "tags": [
      "2D",
      "Plataformas",
      "Espacio",
      "Arcade",
      "Procedural"
    ],
    "highlights": "Flechas/WASD mover · Espacio/↑/W saltar (doble salto) · Shift/X/J dash · ↓/S bajar plataformas · P/Esc pausa",
    "lines": 1763,
    "fileCount": 14
  },
  {
    "id": "mazmorra",
    "group": "Juegos",
    "name": "Mazmorra",
    "description": "Roguelike 3D isométrico a la luz de las antorchas: explora criptas procedurales, esquiva y combate esqueletos, brujos y gólems, abre cofres de bendiciones y derrota al Rey Liche cada tres pisos.",
    "icon": "Skull",
    "category": "Arcade",
    "tags": [
      "3D",
      "Roguelike",
      "Isométrico",
      "Acción",
      "Mazmorras"
    ],
    "highlights": "WASD / flechas: moverse · Espacio / J: atacar · Shift / K: esquivar · E / L: hechizo · Esc / P: pausa",
    "lines": 2357,
    "fileCount": 14
  },
  {
    "id": "ritmo-neon",
    "group": "Juegos",
    "name": "Ritmo Neón",
    "description": "Juego de ritmo 3D de 4 carriles en un escenario neón: la música se genera en vivo y cada nota cae al compás exacto. Clava los Perfectos, encadena combos y desata la Sobrecarga.",
    "icon": "Music",
    "category": "Arcade",
    "tags": [
      "3D",
      "Ritmo",
      "Música",
      "Arcade",
      "Neón"
    ],
    "highlights": "D F J K o ← ↓ ↑ →: carriles · Espacio: Sobrecarga · P/Esc: pausa",
    "lines": 1873,
    "fileCount": 16
  },
  {
    "id": "futbol-arcade",
    "group": "Juegos",
    "name": "Fútbol Arcade",
    "description": "Fútbol 3 contra 3 en un estadio nocturno bajo los focos: regatea, pasa, carga el tiro y celebra cada gol ante la grada rugiente mientras la IA rival aprieta cada vez más.",
    "icon": "Trophy",
    "category": "Arcade",
    "tags": [
      "3D",
      "Arcade",
      "Deportes",
      "Fútbol",
      "IA"
    ],
    "highlights": "Flechas / WASD: mover · Espacio: tiro cargado (sin balón: barrida) · X / K: pase (sin balón: cambiar jugador) · Shift: sprint · Esc / P: pausa",
    "lines": 1848,
    "fileCount": 18
  }
];

export const CATALOG_GROUPS: Record<'Apps' | 'Juegos', string[]> = {
  Apps: ['Negocios', 'Productividad', 'Tiendas', 'Webs', 'Estilo de vida'],
  Juegos: ['Carros', 'Aviones', 'Mundos', 'Arcade'],
};

export const CATALOG_TEMPLATES: ProjectTemplate[] = META.map(m => ({
  id: m.id,
  group: m.group,
  name: m.name,
  description: m.description,
  icon: m.icon,
  category: m.category,
  tags: m.tags,
  thumbnail: `/templates/${m.id}.jpg`,
  filesUrl: `/templates/${m.id}.json`,
  controls: m.highlights,
  stats: `${m.fileCount} archivos · ${m.lines.toLocaleString('es')} líneas`,
  files: [],
}));

const cache = new Map<string, FileItem[]>();

/** Devuelve la plantilla con sus archivos (los descarga si hace falta). */
export async function resolveTemplateFiles(t: ProjectTemplate): Promise<ProjectTemplate> {
  if (!t.filesUrl || (t.files && t.files.length)) return t;
  let files = cache.get(t.id);
  if (!files) {
    const res = await fetch(t.filesUrl, { cache: 'force-cache' });
    if (!res.ok) throw new Error(`No se pudo descargar la plantilla (${res.status})`);
    const data = await res.json() as { files: FileItem[] };
    files = data.files.map(f => ({ ...f, isModified: false }));
    cache.set(t.id, files);
  }
  return { ...t, files: files.map(f => ({ ...f })) };
}
