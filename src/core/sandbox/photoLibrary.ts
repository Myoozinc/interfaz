const LIBRARY_PHOTOS = new Set(['barber-1', 'barber-2', 'cafe-barra', 'cafe-granos', 'cafe-interior', 'cafe-latte', 'cafe-taza', 'codigo-1', 'datos-1', 'equipo-1', 'escritorio-1', 'estudio-1', 'gym-1', 'gym-2', 'interior-1', 'moda-1', 'moda-2', 'oficina-1', 'paisaje-1', 'paisaje-2', 'persona-1', 'persona-2', 'persona-3', 'persona-4', 'plato-1', 'plato-2', 'plato-3', 'prod-audifonos', 'prod-camara', 'prod-reloj', 'resto-interior', 'resto-sala', 'tienda-1']);
/**
 * Los modelos a veces inventan fotos de la biblioteca (p. ej. templates/img/venus.jpg) que no existen.
 * Se sustituyen por una imagen generada con IA a partir del nombre, para que nunca quede una imagen rota.
 */
export function fixInventedPhotos(files: Record<string, string>) {
  for (const [p, c] of Object.entries(files)) {
    if (!/\.(tsx|ts|jsx|js|css|html)$/.test(p)) continue;
    const next = c.replace(/(?:https:\/\/interfaz-hazel\.vercel\.app)?\/templates\/img\/([\w-]+)\.(?:jpg|jpeg|png|webp)/g, (m, name: string) => {
      if (LIBRARY_PHOTOS.has(name)) return m;
      const prompt = `${name.replace(/[-_]+/g, ' ')}, high quality, detailed`;
      return `https://interfaz-hazel.vercel.app/api/image?prompt=${encodeURIComponent(prompt)}&w=1024&h=768&seed=${name.length}`;
    });
    if (next !== c) files[p] = next;
  }
}
