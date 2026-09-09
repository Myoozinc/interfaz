# NONA — AI Software Factory (Lovable / Google Antigravity Standard)

NONA es un entorno de desarrollo asistido por IA multi-agente que permite diseñar, generar, iterar y previsualizar aplicaciones interactivas en tiempo real.

---

## 🏛️ Arquitectura de Generación (Refactor Ronda 2)

### 1. Eliminación Total de Fallbacks Silenciosos (`AgentCollaborationCouncil`)
- **Cero sustituciones encubiertas**: Se eliminaron por completo las sustituciones forzadas a plantillas fijas (Mario Kart, Ace Combat, etc.) cuando una generación no cumple los criterios técnicos.
- **Bucle de Reintento Iterativo**: Si el código generado resulta incompleto, truncado o sin estructura HTML/DOM, se activa un ciclo de corrección técnica (hasta 3 intentos) retroalimentando al LLM el error exacto detectado.
- **Transparencia en Chat**: Si se agotan los reintentos, el sistema reporta de forma honesta y visible la causa técnica en el chat conversacional, protegiendo los archivos del proyecto del usuario de cualquier sobrescritura no deseada.

### 2. Enrutador de Modelos por Complejidad Real (`OptimalModelRouter`)
El enrutamiento de modelos evalúa dinámicamente:
- **Longitud y especificaciones**: Prompts breves de ajuste vs especificaciones completas.
- **Intención**: Edición incremental (`cambia`, `ajusta`, `corrige`) vs Construcción integral (`crea`, `juego`, `simulador`, `dashboard`).
- **Conteo de features & lógica**: Auth, bases de datos (IndexedDB, SQL), stores de estado, WebGL/Three.js, Web Audio, shaders y algoritmos.
- **Ventana de Tokens Extendida**: Salidas de hasta **8,192 tokens** en OpenRouter para construcciones completas, reservando Groq LPU (~450 t/s) para iteraciones de baja latencia.

---

## 🧭 Tabla de Decisiones de Enrutamiento

| Tipo de Solicitud | Criterios y Señales | Servidor | Modelo Recomendado | Max Tokens | Justificación |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Edición Incremental** | Prompt < 160 caracteres, verbos de edición (*cambia, ajusta, agrega botón*), score < 3 | **Groq LPU** | `llama-3.3-70b-versatile` | 4,000 | Latencia ultrarrápida (~450 tokens/s) para micro-iteraciones en el sandbox. |
| **Construcción Estándar** | Palabras clave de construcción (*haz una app, crea un juego*), prompt > 120 caracteres | **OpenRouter** | `deepseek/deepseek-chat` (DeepSeek-V3) | 8,192 | Capacidad de razonamiento y síntesis multi-archivo completa sin truncado. |
| **Arquitectura Compleja / 3D** | Three.js, físicas de colisión, Web Audio, Auth (JWT/roles), IndexedDB, Canvas WebGL, shaders | **OpenRouter** | `deepseek/deepseek-chat` / `claude-3.5-sonnet` | 8,192 | Manejo de dependencias complejas, bucles de render y arquitecturas modulares. |
| **Multimodal / Visión** | Adjuntos de imagen, bocetos de UI o capturas de video | **OpenRouter** | `google/gemini-2.5-flash` | 4,000 | Inferencia visual optimizada y análisis de diagramas. |
| **Entorno Local** | Modo Ollama activo en ajustes locales | **Ollama** | `qwen2.5-coder:7b` | 4,000 | Privacidad local en máquina del usuario. |

---

## 🛠️ Desarrollo Local

```bash
# Instalar dependencias
npm install

# Correr en desarrollo
npm run dev

# Compilar proyecto
npm run build

# Validar linting
npm run lint
```

