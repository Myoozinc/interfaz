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
