/**
 * GUARDRAILS DE COMPLEJIDAD Y PATRONES FEW-SHOT (ESTÁNDAR GOOGLE ANTIGRAVITY & LOVABLE PRO)
 */

export const PRO_COMPLEXITY_GUARDRAIL = `
REGLAS OBLIGATORIAS DE GENERACIÓN DE CÓDIGO (ESTÁNDAR PRO):
1. PROHIBIDO CÓDIGO MINIMALISTA: Todas las aplicaciones deben parecer productos SaaS o web apps comerciales listas para lanzamiento.
2. INTERACTIVIDAD COMPLETA: Todo botón, filtro, pestaña o formulario DEBE tener funcionalidad real o simulada mediante datos reactivos. Cero elementos decorativos inertes.
3. ESTILOS Y UI: Usa exclusivamente Tailwind CSS con un diseño moderno. Incluye siempre:
   - Micro-interacciones visuales (hover:scale-105, active:scale-95, transition-all, hover:border-indigo-500).
   - Sombras pulidas y efectos de cristal (shadow-xl, shadow-indigo-500/10, backdrop-blur-md).
   - Compatibilidad móvil y responsive por defecto (pensado para viewport de escritorio y simulador iPhone 15 Pro).
4. EFECTOS Y PERSISTENCIA:
   - Integra efectos de sonido nativos usando \`window.playSynthSound(type)\` (ej: 'click', 'win', 'eat', 'engine', 'button') en todos los eventos de interacción.
   - Todo cambio de estado (puntuación, carrito, inventario, nivel, filtros) debe guardarse dinámicamente en \`window.NONA_DB\` o \`localStorage\`.
5. COMPONENTES RICOS: Usa Lucide Icons (con llamada a \`lucide.createIcons()\` en script) y gráficos interactivos (Canvas / WebGL / Three.js) donde aplique.
6. FORMATO ESTRICTO: Inicia directamente con el bloque de código \`\`\`html filename=index.html y finaliza siempre con </html>\`\`\`.
`;

export const FEW_SHOT_PATTERNS = `
PATRONES DE ARQUITECTURA Y CÓDIGO FEW-SHOT DE REFERENCIA:

[PATRÓN 1: E-COMMERCE / TIENDA CON CARRITO Y MODAL SLIDE-OVER]
- Barra de navegación con contador de carrito reactivo (\`#cartCount\`).
- Cuadrícula de productos con insignias, precio, descripción e ícono Lucide.
- Modal de carrito lateral desplegable (\`#cartModal\`) con lista de productos agregados, botón de eliminar (\`removeFromCart\`), total calculado y botón de checkout con sonido de victoria (\`window.playSynthSound('win')\`).
- Persistencia en \`localStorage.getItem('nona_cart')\`.

[PATRÓN 2: SIMULACIÓN INTERACTIVA / MASCOTA VIRTUAL TAMAGOTCHI PRO]
- Personaje animado en SVG/Canvas con keyframes CSS (@keyframes de flotación, pestañeo y rebote).
- 4 barras de progreso dinámicas (Hambre, Energía, Diversión, Higiene) con indicadores numéricos porcentuales.
- Botones de acción funcional (Alimentar, Jugar, Dormir, Bañar) que reproducen sonidos de audio (\`window.playSynthSound('eat')\`, \`window.playSynthSound('happy')\`) y suman XP.
- Subida de nivel (\`levelUp\`) al llegar a 100 XP y temporizador de decaimiento pasivo con \`setInterval\`.

[PATRÓN 3: APLICACIÓN MÓVIL CON MARCO IOS / TAB BAR]
- Diseño vertical adaptable con tarjeta de cabecera de usuario y anillos de actividad.
- Tarjetas de estadísticas de dos columnas (Ritmo Cardíaco, Pasos, Calorías).
- Barra de navegación inferior (Bottom Tab Bar) con 4 pestañas interactivas (Inicio, Entrenar, Logros, Perfil).

[PATRÓN 4: SAAS DASHBOARD & METRICS]
- Barra superior con botón de actualización en tiempo real (\`refreshData\`).
- Tarjetas de KPI principales con comparativas de crecimiento (+18.4% MRR).
- Tablas de datos con estados visuales (badges de completado, pendientes), filtros de búsqueda y modales CRUD.
`;
