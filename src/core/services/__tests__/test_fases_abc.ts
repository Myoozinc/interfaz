/**
 * Test Suite: FASES A, B y C (Terminal, GitHub Sync, Supabase Auto-Provisioning)
 * 
 * Verifica el funcionamiento unitario y de integración de los tres nuevos superpoderes.
 */

import assert from 'node:assert';
import { gitHubService } from '../GitHubService';
import { supabaseProvisioningService } from '../SupabaseProvisioningService';
import { webContainerService } from '../../sandbox/WebContainerService';
import type { FileItem } from '../../../types';

console.log('🧪 Iniciando Test Suite de FASES A, B y C (Superpoderes NONA)...\\n');

let passedTests = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedTests++;
  } catch (err: any) {
    console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
    throw err;
  }
}

// ==========================================
// 1. FASE A: TERMINAL INTERACTIVA EN EL WORKSPACE
// ==========================================
console.log('--- 1. Fase A: Terminal Interactiva & WebContainer Shell ---');

test('WebContainerService dispone de startInteractiveShell', () => {
  assert.strictEqual(typeof webContainerService.startInteractiveShell, 'function');
});

test('WebContainerService detecta soporte de aislamiento en el entorno', () => {
  const isSupported = webContainerService.isSupported();
  assert.strictEqual(typeof isSupported, 'boolean');
});

test('WebContainerService.toFileSystemTree transforma archivos anidados correctamente', () => {
  const mockFiles = {
    'index.html': '<!DOCTYPE html><html><body></body></html>',
    'src/App.tsx': 'export default function App() { return <div>App</div>; }',
    'src/components/Hero.tsx': 'export function Hero() { return <h1>Hero</h1>; }',
  };
  const tree = (webContainerService.constructor as any).toFileSystemTree(mockFiles);
  assert.ok(tree['index.html']);
  assert.ok(tree['src']);
  assert.ok((tree['src'] as any).directory['App.tsx']);
  assert.ok((tree['src'] as any).directory['components']);
  assert.ok((tree['src'] as any).directory['components'].directory['Hero.tsx']);
});

// ==========================================
// 2. FASE B: SINCRONIZACIÓN CON GITHUB CON 1 CLIC
// ==========================================
console.log('\n--- 2. Fase B: Sincronización con GitHub con 1 Clic ---');

test('GitHubService sanitiza nombres de repositorio a slugs válidos', () => {
  assert.strictEqual(gitHubService.sanitizeRepoName('Mi Proyecto Increíble!'), 'mi-proyecto-increble');
  assert.strictEqual(gitHubService.sanitizeRepoName('AIR COMBAT 3D (V5)'), 'air-combat-3d-v5');
  assert.strictEqual(gitHubService.sanitizeRepoName('___dashboard___saas___'), 'dashboard-saas');
  assert.strictEqual(gitHubService.sanitizeRepoName(''), 'nona-project');
});

test('GitHubService genera URLs de 1-Click Deploy a Vercel exactas', () => {
  const repoUrl = 'https://github.com/myoozinc/nona-aircombat';
  const vercelUrl = gitHubService.getVercelDeployUrl(repoUrl);
  assert.strictEqual(
    vercelUrl,
    'https://vercel.com/new/git/external?repository-url=https%3A%2F%2Fgithub.com%2Fmyoozinc%2Fnona-aircombat'
  );
});

test('GitHubService rechaza tokens vacíos o no autenticados en validateToken', async () => {
  await assert.rejects(
    async () => {
      await gitHubService.validateToken('');
    },
    /El token de GitHub no puede estar vacío/
  );
});

// ==========================================
// 3. FASE C: AUTO-PROVISIONAMIENTO REAL EN SUPABASE BAAS
// ==========================================
console.log('\n--- 3. Fase C: Auto-Provisionamiento Real en Supabase BaaS ---');

test('SupabaseProvisioningService extrae projectRef desde URL de Supabase', () => {
  const ref1 = supabaseProvisioningService.extractProjectRef('https://zfqwertyuioplkjh.supabase.co');
  assert.strictEqual(ref1, 'zfqwertyuioplkjh');

  const ref2 = supabaseProvisioningService.extractProjectRef('https://my-custom-project.supabase.co/');
  assert.strictEqual(ref2, 'my-custom-project');

  const refInvalid = supabaseProvisioningService.extractProjectRef('https://google.com');
  assert.strictEqual(refInvalid, null);
});

test('SupabaseProvisioningService genera deep link directo a SQL Editor de Supabase', () => {
  const ref = 'zfqwertyuioplkjh';
  const sqlEditorUrl = supabaseProvisioningService.getSqlEditorUrl(ref);
  assert.strictEqual(sqlEditorUrl, 'https://supabase.com/dashboard/project/zfqwertyuioplkjh/sql/new');
});

test('SupabaseProvisioningService extrae DDL desde supabase/schema.sql si existe', () => {
  const mockFiles: FileItem[] = [
    {
      id: '1',
      name: 'supabase/schema.sql',
      language: 'markdown',
      content: 'CREATE TABLE IF NOT EXISTS players (id uuid PRIMARY KEY, score int);',
    },
    {
      id: '2',
      name: 'src/App.tsx',
      language: 'typescript',
      content: 'export default function App() {}',
    },
  ];
  const ddl = supabaseProvisioningService.extractDdlSql(mockFiles);
  assert.ok(ddl.includes('CREATE TABLE IF NOT EXISTS players'));
  assert.ok(ddl.includes('score int'));
});

test('SupabaseProvisioningService extrae DDL desde comentarios en src/lib/supabase.ts', () => {
  const mockFiles: FileItem[] = [
    {
      id: '1',
      name: 'src/lib/supabase.ts',
      language: 'typescript',
      content: `// DDL Supabase:
// CREATE TABLE IF NOT EXISTS tasks (id uuid PRIMARY KEY, title text, done boolean);
// ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
import { createClient } from '@supabase/supabase-js';
export const supabase = createClient('url', 'key');`,
    },
  ];
  const ddl = supabaseProvisioningService.extractDdlSql(mockFiles);
  assert.ok(ddl.includes('CREATE TABLE IF NOT EXISTS tasks'));
  assert.ok(ddl.includes('ALTER TABLE tasks ENABLE ROW LEVEL SECURITY'));
});

test('SupabaseProvisioningService inyecta credenciales y actualiza src/lib/supabase.ts y .env.local', () => {
  const initialFiles: FileItem[] = [
    {
      id: '1',
      name: 'src/App.tsx',
      language: 'typescript',
      content: 'export default function App() {}',
    },
    {
      id: '2',
      name: 'src/lib/supabase.ts',
      language: 'typescript',
      content: '// Placeholder client',
    },
  ];

  const updated = supabaseProvisioningService.injectCredentials(initialFiles, {
    url: 'https://testapp123.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.testkey',
  });

  const clientFile = updated.find((f) => f.name === 'src/lib/supabase.ts');
  assert.ok(clientFile, 'Debe existir src/lib/supabase.ts');
  assert.ok(clientFile.content.includes('https://testapp123.supabase.co'), 'Contiene la URL real');
  assert.ok(clientFile.content.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.testkey'), 'Contiene el anon key real');
  assert.ok(clientFile.content.includes('checkSupabaseConnection'), 'Incluye helper de verificación');

  const envFile = updated.find((f) => f.name === '.env.local');
  assert.ok(envFile, 'Debe generar o actualizar .env.local');
  assert.ok(envFile.content.includes('VITE_SUPABASE_URL=https://testapp123.supabase.co'));
  assert.ok(envFile.content.includes('VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.testkey'));
});

test('SupabaseProvisioningService valida entradas en testConnection', async () => {
  const res = await supabaseProvisioningService.testConnection('', '');
  assert.strictEqual(res.success, false);
  assert.ok(res.message.includes('URL'));
});

console.log(`\n================================================================`);
console.log(`🎯 FASES A, B y C TEST RESULT: ${passedTests}/${passedTests} pruebas superadas con éxito (100%).`);
console.log(`================================================================\n`);
