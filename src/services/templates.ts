import type { ProjectTemplate } from '../types';
import { MARIO_KART_GAME_HTML } from './marioKartTemplate';
import { AIR_COMBAT_GAME_HTML } from './airCombatTemplate';
import { THREE_D_STUDIO_HTML } from './templates3DStudio';
import { SAAS_ANALYTICS_HTML } from './templatesSaaS';
import { ECOMMERCE_STORE_HTML } from './templatesEcommerce';
import { SYNTHWAVE_DAW_HTML } from './templatesDaw';
import { KANBAN_HTML } from './templatesKanban';
import { MOBILE_IOS_HTML } from './templatesMobile';

export { 
  MARIO_KART_GAME_HTML, 
  AIR_COMBAT_GAME_HTML, 
  THREE_D_STUDIO_HTML, 
  SAAS_ANALYTICS_HTML, 
  ECOMMERCE_STORE_HTML, 
  SYNTHWAVE_DAW_HTML, 
  KANBAN_HTML, 
  MOBILE_IOS_HTML 
};

export const STARTER_TEMPLATES: ProjectTemplate[] = [
  // =========================================================================
  // 0. ⚡ MODERN REACT + VITE MODULAR STUDIO
  // =========================================================================
  {
    id: 'nona-react-vite-studio',
    name: '⚡ Modern React + Vite Studio',
    description: 'Arquitectura multi-archivo React 18 con TypeScript, Tailwind CSS y componentes modulares (Header, StatCards, ActivityFeed).',
    icon: 'Code2',
    category: 'React & Vite',
    tags: ['React 18', 'TypeScript', 'Tailwind CSS', 'Vite', 'Componentes'],
    badge: 'Recomendado',
    files: [
      {
        id: '1',
        name: 'src/App.tsx',
        language: 'typescript',
        content: `import React, { useState } from 'react';
import { Header } from './components/Header';
import { StatCard } from './components/StatCard';
import { ActivityFeed } from './components/ActivityFeed';
import { Users, DollarSign, Activity, Zap, RefreshCw } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'settings'>('overview');
  const [count, setCount] = useState(1284);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setCount(prev => prev + Math.floor(Math.random() * 50) + 10);
      setIsRefreshing(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={\`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer \${
                activeTab === 'overview'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }\`}
            >
              Vista General
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={\`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer \${
                activeTab === 'analytics'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }\`}
            >
              Métricas
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={\`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer \${
                activeTab === 'settings'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }\`}
            >
              Configuración
            </button>
          </div>

          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold transition-all cursor-pointer"
          >
            <RefreshCw className={\`w-3.5 h-3.5 \${isRefreshing ? 'animate-spin text-indigo-400' : ''}\`} />
            <span>Actualizar Datos</span>
          </button>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Usuarios Activos"
            value={count.toLocaleString()}
            change="+14.2%"
            isPositive={true}
            icon={Users}
            accentColor="indigo"
          />
          <StatCard
            title="Ingresos Recurrentes (MRR)"
            value="$42,850"
            change="+28.4%"
            isPositive={true}
            icon={DollarSign}
            accentColor="emerald"
          />
          <StatCard
            title="Tasa de Conversión"
            value="3.84%"
            change="-0.6%"
            isPositive={false}
            icon={Activity}
            accentColor="amber"
          />
          <StatCard
            title="Eventos por Segundo"
            value="98.2k/s"
            change="+41.5%"
            isPositive={true}
            icon={Zap}
            accentColor="cyan"
          />
        </div>

        {/* Modular Interactive Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800/80 p-6 rounded-3xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Rendimiento de la Plataforma</h3>
                <p className="text-xs text-slate-400">Tráfico y respuesta de microservicios en vivo</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                100% Operativo
              </span>
            </div>
            <div className="h-48 bg-slate-950/70 rounded-2xl border border-slate-800/60 flex items-center justify-center relative overflow-hidden group">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                  <Zap className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white">Componentes Modulares React 18</h4>
                <p className="text-xs text-slate-400 max-w-sm">Edita los archivos src/components/Header.tsx o StatCard.tsx para ver la recarga en caliente en tiempo real.</p>
              </div>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-3xl shadow-xl">
            <ActivityFeed />
          </div>
        </div>
      </main>
    </div>
  );
}`
      },
      {
        id: '2',
        name: 'src/components/Header.tsx',
        language: 'typescript',
        content: `import React from 'react';
import { Sparkles, Bell, Search } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-6 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
            NONA Studio Pro
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">Vite + React 18</span>
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden sm:block">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar..."
            className="bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors w-48"
          />
        </div>
        <button className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer">
          <Bell className="w-3.5 h-3.5" />
        </button>
        <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center border border-indigo-400/30 shadow-md">
          NO
        </div>
      </div>
    </header>
  );
};`
      },
      {
        id: '3',
        name: 'src/components/StatCard.tsx',
        language: 'typescript',
        content: `import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: LucideIcon;
  accentColor: 'indigo' | 'emerald' | 'amber' | 'cyan';
}

const colorMap = {
  indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  isPositive,
  icon: Icon,
  accentColor
}) => {
  return (
    <div className="bg-slate-900/70 border border-slate-800/80 p-5 rounded-2xl shadow-xl flex flex-col justify-between hover:border-slate-700 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400">{title}</span>
        <div className={\`p-2 rounded-xl border \${colorMap[accentColor]}\`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="mt-4 flex items-baseline justify-between">
        <span className="text-2xl font-black text-white tracking-tight">{value}</span>
        <span className={\`text-xs font-bold \${isPositive ? 'text-emerald-400' : 'text-rose-400'}\`}>
          {change}
        </span>
      </div>
    </div>
  );
};`
      },
      {
        id: '4',
        name: 'src/components/ActivityFeed.tsx',
        language: 'typescript',
        content: `import React from 'react';
import { CheckCircle2, Clock, UserPlus, AlertCircle } from 'lucide-react';

const activities = [
  { id: 1, text: 'Nuevo cliente Enterprise suscrito', time: 'Hace 5m', icon: UserPlus, color: 'text-emerald-400' },
  { id: 2, text: 'Despliegue exitoso en producción', time: 'Hace 18m', icon: CheckCircle2, color: 'text-indigo-400' },
  { id: 3, text: 'Alerta de latencia resuelta en Edge', time: 'Hace 42m', icon: AlertCircle, color: 'text-amber-400' },
  { id: 4, text: 'Backup automático completado', time: 'Hace 2h', icon: Clock, color: 'text-slate-400' },
];

export const ActivityFeed: React.FC = () => {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-white flex items-center gap-2">
        Actividad Reciente
      </h3>
      <div className="space-y-3">
        {activities.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.id} className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/50">
              <Icon className={\`w-4 h-4 mt-0.5 shrink-0 \${item.color}\`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-200 truncate">{item.text}</p>
                <span className="text-[10px] text-slate-500">{item.time}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};`
      },
      {
        id: '5',
        name: 'src/main.tsx',
        language: 'typescript',
        content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`
      },
      {
        id: '6',
        name: 'src/index.css',
        language: 'css',
        content: `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: system-ui, -apple-system, sans-serif;
}`
      },
      {
        id: '7',
        name: 'index.html',
        language: 'html',
        content: `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>NONA App</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="bg-slate-950 text-white min-h-screen">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`
      },
      {
        id: '8',
        name: 'package.json',
        language: 'json',
        content: `{\n  "name": "nona-app",\n  "private": true,\n  "version": "0.1.0",\n  "type": "module",\n  "scripts": {\n    "dev": "vite",\n    "build": "tsc && vite build"\n  },\n  "dependencies": {\n    "react": "^18.3.1",\n    "react-dom": "^18.3.1",\n    "lucide-react": "^0.469.0"\n  },\n  "devDependencies": {\n    "@vitejs/plugin-react": "^4.3.4",\n    "tailwindcss": "^3.4.17",\n    "typescript": "^5.6.3",\n    "vite": "^6.0.7"\n  }\n}`
      },
      {
        id: '9',
        name: 'vite.config.ts',
        language: 'typescript',
        content: `import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\n\nexport default defineConfig({\n  plugins: [react()]\n});`
      }
    ]
  },
  // =========================================================================
  // 1. 📐 3D GEOMETRY STUDIO PRO (Three.js WebGL CAD & Modeling)
  // =========================================================================
  {
    id: '3d-geometry-studio-pro',
    name: '📐 3D Geometry Studio Pro',
    description: 'Modelador 3D interactivo con Three.js: añade formas geométricas (cubo, esfera, toroide, cilindro, plano), manipula materiales, presets de iluminación y exporta capturas en alta definición.',
    icon: 'Box',
    category: 'Estudio 3D & WebGL',
    tags: ['Three.js', 'WebGL', 'Modelado 3D', 'OrbitControls', 'Shaders'],
    badge: 'Pro 3D',
    files: [
      {
        id: '1',
        name: 'index.html',
        language: 'html',
        content: THREE_D_STUDIO_HTML
      }
    ]
  },
  // =========================================================================
  // 1. 🏎️ CYBERPUNK 3D RACING OVERDRIVE (Three.js 3D Game)
  // =========================================================================
  {
    id: 'cyberpunk-3d-racing',
    name: '🏎️ Cyberpunk 3D Racing Overdrive',
    description: 'Juego de carreras 3D en Three.js con físicas reales, derrape, aceleración, sonido de motor sintetizado y controles táctiles y de teclado',
    icon: 'Gamepad2',
    category: 'Videojuegos 3D',
    tags: ['Three.js', 'WebGL', 'Físicas 3D', 'Web Audio API', 'Mobile & Desktop'],
    badge: 'Popular',
    files: [
      {
        id: '1',
        name: 'index.html',
        language: 'html',
        content: `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>Cyberpunk 3D Racing Overdrive</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    body { margin: 0; overflow: hidden; background: #070714; touch-action: manipulation; }
    canvas { display: block; width: 100vw; height: 100vh; }
    .glass-hud { background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(12px); border: 1px solid rgba(99, 102, 241, 0.3); }
    .btn-control:active, .btn-control.active { transform: scale(0.92); background-color: rgba(99, 102, 241, 0.6); }
  </style>
</head>
<body class="select-none font-sans text-white">

  <!-- 3D WebGL Canvas Container -->
  <div id="canvas-container" class="absolute inset-0"></div>

  <!-- Top Cyberpunk HUD -->
  <header class="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none z-10">
    <div class="glass-hud px-4 py-2.5 rounded-2xl flex items-center gap-3 shadow-2xl pointer-events-auto">
      <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30">
        <i data-lucide="zap" class="w-5 h-5"></i>
      </div>
      <div>
        <h1 class="text-xs font-black tracking-wider text-cyan-400 uppercase">CYBERPUNK OVERDRIVE</h1>
        <p class="text-[10px] text-slate-300 font-mono">DISTANCIA: <span id="hud-distance" class="text-white font-bold">0</span> m</p>
      </div>
    </div>

    <!-- Speedometer & Nitro Display -->
    <div class="glass-hud px-5 py-3 rounded-2xl text-right shadow-2xl pointer-events-auto flex items-center gap-4">
      <div>
        <div class="flex items-baseline justify-end gap-1">
          <span id="hud-speed" class="text-3xl font-black text-cyan-400 font-mono tracking-tight">0</span>
          <span class="text-[10px] font-bold text-slate-400">KM/H</span>
        </div>
        <div class="w-28 bg-slate-800/80 h-2 rounded-full overflow-hidden mt-1 border border-slate-700">
          <div id="hud-nitro-bar" class="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 transition-all duration-75" style="width: 100%"></div>
        </div>
      </div>
      <button id="btn-audio" onclick="toggleAudio()" class="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 transition-all cursor-pointer">
        <i id="audio-icon" data-lucide="volume-2" class="w-4 h-4"></i>
      </button>
    </div>
  </header>

  <!-- Start Game Overlay -->
  <div id="start-overlay" class="absolute inset-0 z-20 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center transition-opacity duration-300">
    <div class="max-w-md w-full bg-slate-900/90 border border-cyan-500/30 p-8 rounded-3xl shadow-2xl text-center space-y-6">
      <div class="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 mx-auto shadow-lg shadow-cyan-500/20">
        <i data-lucide="trophy" class="w-8 h-8"></i>
      </div>
      <div>
        <h2 class="text-2xl font-black text-white tracking-wide">CYBER OVERDRIVE 3D</h2>
        <p class="text-xs text-slate-300 mt-2">Conduce tu bólido en la autopista infinita de neón. Esquiva obstáculos y acelera a máxima velocidad.</p>
      </div>

      <div class="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-left text-xs text-slate-300 space-y-1.5 font-mono">
        <div class="flex justify-between"><span>Acelerar:</span> <b class="text-cyan-400">[W] o [↑]</b></div>
        <div class="flex justify-between"><span>Frenar / Reversa:</span> <b class="text-cyan-400">[S] o [↓]</b></div>
        <div class="flex justify-between"><span>Girar / Derrape:</span> <b class="text-cyan-400">[A] / [D] o [←] / [→]</b></div>
        <div class="flex justify-between"><span>Nitro Boost:</span> <b class="text-pink-400">[ESPACIO]</b></div>
        <div class="text-[10px] text-slate-400 pt-1 text-center">📱 En móviles, usa los botones táctiles en pantalla</div>
      </div>

      <button onclick="startGame()" class="w-full py-4 bg-gradient-to-r from-cyan-500 via-indigo-600 to-pink-500 hover:opacity-95 text-white font-black rounded-2xl shadow-xl shadow-cyan-500/30 transition-all text-sm tracking-wider cursor-pointer">
        ¡COMENZAR CARRERA!
      </button>
    </div>
  </div>

  <!-- On-Screen Mobile & Mouse Controls -->
  <div id="touch-controls" class="absolute bottom-5 left-4 right-4 flex justify-between items-end pointer-events-none z-10">
    <div class="flex items-center gap-3 pointer-events-auto">
      <button id="btn-left" class="btn-control w-14 h-14 rounded-2xl glass-hud text-cyan-300 flex items-center justify-center cursor-pointer shadow-lg">
        <i data-lucide="arrow-left" class="w-6 h-6"></i>
      </button>
      <button id="btn-right" class="btn-control w-14 h-14 rounded-2xl glass-hud text-cyan-300 flex items-center justify-center cursor-pointer shadow-lg">
        <i data-lucide="arrow-right" class="w-6 h-6"></i>
      </button>
    </div>

    <div class="flex items-center gap-3 pointer-events-auto">
      <button id="btn-nitro" class="btn-control w-14 h-14 rounded-2xl bg-pink-600/80 border border-pink-400/50 text-white flex flex-col items-center justify-center cursor-pointer shadow-lg font-bold text-[10px]">
        <i data-lucide="flame" class="w-5 h-5"></i> NITRO
      </button>
      <button id="btn-brake" class="btn-control w-14 h-14 rounded-2xl glass-hud text-rose-400 flex flex-col items-center justify-center cursor-pointer shadow-lg font-bold text-[10px]">
        <i data-lucide="arrow-down" class="w-5 h-5"></i> FRENO
      </button>
      <button id="btn-gas" class="btn-control w-16 h-16 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex flex-col items-center justify-center cursor-pointer shadow-xl shadow-cyan-500/30 font-black text-xs">
        <i data-lucide="arrow-up" class="w-6 h-6"></i> GAS
      </button>
    </div>
  </div>

  <script>
    let scene, camera, renderer, clock;
    let carGroup, wheels = [];
    let roadStripeMeshes = [], streetLights = [];
    let particleSystem;
    let audioCtx, engineOsc, engineGain, isMuted = false;
    let gameActive = false;

    let speed = 0;
    const maxForwardSpeed = 1.35;
    const maxReverseSpeed = -0.35;
    const acceleration = 0.022;
    const braking = 0.035;
    const friction = 0.982;
    const turnSensitivity = 0.038;
    let carX = 0;
    let totalDistance = 0;
    let nitroFuel = 100;
    const roadWidth = 14;

    const keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      nitro: false
    };

    function init3D() {
      const container = document.getElementById('canvas-container');
      clock = new THREE.Clock();

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x060714);
      scene.fog = new THREE.FogExp2(0x060714, 0.012);

      camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 800);
      camera.position.set(0, 3.2, 7.5);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      container.appendChild(renderer.domElement);

      const ambientLight = new THREE.AmbientLight(0x223355, 1.2);
      scene.add(ambientLight);

      const dirLight = new THREE.DirectionalLight(0x00f0ff, 1.8);
      dirLight.position.set(10, 25, 15);
      dirLight.castShadow = true;
      scene.add(dirLight);

      const pinkLight = new THREE.DirectionalLight(0xff0077, 1.2);
      pinkLight.position.set(-15, 20, -10);
      scene.add(pinkLight);

      buildRoadAndEnvironment();
      buildCar();
      buildParticles();
      setupControls();

      window.addEventListener('resize', onWindowResize);
      animate();
    }

    function buildRoadAndEnvironment() {
      const roadGeo = new THREE.PlaneGeometry(roadWidth, 800);
      const roadMat = new THREE.MeshStandardMaterial({
        color: 0x0c0f18,
        roughness: 0.8,
        metalness: 0.2
      });
      const road = new THREE.Mesh(roadGeo, roadMat);
      road.rotation.x = -Math.PI / 2;
      road.receiveShadow = true;
      scene.add(road);

      const borderGeo = new THREE.BoxGeometry(0.3, 0.4, 800);
      const borderMatL = new THREE.MeshBasicMaterial({ color: 0x00ffff });
      const borderL = new THREE.Mesh(borderGeo, borderMatL);
      borderL.position.set(-roadWidth / 2, 0.2, 0);
      scene.add(borderL);

      const borderMatR = new THREE.MeshBasicMaterial({ color: 0xff0077 });
      const borderR = new THREE.Mesh(borderGeo, borderMatR);
      borderR.position.set(roadWidth / 2, 0.2, 0);
      scene.add(borderR);

      const stripeGeo = new THREE.PlaneGeometry(0.25, 4);
      const stripeMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
      for (let z = -400; z < 400; z += 12) {
        const stripe = new THREE.Mesh(stripeGeo, stripeMat);
        stripe.rotation.x = -Math.PI / 2;
        stripe.position.set(0, 0.02, z);
        scene.add(stripe);
        roadStripeMeshes.push(stripe);
      }

      const towerGeo = new THREE.BoxGeometry(6, 40, 8);
      for (let i = 0; i < 30; i++) {
        const side = i % 2 === 0 ? 1 : -1;
        const color = i % 3 === 0 ? 0x00ffff : (i % 3 === 1 ? 0xff0077 : 0x4f46e5);
        const towerMat = new THREE.MeshStandardMaterial({
          color: 0x090d16,
          roughness: 0.3,
          metalness: 0.8,
          emissive: color,
          emissiveIntensity: 0.2
        });
        const tower = new THREE.Mesh(towerGeo, towerMat);
        const zPos = -400 + (i * 26);
        tower.position.set(side * (roadWidth / 2 + 8 + Math.random() * 6), 20, zPos);
        scene.add(tower);
        streetLights.push(tower);
      }

      const starGeo = new THREE.BufferGeometry();
      const starCount = 600;
      const starPositions = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount * 3; i += 3) {
        starPositions[i] = (Math.random() - 0.5) * 600;
        starPositions[i + 1] = 40 + Math.random() * 200;
        starPositions[i + 2] = (Math.random() - 0.5) * 600;
      }
      starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
      const starMat = new THREE.PointsMaterial({ color: 0x88bbff, size: 1.5 });
      const stars = new THREE.Points(starGeo, starMat);
      scene.add(stars);
    }

    function buildCar() {
      carGroup = new THREE.Group();

      const chassisGeo = new THREE.BoxGeometry(1.6, 0.45, 3.4);
      const chassisMat = new THREE.MeshStandardMaterial({
        color: 0x0a1020,
        roughness: 0.2,
        metalness: 0.95
      });
      const chassis = new THREE.Mesh(chassisGeo, chassisMat);
      chassis.position.y = 0.45;
      chassis.castShadow = true;
      carGroup.add(chassis);

      const cabinGeo = new THREE.BoxGeometry(1.1, 0.4, 1.8);
      const cabinMat = new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.7,
        roughness: 0.1,
        metalness: 0.9
      });
      const cabin = new THREE.Mesh(cabinGeo, cabinMat);
      cabin.position.set(0, 0.8, -0.2);
      carGroup.add(cabin);

      const spoilerGeo = new THREE.BoxGeometry(1.5, 0.08, 0.4);
      const spoilerMat = new THREE.MeshBasicMaterial({ color: 0xff0077 });
      const spoiler = new THREE.Mesh(spoilerGeo, spoilerMat);
      spoiler.position.set(0, 1.0, 1.4);
      carGroup.add(spoiler);

      const strutGeo = new THREE.BoxGeometry(0.08, 0.4, 0.08);
      const strutL = new THREE.Mesh(strutGeo, chassisMat);
      strutL.position.set(-0.5, 0.8, 1.4);
      carGroup.add(strutL);
      const strutR = new THREE.Mesh(strutGeo, chassisMat);
      strutR.position.set(0.5, 0.8, 1.4);
      carGroup.add(strutR);

      const headlightGeo = new THREE.BoxGeometry(0.35, 0.15, 0.1);
      const headlightMat = new THREE.MeshStandardMaterial({
        color: 0x00ffff,
        emissive: 0x00ffff,
        emissiveIntensity: 3.5
      });
      const headL = new THREE.Mesh(headlightGeo, headlightMat);
      headL.position.set(-0.55, 0.5, -1.7);
      carGroup.add(headL);

      const headR = new THREE.Mesh(headlightGeo, headlightMat);
      headR.position.set(0.55, 0.5, -1.7);
      carGroup.add(headR);

      const taillightMat = new THREE.MeshStandardMaterial({
        color: 0xff0055,
        emissive: 0xff0055,
        emissiveIntensity: 3.0
      });
      const tailL = new THREE.Mesh(headlightGeo, taillightMat);
      tailL.position.set(-0.55, 0.5, 1.7);
      carGroup.add(tailL);

      const tailR = new THREE.Mesh(headlightGeo, taillightMat);
      tailR.position.set(0.55, 0.5, 1.7);
      carGroup.add(tailR);

      const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.28, 20);
      wheelGeo.rotateZ(Math.PI / 2);
      const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111118, roughness: 0.8 });
      const rimMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });

      const wheelOffsets = [
        { x: -0.85, y: 0.38, z: -1.0 },
        { x: 0.85, y: 0.38, z: -1.0 },
        { x: -0.85, y: 0.38, z: 1.0 },
        { x: 0.85, y: 0.38, z: 1.0 }
      ];

      wheelOffsets.forEach(pos => {
        const wheelObj = new THREE.Mesh(wheelGeo, wheelMat);
        wheelObj.position.set(pos.x, pos.y, pos.z);
        wheelObj.castShadow = true;

        const rimGeo = new THREE.RingGeometry(0.1, 0.22, 12);
        rimGeo.rotateY(pos.x > 0 ? Math.PI / 2 : -Math.PI / 2);
        const rim = new THREE.Mesh(rimGeo, rimMat);
        rim.position.set(pos.x > 0 ? 0.15 : -0.15, 0, 0);
        wheelObj.add(rim);

        carGroup.add(wheelObj);
        wheels.push(wheelObj);
      });

      scene.add(carGroup);
    }

    function buildParticles() {
      const particleCount = 60;
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount * 3; i++) {
        pos[i] = 0;
      }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const mat = new THREE.PointsMaterial({
        color: 0x00ffff,
        size: 0.35,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
      });
      particleSystem = new THREE.Points(geo, mat);
      scene.add(particleSystem);
    }

    function setupControls() {
      window.addEventListener('keydown', e => {
        const k = e.key.toLowerCase();
        if (k === 'w' || k === 'arrowup') keys.forward = true;
        if (k === 's' || k === 'arrowdown') keys.backward = true;
        if (k === 'a' || k === 'arrowleft') keys.left = true;
        if (k === 'd' || k === 'arrowright') keys.right = true;
        if (k === ' ' || k === 'shift') keys.nitro = true;
      });

      window.addEventListener('keyup', e => {
        const k = e.key.toLowerCase();
        if (k === 'w' || k === 'arrowup') keys.forward = false;
        if (k === 's' || k === 'arrowdown') keys.backward = false;
        if (k === 'a' || k === 'arrowleft') keys.left = false;
        if (k === 'd' || k === 'arrowright') keys.right = false;
        if (k === ' ' || k === 'shift') keys.nitro = false;
      });

      const bindContinuous = (btnId, keyProp) => {
        const btn = document.getElementById(btnId);
        if (!btn) return;
        const start = e => { e.preventDefault(); keys[keyProp] = true; btn.classList.add('active'); };
        const end = e => { e.preventDefault(); keys[keyProp] = false; btn.classList.remove('active'); };
        btn.addEventListener('mousedown', start);
        btn.addEventListener('mouseup', end);
        btn.addEventListener('mouseleave', end);
        btn.addEventListener('touchstart', start, { passive: false });
        btn.addEventListener('touchend', end, { passive: false });
        btn.addEventListener('touchcancel', end, { passive: false });
      };

      bindContinuous('btn-gas', 'forward');
      bindContinuous('btn-brake', 'backward');
      bindContinuous('btn-left', 'left');
      bindContinuous('btn-right', 'right');
      bindContinuous('btn-nitro', 'nitro');
    }

    function initAudio() {
      if (audioCtx) return;
      try {
        const AudioClass = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioClass();

        engineOsc = audioCtx.createOscillator();
        engineOsc.type = 'sawtooth';
        engineOsc.frequency.setValueAtTime(55, audioCtx.currentTime);

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, audioCtx.currentTime);

        engineGain = audioCtx.createGain();
        engineGain.gain.setValueAtTime(0.08, audioCtx.currentTime);

        engineOsc.connect(filter);
        filter.connect(engineGain);
        engineGain.connect(audioCtx.destination);

        engineOsc.start();
      } catch (err) {
        console.warn('Web Audio not available', err);
      }
    }

    function toggleAudio() {
      isMuted = !isMuted;
      if (engineGain) {
        engineGain.gain.setValueAtTime(isMuted ? 0 : 0.08, audioCtx.currentTime);
      }
      const icon = document.getElementById('audio-icon');
      icon.setAttribute('data-lucide', isMuted ? 'volume-x' : 'volume-2');
      lucide.createIcons();
    }

    function startGame() {
      initAudio();
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      gameActive = true;
      document.getElementById('start-overlay').style.opacity = '0';
      setTimeout(() => {
        document.getElementById('start-overlay').style.display = 'none';
      }, 300);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
      requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);

      if (gameActive) {
        let targetMax = maxForwardSpeed;
        if (keys.nitro && nitroFuel > 0 && speed > 0.2) {
          targetMax = 1.9;
          speed += acceleration * 1.8;
          nitroFuel = Math.max(0, nitroFuel - 0.4);
        } else {
          nitroFuel = Math.min(100, nitroFuel + 0.1);
        }

        if (keys.forward) {
          speed += acceleration;
          if (speed > targetMax) speed = targetMax;
        } else if (keys.backward) {
          speed -= braking;
          if (speed < maxReverseSpeed) speed = maxReverseSpeed;
        } else {
          speed *= friction;
          if (Math.abs(speed) < 0.002) speed = 0;
        }

        if (Math.abs(speed) > 0.02) {
          const steerDir = speed > 0 ? 1 : -1;
          if (keys.left) carX -= turnSensitivity * steerDir;
          if (keys.right) carX += turnSensitivity * steerDir;
        }

        const maxX = (roadWidth / 2) - 1.2;
        if (carX < -maxX) { carX = -maxX; speed *= 0.85; }
        if (carX > maxX) { carX = maxX; speed *= 0.85; }

        carGroup.position.x = carX;

        const targetRotation = (keys.left ? 0.08 : (keys.right ? -0.08 : 0));
        carGroup.rotation.z += (targetRotation - carGroup.rotation.z) * 0.15;
        carGroup.rotation.y = -(carGroup.position.x * 0.02);

        wheels.forEach(w => {
          w.rotation.x += speed * 0.8;
        });

        totalDistance += speed * 60 * delta;

        roadStripeMeshes.forEach(s => {
          s.position.z += speed * 35;
          if (s.position.z > 30) s.position.z -= 800;
        });

        streetLights.forEach(b => {
          b.position.z += speed * 35;
          if (b.position.z > 50) b.position.z -= 800;
        });

        if (particleSystem) {
          const pPositions = particleSystem.geometry.attributes.position.array;
          for (let i = 0; i < pPositions.length; i += 3) {
            pPositions[i + 2] += 0.8 + speed * 2;
            if (pPositions[i + 2] > 6) {
              pPositions[i] = carGroup.position.x + (Math.random() - 0.5) * 0.4;
              pPositions[i + 1] = 0.4 + Math.random() * 0.2;
              pPositions[i + 2] = carGroup.position.z + 1.7;
            }
          }
          particleSystem.geometry.attributes.position.needsUpdate = true;
        }

        if (engineOsc && audioCtx && !isMuted) {
          const freq = 50 + Math.abs(speed / maxForwardSpeed) * 190;
          engineOsc.frequency.setTargetAtTime(freq, audioCtx.currentTime, 0.05);
        }

        camera.position.x += (carGroup.position.x * 0.6 - camera.position.x) * 0.1;
        camera.lookAt(carGroup.position.x * 0.3, 0.8, -12);

        const kmh = Math.floor(Math.abs(speed) * 178);
        document.getElementById('hud-speed').innerText = kmh;
        document.getElementById('hud-distance').innerText = Math.floor(totalDistance);
        document.getElementById('hud-nitro-bar').style.width = nitroFuel + '%';
      }

      renderer.render(scene, camera);
    }

    document.addEventListener('DOMContentLoaded', () => {
      lucide.createIcons();
      init3D();
    });
  </script>
</body>
</html>`
      }
    ]
  },

  // =========================================================================
  // 2. 🏎️ MARIO KART 3D ARCADE GP (Three.js Cartoon Racing Game)
  // =========================================================================
  {
    id: 'mario-kart-3d-arcade',
    name: '🏎️ Mario Kart 3D Arcade GP',
    description: 'Juego de carreras arcade 3D estilo cartoon en Three.js con praderas verdes, colinas, kart detallado, monedas recolectables, turbos y sonido Web Audio',
    icon: 'Gamepad2',
    category: 'Videojuegos 3D',
    tags: ['Three.js', 'WebGL', 'Mario Kart Style', 'Físicas Arcade', 'Monedas & Turbos'],
    badge: 'Popular',
    files: [
      {
        id: '1',
        name: 'index.html',
        language: 'html',
        content: MARIO_KART_GAME_HTML
      }
    ]
  },

  // =========================================================================
  // 3. ✈️ ACE COMBAT 3D: DOGFIGHT SKY FURY (Three.js Flight Simulator)
  // =========================================================================
  {
    id: 'ace-combat-3d-dogfight',
    name: '✈️ Ace Combat 3D: Dogfight Sky Fury',
    description: 'Simulador de combate aéreo 3D en Three.js con caza militar detallado, ametralladoras dobles, cazas enemigos, explosiones de partículas, postcombustión y HUD táctico',
    icon: 'Plane',
    category: 'Combate Aéreo 3D',
    tags: ['Three.js', 'WebGL', 'Simulador de Vuelo', 'Combate Aéreo', 'Web Audio API'],
    badge: 'Nuevo',
    files: [
      {
        id: '1',
        name: 'index.html',
        language: 'html',
        content: AIR_COMBAT_GAME_HTML
      }
    ]
  },

  // =========================================================================
  // 4. 🎹 SYNTHWAVE DAW STUDIO 2026 (Web Audio API & Sequencer)
  // =========================================================================
  {
    id: 'synthwave-web-daw',
    name: '🎹 SynthWave DAW Studio 2026',
    description: 'Estación de producción musical y secuenciador de ritmos de 16 pasos con síntesis analógica polifónica nativa, visualizador FFT en tiempo real y presets de audio.',
    icon: 'Music',
    category: 'Música & Audio',
    tags: ['Web Audio API', 'Osciloscopio', 'Secuenciador 16-Step', 'Sintetizador', 'Presets'],
    badge: 'Pro DAW',
    files: [
      {
        id: '1',
        name: 'index.html',
        language: 'html',
        content: SYNTHWAVE_DAW_HTML
      }
    ]
  },

  // =========================================================================
  // 3. 🚀 STARFIGHTER 3D SPACE ODYSSEY (Three.js 3D Combat Simulator)
  // =========================================================================
  {
    id: 'starfighter-3d-space',
    name: '🚀 Starfighter 3D Space Odyssey',
    description: 'Simulador de combate espacial 3D con Three.js, disparos láser, campo de asteroides procedural y efectos de partículas',
    icon: 'Rocket',
    category: 'Videojuegos 3D',
    tags: ['Three.js', 'Espacio 3D', 'Partículas', 'Combate', 'WebGL'],
    badge: 'Nuevo',
    files: [
      {
        id: '1',
        name: 'index.html',
        language: 'html',
        content: `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>Starfighter 3D Space Odyssey</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>body { margin: 0; overflow: hidden; background: #020208; } canvas { display: block; }</style>
</head>
<body class="select-none font-sans text-white">
  <div id="container" class="absolute inset-0"></div>

  <header class="absolute top-4 left-4 right-4 flex justify-between pointer-events-none z-10">
    <div class="bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-indigo-500/30 flex items-center gap-3 pointer-events-auto">
      <div class="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white"><i data-lucide="crosshair" class="w-4 h-4"></i></div>
      <div>
        <span class="text-[10px] text-indigo-400 font-bold uppercase block">SCORE</span>
        <span id="hud-score" class="text-xl font-black text-white font-mono">0</span>
      </div>
    </div>
    <div class="bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-indigo-500/30 flex items-center gap-2 pointer-events-auto">
      <span class="text-xs text-slate-400">Escudo:</span>
      <div class="w-24 bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700">
        <div id="hud-shield" class="h-full bg-emerald-400 transition-all duration-150" style="width: 100%"></div>
      </div>
    </div>
  </header>

  <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 opacity-70">
    <div class="w-8 h-8 border border-cyan-400/80 rounded-full flex items-center justify-center">
      <div class="w-1.5 h-1.5 bg-pink-500 rounded-full"></div>
    </div>
  </div>

  <div class="absolute bottom-6 right-6 z-10">
    <button onclick="fireLaser()" class="w-16 h-16 rounded-full bg-pink-600 hover:bg-pink-500 border-2 border-pink-400 text-white font-black shadow-2xl flex items-center justify-center cursor-pointer active:scale-95">
      <i data-lucide="zap" class="w-7 h-7"></i>
    </button>
  </div>

  <script>
    let scene, camera, renderer, ship, asteroids = [], lasers = [];
    let score = 0, shield = 100;
    let targetShipX = 0, targetShipY = 0;

    function init() {
      scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x02020a, 0.015);

      camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.set(0, 2, 6);

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      document.getElementById('container').appendChild(renderer.domElement);

      const ambient = new THREE.AmbientLight(0x334466, 1.5);
      scene.add(ambient);
      const sun = new THREE.DirectionalLight(0x00ffff, 2);
      sun.position.set(20, 40, 20);
      scene.add(sun);

      buildStarfield();
      buildShip();
      spawnAsteroids();

      window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      });

      window.addEventListener('pointermove', e => {
        targetShipX = ((e.clientX / window.innerWidth) - 0.5) * 12;
        targetShipY = -((e.clientY / window.innerHeight) - 0.5) * 7;
      });

      window.addEventListener('keydown', e => {
        if (e.key === ' ' || e.key.toLowerCase() === 'f') fireLaser();
      });

      animate();
    }

    function buildStarfield() {
      const geo = new THREE.BufferGeometry();
      const count = 800;
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count * 3; i += 3) {
        pos[i] = (Math.random() - 0.5) * 500;
        pos[i + 1] = (Math.random() - 0.5) * 500;
        pos[i + 2] = (Math.random() - 0.5) * 500;
      }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const mat = new THREE.PointsMaterial({ color: 0xaaccff, size: 1.2 });
      scene.add(new THREE.Points(geo, mat));
    }

    function buildShip() {
      ship = new THREE.Group();

      const bodyGeo = new THREE.ConeGeometry(0.7, 3.2, 5);
      bodyGeo.rotateX(Math.PI / 2);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3, metalness: 0.9 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      ship.add(body);

      const wingGeo = new THREE.BoxGeometry(3.6, 0.08, 1.2);
      const wingMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.2, metalness: 0.8 });
      const wings = new THREE.Mesh(wingGeo, wingMat);
      wings.position.set(0, 0, 0.4);
      ship.add(wings);

      const cockpitGeo = new THREE.SphereGeometry(0.35, 12, 12);
      cockpitGeo.scale(1, 0.8, 1.8);
      const cockpitMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
      cockpit.position.set(0, 0.3, -0.2);
      ship.add(cockpit);

      scene.add(ship);
    }

    function spawnAsteroids() {
      const geo = new THREE.DodecahedronGeometry(1.2, 1);
      const mat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 });

      for (let i = 0; i < 25; i++) {
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set((Math.random() - 0.5) * 35, (Math.random() - 0.5) * 25, -50 - Math.random() * 250);
        mesh.rotation.set(Math.random() * 3, Math.random() * 3, 0);
        scene.add(mesh);
        asteroids.push(mesh);
      }
    }

    function fireLaser() {
      const geo = new THREE.CylinderGeometry(0.08, 0.08, 1.5);
      geo.rotateX(Math.PI / 2);
      const mat = new THREE.MeshBasicMaterial({ color: 0xec4899 });
      const laser = new THREE.Mesh(geo, mat);
      laser.position.set(ship.position.x, ship.position.y, ship.position.z - 1.2);
      scene.add(laser);
      lasers.push(laser);
    }

    function animate() {
      requestAnimationFrame(animate);

      ship.position.x += (targetShipX - ship.position.x) * 0.08;
      ship.position.y += (targetShipY - ship.position.y) * 0.08;
      ship.rotation.z = -(ship.position.x - targetShipX) * 0.15;
      ship.rotation.x = (ship.position.y - targetShipY) * 0.08;

      camera.position.x += (ship.position.x * 0.5 - camera.position.x) * 0.05;
      camera.position.y += ((ship.position.y * 0.5 + 2) - camera.position.y) * 0.05;

      asteroids.forEach(ast => {
        ast.position.z += 1.4;
        ast.rotation.x += 0.02;
        ast.rotation.y += 0.03;

        const dist = ast.position.distanceTo(ship.position);
        if (dist < 1.8) {
          shield = Math.max(0, shield - 20);
          document.getElementById('hud-shield').style.width = shield + '%';
          ast.position.z = -300;
          ast.position.x = (Math.random() - 0.5) * 35;
        }

        if (ast.position.z > 15) {
          ast.position.z = -300;
          ast.position.x = (Math.random() - 0.5) * 35;
          ast.position.y = (Math.random() - 0.5) * 25;
        }
      });

      for (let i = lasers.length - 1; i >= 0; i--) {
        const l = lasers[i];
        l.position.z -= 4.0;

        asteroids.forEach(ast => {
          if (l.position.distanceTo(ast.position) < 2.0) {
            ast.position.z = -300;
            ast.position.x = (Math.random() - 0.5) * 35;
            scene.remove(l);
            lasers.splice(i, 1);
            score += 100;
            document.getElementById('hud-score').innerText = score;
          }
        });

        if (l && l.position.z < -350) {
          scene.remove(l);
          lasers.splice(i, 1);
        }
      }

      renderer.render(scene, camera);
    }

    document.addEventListener('DOMContentLoaded', () => {
      lucide.createIcons();
      init();
    });
  </script>
</body>
</html>`
      }
    ]
  },

  // =========================================================================
  // 4. 👾 NEON RETRO 2D SPACE DEFENDER (HTML5 Canvas Arcade Game)
  // =========================================================================
  {
    id: 'neon-arcade-defender',
    name: '👾 Neon Retro 2D Space Defender',
    description: 'Juego arcade clásico en Canvas 2D a 60 FPS con naves invasoras, disparos continuos, explosiones de partículas y high-score',
    icon: 'Gamepad2',
    category: 'Arcade 2D',
    tags: ['Canvas 2D', 'Arcade', 'Retro', 'Físicas 2D'],
    badge: 'Arcade',
    files: [
      {
        id: '1',
        name: 'index.html',
        language: 'html',
        content: `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>Neon Retro Space Defender</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>body { margin: 0; overflow: hidden; background: #050510; } canvas { display: block; }</style>
</head>
<body class="select-none font-sans text-white">
  <canvas id="gameCanvas" class="w-screen h-screen"></canvas>

  <div class="absolute top-4 left-4 right-4 flex justify-between pointer-events-none z-10 text-xs font-mono">
    <div class="bg-slate-900/80 px-4 py-2 rounded-2xl border border-cyan-500/30">
      PUNTOS: <span id="score" class="font-bold text-cyan-400">0</span>
    </div>
    <div class="bg-slate-900/80 px-4 py-2 rounded-2xl border border-pink-500/30">
      VIDAS: <span id="lives" class="font-bold text-pink-400">❤️❤️❤️</span>
    </div>
  </div>

  <script>
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    let width, height;

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    let score = 0, lives = 3;
    let player = { x: width / 2, y: height - 80, size: 24, speed: 8 };
    let bullets = [], enemies = [], particles = [];
    let keys = {};

    window.addEventListener('keydown', e => keys[e.key] = true);
    window.addEventListener('keyup', e => keys[e.key] = false);

    window.addEventListener('pointermove', e => {
      player.x = e.clientX;
    });

    setInterval(() => {
      enemies.push({
        x: Math.random() * (width - 40) + 20,
        y: -30,
        size: 20 + Math.random() * 15,
        speed: 2 + Math.random() * 2.5
      });
    }, 900);

    function shoot() {
      bullets.push({ x: player.x, y: player.y - 15, speed: 12 });
    }
    setInterval(shoot, 220);

    function explode(x, y, color) {
      for (let i = 0; i < 16; i++) {
        particles.push({
          x, y,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8,
          life: 25,
          color
        });
      }
    }

    function loop() {
      requestAnimationFrame(loop);
      ctx.fillStyle = 'rgba(5, 5, 16, 0.25)';
      ctx.fillRect(0, 0, width, height);

      if (keys['ArrowLeft'] || keys['a']) player.x -= player.speed;
      if (keys['ArrowRight'] || keys['d']) player.x += player.speed;
      player.x = Math.max(player.size, Math.min(width - player.size, player.x));

      ctx.fillStyle = '#06b6d4';
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#06b6d4';
      ctx.beginPath();
      ctx.moveTo(player.x, player.y - 20);
      ctx.lineTo(player.x - 18, player.y + 15);
      ctx.lineTo(player.x + 18, player.y + 15);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#f43f5e';
      ctx.shadowColor = '#f43f5e';
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.y -= b.speed;
        ctx.fillRect(b.x - 2, b.y, 4, 12);
        if (b.y < -20) bullets.splice(i, 1);
      }

      ctx.fillStyle = '#a855f7';
      ctx.shadowColor = '#a855f7';
      for (let i = enemies.length - 1; i >= 0; i--) {
        const en = enemies[i];
        en.y += en.speed;
        ctx.beginPath();
        ctx.arc(en.x, en.y, en.size / 2, 0, Math.PI * 2);
        ctx.fill();

        for (let j = bullets.length - 1; j >= 0; j--) {
          const b = bullets[j];
          const dist = Math.hypot(b.x - en.x, b.y - en.y);
          if (dist < en.size / 2 + 5) {
            explode(en.x, en.y, '#c084fc');
            enemies.splice(i, 1);
            bullets.splice(j, 1);
            score += 25;
            document.getElementById('score').innerText = score;
            break;
          }
        }

        if (en.y > height + 40) enemies.splice(i, 1);
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 3, 3);
        if (p.life <= 0) particles.splice(i, 1);
      }
      ctx.shadowBlur = 0;
    }

    loop();
  </script>
</body>
</html>`
      }
    ]
  },

  // =========================================================================
  // 5. 📊 SAAS ENTERPRISE ANALYTICS & CRM DASHBOARD
  // =========================================================================
  {
    id: 'analytics-dashboard-pro',
    name: '📊 SaaS Enterprise Analytics & CRM',
    description: 'Dashboard ejecutivo B2B interactivo con gráficos Chart.js en tiempo real, KPIs financieros (MRR, LTV, CAC), tabla transaccional filtrable y exportación a CSV.',
    icon: 'BarChart3',
    category: 'SaaS / Dashboards',
    tags: ['Chart.js', 'FinTech', 'SaaS', 'Tailwind CSS', 'Export CSV'],
    badge: 'Enterprise',
    files: [
      {
        id: '1',
        name: 'index.html',
        language: 'html',
        content: SAAS_ANALYTICS_HTML
      }
    ]
  },

  // =========================================================================
  // 6. 🛍️ LUMEN PRO TECH STOREFRONT (Modern E-Commerce)
  // =========================================================================
  {
    id: 'ecommerce-store-pro',
    name: '🛍️ LUMEN Pro Tech Storefront',
    description: 'Tienda de tecnología premium estilo Apple con catálogo interactivo, filtrado por categorías, carrito lateral deslizante, cupón de descuento y pasarela de pago simulada.',
    icon: 'ShoppingBag',
    category: 'E-Commerce',
    tags: ['E-Commerce', 'Carrito Deslizante', 'Checkout', 'Cupones', 'Tailwind CSS'],
    badge: 'Popular',
    files: [
      {
        id: '1',
        name: 'index.html',
        language: 'html',
        content: ECOMMERCE_STORE_HTML
      }
    ]
  },

  // =========================================================================
  // 7. 📋 LINEARFLOW KANBAN PRO (Agile Project Management)
  // =========================================================================
  {
    id: 'linear-kanban-flow',
    name: '📋 LinearFlow - Tablero Ágil & Kanban',
    description: 'Gestor de proyectos moderno estilo Linear con arrastrar y soltar (Drag & Drop), creación de tareas modales, filtros por prioridad y cálculo dinámico de métricas de sprint.',
    icon: 'Kanban',
    category: 'Productividad',
    tags: ['Kanban', 'Drag & Drop', 'Gestión Ágil', 'Linear Style', 'Productividad'],
    badge: 'Nuevo',
    files: [
      {
        id: '1',
        name: 'index.html',
        language: 'html',
        content: KANBAN_HTML
      }
    ]
  },

  // =========================================================================
  // 8. 📱 PULSE IOS HEALTH & FITNESS (Apple-Style Mobile App)
  // =========================================================================
  {
    id: 'mobile-fitness-ios',
    name: '📱 Pulse iOS - Salud & Fitness Hub',
    description: 'App de salud móvil con marco iPhone 15 Pro, Dynamic Island interactiva, anillos concéntricos de actividad estilo Apple Watch, monitor de ritmo cardíaco y registro de hidratación.',
    icon: 'Smartphone',
    category: 'Móvil iOS',
    tags: ['iOS 18', 'iPhone 15 Frame', 'Activity Rings', 'Fitness', 'Apple Watch Style'],
    badge: 'Mobile Pro',
    files: [
      {
        id: '1',
        name: 'index.html',
        language: 'html',
        content: MOBILE_IOS_HTML
      }
    ]
  },
  // =========================================================================
  // 9. 🐾 TAMAGOTCHI VIRTUAL PET PRO
  // =========================================================================
  {
    id: 'tamagotchi-pro',
    name: '🐾 Mascota Virtual Pulpo Pro',
    description: 'Criatura interactiva animada con estadísticas de hambre, energía y diversión, mini-juegos y sonidos',
    icon: 'HeartHandshake',
    category: 'Juegos & Mascotas',
    tags: ['Animación', 'Virtual Pet', 'Audio Synth', 'Casual'],
    badge: 'Fun',
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
  <title>Mascota Virtual</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    @keyframes floatPet { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-12px) scale(1.05); } }
    .pet-floating { animation: floatPet 2.5s ease-in-out infinite; }
  </style>
</head>
<body class="bg-slate-950 text-white min-h-screen flex items-center justify-center p-4">
  <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-6">
    <div class="flex justify-between items-center border-b border-slate-800 pb-3">
      <span class="font-bold text-sm">PULPO VIRTUAL</span>
      <span class="text-xs bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full font-bold">NIVEL 1</span>
    </div>
    <div class="h-48 bg-slate-950 rounded-2xl flex items-center justify-center relative cursor-pointer" onclick="petClick()">
      <div id="pet" class="pet-floating text-7xl">🐙</div>
      <div id="speech" class="absolute top-3 bg-slate-800 text-xs px-3 py-1 rounded-full font-semibold">¡Hola! Cuídame bien</div>
    </div>
    <div class="space-y-3">
      <div>
        <div class="flex justify-between text-xs mb-1"><span>Hambre</span><span id="hVal">80%</span></div>
        <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden"><div id="hBar" class="bg-amber-400 h-full" style="width: 80%"></div></div>
      </div>
      <div>
        <div class="flex justify-between text-xs mb-1"><span>Energía</span><span id="eVal">90%</span></div>
        <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden"><div id="eBar" class="bg-emerald-400 h-full" style="width: 90%"></div></div>
      </div>
    </div>
    <div class="grid grid-cols-2 gap-3">
      <button onclick="feed()" class="p-3 bg-slate-800 hover:bg-amber-500/20 rounded-2xl text-xs font-bold text-amber-300 border border-slate-700 cursor-pointer">Alimentar 🍕</button>
      <button onclick="sleep()" class="p-3 bg-slate-800 hover:bg-emerald-500/20 rounded-2xl text-xs font-bold text-emerald-300 border border-slate-700 cursor-pointer">Dormir 💤</button>
    </div>
  </div>
  <script>
    let hunger = 80, energy = 90;
    function feed() { hunger = Math.min(100, hunger + 20); update(); say('¡Qué rico!'); }
    function sleep() { energy = 100; update(); say('Zzz... descansado'); }
    function petClick() { say('¡Te quiero humano! 💖'); }
    function say(t) { document.getElementById('speech').innerText = t; }
    function update() {
      document.getElementById('hBar').style.width = hunger + '%';
      document.getElementById('hVal').innerText = hunger + '%';
      document.getElementById('eBar').style.width = energy + '%';
      document.getElementById('eVal').innerText = energy + '%';
    }
  </script>
</body>
</html>`
      }
    ]
  }
];
