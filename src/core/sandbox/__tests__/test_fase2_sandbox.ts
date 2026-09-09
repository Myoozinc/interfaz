import { WebContainerService } from '../WebContainerService';
import { ensureCompleteViteProject } from '../ProjectStructureDefaults';
import { VirtualMultiFileBundler } from '../VirtualMultiFileBundler';

console.log('🧪 Iniciando Test Suite de FASE 2: Real Multi-File Sandbox & Preview...\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}`);
    throw new Error(`Test failed: ${testName}`);
  }
}

// -------------------------------------------------------------
// BLOQUE 1: WebContainerService.toFileSystemTree
// -------------------------------------------------------------
console.log('--- 1. Pruebas de WebContainerService.toFileSystemTree ---');

const inputFiles = {
  'package.json': '{"name":"demo"}',
  'src/main.tsx': 'import React from "react";',
  'src/components/Header.tsx': 'export const Header = () => null;',
  './src/components/nested/Deep.tsx': 'export const Deep = 1;',
  '/public/favicon.ico': 'binary-data'
};

const tree = WebContainerService.toFileSystemTree(inputFiles);

assert('package.json' in tree && 'file' in (tree['package.json'] as any), 'package.json está en la raíz del árbol como archivo');
assert((tree['package.json'] as any).file.contents === '{"name":"demo"}', 'El contenido de package.json se preserva');
assert('src' in tree && 'directory' in tree['src'], 'src es un directorio');
assert('main.tsx' in (tree['src'] as any).directory, 'main.tsx está dentro de src');
assert('components' in (tree['src'] as any).directory, 'components está dentro de src');
assert('Header.tsx' in ((tree['src'] as any).directory['components'] as any).directory, 'Header.tsx está dentro de src/components');
assert('nested' in ((tree['src'] as any).directory['components'] as any).directory, 'nested está dentro de src/components');
assert('public' in tree && 'directory' in tree['public'], 'public normaliza la barra inicial y es directorio');

// -------------------------------------------------------------
// BLOQUE 2: ProjectStructureDefaults & ensureCompleteViteProject
// -------------------------------------------------------------
console.log('\n--- 2. Pruebas de ProjectStructureDefaults & ensureCompleteViteProject ---');

const emptyFiles = {};
const completeProject = ensureCompleteViteProject(emptyFiles);

assert('package.json' in completeProject, 'ensureCompleteViteProject inyecta package.json si falta');
assert(completeProject['package.json'].includes('"react"'), 'package.json contiene react');
assert('vite.config.ts' in completeProject, 'ensureCompleteViteProject inyecta vite.config.ts si falta');
assert('tsconfig.json' in completeProject, 'ensureCompleteViteProject inyecta tsconfig.json si falta');
assert('index.html' in completeProject, 'ensureCompleteViteProject inyecta index.html si falta');
assert(completeProject['index.html'].includes('src/main.tsx'), 'index.html tiene script module apuntando a main.tsx');
assert('src/main.tsx' in completeProject, 'ensureCompleteViteProject inyecta src/main.tsx si falta');
assert('src/index.css' in completeProject, 'ensureCompleteViteProject inyecta src/index.css si falta');
assert('src/App.tsx' in completeProject, 'ensureCompleteViteProject inyecta src/App.tsx si no hay componentes');

// Respeto de archivos existentes
const customFiles = {
  'package.json': '{"name": "custom-app"}',
  'src/App.tsx': 'export default function CustomApp() { return <div>Custom</div>; }'
};
const mergedProject = ensureCompleteViteProject(customFiles);
assert(mergedProject['package.json'] === '{"name": "custom-app"}', 'No sobreescribe package.json si ya existe');
assert(mergedProject['src/App.tsx'].includes('CustomApp'), 'No sobreescribe src/App.tsx si ya existe');
assert('vite.config.ts' in mergedProject, 'Inyecta vite.config.ts aunque App.tsx exista');

// -------------------------------------------------------------
// BLOQUE 3: VirtualMultiFileBundler.transpileTypeScript
// -------------------------------------------------------------
console.log('\n--- 3. Pruebas de VirtualMultiFileBundler.transpileTypeScript ---');

const tsSample = `
import React, { useState } from 'react';
import type { ComponentProps } from 'react';
export interface UserProps {
  name: string;
  age: number;
}
export type Status = 'active' | 'inactive';

export const UserCard: React.FC<UserProps> = ({ name, age }: UserProps) => {
  const [active, setActive] = useState<boolean>(true);
  const element = document.getElementById('root')!;
  const config = { mode: 'dark' } as const;
  return <div className="card">{name} - {age}</div>;
};
`;

const transpiled = VirtualMultiFileBundler.transpileTypeScript(tsSample);

assert(!transpiled.includes('import type'), 'Remueve import type');
assert(!transpiled.includes('interface UserProps'), 'Remueve interface UserProps');
assert(!transpiled.includes('type Status'), 'Remueve type Status');
assert(!transpiled.includes(': React.FC'), 'Remueve anotación : React.FC');
assert(!transpiled.includes('as const'), 'Remueve as const');
assert(!transpiled.includes('document.getElementById(\'root\')!'), 'Remueve non-null assertion operator !');

// -------------------------------------------------------------
// BLOQUE 4: VirtualMultiFileBundler.bundle
// -------------------------------------------------------------
console.log('\n--- 4. Pruebas de VirtualMultiFileBundler.bundle ---');

const projectFiles = {
  'src/App.tsx': `
    import React from 'react';
    import { Header } from './components/Header';
    export default function App() {
      return (
        <div>
          <Header title="NONA Test" />
          <p>Multi-File Sandbox Working!</p>
        </div>
      );
    }
  `,
  'src/components/Header.tsx': `
    import React from 'react';
    export function Header({ title }: { title: string }) {
      return <h1>{title}</h1>;
    }
  `,
  'src/index.css': `
    body { background-color: #030712; color: #f9fafb; }
  `
};

const bundleResult = VirtualMultiFileBundler.bundle(projectFiles);

assert(typeof bundleResult.srcDoc === 'string', 'El resultado genera srcDoc');
assert(bundleResult.srcDoc.includes('<script type="importmap">'), 'El srcDoc incluye importmap');
assert(bundleResult.srcDoc.includes('https://esm.sh/react@18.3.1'), 'El importmap incluye react de ESM CDN');
assert(bundleResult.srcDoc.includes('https://esm.sh/lucide-react'), 'El importmap incluye lucide-react');
assert(bundleResult.srcDoc.includes('data:text/javascript;charset=utf-8'), 'Los módulos TSX se convierten a Data URIs');
assert(bundleResult.transpiledFilesCount === 2, 'Transpila exactamente 2 módulos TSX (App y Header)');
assert(bundleResult.srcDoc.includes('background-color: #030712'), 'Inyecta los estilos CSS en el head');
assert(bundleResult.entryPoint === 'src/App.tsx', 'Detecta correctamente src/App.tsx como punto de entrada');
assert(bundleResult.errors.length === 0, 'No produce errores de empaquetado');

// -------------------------------------------------------------
// RESUMEN
// -------------------------------------------------------------
console.log(`\n========================================`);
console.log(`🎯 FASE 2 TEST RESULT: ${passedTests}/${totalTests} pruebas superadas con éxito.`);
console.log(`========================================\n`);
