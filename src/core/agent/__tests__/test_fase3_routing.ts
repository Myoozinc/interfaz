import { optimalModelRouter, OptimalModelRouter } from '../OptimalModelRouter';
import { intentRouter } from '../IntentRouter';

console.log('🧪 Iniciando Test Suite de FASE 3: Smart Model Routing (Señales Reales)...\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}${detail ? ` -> ${detail}` : ''}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}${detail ? ` -> ${detail}` : ''}`);
    throw new Error(`Test failed: ${testName}`);
  }
}

// =========================================================================
// BLOQUE 1: Estimador de Archivos Afectados y Requisitos
// =========================================================================
console.log('--- 1. Estimación de Archivos Afectados y Requisitos ---');

const cosmeticPrompt = 'cambiá el color del botón principal a verde esmeralda';
const affectedCosmetic = OptimalModelRouter.estimateAffectedFiles(cosmeticPrompt, { hasExistingProject: true });
assert(affectedCosmetic === 1, 'Cambio de color estima exactamente 1 archivo afectado', `Estimado: ${affectedCosmetic}`);

const localLogicPrompt = 'agrega un contador interactivo con botones de más y menos';
const affectedLocal = OptimalModelRouter.estimateAffectedFiles(localLogicPrompt, { hasExistingProject: true });
assert(affectedLocal <= 2, 'Componente local estima <= 2 archivos afectados', `Estimado: ${affectedLocal}`);

const multiScreenPrompt = 'Crea un dashboard con pantalla de métricas, pantalla de usuarios y navegación con rutas';
const affectedMulti = OptimalModelRouter.estimateAffectedFiles(multiScreenPrompt, { hasExistingProject: false });
assert(affectedMulti >= 4, 'Dashboard multi-pantalla estima >= 4 archivos afectados', `Estimado: ${affectedMulti}`);

const reqsCountMulti = OptimalModelRouter.countDistinctRequirements(multiScreenPrompt);
assert(reqsCountMulti >= 2, 'Conteo de requisitos detecta múltiples cláusulas', `Requisitos: ${reqsCountMulti}`);

// =========================================================================
// BLOQUE 2: Criterio de Aceptación 1 — App Nueva con Varias Pantallas
// =========================================================================
console.log('\n--- 2. Criterio de Aceptación 1: App Nueva con Varias Pantallas (Modelo Más Capaz) ---');

const newAppPrompt = 'Crea una aplicación financiera completa con tres pantallas: dashboard de métricas, lista de transacciones y configuración de perfil. Incluye gráficos y persistencia de datos.';
const decisionNewApp = optimalModelRouter.selectOptimalModel(
  newAppPrompt,
  [],
  false,
  undefined,
  { hasExistingProject: false, projectFileCount: 0 }
);

assert(decisionNewApp.server === 'openrouter', 'Enruta a OpenRouter para app nueva multi-pantalla', decisionNewApp.server);
assert(decisionNewApp.model === 'deepseek/deepseek-chat', 'Selecciona el modelo de mayor capacidad (DeepSeek-V3)', decisionNewApp.model);
assert(decisionNewApp.maxTokens >= 8000 && decisionNewApp.maxTokens <= 16000, 'maxTokens está en el rango exigido de 8,000 a 16,000', `Tokens: ${decisionNewApp.maxTokens}`);
assert(decisionNewApp.routeCategory === 'complex_build', 'Categoría es complex_build');
assert((decisionNewApp.estimatedAffectedFiles || 0) >= 4, 'Estima >= 4 archivos para la creación inicial');

// =========================================================================
// BLOQUE 3: Criterio de Aceptación 2 — Cambio de Color sobre App ya Generada (Modelo Rápido)
// =========================================================================
console.log('\n--- 3. Criterio de Aceptación 2: Cambio de Color sobre App Generada (Modelo Rápido) ---');

const colorEditPrompt = 'cambiá el color del botón de inicio a verde esmeralda';
const decisionColorEdit = optimalModelRouter.selectOptimalModel(
  colorEditPrompt,
  [],
  false,
  undefined,
  { hasExistingProject: true, projectFileCount: 6, isEdit: true }
);

assert(decisionColorEdit.server === 'groq', 'Enruta a Groq LPU para cambio cosmético puntual', decisionColorEdit.server);
assert(decisionColorEdit.model === 'llama-3.3-70b-versatile', 'Selecciona el modelo rápido y económico Llama 3.3 70B', decisionColorEdit.model);
assert(decisionColorEdit.maxTokens === 4000, 'maxTokens es 4,000 para iteración rápida', `Tokens: ${decisionColorEdit.maxTokens}`);
assert(decisionColorEdit.routeCategory === 'incremental_edit', 'Categoría es incremental_edit');
assert(decisionColorEdit.estimatedAffectedFiles === 1, 'Archivos afectados estimados es 1');

// =========================================================================
// BLOQUE 4: Cambio de Texto / Título sobre App ya Generada
// =========================================================================
console.log('\n--- 4. Cambio de Texto/Título sobre App ya Generada ---');

const textEditPrompt = 'cambiá el texto del título superior a "NONA Studio Pro"';
const decisionTextEdit = optimalModelRouter.selectOptimalModel(
  textEditPrompt,
  [],
  false,
  undefined,
  { hasExistingProject: true, projectFileCount: 6, isEdit: true }
);

assert(decisionTextEdit.server === 'groq', 'Enruta a Groq para cambio de texto', decisionTextEdit.server);
assert(decisionTextEdit.model === 'llama-3.3-70b-versatile', 'Usa modelo rápido Llama 3.3 70B');
assert(decisionTextEdit.estimatedAffectedFiles === 1, 'Estima 1 archivo afectado');

// =========================================================================
// BLOQUE 5: Edición Compleja / Multi-Archivo sobre App ya Generada
// =========================================================================
console.log('\n--- 5. Edición Compleja Multi-Archivo sobre App ya Generada ---');

const complexEditPrompt = 'Agrega una nueva pantalla completa de configuración con tres pestañas, autenticación con Supabase y persistencia en base de datos.';
const decisionComplexEdit = optimalModelRouter.selectOptimalModel(
  complexEditPrompt,
  [],
  false,
  undefined,
  { hasExistingProject: true, projectFileCount: 6, isEdit: true }
);

assert(decisionComplexEdit.server === 'openrouter', 'Enruta a OpenRouter por edición compleja multi-archivo', decisionComplexEdit.server);
assert(decisionComplexEdit.model === 'deepseek/deepseek-chat', 'Usa modelo capaz DeepSeek-V3');
assert(decisionComplexEdit.maxTokens === 8192, 'maxTokens es 8,192 para edición multi-archivo');

// =========================================================================
// BLOQUE 6: Soporte Multimodal y Ollama Local
// =========================================================================
console.log('\n--- 6. Multimodal y Ollama Local ---');

const decisionVision = optimalModelRouter.selectOptimalModel(
  'Crea la UI a partir de esta imagen',
  [{ id: '1', name: 'design.png', type: 'image', url: 'data:image/png;base64,...' }]
);
assert(decisionVision.server === 'openrouter', 'Visión enruta a OpenRouter');
assert(decisionVision.model === 'google/gemini-2.5-flash', 'Usa Gemini 2.5 Flash para visión');

const decisionOllama = optimalModelRouter.selectOptimalModel(
  'Genera un componente',
  [],
  true,
  'ollama'
);
assert(decisionOllama.server === 'ollama', 'Enruta a Ollama local');
assert(decisionOllama.model === 'qwen2.5-coder:7b', 'Usa modelo local Qwen 2.5 Coder');

// =========================================================================
// BLOQUE 7: IntentRouter sin Coincidencias Hardcodeadas de Juegos/Apps
// =========================================================================
console.log('\n--- 7. Verificación de IntentRouter sin Strings Hardcodeados ---');

// Creación de apps diversas sin proyecto previo -> FULL_BUILD
const intentAviones = intentRouter.classifyIntent('quiero un simulador de combate de vuelo en canvas 3D', '');
assert(intentAviones.type === 'FULL_BUILD', 'App de simulación aérea sin proyecto previo es FULL_BUILD');

const intentCarreras = intentRouter.classifyIntent('desarrolla un juego de carreras arcade con obstáculos', '');
assert(intentCarreras.type === 'FULL_BUILD', 'App de carreras sin proyecto previo es FULL_BUILD');

const intentECommerce = intentRouter.classifyIntent('crea una tienda online de ropa urbana con catálogo y carrito', '');
assert(intentECommerce.type === 'FULL_BUILD', 'Tienda e-commerce sin proyecto previo es FULL_BUILD');

// Modificaciones sobre código existente -> SURGICAL_EDIT (Iteración continua)
const existingAppCode = 'export default function GameApp() { return <canvas id="game"></canvas>; }';
const intentEditVuelo = intentRouter.classifyIntent('aumenta la velocidad máxima del caza y cambia los controles', existingAppCode);
assert(intentEditVuelo.type === 'SURGICAL_EDIT', 'Modificar app existente es SURGICAL_EDIT (no reinicia)');

const intentEditCarreras = intentRouter.classifyIntent('cambia el color del auto a rojo metálico', existingAppCode);
assert(intentEditCarreras.type === 'SURGICAL_EDIT', 'Cambio de color sobre app existente es SURGICAL_EDIT');

// =========================================================================
// RESUMEN FINAL DE FASE 3
// =========================================================================
console.log(`\n================================================================`);
console.log(`🎯 FASE 3 TEST RESULT: ${passedTests}/${totalTests} pruebas superadas con éxito (100%).`);
console.log(`================================================================\n`);
