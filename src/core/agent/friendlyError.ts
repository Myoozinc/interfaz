/** Traduce errores técnicos de la IA a un mensaje claro para el usuario. */
export function friendlyError(message: string): string {
  const m = String(message || '');
  if (/saturad|429|rate limit|quota|exceeded|high demand|503/i.test(m)) {
    return 'La IA gratuita de NONA está al límite de capacidad en este momento (los proveedores gratuitos tienen un cupo por minuto y por día). Espera un par de minutos y vuelve a intentarlo; tu proyecto no se ha perdido.';
  }
  if (/fetch failed|Failed to fetch|NetworkError|network/i.test(m)) {
    return 'No hay conexión con el servidor de NONA. Revisa tu conexión a internet y vuelve a intentarlo.';
  }
  if (/AbortError|aborted/i.test(m)) return 'Generación cancelada.';
  return m;
}
