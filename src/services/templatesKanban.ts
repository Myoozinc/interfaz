export const KANBAN_HTML = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LinearFlow - Kanban Pro</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js"></script>
  <style>
    body { background: #0c0f17; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .glass-card { background: rgba(22, 27, 39, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.07); }
    .column-scroll { max-height: calc(100vh - 210px); }
    ::-webkit-scrollbar { width: 5px; height: 5px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
    .task-card { cursor: grab; }
    .task-card:active { cursor: grabbing; }
    .drag-over { background: rgba(59, 130, 246, 0.15) !important; border-color: rgba(59, 130, 246, 0.5) !important; }
  </style>
</head>
<body class="text-slate-100 min-h-screen flex flex-col select-none overflow-x-auto">

  <!-- Linear Style Navbar -->
  <header class="border-b border-slate-800/80 bg-slate-950/70 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md">
    <div class="flex items-center gap-4">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-sky-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
          <i data-lucide="trello" class="w-4 h-4"></i>
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-sm font-bold tracking-tight text-white">LINEAR<span class="text-indigo-400">FLOW</span></h1>
            <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Sprint 14</span>
          </div>
          <p class="text-[11px] text-slate-400 font-medium">NONA AI Core Platform v3.4</p>
        </div>
      </div>

      <div class="h-5 w-px bg-slate-800 hidden sm:block"></div>

      <!-- Quick Metrics -->
      <div class="hidden md:flex items-center gap-4 text-xs">
        <div class="flex items-center gap-1.5 text-slate-400">
          <i data-lucide="check-circle" class="w-3.5 h-3.5 text-emerald-400"></i>
          <span>Progreso: <strong id="progressPercent" class="text-slate-200">0%</strong></span>
        </div>
        <div class="w-24 bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div id="progressBar" class="bg-emerald-500 h-full w-0 transition-all duration-300"></div>
        </div>
      </div>
    </div>

    <!-- Actions & Filter -->
    <div class="flex items-center gap-3">
      <!-- Search Input -->
      <div class="relative">
        <i data-lucide="search" class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"></i>
        <input 
          type="text" 
          id="searchInput" 
          placeholder="Buscar tareas..." 
          oninput="filterTasks()"
          class="bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors w-40 sm:w-56"
        >
      </div>

      <!-- Priority Filter -->
      <select id="priorityFilter" onchange="filterTasks()" class="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500">
        <option value="all">Todas las prioridades</option>
        <option value="urgent">Urgente</option>
        <option value="high">Alta</option>
        <option value="medium">Media</option>
        <option value="low">Baja</option>
      </select>

      <button onclick="openNewTaskModal()" class="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all cursor-pointer">
        <i data-lucide="plus" class="w-3.5 h-3.5"></i>
        <span>Nueva Tarea</span>
      </button>
    </div>
  </header>

  <!-- Board Columns Container -->
  <main class="flex-1 p-6 flex gap-5 overflow-x-auto min-w-max">

    <!-- Column 1: Backlog -->
    <div class="w-80 flex flex-col glass-card rounded-2xl p-3" ondragover="allowDrop(event)" ondragleave="dragLeave(event)" ondrop="drop(event, 'backlog')">
      <div class="flex items-center justify-between px-2 py-1.5 mb-2">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
          <h2 class="text-xs font-bold uppercase tracking-wider text-slate-300">Backlog</h2>
          <span id="badge-backlog" class="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400">0</span>
        </div>
        <button onclick="openNewTaskModal('backlog')" class="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer">
          <i data-lucide="plus" class="w-3.5 h-3.5"></i>
        </button>
      </div>
      <div id="col-backlog" class="column-scroll flex flex-col gap-2.5 overflow-y-auto pr-1 flex-1 min-h-[350px]"></div>
    </div>

    <!-- Column 2: In Progress -->
    <div class="w-80 flex flex-col glass-card rounded-2xl p-3" ondragover="allowDrop(event)" ondragleave="dragLeave(event)" ondrop="drop(event, 'in_progress')">
      <div class="flex items-center justify-between px-2 py-1.5 mb-2">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
          <h2 class="text-xs font-bold uppercase tracking-wider text-slate-300">En Progreso</h2>
          <span id="badge-in_progress" class="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400">0</span>
        </div>
        <button onclick="openNewTaskModal('in_progress')" class="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer">
          <i data-lucide="plus" class="w-3.5 h-3.5"></i>
        </button>
      </div>
      <div id="col-in_progress" class="column-scroll flex flex-col gap-2.5 overflow-y-auto pr-1 flex-1 min-h-[350px]"></div>
    </div>

    <!-- Column 3: Review / QA -->
    <div class="w-80 flex flex-col glass-card rounded-2xl p-3" ondragover="allowDrop(event)" ondragleave="dragLeave(event)" ondrop="drop(event, 'review')">
      <div class="flex items-center justify-between px-2 py-1.5 mb-2">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
          <h2 class="text-xs font-bold uppercase tracking-wider text-slate-300">En Revisión</h2>
          <span id="badge-review" class="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400">0</span>
        </div>
        <button onclick="openNewTaskModal('review')" class="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer">
          <i data-lucide="plus" class="w-3.5 h-3.5"></i>
        </button>
      </div>
      <div id="col-review" class="column-scroll flex flex-col gap-2.5 overflow-y-auto pr-1 flex-1 min-h-[350px]"></div>
    </div>

    <!-- Column 4: Completed -->
    <div class="w-80 flex flex-col glass-card rounded-2xl p-3" ondragover="allowDrop(event)" ondragleave="dragLeave(event)" ondrop="drop(event, 'done')">
      <div class="flex items-center justify-between px-2 py-1.5 mb-2">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          <h2 class="text-xs font-bold uppercase tracking-wider text-slate-300">Completado</h2>
          <span id="badge-done" class="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400">0</span>
        </div>
        <button onclick="openNewTaskModal('done')" class="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer">
          <i data-lucide="plus" class="w-3.5 h-3.5"></i>
        </button>
      </div>
      <div id="col-done" class="column-scroll flex flex-col gap-2.5 overflow-y-auto pr-1 flex-1 min-h-[350px]"></div>
    </div>

  </main>

  <!-- Modal: Crear / Editar Tarea -->
  <div id="taskModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 hidden">
    <div class="glass-card bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-fade-in">
      <div class="flex items-center justify-between pb-4 border-b border-slate-800">
        <h3 class="text-sm font-bold text-white flex items-center gap-2">
          <i data-lucide="plus-circle" class="w-4 h-4 text-indigo-400"></i>
          <span>Crear Nueva Tarea</span>
        </h3>
        <button onclick="closeTaskModal()" class="text-slate-400 hover:text-white transition-colors cursor-pointer">
          <i data-lucide="x" class="w-4 h-4"></i>
        </button>
      </div>

      <form onsubmit="saveNewTask(event)" class="mt-4 space-y-4 text-xs">
        <input type="hidden" id="taskColumnTarget" value="backlog">

        <div>
          <label class="block text-[11px] font-semibold text-slate-300 mb-1">Título de la Tarea</label>
          <input type="text" id="taskTitle" required placeholder="Ej: Implementar WebSockets en preview..." class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500">
        </div>

        <div>
          <label class="block text-[11px] font-semibold text-slate-300 mb-1">Descripción</label>
          <textarea id="taskDesc" rows="3" placeholder="Detalles de la tarea..." class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"></textarea>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-[11px] font-semibold text-slate-300 mb-1">Prioridad</label>
            <select id="taskPriority" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500">
              <option value="urgent">🔴 Urgente</option>
              <option value="high" selected>🟠 Alta</option>
              <option value="medium">🟡 Media</option>
              <option value="low">🟢 Baja</option>
            </select>
          </div>

          <div>
            <label class="block text-[11px] font-semibold text-slate-300 mb-1">Etiqueta</label>
            <select id="taskTag" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500">
              <option value="Frontend">Frontend</option>
              <option value="Backend">Backend</option>
              <option value="Design">UI / UX</option>
              <option value="AI Engine">AI Engine</option>
              <option value="Bugfix">Bugfix</option>
            </select>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-3 border-t border-slate-800">
          <button type="button" onclick="closeTaskModal()" class="px-3.5 py-1.5 rounded-xl text-slate-400 hover:bg-slate-800 font-medium transition-colors cursor-pointer">Cancelar</button>
          <button type="submit" class="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors cursor-pointer shadow-lg shadow-indigo-600/20">Guardar Tarea</button>
        </div>
      </form>
    </div>
  </div>

  <script>
    let tasks = [
      { id: "task-1", title: "Optimizar Bundler Multi-archivo", desc: "Integrar resolución local de imports React y WebGL sin latencia externa.", status: "done", priority: "urgent", tag: "Frontend", author: "Alex", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&h=60&fit=crop&crop=face" },
      { id: "task-2", title: "Pipeline de Orquestación Multi-IA", desc: "Diseñar router de inferencia para balancear cargas entre Llama 3.3 y Groq.", status: "in_progress", priority: "high", tag: "AI Engine", author: "Sofia", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face" },
      { id: "task-3", title: "Estudio de Audio Web Audio API", desc: "Sintetizadores con osciladores nativos y secuenciador de ritmos 16-step.", status: "in_progress", priority: "high", tag: "Frontend", author: "Marcos", avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=60&h=60&fit=crop&crop=face" },
      { id: "task-4", title: "Refactor de CSS Glassmorphism", desc: "Unificar paleta oscura slate-950 y bordes translúcidos en todo el IDE.", status: "review", priority: "medium", tag: "Design", author: "Elena", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=60&h=60&fit=crop&crop=face" },
      { id: "task-5", title: "Exportación de Proyectos a ZIP", desc: "Permitir a los usuarios descargar el árbol de archivos generado en 1 clic.", status: "backlog", priority: "low", tag: "Backend", author: "David", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&h=60&fit=crop&crop=face" },
      { id: "task-6", title: "Soporte para Shader GLSL en 3D", desc: "Añadir panel de edición de fragment shaders personalizados para Three.js.", status: "backlog", priority: "medium", tag: "Frontend", author: "Alex", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&h=60&fit=crop&crop=face" }
    ];

    let draggedTaskId = null;

    const PRIORITY_CONFIG = {
      urgent: { label: "Urgente", color: "text-rose-400 bg-rose-500/10 border-rose-500/30" },
      high: { label: "Alta", color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
      medium: { label: "Media", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30" },
      low: { label: "Baja", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
    };

    function renderBoard() {
      const query = (document.getElementById('searchInput')?.value || '').toLowerCase();
      const priority = document.getElementById('priorityFilter')?.value || 'all';

      const filtered = tasks.filter(t => {
        const matchesQuery = t.title.toLowerCase().includes(query) || t.desc.toLowerCase().includes(query);
        const matchesPriority = priority === 'all' || t.priority === priority;
        return matchesQuery && matchesPriority;
      });

      const cols = ['backlog', 'in_progress', 'review', 'done'];
      cols.forEach(col => {
        const container = document.getElementById('col-' + col);
        const badge = document.getElementById('badge-' + col);
        if (!container) return;

        const colTasks = filtered.filter(t => t.status === col);
        if (badge) badge.innerText = colTasks.length;

        container.innerHTML = colTasks.map(task => {
          const pConf = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
          return \`
            <div 
              id="\${task.id}"
              draggable="true" 
              ondragstart="dragStart(event, '\${task.id}')"
              class="task-card bg-slate-900/90 hover:bg-slate-850 p-3.5 rounded-xl border border-slate-800 hover:border-slate-700 shadow-lg transition-all group relative"
            >
              <div class="flex items-start justify-between gap-2 mb-2">
                <span class="px-2 py-0.5 rounded-md text-[9px] font-bold border \${pConf.color}">
                  \${pConf.label}
                </span>
                <span class="text-[9px] font-semibold text-slate-500 bg-slate-800/80 px-2 py-0.5 rounded">
                  \${task.tag}
                </span>
              </div>

              <h4 class="text-xs font-bold text-slate-100 group-hover:text-indigo-300 transition-colors leading-snug mb-1">
                \${task.title}
              </h4>
              <p class="text-[11px] text-slate-400 line-clamp-2 mb-3">
                \${task.desc}
              </p>

              <div class="flex items-center justify-between pt-2 border-t border-slate-800/70 text-[10px] text-slate-500">
                <div class="flex items-center gap-1.5">
                  <img src="\${task.avatar}" class="w-5 h-5 rounded-full object-cover border border-slate-700" alt="\${task.author}">
                  <span class="font-medium text-slate-400">\${task.author}</span>
                </div>
                <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onclick="deleteTask('\${task.id}')" class="p-1 hover:text-rose-400 text-slate-500 rounded transition-colors cursor-pointer" title="Eliminar">
                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                  </button>
                </div>
              </div>
            </div>
          \`;
        }).join('');
      });

      updateMetrics();
      lucide.createIcons();
    }

    function updateMetrics() {
      const total = tasks.length;
      const doneCount = tasks.filter(t => t.status === 'done').length;
      const pct = total === 0 ? 0 : Math.round((doneCount / total) * 100);

      const pText = document.getElementById('progressPercent');
      const pBar = document.getElementById('progressBar');
      if (pText) pText.innerText = \`\${pct}% (\${doneCount}/\${total})\`;
      if (pBar) pBar.style.width = \`\${pct}%\`;
    }

    // --- Drag and Drop Handlers ---
    function dragStart(e, id) {
      draggedTaskId = id;
      e.dataTransfer.setData('text/plain', id);
    }

    function allowDrop(e) {
      e.preventDefault();
      e.currentTarget.classList.add('drag-over');
    }

    function dragLeave(e) {
      e.currentTarget.classList.remove('drag-over');
    }

    function drop(e, targetCol) {
      e.preventDefault();
      e.currentTarget.classList.remove('drag-over');
      if (!draggedTaskId) return;

      const task = tasks.find(t => t.id === draggedTaskId);
      if (task && task.status !== targetCol) {
        task.status = targetCol;
        if (targetCol === 'done') {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 }
          });
        }
        renderBoard();
      }
      draggedTaskId = null;
    }

    // --- Modal Management ---
    function openNewTaskModal(col = 'backlog') {
      document.getElementById('taskColumnTarget').value = col;
      document.getElementById('taskTitle').value = '';
      document.getElementById('taskDesc').value = '';
      document.getElementById('taskModal').classList.remove('hidden');
    }

    function closeTaskModal() {
      document.getElementById('taskModal').classList.add('hidden');
    }

    function saveNewTask(e) {
      e.preventDefault();
      const title = document.getElementById('taskTitle').value.trim();
      const desc = document.getElementById('taskDesc').value.trim();
      const priority = document.getElementById('taskPriority').value;
      const tag = document.getElementById('taskTag').value;
      const status = document.getElementById('taskColumnTarget').value || 'backlog';

      if (!title) return;

      const newTask = {
        id: 'task-' + Date.now(),
        title,
        desc: desc || "Sin descripción proporcionada.",
        status,
        priority,
        tag,
        author: "Tú",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&h=60&fit=crop&crop=face"
      };

      tasks.unshift(newTask);
      closeTaskModal();
      renderBoard();
    }

    function deleteTask(id) {
      tasks = tasks.filter(t => t.id !== id);
      renderBoard();
    }

    function filterTasks() {
      renderBoard();
    }

    window.addEventListener('DOMContentLoaded', () => {
      renderBoard();
    });
  </script>
</body>
</html>`;
