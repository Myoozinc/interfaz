/**
 * templatesRetroCalculator.ts
 * Calculadora Científica Retro Profesional y Funcional (Casio / TI Vintage Style)
 * Desarrollada con Web Audio API para retroalimentación táctil, display VFD/LCD de doble línea,
 * soporte trigonométrico (DEG/RAD), memoria M+/MR/MC, historial en vivo y atajos de teclado.
 */

export const RETRO_CALCULATOR_HTML = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Calculadora Científica Retro — NONA Vintage Edition</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=VT323&display=swap" rel="stylesheet">
  <style>
    body {
      background: radial-gradient(circle at 50% 20%, #1e293b, #0f172a 70%, #020617);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: system-ui, -apple-system, sans-serif;
      user-select: none;
      margin: 0;
      padding: 16px;
    }

    .retro-font-lcd {
      font-family: 'Share Tech Mono', monospace;
    }

    .retro-font-vfd {
      font-family: 'VT323', monospace;
    }

    /* Screen themes */
    .screen-green {
      background: #062b19;
      color: #34d399;
      border-color: #059669;
      box-shadow: inset 0 0 18px rgba(16, 185, 129, 0.25), 0 0 10px rgba(16, 185, 129, 0.15);
      text-shadow: 0 0 8px rgba(52, 211, 153, 0.6);
    }
    .screen-amber {
      background: #2b1803;
      color: #fbbf24;
      border-color: #d97706;
      box-shadow: inset 0 0 18px rgba(245, 158, 11, 0.25), 0 0 10px rgba(245, 158, 11, 0.15);
      text-shadow: 0 0 8px rgba(251, 191, 36, 0.6);
    }
    .screen-cyan {
      background: #04242e;
      color: #38bdf8;
      border-color: #0284c7;
      box-shadow: inset 0 0 18px rgba(14, 165, 233, 0.25), 0 0 10px rgba(14, 165, 233, 0.15);
      text-shadow: 0 0 8px rgba(56, 189, 248, 0.6);
    }
    .screen-classic {
      background: #8b9c8b;
      color: #1a291a;
      border-color: #5b6e5b;
      box-shadow: inset 0 0 12px rgba(0,0,0,0.3);
      text-shadow: 1px 1px 0 rgba(255, 255, 255, 0.2);
    }

    /* Bezel scanlines effect */
    .scanlines {
      background: linear-gradient(
        rgba(18, 16, 16, 0) 50%, 
        rgba(0, 0, 0, 0.25) 50%
      ), linear-gradient(
        90deg,
        rgba(255, 0, 0, 0.03),
        rgba(0, 255, 0, 0.01),
        rgba(0, 0, 255, 0.03)
      );
      background-size: 100% 3px, 6px 100%;
    }

    /* Beveled 3D buttons */
    .btn-key {
      position: relative;
      transition: all 0.05s ease-in-out;
      box-shadow: 0 4px 0 #0f172a, 0 6px 6px rgba(0,0,0,0.4);
    }
    .btn-key:active {
      top: 3px;
      box-shadow: 0 1px 0 #0f172a, 0 2px 2px rgba(0,0,0,0.3);
    }
  </style>
</head>
<body>

  <!-- CALCULATOR CONTAINER -->
  <div class="relative w-full max-w-[440px] bg-gradient-to-b from-slate-800 via-slate-900 to-black p-5 sm:p-6 rounded-3xl border-2 border-slate-700/80 shadow-[0_25px_60px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.15)] flex flex-col gap-4">
    
    <!-- SOLAR PANEL & BRAND HEADER -->
    <div class="flex items-center justify-between px-1">
      <div class="flex flex-col">
        <span class="text-xs font-black tracking-widest text-slate-300 flex items-center gap-1">
          <span class="text-amber-400">NONA</span> SCIENTIFIC
        </span>
        <span class="text-[9px] tracking-wider text-slate-500 font-mono font-bold">FX-991 RETRO PRO</span>
      </div>

      <!-- FAUX SOLAR CELL -->
      <div class="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 rounded-lg border border-amber-700/50 shadow-inner">
        <div class="w-2.5 h-4 bg-amber-900/60 border-r border-amber-950/80"></div>
        <div class="w-2.5 h-4 bg-amber-900/60 border-r border-amber-950/80"></div>
        <div class="w-2.5 h-4 bg-amber-900/60 border-r border-amber-950/80"></div>
        <div class="w-2.5 h-4 bg-amber-900/60"></div>
        <span class="text-[8px] text-amber-500/80 font-mono ml-1 font-bold">SOLAR</span>
      </div>

      <!-- SOUND & THEME TOGGLES -->
      <div class="flex items-center gap-1.5">
        <button id="soundToggleBtn" title="Sonido Mecánico" class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 text-xs">
          🔊
        </button>
        <button id="themeToggleBtn" title="Cambiar Fósforo / Pantalla" class="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-600 text-[10px] font-mono font-bold">
          CRT
        </button>
      </div>
    </div>

    <!-- DUAL-LINE RETRO DISPLAY -->
    <div id="calculatorScreen" class="screen-green scanlines relative p-4 rounded-2xl border-2 flex flex-col justify-between h-28 overflow-hidden transition-all duration-300">
      
      <!-- INDICATORS BAR -->
      <div class="flex items-center justify-between text-[11px] font-bold tracking-wider retro-font-lcd opacity-85">
        <div class="flex items-center gap-2">
          <span id="degRadBadge" class="px-1 rounded bg-black/30 border border-current">DEG</span>
          <span id="shiftBadge" class="hidden px-1 rounded bg-amber-500 text-black">2nd</span>
          <span id="memBadge" class="hidden px-1 rounded bg-black/30">M</span>
        </div>
        <div class="flex items-center gap-1.5 text-[10px]">
          <span>STAT</span>
          <span>MATH</span>
        </div>
      </div>

      <!-- FORMULA / EXPRESSION LINE -->
      <div id="expressionDisplay" class="text-right text-sm retro-font-lcd tracking-wider overflow-x-auto whitespace-nowrap opacity-75 min-h-[20px] scrollbar-none">
        0
      </div>

      <!-- MAIN BIG NUMBER DISPLAY -->
      <div id="mainDisplay" class="text-right text-3xl sm:text-4xl font-bold retro-font-lcd tracking-wider overflow-x-auto whitespace-nowrap scrollbar-none">
        0
      </div>
    </div>

    <!-- QUICK SYSTEM TOGGLES (DEG/RAD, 2nd, SHIFT, HISTORY) -->
    <div class="grid grid-cols-4 gap-2 text-xs font-bold">
      <button id="btnDegRad" class="btn-key py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-[11px] font-mono">
        DEG / RAD
      </button>
      <button id="btnShift" class="btn-key py-1.5 rounded-xl bg-amber-900/40 hover:bg-amber-800/60 text-amber-300 border border-amber-600/40 text-[11px] font-mono">
        2nd (INV)
      </button>
      <button id="btnHistoryToggle" class="btn-key py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 text-[11px] font-mono">
        📜 HIST
      </button>
      <button id="btnCopyAns" class="btn-key py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 border border-slate-700 text-[11px] font-mono">
        📋 COPIAR
      </button>
    </div>

    <!-- SCIENTIFIC BUTTONS GRID (ROW 1: MEMORY & CONSTANTS) -->
    <div class="grid grid-cols-5 gap-1.5 sm:gap-2 text-[11px] font-bold font-mono">
      <button onclick="handleMemory('mc')" class="btn-key py-2 rounded-xl bg-slate-800/90 text-rose-300 hover:bg-slate-700 border border-slate-700">MC</button>
      <button onclick="handleMemory('mr')" class="btn-key py-2 rounded-xl bg-slate-800/90 text-rose-300 hover:bg-slate-700 border border-slate-700">MR</button>
      <button onclick="handleMemory('m-plus')" class="btn-key py-2 rounded-xl bg-slate-800/90 text-rose-300 hover:bg-slate-700 border border-slate-700">M+</button>
      <button onclick="handleMemory('m-minus')" class="btn-key py-2 rounded-xl bg-slate-800/90 text-rose-300 hover:bg-slate-700 border border-slate-700">M-</button>
      <button onclick="insertFunc('(')" class="btn-key py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700">(</button>
    </div>

    <!-- SCIENTIFIC FUNCTIONS (ROW 2: TRIGONOMETRY) -->
    <div class="grid grid-cols-5 gap-1.5 sm:gap-2 text-[11px] font-bold font-mono">
      <button id="btnSin" onclick="insertTrig('sin')" class="btn-key py-2 rounded-xl bg-slate-800/90 text-cyan-200 hover:bg-slate-700 border border-slate-700">sin</button>
      <button id="btnCos" onclick="insertTrig('cos')" class="btn-key py-2 rounded-xl bg-slate-800/90 text-cyan-200 hover:bg-slate-700 border border-slate-700">cos</button>
      <button id="btnTan" onclick="insertTrig('tan')" class="btn-key py-2 rounded-xl bg-slate-800/90 text-cyan-200 hover:bg-slate-700 border border-slate-700">tan</button>
      <button onclick="insertFunc('π')" class="btn-key py-2 rounded-xl bg-slate-800 text-amber-200 hover:bg-slate-700 border border-slate-700">π</button>
      <button onclick="insertFunc(')')" class="btn-key py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700">)</button>
    </div>

    <!-- SCIENTIFIC FUNCTIONS (ROW 3: POWERS & LOGARITHMS) -->
    <div class="grid grid-cols-5 gap-1.5 sm:gap-2 text-[11px] font-bold font-mono">
      <button onclick="insertOp('^2')" class="btn-key py-2 rounded-xl bg-slate-800/90 text-cyan-200 hover:bg-slate-700 border border-slate-700">x²</button>
      <button onclick="insertOp('^')" class="btn-key py-2 rounded-xl bg-slate-800/90 text-cyan-200 hover:bg-slate-700 border border-slate-700">xʸ</button>
      <button onclick="insertFunc('sqrt(')" class="btn-key py-2 rounded-xl bg-slate-800/90 text-cyan-200 hover:bg-slate-700 border border-slate-700">√x</button>
      <button onclick="insertFunc('log(')" class="btn-key py-2 rounded-xl bg-slate-800/90 text-cyan-200 hover:bg-slate-700 border border-slate-700">log</button>
      <button onclick="insertFunc('ln(')" class="btn-key py-2 rounded-xl bg-slate-800/90 text-cyan-200 hover:bg-slate-700 border border-slate-700">ln</button>
    </div>

    <!-- SCIENTIFIC FUNCTIONS (ROW 4: SPECIALS & CONSTANTS) -->
    <div class="grid grid-cols-5 gap-1.5 sm:gap-2 text-[11px] font-bold font-mono">
      <button onclick="insertOp('!')" class="btn-key py-2 rounded-xl bg-slate-800/90 text-cyan-200 hover:bg-slate-700 border border-slate-700">x!</button>
      <button onclick="insertOp('inv')" class="btn-key py-2 rounded-xl bg-slate-800/90 text-cyan-200 hover:bg-slate-700 border border-slate-700">1/x</button>
      <button onclick="insertFunc('e')" class="btn-key py-2 rounded-xl bg-slate-800 text-amber-200 hover:bg-slate-700 border border-slate-700">e</button>
      <button onclick="insertFunc('10^(')" class="btn-key py-2 rounded-xl bg-slate-800/90 text-cyan-200 hover:bg-slate-700 border border-slate-700">10ˣ</button>
      <button onclick="insertFunc('%')" class="btn-key py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700">%</button>
    </div>

    <!-- MAIN NUMERIC & OPERATOR KEYPAD (STANDARD 4x5) -->
    <div class="grid grid-cols-4 gap-2 pt-2 border-t border-slate-700/60 font-mono text-base font-bold">
      <!-- ROW 1 -->
      <button onclick="handleClearAll()" class="btn-key py-3.5 rounded-2xl bg-rose-900/80 hover:bg-rose-800 text-rose-200 border border-rose-600/50">
        AC
      </button>
      <button onclick="handleDelete()" class="btn-key py-3.5 rounded-2xl bg-amber-900/70 hover:bg-amber-800 text-amber-200 border border-amber-600/50">
        DEL
      </button>
      <button onclick="insertOp('+/-')" class="btn-key py-3.5 rounded-2xl bg-slate-700/80 hover:bg-slate-600 text-slate-200 border border-slate-600">
        ±
      </button>
      <button onclick="insertOp('/')" class="btn-key py-3.5 rounded-2xl bg-indigo-900/80 hover:bg-indigo-800 text-indigo-200 border border-indigo-600/50">
        ÷
      </button>

      <!-- ROW 2 -->
      <button onclick="insertDigit('7')" class="btn-key py-3.5 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700 text-lg">7</button>
      <button onclick="insertDigit('8')" class="btn-key py-3.5 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700 text-lg">8</button>
      <button onclick="insertDigit('9')" class="btn-key py-3.5 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700 text-lg">9</button>
      <button onclick="insertOp('*')" class="btn-key py-3.5 rounded-2xl bg-indigo-900/80 hover:bg-indigo-800 text-indigo-200 border border-indigo-600/50">×</button>

      <!-- ROW 3 -->
      <button onclick="insertDigit('4')" class="btn-key py-3.5 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700 text-lg">4</button>
      <button onclick="insertDigit('5')" class="btn-key py-3.5 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700 text-lg">5</button>
      <button onclick="insertDigit('6')" class="btn-key py-3.5 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700 text-lg">6</button>
      <button onclick="insertOp('-')" class="btn-key py-3.5 rounded-2xl bg-indigo-900/80 hover:bg-indigo-800 text-indigo-200 border border-indigo-600/50">−</button>

      <!-- ROW 4 -->
      <button onclick="insertDigit('1')" class="btn-key py-3.5 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700 text-lg">1</button>
      <button onclick="insertDigit('2')" class="btn-key py-3.5 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700 text-lg">2</button>
      <button onclick="insertDigit('3')" class="btn-key py-3.5 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700 text-lg">3</button>
      <button onclick="insertOp('+')" class="btn-key py-3.5 rounded-2xl bg-indigo-900/80 hover:bg-indigo-800 text-indigo-200 border border-indigo-600/50">+</button>

      <!-- ROW 5 -->
      <button onclick="insertDigit('0')" class="btn-key py-3.5 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700 text-lg">0</button>
      <button onclick="insertDecimal()" class="btn-key py-3.5 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700 text-lg">.</button>
      <button onclick="insertAns()" class="btn-key py-3.5 rounded-2xl bg-slate-700/80 hover:bg-slate-600 text-amber-300 border border-slate-600 text-sm">Ans</button>
      <button onclick="handleCalculate()" class="btn-key py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-emerald-950 font-black border border-emerald-400 text-xl shadow-[0_4px_0_#065f46]">
        =
      </button>
    </div>

    <!-- FOOTER STATUS -->
    <div class="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1">
      <span>Teclado PC compatible (0-9, +, -, *, /, Enter, Esc)</span>
      <span class="text-slate-400">NONA Engine v2.6</span>
    </div>

    <!-- COLLAPSIBLE HISTORY DRAWER -->
    <div id="historyDrawer" class="hidden absolute inset-x-5 bottom-5 top-20 bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-700 p-4 flex flex-col z-20 shadow-2xl">
      <div class="flex items-center justify-between pb-3 border-b border-slate-800">
        <h3 class="text-sm font-bold text-slate-200 flex items-center gap-1.5">
          <span>📜</span> Bitácora de Cálculos
        </h3>
        <button onclick="toggleHistory()" class="text-slate-400 hover:text-white p-1">✕</button>
      </div>

      <div id="historyList" class="flex-1 overflow-y-auto py-2 flex flex-col gap-2 font-mono text-xs">
        <div class="text-slate-500 text-center py-8">No hay cálculos registrados aún.</div>
      </div>

      <div class="pt-2 border-t border-slate-800 flex justify-end">
        <button onclick="clearHistory()" class="text-[11px] text-rose-400 hover:text-rose-300 font-bold px-3 py-1 rounded bg-rose-950/40 border border-rose-800">
          Borrar Historial
        </button>
      </div>
    </div>

  </div>

  <!-- JAVASCRIPT SCIENTIFIC ENGINE -->
  <script>
    // State variables
    let currentExpression = '';
    let lastResult = '0';
    let isDegreeMode = true; // true = DEG, false = RAD
    let isShiftMode = false;
    let memoryValue = 0;
    let soundEnabled = true;
    let currentThemeIndex = 0;
    const themes = ['screen-green', 'screen-amber', 'screen-cyan', 'screen-classic'];
    const themeLabels = ['CRT VFD', 'AMBER', 'CYAN', 'LCD CLASSIC'];
    const history = [];

    // Web Audio Synthesizer for Mechanical Clicks
    let audioCtx = null;
    function playClickSound(frequency = 750, duration = 0.02) {
      if (!soundEnabled) return;
      try {
        if (!audioCtx) {
          audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
          audioCtx.resume();
        }
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + duration);

        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + duration);
      } catch (e) {}
    }

    // UI Updates
    function updateDisplay(mainVal, exprVal) {
      const mainEl = document.getElementById('mainDisplay');
      const exprEl = document.getElementById('expressionDisplay');
      
      mainEl.textContent = mainVal || '0';
      exprEl.textContent = exprVal !== undefined ? exprVal : (currentExpression || '0');

      // Update memory indicator
      const memBadge = document.getElementById('memBadge');
      if (memoryValue !== 0) {
        memBadge.classList.remove('hidden');
      } else {
        memBadge.classList.add('hidden');
      }
    }

    // Input handlers
    function insertDigit(digit) {
      playClickSound(800);
      if (currentExpression === '0' || currentExpression === 'Error') {
        currentExpression = digit;
      } else {
        currentExpression += digit;
      }
      updateDisplay(currentExpression);
    }

    function insertDecimal() {
      playClickSound(700);
      if (!currentExpression || currentExpression === 'Error') {
        currentExpression = '0.';
      } else if (!currentExpression.endsWith('.')) {
        currentExpression += '.';
      }
      updateDisplay(currentExpression);
    }

    function insertOp(op) {
      playClickSound(650);
      if (currentExpression === 'Error') currentExpression = '0';

      if (op === '+/-') {
        if (currentExpression.startsWith('-')) {
          currentExpression = currentExpression.slice(1);
        } else if (currentExpression !== '0') {
          currentExpression = '-' + currentExpression;
        }
        updateDisplay(currentExpression);
        return;
      }

      if (op === 'inv') {
        currentExpression = '1/(' + (currentExpression || '0') + ')';
        updateDisplay(currentExpression);
        return;
      }

      if (op === '!') {
        currentExpression += '!';
        updateDisplay(currentExpression);
        return;
      }

      currentExpression += op;
      updateDisplay(currentExpression);
    }

    function insertFunc(func) {
      playClickSound(720);
      if (currentExpression === '0' || currentExpression === 'Error') {
        currentExpression = func;
      } else {
        currentExpression += func;
      }
      updateDisplay(currentExpression);
    }

    function insertTrig(trig) {
      playClickSound(720);
      const func = isShiftMode ? ('a' + trig + '(') : (trig + '(');
      if (currentExpression === '0' || currentExpression === 'Error') {
        currentExpression = func;
      } else {
        currentExpression += func;
      }
      if (isShiftMode) {
        toggleShift();
      }
      updateDisplay(currentExpression);
    }

    function insertAns() {
      playClickSound(750);
      if (currentExpression === '0' || currentExpression === 'Error') {
        currentExpression = lastResult;
      } else {
        currentExpression += lastResult;
      }
      updateDisplay(currentExpression);
    }

    function handleDelete() {
      playClickSound(500);
      if (currentExpression.length > 0 && currentExpression !== 'Error') {
        currentExpression = currentExpression.slice(0, -1);
      }
      if (!currentExpression) currentExpression = '0';
      updateDisplay(currentExpression);
    }

    function handleClearAll() {
      playClickSound(400);
      currentExpression = '';
      updateDisplay('0', '0');
    }

    // Scientific Evaluation Engine
    function factorial(n) {
      if (n < 0 || Math.floor(n) !== n) return NaN;
      if (n === 0 || n === 1) return 1;
      let res = 1;
      for (let i = 2; i <= n; i++) res *= i;
      return res;
    }

    function sanitizeForEval(expr) {
      let s = expr;

      // Replace unicode constants
      s = s.replace(/π/g, 'Math.PI');
      s = s.replace(/e(?![a-zA-Z0-9_])/g, 'Math.E');

      // Replace power syntax: x^y to Math.pow(x, y)
      // Handles simple base^exp
      s = s.replace(/([0-9.]+|Math\.PI|Math\.E)\s*\^\s*([0-9.]+|Math\.PI|Math\.E)/g, 'Math.pow($1, $2)');

      // Square: ^2
      s = s.replace(/\^2/g, '**2');

      // Square root
      s = s.replace(/sqrt\(/g, 'Math.sqrt(');

      // Log base 10 & natural ln
      s = s.replace(/log\(/g, 'Math.log10(');
      s = s.replace(/ln\(/g, 'Math.log(');

      // Trigonometry with DEG/RAD conversion
      const toRad = isDegreeMode ? '(Math.PI / 180) * ' : '';
      const toDeg = isDegreeMode ? '(180 / Math.PI) * ' : '';

      s = s.replace(/asin\(([^)]+)\)/g, '(' + toDeg + 'Math.asin($1))');
      s = s.replace(/acos\(([^)]+)\)/g, '(' + toDeg + 'Math.acos($1))');
      s = s.replace(/atan\(([^)]+)\)/g, '(' + toDeg + 'Math.atan($1))');

      s = s.replace(/sin\(([^)]+)\)/g, 'Math.sin(' + toRad + '($1))');
      s = s.replace(/cos\(([^)]+)\)/g, 'Math.cos(' + toRad + '($1))');
      s = s.replace(/tan\(([^)]+)\)/g, 'Math.tan(' + toRad + '($1))');

      // Factorial: n!
      s = s.replace(/(\d+)!/g, 'factorial($1)');

      // Percent: x% to (x/100)
      s = s.replace(/(\d+(\.\d+)?)%/g, '($1/100)');

      return s;
    }

    function handleCalculate() {
      playClickSound(950, 0.04);
      if (!currentExpression || currentExpression === 'Error') return;

      const rawExpr = currentExpression;
      try {
        const sanitized = sanitizeForEval(rawExpr);
        // Safe evaluation
        const result = Function('factorial', '"use strict"; return (' + sanitized + ')')(factorial);

        let formattedResult = '';
        if (typeof result !== 'number' || isNaN(result)) {
          formattedResult = 'Error';
        } else if (!isFinite(result)) {
          formattedResult = result > 0 ? '∞' : '-∞';
        } else {
          // Format precision nicely
          formattedResult = Number(result.toFixed(10)).toString();
        }

        const prevExpr = currentExpression;
        lastResult = formattedResult;
        currentExpression = formattedResult;

        updateDisplay(formattedResult, prevExpr + ' =');

        // Add to history
        if (formattedResult !== 'Error') {
          history.unshift({ expr: prevExpr, result: formattedResult, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
          renderHistory();
        }
      } catch (err) {
        currentExpression = 'Error';
        updateDisplay('Error', rawExpr + ' =');
      }
    }

    // Memory operations
    function handleMemory(op) {
      playClickSound(850);
      const currentVal = parseFloat(currentExpression) || parseFloat(lastResult) || 0;
      if (op === 'mc') {
        memoryValue = 0;
      } else if (op === 'mr') {
        currentExpression = memoryValue.toString();
        updateDisplay(currentExpression);
      } else if (op === 'm-plus') {
        memoryValue += currentVal;
      } else if (op === 'm-minus') {
        memoryValue -= currentVal;
      }
      updateDisplay(currentExpression);
    }

    // System Toggles
    function toggleDegRad() {
      playClickSound(700);
      isDegreeMode = !isDegreeMode;
      const badge = document.getElementById('degRadBadge');
      badge.textContent = isDegreeMode ? 'DEG' : 'RAD';
      badge.className = isDegreeMode ? 'px-1 rounded bg-black/30 border border-current' : 'px-1 rounded bg-cyan-600 text-black font-black';
    }

    function toggleShift() {
      playClickSound(700);
      isShiftMode = !isShiftMode;
      const badge = document.getElementById('shiftBadge');
      const btnSin = document.getElementById('btnSin');
      const btnCos = document.getElementById('btnCos');
      const btnTan = document.getElementById('btnTan');

      if (isShiftMode) {
        badge.classList.remove('hidden');
        btnSin.textContent = 'asin';
        btnCos.textContent = 'acos';
        btnTan.textContent = 'atan';
      } else {
        badge.classList.add('hidden');
        btnSin.textContent = 'sin';
        btnCos.textContent = 'cos';
        btnTan.textContent = 'tan';
      }
    }

    function toggleTheme() {
      playClickSound(900);
      const screen = document.getElementById('calculatorScreen');
      const btn = document.getElementById('themeToggleBtn');
      screen.classList.remove(themes[currentThemeIndex]);

      currentThemeIndex = (currentThemeIndex + 1) % themes.length;
      screen.classList.add(themes[currentThemeIndex]);
      btn.textContent = themeLabels[currentThemeIndex];
    }

    function toggleSound() {
      soundEnabled = !soundEnabled;
      const btn = document.getElementById('soundToggleBtn');
      btn.textContent = soundEnabled ? '🔊' : '🔇';
    }

    function toggleHistory() {
      const drawer = document.getElementById('historyDrawer');
      drawer.classList.toggle('hidden');
    }

    function renderHistory() {
      const list = document.getElementById('historyList');
      if (history.length === 0) {
        list.innerHTML = '<div class="text-slate-500 text-center py-8">No hay cálculos registrados aún.</div>';
        return;
      }
      list.innerHTML = history.slice(0, 15).map((item, idx) => {
        return '<div onclick="recallHistory(' + idx + ')" class="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 cursor-pointer border border-slate-700/60 transition-colors">' +
          '<div class="flex justify-between text-[10px] text-slate-400">' +
            '<span>' + item.time + '</span>' +
            '<span class="text-cyan-400 hover:underline">Reusar ↩</span>' +
          '</div>' +
          '<div class="text-slate-300 text-right truncate">' + item.expr + '</div>' +
          '<div class="text-emerald-400 font-bold text-right text-sm"> = ' + item.result + '</div>' +
        '</div>';
      }).join('');
    }

    function recallHistory(idx) {
      const item = history[idx];
      if (item) {
        currentExpression = item.result;
        updateDisplay(item.result, item.expr + ' =');
        toggleHistory();
      }
    }

    function clearHistory() {
      history.length = 0;
      renderHistory();
    }

    // Copy to clipboard
    document.getElementById('btnCopyAns').addEventListener('click', () => {
      playClickSound(900);
      const val = document.getElementById('mainDisplay').textContent;
      navigator.clipboard.writeText(val).then(() => {
        const copyBtn = document.getElementById('btnCopyAns');
        const oldText = copyBtn.textContent;
        copyBtn.textContent = '¡COPIADO!';
        setTimeout(() => copyBtn.textContent = oldText, 1000);
      });
    });

    // Event listeners for toggle buttons
    document.getElementById('btnDegRad').addEventListener('click', toggleDegRad);
    document.getElementById('btnShift').addEventListener('click', toggleShift);
    document.getElementById('themeToggleBtn').addEventListener('click', toggleTheme);
    document.getElementById('soundToggleBtn').addEventListener('click', toggleSound);
    document.getElementById('btnHistoryToggle').addEventListener('click', toggleHistory);

    // Keyboard support
    window.addEventListener('keydown', (e) => {
      if (e.key >= '0' && e.key <= '9') {
        insertDigit(e.key);
      } else if (e.key === '.') {
        insertDecimal();
      } else if (e.key === '+' || e.key === '-' || e.key === '*' || e.key === '/') {
        insertOp(e.key);
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleCalculate();
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Escape') {
        handleClearAll();
      } else if (e.key === '(' || e.key === ')') {
        insertFunc(e.key);
      } else if (e.key === '^') {
        insertOp('^');
      } else if (e.key === '%') {
        insertFunc('%');
      }
    });
  </script>
</body>
</html>`;
