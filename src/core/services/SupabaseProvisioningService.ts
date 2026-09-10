/**
 * SupabaseProvisioningService
 * 
 * Servicio para la integración y auto-provisionamiento real con Supabase BaaS.
 * Permite validar conexiones, extraer y ejecutar esquemas SQL DDL (CREATE TABLE...),
 * generar enlaces directos al SQL Editor de Supabase e inyectar credenciales reales
 * en el código del proyecto (src/lib/supabase.ts y .env.local).
 */

import type { FileItem } from '../../types';

export interface SupabaseConfig {
  projectUrl: string;
  anonKey: string;
  serviceRoleKey?: string;
  managementToken?: string;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  latencyMs?: number;
}

export interface ExecutionResult {
  success: boolean;
  message: string;
  data?: any;
}

export class SupabaseProvisioningService {
  private static instance: SupabaseProvisioningService | null = null;
  private readonly STORAGE_KEY = 'nona_supabase_config';

  private constructor() {}

  public static getInstance(): SupabaseProvisioningService {
    if (!SupabaseProvisioningService.instance) {
      SupabaseProvisioningService.instance = new SupabaseProvisioningService();
    }
    return SupabaseProvisioningService.instance;
  }

  /**
   * Guarda la configuración de Supabase en almacenamiento local seguro
   */
  public saveConfig(config: SupabaseConfig): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
  }

  /**
   * Recupera la configuración guardada de Supabase
   */
  public getConfig(): SupabaseConfig | null {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  /**
   * Extrae el ID / Referencia del proyecto a partir de la URL (ej: https://xyz.supabase.co -> xyz)
   */
  public extractProjectRef(url: string): string | null {
    if (!url) return null;
    const clean = url.trim().toLowerCase();
    const match = clean.match(/https:\/\/([a-z0-9_-]+)\.supabase\.co/);
    return match ? match[1] : null;
  }

  /**
   * Genera la URL directa para abrir el SQL Editor del proyecto en Supabase Dashboard
   */
  public getSqlEditorUrl(projectRef: string): string {
    return `https://supabase.com/dashboard/project/${projectRef}/sql/new`;
  }

  /**
   * Extrae las sentencias DDL SQL del proyecto actual buscando en:
   * 1. supabase/schema.sql
   * 2. Comentarios SQL dentro de src/lib/supabase.ts
   * 3. Esquema predeterminado según el tipo de proyecto
   */
  public extractDdlSql(files: FileItem[]): string {
    // 1. Archivo dedicado supabase/schema.sql
    const schemaFile = files.find((f) => f.name.endsWith('schema.sql') || f.name.endsWith('supabase.sql'));
    if (schemaFile && schemaFile.content.trim()) {
      return schemaFile.content.trim();
    }

    // 2. Comentarios en src/lib/supabase.ts
    const supabaseClientFile = files.find((f) => f.name.includes('lib/supabase'));
    if (supabaseClientFile) {
      const content = supabaseClientFile.content;
      // Extraer bloques con CREATE TABLE o sentencias SQL
      const lines = content.split('\n');
      const sqlLines = lines
        .filter((line) => {
          const l = line.trim();
          return (
            (l.startsWith('//') || l.startsWith('--') || l.startsWith('/*') || l.startsWith('*')) &&
            (l.includes('CREATE TABLE') ||
              l.includes('ALTER TABLE') ||
              l.includes('CREATE POLICY') ||
              l.includes('ENABLE ROW LEVEL SECURITY') ||
              l.includes('PRIMARY KEY') ||
              l.includes('INSERT INTO'))
          );
        })
        .map((l) => l.replace(/^(\/\/|\-\-|\/\*|\*)\s*/, ''));

      if (sqlLines.length > 0) {
        return sqlLines.join('\n');
      }
    }

    // 3. Esquema general de fallback si la app usa persistencia
    return `-- Esquema SQL autogenerado por NONA AI Software Factory
CREATE TABLE IF NOT EXISTS app_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content JSONB DEFAULT '{}'::jsonb,
  user_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE app_records ENABLE ROW LEVEL SECURITY;

-- Política de lectura pública / usuarios autenticados
CREATE POLICY "Permitir lectura publica" ON app_records FOR SELECT USING (true);
CREATE POLICY "Permitir insercion" ON app_records FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir actualizacion" ON app_records FOR UPDATE USING (true);
`;
  }

  /**
   * Realiza un test de conexión directo al endpoint REST de Supabase
   */
  public async testConnection(projectUrl: string, anonKey: string): Promise<ConnectionTestResult> {
    const cleanUrl = projectUrl.trim().replace(/\/+$/, '');
    const cleanKey = anonKey.trim();

    if (!cleanUrl || !cleanKey) {
      return {
        success: false,
        message: 'Debes proporcionar la URL del proyecto y el Anon Key.',
      };
    }

    const start = performance.now();
    try {
      const response = await fetch(`${cleanUrl}/rest/v1/?apikey=${cleanKey}`, {
        method: 'GET',
        headers: {
          apikey: cleanKey,
          Authorization: `Bearer ${cleanKey}`,
          Accept: 'application/openapi+json',
        },
      });

      const latencyMs = Math.round(performance.now() - start);

      if (response.ok) {
        return {
          success: true,
          message: `Conexión exitosa con Supabase (${latencyMs}ms)`,
          latencyMs,
        };
      }

      if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          message: 'Error de autenticación: El Anon Key proporcionado no es válido para este proyecto.',
          latencyMs,
        };
      }

      return {
        success: false,
        message: `Supabase respondió con estado HTTP ${response.status}`,
        latencyMs,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Error al conectar con la URL: ${err.message || 'Error de red'}`,
      };
    }
  }

  /**
   * Ejecuta sentencias SQL DDL directamente utilizando la Management API de Supabase
   */
  public async executeDdlViaManagementApi(
    projectRef: string,
    managementToken: string,
    sql: string
  ): Promise<ExecutionResult> {
    const cleanToken = managementToken.trim();
    if (!cleanToken) {
      return {
        success: false,
        message: 'Se requiere un Management Token de Supabase (sbp_...) para ejecutar SQL directamente.',
      };
    }

    try {
      const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cleanToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: sql,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          message: errorData.message || `Error al ejecutar SQL en Supabase (HTTP ${response.status})`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        message: 'Esquema SQL DDL provisionado exitosamente en PostgreSQL.',
        data,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Fallo al invocar Management API: ${err.message}`,
      };
    }
  }

  /**
   * Inyecta las credenciales reales de Supabase dentro de los archivos del proyecto (src/lib/supabase.ts y .env.local)
   */
  public injectCredentials(files: FileItem[], config: { url: string; anonKey: string }): FileItem[] {
    const cleanUrl = config.url.trim().replace(/\/+$/, '');
    const cleanKey = config.anonKey.trim();

    const updatedFiles = [...files];

    // 1. Inyectar o actualizar src/lib/supabase.ts
    const clientIndex = updatedFiles.findIndex((f) => f.name === 'src/lib/supabase.ts' || f.name.endsWith('lib/supabase.ts'));
    const newClientContent = `import { createClient } from '@supabase/supabase-js';

// Cliente Supabase conectado en vivo mediante NONA Studio
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || '${cleanUrl}';
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || '${cleanKey}';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Helper de verificación de conexión en caliente
 */
export async function checkSupabaseConnection(): Promise<{ connected: boolean; message: string }> {
  try {
    const { error } = await supabase.from('_healthcheck').select('*').limit(1);
    if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
      return { connected: false, message: error.message };
    }
    return { connected: true, message: 'Conexión activa con Supabase BaaS.' };
  } catch (err: any) {
    return { connected: false, message: err.message || 'Error de conexión' };
  }
}
`;

    if (clientIndex >= 0) {
      updatedFiles[clientIndex] = {
        ...updatedFiles[clientIndex],
        content: newClientContent,
        isModified: true,
      };
    } else {
      updatedFiles.push({
        id: `file-supabase-${Date.now()}`,
        name: 'src/lib/supabase.ts',
        language: 'typescript',
        content: newClientContent,
        isModified: true,
      });
    }

    // 2. Inyectar o actualizar .env.local
    const envContent = `VITE_SUPABASE_URL=${cleanUrl}\nVITE_SUPABASE_ANON_KEY=${cleanKey}\n`;
    const envIndex = updatedFiles.findIndex((f) => f.name === '.env.local' || f.name === '.env');
    if (envIndex >= 0) {
      updatedFiles[envIndex] = {
        ...updatedFiles[envIndex],
        content: envContent,
        isModified: true,
      };
    } else {
      updatedFiles.push({
        id: `file-env-${Date.now()}`,
        name: '.env.local',
        language: 'markdown',
        content: envContent,
        isModified: true,
      });
    }

    return updatedFiles;
  }
}

export const supabaseProvisioningService = SupabaseProvisioningService.getInstance();
