import type { FileItem } from '../types';

export interface UserVisitRecord {
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

export interface UserEventRecord {
  id: string;
  sessionId: string;
  type: string;
  title: string;
  details?: any;
  timestamp: string;
  ip: string;
  country: string;
}

export interface GenerationBackupRecord {
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

export interface AdminAnalyticsData {
  visits: UserVisitRecord[];
  events: UserEventRecord[];
  generations: GenerationBackupRecord[];
  stats: {
    totalVisits: number;
    uniqueIps: number;
    totalGenerations: number;
    totalEvents: number;
    countryBreakdown: { country: string; flag: string; count: number }[];
    deviceBreakdown: Record<string, number>;
    browserBreakdown: Record<string, number>;
    lastUpdated: string;
  };
}

class TelemetryService {
  private static instance: TelemetryService | null = null;
  private sessionId: string;
  private clientIp: string = '';
  private country: string = '';
  private countryCode: string = '';
  private city: string = '';
  private region: string = '';
  private latitude: number | null = null;
  private longitude: number | null = null;
  private flag: string = '🌐';
  private totalEvents: number = 0;
  private promptsCount: number = 0;
  private isInitialized: boolean = false;

  private constructor() {
    let savedSession = sessionStorage.getItem('nona_session_id');
    if (!savedSession) {
      savedSession = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem('nona_session_id', savedSession);
    }
    this.sessionId = savedSession;
  }

  public static getInstance(): TelemetryService {
    if (!TelemetryService.instance) {
      TelemetryService.instance = new TelemetryService();
    }
    return TelemetryService.instance;
  }

  /**
   * Detect client hardware, OS, and browser
   */
  public detectClientInfo() {
    const ua = navigator.userAgent;
    let device = 'Desktop';
    if (/Mobi|Android|iPhone|iPod/i.test(ua)) {
      device = 'Mobile';
    } else if (/iPad|Tablet/i.test(ua)) {
      device = 'Tablet';
    }

    let os = 'Desconocido';
    if (/Macintosh|Mac OS X/i.test(ua)) os = 'macOS';
    else if (/Windows NT/i.test(ua)) os = 'Windows';
    else if (/Android/i.test(ua)) os = 'Android';
    else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
    else if (/Linux/i.test(ua)) os = 'Linux';

    let browser = 'Web';
    if (/Edg\//i.test(ua)) browser = 'Edge';
    else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) browser = 'Chrome';
    else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = 'Safari';
    else if (/Firefox\//i.test(ua)) browser = 'Firefox';
    else if (/Opera|OPR\//i.test(ua)) browser = 'Opera';

    return {
      device,
      os,
      browser,
      language: navigator.language || 'es',
      referrer: document.referrer || 'Directo',
      entryPath: window.location.pathname || '/'
    };
  }

  /**
   * Initializes real visitor session and records initial entry
   */
  public async init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    const clientInfo = this.detectClientInfo();

    // 1. Try to fetch IP and geo from server endpoint
    try {
      const res = await fetch('/api/telemetry?action=get_ip');
      if (res.ok) {
        const geo = await res.json();
        this.clientIp = geo.ip;
        this.country = geo.country;
        this.countryCode = geo.countryCode;
        this.city = geo.city;
        this.region = geo.region;
        this.latitude = geo.latitude;
        this.longitude = geo.longitude;
        this.flag = geo.flag;
      }
    } catch {
      // Direct client fallback to free public geo endpoint
      try {
        const fallbackRes = await fetch('https://ipwho.is/');
        if (fallbackRes.ok) {
          const geo = await fallbackRes.json();
          if (geo.success) {
            this.clientIp = geo.ip;
            this.country = geo.country;
            this.countryCode = geo.country_code;
            this.city = geo.city;
            this.region = geo.region;
            this.latitude = geo.latitude;
            this.longitude = geo.longitude;
            this.flag = geo.flag?.emoji || '🌐';
          }
        }
      } catch {}
    }

    // 2. Record visit on server
    this.sendVisitRecord(clientInfo);

    // 3. Setup recurring heartbeat to track duration
    setInterval(() => {
      this.sendVisitRecord(clientInfo);
    }, 30000);

    // 4. Track beforeunload to capture final session exit time
    window.addEventListener('beforeunload', () => {
      this.sendVisitRecord(clientInfo, true);
    });
  }

  private sendVisitRecord(clientInfo: any, isBeacon: boolean = false) {
    const payload = {
      sessionId: this.sessionId,
      clientIp: this.clientIp,
      country: this.country,
      countryCode: this.countryCode,
      city: this.city,
      region: this.region,
      latitude: this.latitude,
      longitude: this.longitude,
      flag: this.flag,
      totalEvents: this.totalEvents,
      promptsCount: this.promptsCount,
      ...clientInfo
    };

    if (isBeacon && navigator.sendBeacon) {
      try {
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        navigator.sendBeacon('/api/telemetry?action=record_visit', blob);
      } catch {}
      return;
    }

    fetch('/api/telemetry?action=record_visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {});
  }

  /**
   * Tracks an in-app user action
   */
  public trackEvent(type: string, title: string, details?: any) {
    this.totalEvents++;
    if (type === 'prompt_submit') {
      this.promptsCount++;
    }

    const payload = {
      sessionId: this.sessionId,
      type,
      title,
      details,
      clientIp: this.clientIp,
      country: this.country
    };

    // Save locally
    try {
      const localEvents = JSON.parse(localStorage.getItem('nona_local_events') || '[]');
      localEvents.unshift({
        id: `evt_${Date.now()}`,
        ...payload,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('nona_local_events', JSON.stringify(localEvents.slice(0, 500)));
    } catch {}

    // Send to server
    fetch('/api/telemetry?action=record_event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {});
  }

  /**
   * Vault backup of an application generated by user ("un resguardo de lo que genere")
   */
  public backupGeneration(
    prompt: string,
    projectName: string,
    files: FileItem[] | Record<string, any>,
    durationMs: number = 0,
    previewUrl?: string
  ) {
    const clientInfo = this.detectClientInfo();
    const normalizedFiles = Array.isArray(files)
      ? files.map(f => ({ path: f.name || (f as any).path, content: f.content, language: f.language }))
      : Object.entries(files).map(([p, c]) => ({
          path: p,
          content: typeof c === 'string' ? c : (c as any).content || '',
          language: p.endsWith('.tsx') ? 'typescript' : p.endsWith('.css') ? 'css' : 'javascript'
        }));

    const payload = {
      sessionId: this.sessionId,
      prompt,
      projectName,
      files: normalizedFiles,
      durationMs,
      previewUrl,
      clientIp: this.clientIp,
      country: this.country,
      city: this.city,
      flag: this.flag,
      device: clientInfo.device
    };

    // Save in local storage vault as backup
    try {
      const localBackups = JSON.parse(localStorage.getItem('nona_local_generations') || '[]');
      localBackups.unshift({
        id: `gen_${Date.now()}`,
        ...payload,
        timestamp: new Date().toISOString(),
        fileCount: normalizedFiles.length
      });
      localStorage.setItem('nona_local_generations', JSON.stringify(localBackups.slice(0, 50)));
    } catch {}

    // Send to server telemetry vault
    fetch('/api/telemetry?action=backup_generation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {});
  }

  /**
   * Fetches real admin data from server telemetry vault
   */
  public async fetchAdminData(code: string, password: string): Promise<AdminAnalyticsData> {
    const res = await fetch(`/api/telemetry?action=get_all&code=${encodeURIComponent(code)}&password=${encodeURIComponent(password)}`);
    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('Credenciales incorrectas. Verifique el código y contraseña.');
      }
      throw new Error(`Error del servidor (${res.status}) al obtener registros.`);
    }

    const data: AdminAnalyticsData = await res.json();

    // Merge with any local generation backups if server has fewer (e.g. cold restart)
    try {
      const localGenerations = JSON.parse(localStorage.getItem('nona_local_generations') || '[]');
      const existingGenIds = new Set(data.generations.map(g => g.id));
      for (const lg of localGenerations) {
        if (!existingGenIds.has(lg.id)) {
          data.generations.push(lg);
        }
      }
      data.generations.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      data.stats.totalGenerations = data.generations.length;
    } catch {}

    return data;
  }

  /**
   * Clears telemetry records on server and locally
   */
  public async clearData(code: string, password: string): Promise<void> {
    const res = await fetch('/api/telemetry?action=clear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, password })
    });
    if (!res.ok) {
      throw new Error('Error al limpiar registros.');
    }
    localStorage.removeItem('nona_local_events');
    localStorage.removeItem('nona_local_generations');
  }
}

export const telemetryService = TelemetryService.getInstance();
