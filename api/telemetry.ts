import type { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import path from 'path';

export const config = {
  runtime: 'nodejs',
  maxDuration: 60,
};

interface UserVisit {
  id: string;
  ip: string;
  country: string;
  countryCode: string;
  city: string;
  region: string;
  latitude: number | null;
  longitude: number | null;
  flag: string;
  device: string;
  os: string;
  browser: string;
  language: string;
  referrer: string;
  entryPath: string;
  firstSeen: string;
  lastSeen: string;
  durationSeconds: number;
  totalEvents: number;
  promptsCount: number;
}

interface UserEvent {
  id: string;
  sessionId: string;
  type: string;
  title: string;
  details?: any;
  timestamp: string;
  ip: string;
  country: string;
}

interface GenerationBackup {
  id: string;
  sessionId: string;
  prompt: string;
  projectName: string;
  fileCount: number;
  files: { path: string; content: string; language?: string }[];
  timestamp: string;
  ip: string;
  country: string;
  city: string;
  flag: string;
  device: string;
  previewUrl?: string;
  generationDurationMs?: number;
}

interface TelemetryVault {
  visits: UserVisit[];
  events: UserEvent[];
  generations: GenerationBackup[];
  lastUpdated: string;
}

const VAULT_FILE = path.join('/tmp', 'nona_telemetry_vault.json');

// In-memory cache for speed and survival during function lifecycles
let cachedVault: TelemetryVault = {
  visits: [],
  events: [],
  generations: [],
  lastUpdated: new Date().toISOString(),
};

// Load existing vault from disk if present
function loadVault(): TelemetryVault {
  try {
    if (fs.existsSync(VAULT_FILE)) {
      const raw = fs.readFileSync(VAULT_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (data && Array.isArray(data.visits)) {
        cachedVault = data;
      }
    }
  } catch (e) {
    console.warn('[Telemetry] Error loading vault from disk:', e);
  }
  return cachedVault;
}

// Save vault to disk
function saveVault(vault: TelemetryVault) {
  cachedVault = vault;
  cachedVault.lastUpdated = new Date().toISOString();
  try {
    fs.writeFileSync(VAULT_FILE, JSON.stringify(cachedVault, null, 2), 'utf-8');
  } catch (e) {
    console.warn('[Telemetry] Error saving vault to disk:', e);
  }
}

// Convert 2-letter country code to flag emoji (e.g. "US" -> 🇺🇸, "CO" -> 🇨🇴)
function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌐';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// Resolve IP and Geolocation
async function resolveIpAndGeo(req: IncomingMessage, clientPayload?: any) {
  const forwarded = req.headers['x-forwarded-for'];
  let ip = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : '') ||
           (req.headers['x-real-ip'] as string) ||
           req.socket?.remoteAddress ||
           '';

  // Clean IPv6 mapped IPv4
  if (ip.startsWith('::ffff:')) {
    ip = ip.slice(7);
  }

  // If local or missing, check client payload
  if ((!ip || ip === '::1' || ip === '127.0.0.1') && clientPayload?.clientIp) {
    ip = clientPayload.clientIp;
  }
  if (!ip || ip === '::1') {
    ip = '127.0.0.1';
  }

  let country = (req.headers['x-vercel-ip-country'] as string) || clientPayload?.country || '';
  let city = (req.headers['x-vercel-ip-city'] as string) || clientPayload?.city || '';
  let region = (req.headers['x-vercel-ip-country-region'] as string) || clientPayload?.region || '';
  let lat = req.headers['x-vercel-ip-latitude'] ? parseFloat(req.headers['x-vercel-ip-latitude'] as string) : null;
  let lon = req.headers['x-vercel-ip-longitude'] ? parseFloat(req.headers['x-vercel-ip-longitude'] as string) : null;

  if (lat === null && clientPayload?.latitude) lat = clientPayload.latitude;
  if (lon === null && clientPayload?.longitude) lon = clientPayload.longitude;

  // If country is missing and IP is not local, attempt fast public IP lookup
  if ((!country || country === '') && ip !== '127.0.0.1' && !ip.startsWith('192.168.') && !ip.startsWith('10.')) {
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`https://ipwho.is/${ip}`, { signal: controller.signal });
      clearTimeout(t);
      if (res.ok) {
        const geo = await res.json();
        if (geo.success) {
          country = geo.country || country;
          city = geo.city || city;
          region = geo.region || region;
          lat = geo.latitude || lat;
          lon = geo.longitude || lon;
        }
      }
    } catch {}
  }

  const countryCode = country.length === 2 ? country.toUpperCase() : (clientPayload?.countryCode || 'UN');
  const flag = getFlagEmoji(countryCode);

  return {
    ip,
    country: country || 'Desconocido',
    countryCode,
    city: city || 'Desconocido',
    region: region || '',
    latitude: lat,
    longitude: lon,
    flag
  };
}

// Parse request body
async function parseBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const action = url.searchParams.get('action') || 'info';

  const vault = loadVault();

  // 1. IP & Geo Lookup for client
  if (req.method === 'GET' && action === 'get_ip') {
    const geo = await resolveIpAndGeo(req);
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify(geo));
    return;
  }

  // 2. Admin Get All Data (Protected by Credentials)
  if (req.method === 'GET' && action === 'get_all') {
    const code = url.searchParams.get('code') || req.headers['x-admin-code'];
    const password = url.searchParams.get('password') || req.headers['x-admin-password'];

    if (code !== 'Gingerboy' || password !== 'Rona12345') {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 401;
      res.end(JSON.stringify({ error: 'Acceso denegado: Código o contraseña incorrectos' }));
      return;
    }

    // Calculate real summary statistics
    const uniqueIps = new Set(vault.visits.map(v => v.ip)).size;
    const totalVisits = vault.visits.length;
    const totalGenerations = vault.generations.length;
    const totalEvents = vault.events.length;
    
    // Country breakdown
    const countryMap: Record<string, { count: number; flag: string; country: string }> = {};
    vault.visits.forEach(v => {
      const c = v.country || 'Desconocido';
      if (!countryMap[c]) {
        countryMap[c] = { count: 0, flag: v.flag || '🌐', country: c };
      }
      countryMap[c].count++;
    });

    // Device breakdown
    const deviceMap: Record<string, number> = {};
    vault.visits.forEach(v => {
      const d = v.device || 'Desktop';
      deviceMap[d] = (deviceMap[d] || 0) + 1;
    });

    // Browser breakdown
    const browserMap: Record<string, number> = {};
    vault.visits.forEach(v => {
      const b = v.browser || 'Chrome';
      browserMap[b] = (browserMap[b] || 0) + 1;
    });

    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify({
      visits: vault.visits,
      events: vault.events.slice(-500), // Keep latest 500 events
      generations: vault.generations,
      stats: {
        totalVisits,
        uniqueIps,
        totalGenerations,
        totalEvents,
        countryBreakdown: Object.values(countryMap).sort((a, b) => b.count - a.count),
        deviceBreakdown: deviceMap,
        browserBreakdown: browserMap,
        lastUpdated: vault.lastUpdated
      }
    }));
    return;
  }

  // 3. Admin Purge / Clear Data (Protected)
  if (req.method === 'POST' && action === 'clear') {
    const body = await parseBody(req);
    const code = body.code || url.searchParams.get('code');
    const password = body.password || url.searchParams.get('password');

    if (code !== 'Gingerboy' || password !== 'Rona12345') {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 401;
      res.end(JSON.stringify({ error: 'Acceso denegado' }));
      return;
    }

    saveVault({
      visits: [],
      events: [],
      generations: [],
      lastUpdated: new Date().toISOString()
    });

    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify({ success: true, message: 'Registros limpiados correctamente' }));
    return;
  }

  // 4. Record Real Visitor Entry / Session Heartbeat
  if (req.method === 'POST' && action === 'record_visit') {
    const body = await parseBody(req);
    const geo = await resolveIpAndGeo(req, body);

    const sessionId = body.sessionId || `sess_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();

    const existingIndex = vault.visits.findIndex(v => v.id === sessionId);

    if (existingIndex >= 0) {
      // Update duration and lastSeen
      const v = vault.visits[existingIndex];
      const startMs = new Date(v.firstSeen).getTime();
      const nowMs = Date.now();
      v.lastSeen = now;
      v.durationSeconds = Math.max(0, Math.floor((nowMs - startMs) / 1000));
      if (body.totalEvents) v.totalEvents = body.totalEvents;
      if (body.promptsCount) v.promptsCount = body.promptsCount;
    } else {
      // Create new visit record
      const newVisit: UserVisit = {
        id: sessionId,
        ip: geo.ip,
        country: geo.country,
        countryCode: geo.countryCode,
        city: geo.city,
        region: geo.region,
        latitude: geo.latitude,
        longitude: geo.longitude,
        flag: geo.flag,
        device: body.device || 'Desktop',
        os: body.os || 'Desconocido',
        browser: body.browser || 'Navegador Web',
        language: body.language || 'es',
        referrer: body.referrer || 'Directo',
        entryPath: body.entryPath || '/',
        firstSeen: now,
        lastSeen: now,
        durationSeconds: 0,
        totalEvents: 1,
        promptsCount: 0
      };
      vault.visits.unshift(newVisit);
      // Keep up to 2,000 real visits in disk vault
      if (vault.visits.length > 2000) {
        vault.visits = vault.visits.slice(0, 2000);
      }
    }

    saveVault(vault);

    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify({ success: true, sessionId, geo }));
    return;
  }

  // 5. Record Real In-App Event
  if (req.method === 'POST' && action === 'record_event') {
    const body = await parseBody(req);
    const geo = await resolveIpAndGeo(req, body);

    const event: UserEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      sessionId: body.sessionId || 'anonymous',
      type: body.type || 'interaction',
      title: body.title || 'Acción de usuario',
      details: body.details || null,
      timestamp: new Date().toISOString(),
      ip: geo.ip,
      country: geo.country
    };

    vault.events.unshift(event);
    if (vault.events.length > 3000) {
      vault.events = vault.events.slice(0, 3000);
    }

    // Update visit prompt count if it was a prompt
    if (body.type === 'prompt_submit' && body.sessionId) {
      const v = vault.visits.find(vis => vis.id === body.sessionId);
      if (v) v.promptsCount = (v.promptsCount || 0) + 1;
    }

    saveVault(vault);

    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify({ success: true }));
    return;
  }

  // 6. Record Real Generation Backup ("un resguardo de lo que genere")
  if (req.method === 'POST' && action === 'backup_generation') {
    const body = await parseBody(req);
    const geo = await resolveIpAndGeo(req, body);

    const backup: GenerationBackup = {
      id: `gen_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      sessionId: body.sessionId || 'anonymous',
      prompt: body.prompt || 'Sin descripción',
      projectName: body.projectName || 'Proyecto Generado',
      fileCount: body.files ? (Array.isArray(body.files) ? body.files.length : Object.keys(body.files).length) : 0,
      files: Array.isArray(body.files) 
        ? body.files 
        : Object.entries(body.files || {}).map(([p, c]) => ({
            path: p,
            content: typeof c === 'string' ? c : (c as any).content || '',
            language: p.endsWith('.tsx') ? 'typescript' : p.endsWith('.css') ? 'css' : 'javascript'
          })),
      timestamp: new Date().toISOString(),
      ip: geo.ip,
      country: geo.country,
      city: geo.city,
      flag: geo.flag,
      device: body.device || 'Desktop',
      previewUrl: body.previewUrl,
      generationDurationMs: body.durationMs || 0
    };

    vault.generations.unshift(backup);
    // Keep up to 200 complete generation backups in disk vault
    if (vault.generations.length > 200) {
      vault.generations = vault.generations.slice(0, 200);
    }

    saveVault(vault);

    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify({ success: true, backupId: backup.id }));
    return;
  }

  res.setHeader('Content-Type', 'application/json');
  res.statusCode = 200;
  res.end(JSON.stringify({ status: 'ok', service: 'NONA Real Telemetry & Vault API' }));
}
