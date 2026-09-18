export const MOBILE_IOS_HTML = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pulse iOS - Health & Fitness</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    body { background: #07090e; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", Roboto, sans-serif; }
    .iphone-frame {
      width: 385px;
      height: 780px;
      border-radius: 48px;
      box-shadow: 0 0 0 10px #1e2538, 0 0 0 12px #2f3854, 0 25px 60px -15px rgba(0,0,0,0.9);
      position: relative;
      overflow: hidden;
      background: #000000;
    }
    .dynamic-island {
      width: 110px;
      height: 28px;
      background: #000;
      border-radius: 20px;
      position: absolute;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 50;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .ring-circle {
      transition: stroke-dashoffset 1s ease-in-out;
      transform: rotate(-90deg);
      transform-origin: 50% 50%;
    }
    .pulse-glow {
      animation: pulseAnim 1.6s infinite ease-in-out;
    }
    @keyframes pulseAnim {
      0% { transform: scale(1); opacity: 0.9; }
      50% { transform: scale(1.08); opacity: 1; filter: drop-shadow(0 0 8px #fa114f); }
      100% { transform: scale(1); opacity: 0.9; }
    }
    ::-webkit-scrollbar { width: 0; height: 0; }
  </style>
</head>
<body class="min-h-screen text-white flex flex-col items-center justify-center p-4 select-none">

  <!-- Desktop Control Header -->
  <div class="mb-4 flex items-center gap-3">
    <div class="flex items-center gap-2">
      <span class="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
      <span class="text-xs font-bold uppercase tracking-wider text-slate-300">Pulse Health Pro iOS</span>
    </div>
    <div class="h-4 w-px bg-slate-800"></div>
    <button onclick="toggleDeviceFrame()" id="frameToggleBtn" class="text-xs px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors cursor-pointer">
      Alternar Modo Teléfono / Pantalla Completa
    </button>
  </div>

  <!-- Device Container -->
  <div id="deviceContainer" class="iphone-frame flex flex-col">
    <!-- Dynamic Island -->
    <div class="dynamic-island flex items-center justify-between px-2.5">
      <div class="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800"></div>
      <div class="flex items-center gap-1">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        <span class="text-[9px] font-mono text-emerald-400 font-bold">LIVE</span>
      </div>
    </div>

    <!-- iOS Status Bar -->
    <div class="pt-3 px-6 flex justify-between items-center text-[12px] font-semibold text-white z-40">
      <span id="statusBarTime">9:41</span>
      <div class="flex items-center gap-1.5">
        <i data-lucide="signal" class="w-3.5 h-3.5"></i>
        <i data-lucide="wifi" class="w-3.5 h-3.5"></i>
        <i data-lucide="battery-medium" class="w-4 h-4 text-emerald-400"></i>
      </div>
    </div>

    <!-- App Content Scrollable -->
    <div class="flex-1 overflow-y-auto px-5 pt-3 pb-20 space-y-4">

      <!-- Greeting & Avatar -->
      <div class="flex items-center justify-between">
        <div>
          <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Hoy, 18 Septiembre</span>
          <h2 class="text-xl font-black text-white">Resumen Diario</h2>
        </div>
        <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 p-0.5 shadow-lg shadow-rose-500/20">
          <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=face" class="w-full h-full rounded-full object-cover" alt="User">
        </div>
      </div>

      <!-- Concentric Activity Rings Card -->
      <div class="bg-gradient-to-b from-slate-900/90 to-slate-950 p-4 rounded-3xl border border-slate-800/80 shadow-2xl relative overflow-hidden">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-bold text-slate-300">Anillos de Actividad</span>
          <span class="text-[10px] text-slate-500 font-mono">Objetivo: 85%</span>
        </div>

        <div class="flex items-center justify-between gap-4">
          <!-- SVG Rings -->
          <div class="relative w-36 h-36 shrink-0 flex items-center justify-center">
            <svg class="w-full h-full" viewBox="0 0 140 140">
              <!-- Background Tracks -->
              <circle cx="70" cy="70" r="54" fill="none" stroke="#2a101b" stroke-width="11" />
              <circle cx="70" cy="70" r="40" fill="none" stroke="#0e2a1e" stroke-width="11" />
              <circle cx="70" cy="70" r="26" fill="none" stroke="#0e2633" stroke-width="11" />

              <!-- Outer: Move (Red) -->
              <circle id="ringMove" class="ring-circle" cx="70" cy="70" r="54" fill="none" stroke="#fa114f" stroke-width="11" stroke-linecap="round" stroke-dasharray="339.29" stroke-dashoffset="67" />
              <!-- Middle: Exercise (Green) -->
              <circle id="ringExercise" class="ring-circle" cx="70" cy="70" r="40" fill="none" stroke="#a1ff00" stroke-width="11" stroke-linecap="round" stroke-dasharray="251.32" stroke-dashoffset="50" />
              <!-- Inner: Stand (Cyan) -->
              <circle id="ringStand" class="ring-circle" cx="70" cy="70" r="26" fill="none" stroke="#00f0ff" stroke-width="11" stroke-linecap="round" stroke-dasharray="163.36" stroke-dashoffset="32" />
            </svg>
            <i data-lucide="flame" class="w-5 h-5 text-rose-500 absolute"></i>
          </div>

          <!-- Ring Legends -->
          <div class="flex-1 space-y-2 text-xs">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-full bg-[#fa114f]"></span>
                <span class="text-slate-400 font-medium text-[11px]">Moverse</span>
              </div>
              <span class="font-bold font-mono text-white text-[11px]">580/650 <span class="text-[9px] text-slate-500">cal</span></span>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-full bg-[#a1ff00]"></span>
                <span class="text-slate-400 font-medium text-[11px]">Ejercicio</span>
              </div>
              <span class="font-bold font-mono text-white text-[11px]">34/30 <span class="text-[9px] text-emerald-400">min</span></span>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-full bg-[#00f0ff]"></span>
                <span class="text-slate-400 font-medium text-[11px]">De pie</span>
              </div>
              <span class="font-bold font-mono text-white text-[11px]">10/12 <span class="text-[9px] text-slate-500">hrs</span></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Metrics Grid -->
      <div class="grid grid-cols-2 gap-3">
        <!-- Heart Rate Monitor Card -->
        <div class="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div class="flex items-center justify-between mb-2">
            <span class="text-[11px] font-semibold text-slate-400">Ritmo Cardíaco</span>
            <i data-lucide="heart" class="w-4 h-4 text-rose-500 fill-rose-500 pulse-glow"></i>
          </div>
          <div>
            <div class="flex items-baseline gap-1">
              <span id="heartRateVal" class="text-2xl font-black font-mono text-white">74</span>
              <span class="text-[10px] text-slate-400 font-bold">LPM</span>
            </div>
            <span class="text-[9px] text-emerald-400 font-semibold flex items-center gap-0.5">
              <i data-lucide="activity" class="w-2.5 h-2.5"></i> Ritmo sinusal normal
            </span>
          </div>
        </div>

        <!-- Steps Card -->
        <div class="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div class="flex items-center justify-between mb-2">
            <span class="text-[11px] font-semibold text-slate-400">Pasos Hoy</span>
            <i data-lucide="footprints" class="w-4 h-4 text-cyan-400"></i>
          </div>
          <div>
            <div class="flex items-baseline gap-1">
              <span id="stepsVal" class="text-2xl font-black font-mono text-white">8,420</span>
              <span class="text-[10px] text-slate-400 font-bold">/10k</span>
            </div>
            <span class="text-[9px] text-cyan-400 font-semibold">6.2 km recorridos</span>
          </div>
        </div>
      </div>

      <!-- Hydration Logger -->
      <div class="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-2">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="p-1.5 bg-sky-500/20 text-sky-400 rounded-lg">
              <i data-lucide="droplet" class="w-4 h-4"></i>
            </div>
            <div>
              <h3 class="text-xs font-bold text-white">Hidratación Diaria</h3>
              <p class="text-[10px] text-slate-400"><span id="waterVal">1,750</span> ml de 2,500 ml</p>
            </div>
          </div>
          <button onclick="addWater(250)" class="px-2.5 py-1 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-xs font-bold border border-sky-500/30 transition-colors cursor-pointer active:scale-95">
            +250 ml
          </button>
        </div>
        <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
          <div id="waterBar" class="bg-sky-400 h-full w-[70%] transition-all duration-300"></div>
        </div>
      </div>

      <!-- Workout Session Launcher -->
      <div class="bg-gradient-to-r from-rose-950/60 to-purple-950/60 p-4 rounded-2xl border border-rose-500/20 flex items-center justify-between">
        <div>
          <span class="text-[9px] font-bold text-rose-400 uppercase tracking-wider">Entrenamiento Rápido</span>
          <h4 class="text-xs font-bold text-white">Carrera al Aire Libre</h4>
          <span class="text-[10px] text-slate-400">GPS & Ritmo activado</span>
        </div>
        <button id="btnWorkout" onclick="toggleWorkout()" class="px-3.5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-black text-xs shadow-lg shadow-rose-500/30 transition-all cursor-pointer active:scale-95">
          INICIAR
        </button>
      </div>

    </div>

    <!-- iOS Tab Bar -->
    <div class="absolute bottom-0 left-0 right-0 h-16 bg-slate-950/90 backdrop-blur-md border-t border-slate-800 flex items-center justify-around px-2 z-40">
      <button class="flex flex-col items-center gap-1 text-rose-500">
        <i data-lucide="layout-grid" class="w-4 h-4"></i>
        <span class="text-[9px] font-bold">Resumen</span>
      </button>
      <button class="flex flex-col items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors">
        <i data-lucide="flame" class="w-4 h-4"></i>
        <span class="text-[9px] font-bold">Actividad</span>
      </button>
      <button class="flex flex-col items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors">
        <i data-lucide="heart-pulse" class="w-4 h-4"></i>
        <span class="text-[9px] font-bold">Salud</span>
      </button>
      <button class="flex flex-col items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors">
        <i data-lucide="user" class="w-4 h-4"></i>
        <span class="text-[9px] font-bold">Perfil</span>
      </button>
    </div>

    <!-- Home Indicator -->
    <div class="w-32 h-1 bg-slate-500/60 rounded-full absolute bottom-1.5 left-1/2 -translate-x-1/2 z-50"></div>
  </div>

  <script>
    let waterMl = 1750;
    const waterGoal = 2500;
    let isWorkoutActive = false;
    let workoutTimer = null;
    let workoutSeconds = 0;
    let isDeviceFrame = true;

    function addWater(amount) {
      waterMl = Math.min(waterGoal, waterMl + amount);
      document.getElementById('waterVal').innerText = waterMl.toLocaleString();
      const pct = Math.round((waterMl / waterGoal) * 100);
      document.getElementById('waterBar').style.width = pct + '%';
    }

    function toggleWorkout() {
      isWorkoutActive = !isWorkoutActive;
      const btn = document.getElementById('btnWorkout');
      if (isWorkoutActive) {
        btn.innerText = "DETENER";
        btn.classList.replace('bg-rose-500', 'bg-amber-400');
        workoutTimer = setInterval(() => {
          workoutSeconds++;
          // simulate step count increment
          const stepsEl = document.getElementById('stepsVal');
          if (stepsEl) {
            let cur = parseInt(stepsEl.innerText.replace(',', ''), 10);
            stepsEl.innerText = (cur + 2).toLocaleString();
          }
        }, 1000);
      } else {
        btn.innerText = "INICIAR";
        btn.classList.replace('bg-amber-400', 'bg-rose-500');
        if (workoutTimer) clearInterval(workoutTimer);
      }
    }

    function toggleDeviceFrame() {
      const container = document.getElementById('deviceContainer');
      const btn = document.getElementById('frameToggleBtn');
      isDeviceFrame = !isDeviceFrame;
      if (!isDeviceFrame) {
        container.classList.remove('iphone-frame');
        container.classList.add('w-full', 'max-w-2xl', 'h-[800px]', 'rounded-3xl', 'border', 'border-slate-800');
        btn.innerText = "Ver como iPhone 15";
      } else {
        container.classList.remove('w-full', 'max-w-2xl', 'h-[800px]', 'rounded-3xl', 'border', 'border-slate-800');
        container.classList.add('iphone-frame');
        btn.innerText = "Alternar Modo Teléfono / Pantalla Completa";
      }
    }

    // Dynamic live heart rate variation
    setInterval(() => {
      const hrEl = document.getElementById('heartRateVal');
      if (hrEl) {
        const base = isWorkoutActive ? 135 : 72;
        const jitter = Math.floor(Math.random() * 7) - 3;
        hrEl.innerText = base + jitter;
      }
    }, 2500);

    // Update real device time
    function updateClock() {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const clockEl = document.getElementById('statusBarTime');
      if (clockEl) clockEl.innerText = timeStr;
    }

    window.addEventListener('DOMContentLoaded', () => {
      lucide.createIcons();
      updateClock();
      setInterval(updateClock, 10000);
    });
  </script>
</body>
</html>`;
