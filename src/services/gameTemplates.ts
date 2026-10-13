/**
 * Catálogo de juegos completos de NONA (Carros, Aviones, Mundos, Juegos).
 * Los archivos de cada plantilla viven en /public/templates/<id>.json y su portada en /public/templates/<id>.jpg;
 * se descargan solo al cargar la plantilla para no inflar el bundle principal.
 * Generado por la mesa de pruebas de plantillas (cada juego verificado en three r128 y r170).
 */
import type { FileItem, ProjectTemplate } from '../types';

export interface GameTemplateMeta {
  id: string; name: string; description: string; icon: string; category: string;
  tags: string[]; controls?: string; lines: number; fileCount: number;
}

const META: GameTemplateMeta[] = [
  {
    "id": "kart-rally",
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
    "controls": "↑ / W: acelerar · ↓ / S: frenar · ← → / A D: girar · Shift / X: derrapar · Espacio: usar objeto · Esc / P: pausa",
    "lines": 1882,
    "fileCount": 17
  },
  {
    "id": "neon-highway",
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
    "controls": "← → / A D: cambiar de carril · ↑ / W: acelerar · ↓ / S: frenar · Espacio: nitro · Esc / P: pausa",
    "lines": 2196,
    "fileCount": 14
  },
  {
    "id": "drift-kings",
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
    "controls": "↑ / W: acelerar · ↓ / S: frenar · ← → / A D: girar y contravolante · Espacio: freno de mano · Shift / N: nitro · Esc / P: pausa",
    "lines": 1809,
    "fileCount": 15
  },
  {
    "id": "monster-truck",
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
    "controls": "→ / ↑ / D / W: acelerar (en el aire: girar atrás) · ← / ↓ / A / S: frenar y reversa (en el aire: girar adelante) · Espacio: nitro · Esc / P: pausa",
    "lines": 1897,
    "fileCount": 15
  },
  {
    "id": "police-chase",
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
    "controls": "↑ / W: acelerar · ↓ / S: frenar/reversa · ← → / A D: girar · Espacio / Shift: nitro · Esc / P: pausa",
    "lines": 1891,
    "fileCount": 17
  },
  {
    "id": "sky-ace",
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
    "controls": "Flechas/WASD: pilotar · Espacio: ametralladora · X/M: misil · Shift: turbo · P/Esc: pausa",
    "lines": 2227,
    "fileCount": 14
  },
  {
    "id": "retro-1942",
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
    "controls": "Flechas/WASD mover · disparo automático · Espacio rizo evasivo · X bomba · P/Esc pausa",
    "lines": 1891,
    "fileCount": 14
  },
  {
    "id": "piloto-carga",
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
    "controls": "Flechas/WASD: pilotar · Shift: turbo · Espacio: flaps/frenos · P/Esc: pausa",
    "lines": 1843,
    "fileCount": 15
  },
  {
    "id": "planeador",
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
    "controls": "Flechas/WASD: cabeceo y alabeo · Espacio/Shift: ráfaga · P/Esc: pausa",
    "lines": 1894,
    "fileCount": 20
  },
  {
    "id": "bombero-aereo",
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
    "controls": "Flechas/WASD: virar y subir/bajar · Espacio: soltar agua · Shift: turbo · rasa el lago para cargar · P/Esc: pausa",
    "lines": 1838,
    "fileCount": 14
  },
  {
    "id": "voxel-craft",
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
    "controls": "WASD/flechas mover y girar, ratón mirar, clic izq. romper/atacar, clic der. o E colocar, 1-9 bloque, Espacio saltar, V volar (creativo), Esc pausa",
    "lines": 1933,
    "fileCount": 14
  },
  {
    "id": "isla-perdida",
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
    "controls": "↑ ↓ / W S: caminar · ← → / A D: girar · Shift: correr · Espacio: talar / picar / atacar · E: comer · 1-4: crear · Esc / P: pausa",
    "lines": 1707,
    "fileCount": 14
  },
  {
    "id": "galaxia",
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
    "controls": "↑/W: propulsión · ↓/S: frenar · ←→/AD: girar · Espacio: láser · Shift: turbo · E: atracar · P/Esc: pausa",
    "lines": 1903,
    "fileCount": 19
  },
  {
    "id": "abismo",
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
    "controls": "Flechas/WASD: navegar · Espacio: sonar · X/J: torpedo · Shift: turbo · E: taller (en superficie) · P/Esc: pausa",
    "lines": 1801,
    "fileCount": 17
  },
  {
    "id": "reino-pixel",
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
    "controls": "Flechas/WASD mover · Espacio/J espada · Shift/K esquivar · E/Enter hablar y abrir · Q poción · P/Esc pausa",
    "lines": 1688,
    "fileCount": 14
  },
  {
    "id": "torre-defensa",
    "name": "Torre Defensa",
    "description": "Defiende el Núcleo de cristal en un tablero 3D flotante: construye cañones, láseres, torres de hielo y lanzamisiles, mejóralos y resiste 20 oleadas con jefes colosales.",
    "icon": "Castle",
    "category": "Juegos",
    "tags": [
      "3D",
      "Estrategia",
      "Tower Defense",
      "Oleadas"
    ],
    "controls": "Clic/toque en casillas para construir o seleccionar · Flechas/WASD mueven el cursor · 1-4 elige torre · Espacio construye/mejora · X vende · N oleada · F velocidad x2 · Esc pausa",
    "lines": 1936,
    "fileCount": 14
  },
  {
    "id": "salto-estelar",
    "name": "Salto Estelar",
    "description": "Plataformas espaciales con niveles procedurales infinitos: salta entre asteroides con doble salto y dash, aplasta alienígenas, recoge fragmentos de estrella y alcanza el portal de cada sector.",
    "icon": "Rocket",
    "category": "Juegos",
    "tags": [
      "2D",
      "Plataformas",
      "Espacio",
      "Arcade",
      "Procedural"
    ],
    "controls": "Flechas/WASD mover · Espacio/↑/W saltar (doble salto) · Shift/X/J dash · ↓/S bajar plataformas · P/Esc pausa",
    "lines": 1763,
    "fileCount": 14
  },
  {
    "id": "mazmorra",
    "name": "Mazmorra",
    "description": "Roguelike 3D isométrico a la luz de las antorchas: explora criptas procedurales, esquiva y combate esqueletos, brujos y gólems, abre cofres de bendiciones y derrota al Rey Liche cada tres pisos.",
    "icon": "Skull",
    "category": "Juegos",
    "tags": [
      "3D",
      "Roguelike",
      "Isométrico",
      "Acción",
      "Mazmorras"
    ],
    "controls": "WASD / flechas: moverse · Espacio / J: atacar · Shift / K: esquivar · E / L: hechizo · Esc / P: pausa",
    "lines": 2357,
    "fileCount": 14
  },
  {
    "id": "ritmo-neon",
    "name": "Ritmo Neón",
    "description": "Juego de ritmo 3D de 4 carriles en un escenario neón: la música se genera en vivo y cada nota cae al compás exacto. Clava los Perfectos, encadena combos y desata la Sobrecarga.",
    "icon": "Music",
    "category": "Juegos",
    "tags": [
      "3D",
      "Ritmo",
      "Música",
      "Arcade",
      "Neón"
    ],
    "controls": "D F J K o ← ↓ ↑ →: carriles · Espacio: Sobrecarga · P/Esc: pausa",
    "lines": 1873,
    "fileCount": 16
  },
  {
    "id": "futbol-arcade",
    "name": "Fútbol Arcade",
    "description": "Fútbol 3 contra 3 en un estadio nocturno bajo los focos: regatea, pasa, carga el tiro y celebra cada gol ante la grada rugiente mientras la IA rival aprieta cada vez más.",
    "icon": "Trophy",
    "category": "Juegos",
    "tags": [
      "3D",
      "Arcade",
      "Deportes",
      "Fútbol",
      "IA"
    ],
    "controls": "Flechas / WASD: mover · Espacio: tiro cargado (sin balón: barrida) · X / K: pase (sin balón: cambiar jugador) · Shift: sprint · Esc / P: pausa",
    "lines": 1848,
    "fileCount": 18
  }
];

export const GAME_CATEGORIES = ['Carros', 'Aviones', 'Mundos', 'Juegos'] as const;

export const GAME_TEMPLATES: ProjectTemplate[] = META.map(m => ({
  id: m.id,
  name: m.name,
  description: m.description,
  icon: m.icon,
  category: m.category,
  tags: m.tags,
  badge: 'Nuevo',
  thumbnail: `/templates/${m.id}.jpg`,
  filesUrl: `/templates/${m.id}.json`,
  controls: m.controls,
  stats: `${m.fileCount} archivos · ${m.lines.toLocaleString('es')} líneas`,
  files: [],
}));

/** Plantillas antiguas sustituidas por juegos del catálogo nuevo (se ocultan de la galería). */
export const REPLACED_TEMPLATE_IDS = new Set(['cyberpunk-3d-racing', 'mario-kart-3d-arcade', 'ace-combat-3d-dogfight']);

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
