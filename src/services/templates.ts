import type { ProjectTemplate } from '../types';

export const STARTER_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'saas-cream',
    name: 'NONA SaaS Cream',
    description: 'Landing page ultra moderna y minimalista con paleta crema y bronce',
    icon: 'Sparkles',
    files: [
      {
        id: '1',
        name: 'index.html',
        language: 'html',
        content: `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NONA — The Future of Code</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <script src="https://unpkg.com/lucide@latest"></script>
  <link rel="stylesheet" href="styles.css">
</head>
<body class="bg-[#FAF7F2] text-[#1C1917] font-sans antialiased min-h-screen flex flex-col selection:bg-[#EADBCE] selection:text-[#8F5622]">

  <!-- Header Navigation -->
  <header class="sticky top-0 z-50 backdrop-blur-md bg-[#FAF7F2]/85 border-b border-[#E7E0D6] px-6 py-4">
    <div class="max-w-6xl mx-auto flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-[#FAF1E8] border border-[#DFC7B1] flex items-center justify-center text-[#A86B32] shadow-sm">
          <i data-lucide="sparkles" class="w-5 h-5"></i>
        </div>
        <span class="font-extrabold text-xl tracking-tight text-[#1C1917]">NONA<span class="text-[#A86B32]">.</span></span>
      </div>

      <nav class="hidden md:flex items-center gap-8 text-sm font-medium text-[#57534E]">
        <a href="#features" class="hover:text-[#A86B32] transition-colors">Características</a>
        <a href="#demo" class="hover:text-[#A86B32] transition-colors">Demostración</a>
        <a href="#pricing" class="hover:text-[#A86B32] transition-colors">Precios</a>
        <a href="#docs" class="hover:text-[#A86B32] transition-colors">Documentación</a>
      </nav>

      <div class="flex items-center gap-3">
        <button class="px-4 py-2 text-sm font-medium text-[#57534E] hover:text-[#1C1917] transition-colors">Iniciar Sesión</button>
        <button class="px-4 py-2 text-sm font-medium bg-[#A86B32] hover:bg-[#8F5622] text-white rounded-xl shadow-sm transition-all hover:shadow hover:-translate-y-0.5">
          Probar Gratis
        </button>
      </div>
    </div>
  </header>

  <!-- Hero Section -->
  <main class="flex-1 max-w-6xl mx-auto px-6 py-16 md:py-24 text-center">
    <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FAF1E8] border border-[#DFC7B1] text-xs font-semibold text-[#8F5622] mb-8 animate-fade-in shadow-xs">
      <span class="w-2 h-2 rounded-full bg-[#10B981] animate-ping"></span>
      Impulsado por Qwen 3.8 & Arquitectura Multiplataforma
    </div>

    <h1 class="text-4xl md:text-6xl font-extrabold text-[#1C1917] tracking-tight leading-[1.15] max-w-3xl mx-auto">
      Crea aplicaciones reales en segundos con <span class="text-[#A86B32] underline decoration-[#DFC7B1] decoration-wavy underline-offset-8">IA autónoma</span>
    </h1>

    <p class="mt-6 text-lg md:text-xl text-[#57534E] max-w-2xl mx-auto font-normal leading-relaxed">
      NONA combina el poder de un motor de código inteligente con previsualizaciones instantáneas en vivo y edición precisa en tus archivos.
    </p>

    <!-- CTAs -->
    <div class="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
      <button id="generateBtn" class="w-full sm:w-auto px-8 py-3.5 bg-[#A86B32] hover:bg-[#8F5622] text-white font-medium rounded-xl shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2">
        <i data-lucide="zap" class="w-4 h-4"></i>
        Comenzar Ahora — 50 Créditos Gratis
      </button>
      <button class="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-[#F4EFEA] text-[#1C1917] font-medium rounded-xl border border-[#E7E0D6] shadow-xs transition-all flex items-center justify-center gap-2">
        <i data-lucide="play" class="w-4 h-4 text-[#A86B32]"></i>
        Ver Video Demo
      </button>
    </div>

    <!-- Feature Cards Grid -->
    <div id="features" class="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
      <div class="p-6 rounded-2xl bg-white border border-[#E7E0D6] shadow-xs hover:shadow-md transition-all hover:border-[#DFC7B1] group">
        <div class="w-12 h-12 rounded-xl bg-[#FAF1E8] flex items-center justify-center text-[#A86B32] mb-4 group-hover:scale-105 transition-transform">
          <i data-lucide="cpu" class="w-6 h-6"></i>
        </div>
        <h3 class="text-lg font-bold text-[#1C1917]">Motor de Inferencia Qwen</h3>
        <p class="mt-2 text-sm text-[#57534E] leading-relaxed">
          Optimizado para razonamiento lógico profundo, generación de código limpio y refactorización inteligente.
        </p>
      </div>

      <div class="p-6 rounded-2xl bg-white border border-[#E7E0D6] shadow-xs hover:shadow-md transition-all hover:border-[#DFC7B1] group">
        <div class="w-12 h-12 rounded-xl bg-[#FAF1E8] flex items-center justify-center text-[#A86B32] mb-4 group-hover:scale-105 transition-transform">
          <i data-lucide="monitor" class="w-6 h-6"></i>
        </div>
        <h3 class="text-lg font-bold text-[#1C1917]">Live Preview en Vivo</h3>
        <p class="mt-2 text-sm text-[#57534E] leading-relaxed">
          Previsualiza interfaces web en tiempo real con simulador responsivo para Escritorio, Tablet y Móvil.
        </p>
      </div>

      <div class="p-6 rounded-2xl bg-white border border-[#E7E0D6] shadow-xs hover:shadow-md transition-all hover:border-[#DFC7B1] group">
        <div class="w-12 h-12 rounded-xl bg-[#FAF1E8] flex items-center justify-center text-[#A86B32] mb-4 group-hover:scale-105 transition-transform">
          <i data-lucide="shield-check" class="w-6 h-6"></i>
        </div>
        <h3 class="text-lg font-bold text-[#1C1917]">Exportación & Sincronización</h3>
        <p class="mt-2 text-sm text-[#57534E] leading-relaxed">
          Descarga proyectos completos en ZIP o sincronízalos directamente con tu repositorio de GitHub y Vercel.
        </p>
      </div>
    </div>
  </main>

  <!-- Footer -->
  <footer class="border-t border-[#E7E0D6] bg-[#F4EFEA] py-8 text-center text-xs text-[#8C827A]">
    <p>© 2026 NONA Platform Inc. Diseñado para creadores y desarrolladores de próxima generación.</p>
  </footer>

  <script src="app.js"></script>
</body>
</html>`
      },
      {
        id: '2',
        name: 'styles.css',
        language: 'css',
        content: `/* Custom Refined Cream Aesthetic */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

button {
  cursor: pointer;
}
`
      },
      {
        id: '3',
        name: 'app.js',
        language: 'javascript',
        content: `// Interactive scripts
document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) {
    window.lucide.createIcons();
  }

  const generateBtn = document.getElementById('generateBtn');
  if (generateBtn) {
    generateBtn.addEventListener('click', () => {
      alert('¡Bienvenido a NONA App! Tu entorno está listo para crear.');
    });
  }
});`
      }
    ]
  },
  {
    id: 'analytics-dashboard',
    name: 'Dashboard Financiero & Métricas',
    description: 'Panel de control interactivo con gráficos, transacciones y tarjetas de KPI',
    icon: 'BarChart3',
    files: [
      {
        id: '1',
        name: 'index.html',
        language: 'html',
        content: `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NONA Analytics Dashboard</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://unpkg.com/lucide@latest"></script>
</head>
<body class="bg-[#FAF7F2] text-[#1C1917] font-sans antialiased p-6">
  <div class="max-w-6xl mx-auto space-y-6">
    
    <!-- Top Bar -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E7E0D6] shadow-xs">
      <div>
        <h1 class="text-xl font-bold text-[#1C1917]">Resumen de Actividad</h1>
        <p class="text-xs text-[#8C827A]">Métricas en tiempo real actualizadas hace un momento</p>
      </div>
      <div class="flex items-center gap-3">
        <button class="px-3.5 py-1.5 text-xs font-semibold bg-[#FAF1E8] border border-[#DFC7B1] text-[#8F5622] rounded-xl hover:bg-[#F4E2D2] transition-colors">
          Exportar Reporte
        </button>
        <div class="w-8 h-8 rounded-full bg-[#A86B32] text-white flex items-center justify-center font-bold text-xs">
          NZ
        </div>
      </div>
    </div>

    <!-- KPI Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
      <div class="bg-white p-5 rounded-2xl border border-[#E7E0D6] shadow-xs">
        <span class="text-xs font-medium text-[#8C827A]">Ingresos Totales</span>
        <div class="mt-2 flex items-baseline justify-between">
          <span class="text-2xl font-extrabold text-[#1C1917]">$24,580.00</span>
          <span class="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">+14.2%</span>
        </div>
      </div>

      <div class="bg-white p-5 rounded-2xl border border-[#E7E0D6] shadow-xs">
        <span class="text-xs font-medium text-[#8C827A]">Usuarios Activos</span>
        <div class="mt-2 flex items-baseline justify-between">
          <span class="text-2xl font-extrabold text-[#1C1917]">1,420</span>
          <span class="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">+8.5%</span>
        </div>
      </div>

      <div class="bg-white p-5 rounded-2xl border border-[#E7E0D6] shadow-xs">
        <span class="text-xs font-medium text-[#8C827A]">Créditos Consumidos</span>
        <div class="mt-2 flex items-baseline justify-between">
          <span class="text-2xl font-extrabold text-[#1C1917]">18,940</span>
          <span class="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">82% Cuota</span>
        </div>
      </div>
    </div>

    <!-- Recent Transactions Table -->
    <div class="bg-white rounded-2xl border border-[#E7E0D6] shadow-xs overflow-hidden">
      <div class="p-4 border-b border-[#E7E0D6] flex items-center justify-between">
        <h2 class="font-bold text-sm text-[#1C1917]">Últimas Generaciones de IA</h2>
        <span class="text-xs text-[#8C827A]">Mostrando 2 de 128</span>
      </div>
      <div class="divide-y divide-[#E7E0D6] text-xs">
        <div class="p-3.5 flex items-center justify-between hover:bg-[#FAF7F2] transition-colors">
          <div class="flex items-center gap-3">
            <div class="w-7 h-7 rounded-lg bg-[#FAF1E8] flex items-center justify-center text-[#A86B32]">
              <i data-lucide="code-2" class="w-4 h-4"></i>
            </div>
            <div>
              <span class="font-semibold text-[#1C1917]">Landing Page Component</span>
              <p class="text-[11px] text-[#8C827A]">Modelo Qwen 3.8 • 1.2s</p>
            </div>
          </div>
          <span class="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium">Completado</span>
        </div>

        <div class="p-3.5 flex items-center justify-between hover:bg-[#FAF7F2] transition-colors">
          <div class="flex items-center gap-3">
            <div class="w-7 h-7 rounded-lg bg-[#FAF1E8] flex items-center justify-center text-[#A86B32]">
              <i data-lucide="database" class="w-4 h-4"></i>
            </div>
            <div>
              <span class="font-semibold text-[#1C1917]">Schema SQL PostgreSQL</span>
              <p class="text-[11px] text-[#8C827A]">Modelo Qwen 3.8 • 0.8s</p>
            </div>
          </div>
          <span class="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium">Completado</span>
        </div>
      </div>
    </div>

  </div>

  <script>
    if (window.lucide) {
      window.lucide.createIcons();
    }
  </script>
</body>
</html>`
      }
    ]
  }
];
