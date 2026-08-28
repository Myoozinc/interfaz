import type { FullStackProject, ProjectFile } from '../types';

export class ProjectWorkspaceManager {
  private activeProject: FullStackProject;

  constructor() {
    this.activeProject = this.createDefaultProject('NONA Restaurant SaaS');
  }

  getActiveProject(): FullStackProject {
    return this.activeProject;
  }

  setActiveProject(project: FullStackProject) {
    this.activeProject = project;
  }

  updateFile(path: string, content: string, language?: string) {
    const ext = path.split('.').pop() || 'html';
    this.activeProject.files[path] = {
      path,
      content,
      language: language || (ext === 'ts' || ext === 'tsx' ? 'typescript' : ext === 'js' ? 'javascript' : ext),
      isModified: true,
      size: content.length,
    };
    this.activeProject.updatedAt = new Date().toISOString();
  }

  deleteFile(path: string) {
    delete this.activeProject.files[path];
    this.activeProject.updatedAt = new Date().toISOString();
  }

  createDefaultProject(name: string = 'NONA Restaurant SaaS'): FullStackProject {
    const initialHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
  </style>
</head>
<body class="bg-slate-50 text-slate-900 min-h-screen flex flex-col antialiased">
  
  <header class="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-4">
    <div class="max-w-6xl mx-auto flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md">
          <i data-lucide="utensils" class="w-5 h-5"></i>
        </div>
        <div>
          <span class="font-extrabold text-lg tracking-tight text-slate-900">RestauFlow<span class="text-indigo-600">.</span></span>
          <span class="text-[10px] block font-bold text-indigo-600 uppercase tracking-widest">SaaS de Restaurantes</span>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <button class="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900">Menú Digital</button>
        <button class="px-4 py-2 text-xs font-bold bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl shadow-sm">
          Nueva Reserva
        </button>
      </div>
    </div>
  </header>

  <main class="flex-1 max-w-6xl mx-auto px-6 py-10 w-full">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <span class="text-xs font-bold text-slate-400 uppercase">Reservas Hoy</span>
        <div class="text-3xl font-extrabold text-slate-900 mt-2">24</div>
        <span class="text-xs text-emerald-600 font-semibold mt-1 block">↑ 18% vs semana pasada</span>
      </div>
      <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <span class="text-xs font-bold text-slate-400 uppercase">Mesas Activas</span>
        <div class="text-3xl font-extrabold text-indigo-600 mt-2">12 / 16</div>
        <span class="text-xs text-slate-500 font-semibold mt-1 block">75% ocupación</span>
      </div>
      <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <span class="text-xs font-bold text-slate-400 uppercase">Ingresos Estimados</span>
        <div class="text-3xl font-extrabold text-slate-900 mt-2">$2,480.00</div>
        <span class="text-xs text-emerald-600 font-semibold mt-1 block">Ticket promedio $103</span>
      </div>
    </div>

    <div class="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-lg font-bold text-slate-900">Gestión de Mesas y Reservas</h2>
        <span class="text-xs bg-indigo-50 text-indigo-700 font-bold px-3 py-1 rounded-full">En Vivo</span>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4" id="tablesGrid">
        <div class="p-4 rounded-2xl border-2 border-emerald-500 bg-emerald-50/50 flex flex-col items-center justify-center">
          <span class="font-black text-emerald-700">Mesa 1</span>
          <span class="text-xs text-emerald-600 font-semibold">Disponible</span>
        </div>
        <div class="p-4 rounded-2xl border-2 border-indigo-500 bg-indigo-50/50 flex flex-col items-center justify-center">
          <span class="font-black text-indigo-700">Mesa 2</span>
          <span class="text-xs text-indigo-600 font-semibold">Ocupada (4 pers)</span>
        </div>
        <div class="p-4 rounded-2xl border-2 border-indigo-500 bg-indigo-50/50 flex flex-col items-center justify-center">
          <span class="font-black text-indigo-700">Mesa 3</span>
          <span class="text-xs text-indigo-600 font-semibold">Ocupada (2 pers)</span>
        </div>
        <div class="p-4 rounded-2xl border-2 border-emerald-500 bg-emerald-50/50 flex flex-col items-center justify-center">
          <span class="font-black text-emerald-700">Mesa 4</span>
          <span class="text-xs text-emerald-600 font-semibold">Disponible</span>
        </div>
      </div>
    </div>
  </main>

  <script>
    lucide.createIcons();
  </script>
</body>
</html>`;

    const files: Record<string, ProjectFile> = {
      'index.html': {
        path: 'index.html',
        content: initialHtml,
        language: 'html',
        size: initialHtml.length,
      },
      'schema.sql': {
        path: 'schema.sql',
        content: `-- Database Schema: Restaurants SaaS
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) DEFAULT 'customer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  capacity INT NOT NULL DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id),
  user_id UUID REFERENCES users(id),
  guest_count INT NOT NULL,
  reservation_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) DEFAULT 'confirmed'
);`,
        language: 'sql',
      },
      'api/reservations.js': {
        path: 'api/reservations.js',
        content: `// API Endpoint: /api/reservations
export async function getReservations(req, res) {
  // Fetch reservations logic
  return res.json({ status: 'ok', count: 24 });
}

export async function createReservation(req, res) {
  const { restaurantId, guestCount, time } = req.body;
  return res.json({ success: true, id: 'res_' + Date.now() });
}`,
        language: 'javascript',
      },
      '.env.example': {
        path: '.env.example',
        content: `DATABASE_URL=postgresql://user:password@localhost:5432/restaurants_db
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_APP_URL=https://myapp.vercel.app`,
        language: 'text',
      }
    };

    return {
      id: 'proj_' + Date.now(),
      name,
      description: 'Plataforma SaaS para restaurantes creada con NONA AI Software Factory',
      files,
      environmentVariables: {
        DATABASE_URL: '',
        STRIPE_SECRET_KEY: '',
      },
      framework: 'react-vite',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}

export const workspaceManager = new ProjectWorkspaceManager();
