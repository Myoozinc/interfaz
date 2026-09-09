import { AgentCollaborationCouncil } from '../../agent/AgentCollaborationCouncil';
import { SurgicalDiffAgent } from '../../agent/SurgicalDiffAgent';
import type { FullStackProject } from '../../types';

async function runOrchestrationFase1Tests() {
  console.log('================================================================');
  console.log('   FASE 1: PRUEBAS DE INTEGRACIÓN DE FLUJO Y REINTENTOS REALES  ');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      if (detail) console.log(`   └─ ${detail}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      if (detail) console.error(`   └─ ${detail}`);
    }
  }

  const council = new AgentCollaborationCouncil();
  const surgicalAgent = new SurgicalDiffAgent();

  const emptyProject: FullStackProject = {
    id: 'test_proj',
    name: 'Test App',
    description: '',
    files: {},
    environmentVariables: {},
    framework: 'html-tailwind',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // --------------------------------------------------------------------------
  // TEST A: Flujo exitoso con contrato FullBuild
  // --------------------------------------------------------------------------
  console.log('\n--- CASO A: Generación Full Build con Contrato JSON válido ---');
  let mockAttempts = 0;
  (council as any).aiProvider = {
    streamChat: async (_messages: any[], onProgress: any) => {
      mockAttempts++;
      const fullResponse = JSON.stringify({
        files: [
          { path: 'src/App.tsx', content: 'export default function App() { return <div>Landing Page</div>; }' },
          { path: 'src/components/Header.tsx', content: 'export function Header() { return <header>Header</header>; }' },
          { path: 'src/index.css', content: 'body { margin: 0; }' }
        ],
        explanation: 'Se construyó la landing page multi-archivo con Header y App.'
      });
      onProgress(fullResponse, fullResponse);
      return fullResponse;
    }
  };

  const resA = await council.executeCollaborativeSynthesis(
    'Crea una landing page para un producto de café artesanal',
    emptyProject,
    () => {}
  );

  assert(Object.keys(resA.files).length >= 3, 'ResA contiene al menos 3 archivos generados', `Archivos: ${Object.keys(resA.files).join(', ')}`);
  assert(resA.conversationalSummary.includes('landing page multi-archivo'), 'ResA contiene explicación real del modelo');
  assert(!resA.fullCode.includes('MARIO KART') && !resA.fullCode.includes('ACE COMBAT'), 'ResA NO contiene ninguna plantilla prefabricada');
  assert(resA.thinkingStages.length === 3, 'ResA tiene exactamente 3 etapas sin teatro de prompts');

  // --------------------------------------------------------------------------
  // TEST B: Bucle de Reintento Técnico cuando el modelo falla en el intento 1
  // --------------------------------------------------------------------------
  console.log('\n--- CASO B: Reintento Técnico tras fallo inicial de JSON ---');
  let attemptCount = 0;
  let receivedRetryCorrection = false;

  (council as any).aiProvider = {
    streamChat: async (messages: any[], onProgress: any) => {
      attemptCount++;
      if (attemptCount === 1) {
        // Intento 1: Devuelve JSON corrupto / incompleto sin el campo "files"
        const brokenResponse = `{"error": "Hubo un fallo generando el código"}`;
        onProgress(brokenResponse, brokenResponse);
        return brokenResponse;
      } else {
        // Intento 2: Verifica que el prompt incluyó la corrección técnica obligatoria
        const lastUserMsg = messages[messages.length - 1].content;
        if (lastUserMsg.includes('CORRECCIÓN TÉCNICA OBLIGATORIA')) {
          receivedRetryCorrection = true;
        }
        const correctedResponse = JSON.stringify({
          files: [
            { path: 'src/App.tsx', content: 'export default function App() { return <h1>Corregido</h1>; }' },
            { path: 'src/index.css', content: 'h1 { color: red; }' }
          ],
          explanation: 'Aplicación corregida tras reintento técnico.'
        });
        onProgress(correctedResponse, correctedResponse);
        return correctedResponse;
      }
    }
  };

  const resB = await council.executeCollaborativeSynthesis(
    'Crea un dashboard financiero con gráficos',
    emptyProject,
    () => {}
  );

  assert(attemptCount === 2, 'Se ejecutó el reintento técnico (2 intentos totales)');
  assert(receivedRetryCorrection, 'El prompt de reintento incluyó la directiva [CORRECCIÓN TÉCNICA OBLIGATORIA]');
  assert(Object.keys(resB.files).length >= 2, 'ResB se recuperó y contiene archivos válidos');
  assert(resB.conversationalSummary.includes('corregida tras reintento'), 'ResB mantuvo la explicación del modelo');

  // --------------------------------------------------------------------------
  // TEST C: Fallo total y Honestidad (Cero plantillas sustitutivas)
  // --------------------------------------------------------------------------
  console.log('\n--- CASO C: Fallo total tras todos los reintentos (Reporte honesto) ---');
  let totalFails = 0;
  (council as any).aiProvider = {
    streamChat: async (_messages: any[], onProgress: any) => {
      totalFails++;
      const garbage = 'Respuesta corrupta que no contiene ningún JSON ni código parseable';
      onProgress(garbage, garbage);
      return garbage;
    }
  };

  const resC = await council.executeCollaborativeSynthesis(
    'Un pedido imposible que rompe al modelo',
    emptyProject,
    () => {}
  );

  assert(totalFails === 3, 'Se agotaron exactamente 3 intentos (1 inicial + 2 reintentos)');
  assert(Object.keys(resC.files).length === 0, 'files está vacío (NO se inyectó ninguna plantilla falsa)');
  assert(resC.fullCode === '', 'fullCode está vacío');
  assert(resC.conversationalSummary.includes('No fue posible generar la aplicación'), 'Se devolvió mensaje honesto de error al usuario');
  assert(!resC.conversationalSummary.includes('Mario Kart') && !resC.conversationalSummary.includes('Ace Combat'), 'Cero menciones a juegos ajenos');

  // --------------------------------------------------------------------------
  // TEST D: Edición Incremental con IncrementalEditContract
  // --------------------------------------------------------------------------
  console.log('\n--- CASO D: Edición Incremental Multi-Archivo ---');
  (surgicalAgent as any).aiProvider = {
    streamChat: async (_messages: any[], onProgress: any) => {
      const editResponse = JSON.stringify({
        changes: [
          {
            path: 'src/components/Header.tsx',
            action: 'update',
            content: 'export function Header() { return <header className="bg-indigo-600">Header Modificado</header>; }'
          },
          {
            path: 'src/components/NotificationBadge.tsx',
            action: 'create',
            content: 'export function NotificationBadge({ count }: any) { return <span>{count}</span>; }'
          }
        ],
        explanation: 'Se cambió el color del header a índigo y se creó el componente NotificationBadge.'
      });
      onProgress(editResponse, editResponse);
      return editResponse;
    }
  };

  const existingProjectFiles = {
    'src/App.tsx': { path: 'src/App.tsx', content: 'export default function App() {}', language: 'typescript' },
    'src/components/Header.tsx': { path: 'src/components/Header.tsx', content: 'export function Header() {}', language: 'typescript' }
  };

  const resD = await surgicalAgent.applyIncrementalProjectEdit(
    'Cámbiame el color del header a índigo y crea un badge de notificaciones',
    existingProjectFiles,
    () => {}
  );

  assert(resD.changes.length === 2, 'applyIncrementalProjectEdit devolvió 2 cambios');
  assert(resD.changes[0].action === 'update', 'Cambio 1 es update');
  assert(resD.changes[1].action === 'create', 'Cambio 2 es create');
  assert(resD.explanation.includes('índigo'), 'Explicación de cambios conservada');

  console.log('\n================================================================');
  console.log(`   RESULTADOS DE INTEGRACIÓN FASE 1: ${passed}/${total} PRUEBAS EXITOSAS (${Math.round((passed / total) * 100)}%)`);
  console.log('================================================================\n');

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runOrchestrationFase1Tests().catch(err => {
  console.error('Error fatal ejecutando pruebas de integración:', err);
  process.exit(1);
});
