# NONA — AI App Builder & Code Studio (Estilo Lovable / Google Antigravity)

NONA es un estudio de desarrollo de software asistido por IA capaz de transformar especificaciones en lenguaje natural en proyectos reales, multi-archivo, interactivos y ejecutables en el navegador con **React + Vite + TypeScript + Tailwind CSS**, vista previa en vivo, edición incremental por chat y exportación limpia a ZIP.

---

## 🏛️ Arquitectura del Sistema

NONA implementa una arquitectura modular de 5 capas diseñada para eliminar el "teatro de prompts", erradicar cualquier fallback a plantillas fijas y garantizar ejecución real de código:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        NONA INTERFACE & CHAT                           │
│           (Explorador de Archivos Jerárquico + Live Preview)           │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│             INTENT CLASSIFIER & OPTIMAL MODEL ROUTER (Fase 3)          │
│  - Señal 1: Proyecto existente vs Nuevo scaffold                       │
│  - Señal 2: Estimación de archivos afectados (1-2 vs 3+)              │
│  - Señal 3: Complejidad semántica y cantidad de requisitos             │
└────────┬──────────────────────────────────────────────────────┬────────┘
         │ (App nueva / Multi-archivo)                          │ (Edición puntual)
         ▼                                                      ▼
┌──────────────────────────────────┐   ┌─────────────────────────────────┐
│ AGENT COUNCIL (Full Build JSON)  │   │ SURGICAL DIFF (Incremental JSON)│
│  - OpenRouter (DeepSeek-V3)      │   │  - Groq LPU (Llama 3.3 70B)     │
│  - 12,000 maxTokens              │   │  - 4,000 maxTokens (~450 t/s)   │
└────────────────┬─────────────────┘   └────────────────┬────────────────┘
                 │                                      │
                 ▼                                      ▼
┌────────────────────────────────────────────────────────────────────────┐
│               PARSER ESTRICTO & QA TESTER AGENT (Fase 1 & 4)           │
│  - Limpieza de tokens <think>                                          │
│  - Resolución de imports relativos (garantía de existencia de archivos)│
│  - Validación de sintaxis TSX / llaves balanceadas                     │
│  - Bucle de autocorrección estructurado (máx. 3 intentos)              │
│  - CERO plantillas falsas: reporte honesto en caso de fallo persistente│
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                SANDBOX DUAL & PREVIEW ENGINE (Fase 2)                  │
│  - Motor Primario: StackBlitz WebContainers (@webcontainer/api)        │
│    (COOP: same-origin, COEP: require-corp, npm install, Vite dev server│
│  - Motor Secundario: Virtual Multi-File Bundler (Cliente)              │
│    (Transpilación TSX en memoria, Import Maps nativos, Data URIs)      │
│  - Exportador ZIP con proyecto Vite ejecutable (npm install && dev)    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📜 1. Contrato de Salida Estructurado del LLM

El modelo de lenguaje devuelve **exclusivamente** contratos JSON válidos (encerrados en bloques ````json ... ````):

### Contrato de Construcción Completa (`FullBuildContract`)
```json
{
  "files": [
    { "path": "src/App.tsx", "content": "import React from 'react';\n..." },
    { "path": "src/components/Header.tsx", "content": "export function Header() { ... }" },
    { "path": "src/index.css", "content": "@tailwind base;..." },
    { "path": "package.json", "content": "{ ... }" }
  ],
  "explanation": "Resumen claro y conversacional de las funcionalidades generadas."
}
```

### Contrato de Edición Incremental (`IncrementalEditContract`)
```json
{
  "changes": [
    {
      "path": "src/components/Header.tsx",
      "action": "update",
      "content": "código completo actualizado..."
    },
    {
      "path": "src/components/UserBadge.tsx",
      "action": "create",
      "content": "código del nuevo componente..."
    }
  ],
  "explanation": "Resumen puntual de los cambios aplicados sin tocar el resto del proyecto."
}
```

---

## 🧭 2. Enrutamiento Inteligente de Modelos (Smart Routing)

La selección del modelo se infiere a partir de **tres señales objetivas**, nunca de frases mágicas:

| # | Condición / Escenario | Señales Reales | Servidor | Modelo | maxTokens | Temp | Justificación |
|---|---|---|---|---|---|---|---|
| 1 | **Multimodal / Visión** | `attachments.some(img/video)` | OpenRouter | `google/gemini-2.5-flash` | 4,000 | 0.20 | Procesamiento visual de alta resolución con baja latencia. |
| 2 | **Ollama Local** | `hasCustomOllama && model === 'ollama'` | Ollama | `qwen2.5-coder:7b` | 4,000 | 0.20 | Privacidad total en el hardware local del usuario. |
| 3 | **Override de Usuario** | `requestedModel != 'default'` | Configurado | `requestedModel` | 8,192 | 0.15 | Respeto a la selección manual explícita. |
| 4 | **Edición Incremental Chica** | Proyecto existente, $\le 2$ archivos afectados, $\le 2$ requisitos, prompt $< 250$ chars | **Groq LPU** | `llama-3.3-70b-versatile` | 4,000 | 0.10 | Iteración ultra-rápida (~450 tokens/s) y económica. |
| 5 | **Edición Multi-Archivo** | Proyecto existente, $> 2$ archivos afectados o $> 2$ requisitos | **OpenRouter** | `deepseek/deepseek-chat` | 8,192 | 0.15 | Coherencia entre múltiples componentes interdependientes. |
| 6 | **Generación Inicial / App Nueva** | Sin proyecto previo, o reinicio explícito, o múltiples pantallas | **OpenRouter** | `deepseek/deepseek-chat` | 12,000 | 0.15 | Máxima capacidad de código multi-archivo con ventana extendida. |

---

## 🧪 3. Validación Real y Autocorrección en Sandbox

1. **Resolución de Imports Relativos**: `QATesterAgent` audita que cada `import ... from './...'` resuelva a un archivo existente en el mapa del proyecto.
2. **Auditoría Sintáctica**: Detecta llaves desbalanceadas, código truncado y etiquetas JSX sin cerrar antes de compilar.
3. **Captura de Runtime**: Errores del sandbox (`window.onerror`, dev server logs) se canalizan hacia el pipeline.
4. **Bucle de Autocorrección**: Ante cualquier fallo, se genera un prompt estructurado `[CORRECCIÓN TÉCNICA OBLIGATORIA]` alimentando el error exacto (máximo 3 intentos).
5. **Honestidad Absoluta**: Si tras los reintentos el error persiste, se reporta de forma transparente en el chat. **Prohibido sustituir por plantillas prefabricadas no solicitadas**.

---

## 💻 4. Sandbox Dual y Exportación

1. **Aislamiento Cruzado**: Cabeceras `COOP: same-origin` y `COEP: require-corp` configuradas en `vercel.json` y `vite.config.ts`.
2. **StackBlitz WebContainers**: Permite correr Node.js y el servidor Vite real en navegadores compatibles.
3. **Virtual Multi-File Bundler**: Compilador de cliente en memoria con Import Maps y Data URIs como respaldo garantizado.
4. **Exportación ZIP**: Empaqueta un proyecto Vite estándar (`package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/`) que se ejecuta inmediatamente con:
   ```bash
   npm install && npm run dev
   ```

---

## 🗂️ 5. Arquitectura Convencional y BaaS (Supabase)

1. **Estructura de Carpetas Convencional**:
   - `src/components/`: Componentes UI modulares reutilizables (PascalCase).
   - `src/pages/`: Vistas completas de pantallas y rutas.
   - `src/lib/`: Utilidades compartidas (`src/lib/utils.ts` con `cn()`) y clientes de servicios.
   - `src/types/`: Interfaces y modelos de TypeScript (`src/types/index.ts`).
2. **Soporte de Path Alias `@/`**:
   - Resuelve directamente a `src/` en Vite, TypeScript, Sandbox Virtual y validador de QA.
3. **Backend-as-a-Service (BaaS) con Supabase**:
   - Cuando el usuario solicita persistencia, bases de datos o autenticación, se genera el cliente `src/lib/supabase.ts` con `@supabase/supabase-js`.
   - Incluye sentencias SQL DDL en comentarios de código para crear las tablas en el dashboard de Supabase.
   - Cuenta con un fallback mock seguro para evitar caídas o pantallas en blanco en el Sandbox si las credenciales de entorno no han sido configuradas.

---

## 🚀 Comandos de Desarrollo y Pruebas

```bash
# Instalar dependencias
npm install

# Correr servidor local de desarrollo
npm run dev

# Compilar proyecto para producción
npm run build

# Ejecutar suite de pruebas completa (161/161 pruebas - 100% aprobadas)
./node_modules/.bin/jiti src/core/parser/__tests__/test_fase1_contracts.ts
./node_modules/.bin/jiti src/core/parser/__tests__/test_orchestration_fase1.ts
./node_modules/.bin/jiti src/core/sandbox/__tests__/test_fase2_sandbox.ts
./node_modules/.bin/jiti src/core/agent/__tests__/test_fase3_routing.ts
./node_modules/.bin/jiti src/core/agent/__tests__/test_fase4_validation.ts
./node_modules/.bin/jiti src/core/agent/__tests__/test_fase5_scalability.ts
```
