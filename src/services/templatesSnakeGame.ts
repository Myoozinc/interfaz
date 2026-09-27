/**
 * templatesSnakeGame.ts
 * Videojuego Sniki — Retro Neon Snake 2026
 * Desarrollado con HTML5 Canvas a 60 FPS, Web Audio API para efectos de sonido retro,
 * sistema de partículas de chispas, controles táctiles y de teclado, y selector de dificultades.
 */

export const SNAKE_RETRO_GAME_HTML = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Sniki — Neon Snake 2026</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js"></script>
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Rajdhani:wght@600;700&display=swap" rel="stylesheet">
  <style>
    body {
      background: radial-gradient(circle at 50% 10%, #0f172a, #020617 85%);
      font-family: 'Rajdhani', sans-serif;
      user-select: none;
      -webkit-user-select: none;
      touch-action: manipulation;
    }
    .font-hud {
      font-family: 'Orbitron', monospace;
    }
    .neon-border {
      box-shadow: 0 0 25px rgba(16, 185, 129, 0.25), inset 0 0 20px rgba(16, 185, 129, 0.1);
    }
    .neon-glow-cyan {
      text-shadow: 0 0 10px rgba(6, 182, 212, 0.8), 0 0 20px rgba(6, 182, 212, 0.4);
    }
    .neon-glow-emerald {
      text-shadow: 0 0 10px rgba(16, 185, 129, 0.8), 0 0 20px rgba(16, 185, 129, 0.4);
    }
  </style>
</head>
<body class="min-h-screen text-slate-100 flex flex-col items-center justify-between p-3 sm:p-5 select-none overflow-x-hidden">

  <!-- Header HUD -->
  <header class="w-full max-w-xl flex items-center justify-between py-2 px-4 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl shadow-xl">
    <div class="flex items-center gap-2.5">
      <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/30">
        🐍
      </div>
      <div>
        <h1 class="text-base sm:text-lg font-black tracking-wider text-white font-hud neon-glow-emerald">
          SNIKI
        </h1>
        <span class="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Neon Arcade</span>
      </div>
    </div>

    <!-- Live Scores -->
    <div class="flex items-center gap-3 font-hud text-xs sm:text-sm">
      <div class="bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 text-center">
        <div class="text-[9px] text-slate-400 font-bold uppercase">Puntos</div>
        <div id="scoreDisplay" class="text-emerald-400 font-black text-base">0</div>
      </div>
      <div class="bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 text-center">
        <div class="text-[9px] text-slate-400 font-bold uppercase">Récord</div>
        <div id="bestDisplay" class="text-cyan-400 font-black text-base">0</div>
      </div>
    </div>
  </header>

  <!-- Canvas Container -->
  <main class="relative w-full max-w-xl my-auto flex flex-col items-center justify-center">
    <div class="relative bg-slate-950/90 rounded-2xl border-2 border-emerald-500/40 p-1.5 neon-border shadow-2xl">
      <canvas id="gameCanvas" width="400" height="400" class="rounded-xl block bg-slate-950/95"></canvas>

      <!-- Overlay / Start & Game Over Screen -->
      <div id="overlay" class="absolute inset-0 bg-slate-950/90 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center p-6 text-center space-y-4 transition-all">
        <div class="space-y-1">
          <div class="text-4xl sm:text-5xl font-black text-white font-hud tracking-wider neon-glow-emerald">
            SNIKI 2026
          </div>
          <p id="overlaySubtitle" class="text-xs sm:text-sm text-slate-400 font-medium">
            Controla a Sniki, come orbes de energía de neón y no choques contra ti mismo.
          </p>
        </div>

        <div id="finalScoreCard" class="hidden bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 w-full max-w-xs space-y-2">
          <div class="text-xs text-slate-400 uppercase font-bold">Puntuación Final</div>
          <div id="finalScore" class="text-3xl font-black text-emerald-400 font-hud">0</div>
          <div id="newBestBadge" class="hidden inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            🏆 ¡Nuevo Récord!
          </div>
        </div>

        <!-- Difficulty Selector -->
        <div class="flex items-center gap-2 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button type="button" onclick="setDifficulty('easy')" id="btnEasy" class="px-3 py-1 rounded-lg text-xs font-bold transition-all text-slate-400 hover:text-white">
            Tranquilo
          </button>
          <button type="button" onclick="setDifficulty('normal')" id="btnNormal" class="px-3 py-1 rounded-lg text-xs font-bold transition-all bg-emerald-500 text-slate-950 shadow-md">
            Normal
          </button>
          <button type="button" onclick="setDifficulty('hard')" id="btnHard" class="px-3 py-1 rounded-lg text-xs font-bold transition-all text-slate-400 hover:text-white">
            Demencial
          </button>
        </div>

        <button
          type="button"
          onclick="startGame()"
          class="px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:opacity-95 text-slate-950 font-black font-hud text-sm tracking-wider shadow-lg shadow-emerald-500/25 transition-all cursor-pointer hover:scale-105 active:scale-95"
        >
          ▶ JUGAR AHORA
        </button>

        <div class="text-[11px] text-slate-500">
          Usa las flechas del teclado, WASD o la cruceta táctil.
        </div>
      </div>
    </div>
  </main>

  <!-- Mobile On-Screen D-Pad Controls -->
  <footer class="w-full max-w-xs flex flex-col items-center gap-1.5 pt-1">
    <button onclick="handleDirection('UP')" class="w-14 h-12 rounded-xl bg-slate-800/80 active:bg-emerald-600 border border-slate-700/80 text-white font-bold flex items-center justify-center text-lg shadow-lg active:scale-95 transition-all">
      ▲
    </button>
    <div class="flex items-center gap-6">
      <button onclick="handleDirection('LEFT')" class="w-14 h-12 rounded-xl bg-slate-800/80 active:bg-emerald-600 border border-slate-700/80 text-white font-bold flex items-center justify-center text-lg shadow-lg active:scale-95 transition-all">
        ◀
      </button>
      <button onclick="togglePause()" class="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 active:bg-slate-700 text-slate-400 font-bold flex items-center justify-center text-xs">
        ⏸️
      </button>
      <button onclick="handleDirection('RIGHT')" class="w-14 h-12 rounded-xl bg-slate-800/80 active:bg-emerald-600 border border-slate-700/80 text-white font-bold flex items-center justify-center text-lg shadow-lg active:scale-95 transition-all">
        ▶
      </button>
    </div>
    <button onclick="handleDirection('DOWN')" class="w-14 h-12 rounded-xl bg-slate-800/80 active:bg-emerald-600 border border-slate-700/80 text-white font-bold flex items-center justify-center text-lg shadow-lg active:scale-95 transition-all">
      ▼
    </button>
  </footer>

  <script>
    // Audio FX using Web Audio API
    let audioCtx = null;
    function getAudioContext() {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      return audioCtx;
    }

    function playSound(type) {
      try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;
        if (type === 'eat') {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
          gain.gain.setValueAtTime(0.3, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
          osc.start(now);
          osc.stop(now + 0.12);
        } else if (type === 'die') {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(260, now);
          osc.frequency.exponentialRampToValueAtTime(60, now + 0.35);
          gain.gain.setValueAtTime(0.4, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
          osc.start(now);
          osc.stop(now + 0.35);
        } else if (type === 'move') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(140, now);
          gain.gain.setValueAtTime(0.04, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
          osc.start(now);
          osc.stop(now + 0.05);
        }
      } catch (e) {}
    }

    // Game Core
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const GRID_SIZE = 20;
    const TILE_COUNT = 20;

    let snake = [];
    let food = { x: 5, y: 5 };
    let goldenFood = null;
    let goldenFoodTimer = 0;
    let particles = [];
    let dx = 1;
    let dy = 0;
    let nextDx = 1;
    let nextDy = 0;
    let score = 0;
    let bestScore = parseInt(localStorage.getItem('sniki_best_score') || '0', 10);
    let gameLoop = null;
    let isPlaying = false;
    let isPaused = false;
    let gameSpeed = 100; // ms

    document.getElementById('bestDisplay').textContent = bestScore;

    function setDifficulty(level) {
      document.getElementById('btnEasy').className = 'px-3 py-1 rounded-lg text-xs font-bold transition-all ' + (level === 'easy' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white');
      document.getElementById('btnNormal').className = 'px-3 py-1 rounded-lg text-xs font-bold transition-all ' + (level === 'normal' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white');
      document.getElementById('btnHard').className = 'px-3 py-1 rounded-lg text-xs font-bold transition-all ' + (level === 'hard' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white');

      if (level === 'easy') gameSpeed = 135;
      else if (level === 'normal') gameSpeed = 100;
      else if (level === 'hard') gameSpeed = 70;
    }

    function spawnFood() {
      let valid = false;
      while (!valid) {
        food.x = Math.floor(Math.random() * TILE_COUNT);
        food.y = Math.floor(Math.random() * TILE_COUNT);
        valid = !snake.some(segment => segment.x === food.x && segment.y === food.y);
      }

      // Chance of spawning Golden Orbs
      if (Math.random() < 0.25 && !goldenFood) {
        let gValid = false;
        let gx = 0, gy = 0;
        while (!gValid) {
          gx = Math.floor(Math.random() * TILE_COUNT);
          gy = Math.floor(Math.random() * TILE_COUNT);
          gValid = !snake.some(s => s.x === gx && s.y === gy) && (gx !== food.x || gy !== food.y);
        }
        goldenFood = { x: gx, y: gy, life: 60 };
      }
    }

    function createExplosion(x, y, color) {
      for (let i = 0; i < 16; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 1;
        particles.push({
          x: x * GRID_SIZE + GRID_SIZE / 2,
          y: y * GRID_SIZE + GRID_SIZE / 2,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color,
          alpha: 1,
          size: Math.random() * 4 + 2
        });
      }
    }

    function startGame() {
      snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
      ];
      dx = 1;
      dy = 0;
      nextDx = 1;
      nextDy = 0;
      score = 0;
      particles = [];
      goldenFood = null;
      document.getElementById('scoreDisplay').textContent = score;

      spawnFood();
      isPlaying = true;
      isPaused = false;
      document.getElementById('overlay').classList.add('hidden');
      document.getElementById('finalScoreCard').classList.add('hidden');

      if (gameLoop) clearInterval(gameLoop);
      gameLoop = setInterval(update, gameSpeed);
      playSound('move');
    }

    function togglePause() {
      if (!isPlaying) return;
      isPaused = !isPaused;
      if (isPaused) {
        clearInterval(gameLoop);
        document.getElementById('overlaySubtitle').textContent = 'Juego Pausado';
        document.getElementById('overlay').classList.remove('hidden');
      } else {
        document.getElementById('overlay').classList.add('hidden');
        gameLoop = setInterval(update, gameSpeed);
      }
    }

    function gameOver() {
      isPlaying = false;
      clearInterval(gameLoop);
      playSound('die');

      const isNewBest = score > bestScore;
      if (isNewBest) {
        bestScore = score;
        localStorage.setItem('sniki_best_score', bestScore.toString());
        document.getElementById('bestDisplay').textContent = bestScore;
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      }

      document.getElementById('finalScore').textContent = score;
      document.getElementById('newBestBadge').classList.toggle('hidden', !isNewBest);
      document.getElementById('overlaySubtitle').textContent = '¡Fin del Juego! ¿Quieres intentarlo otra vez?';
      document.getElementById('finalScoreCard').classList.remove('hidden');
      document.getElementById('overlay').classList.remove('hidden');
    }

    function handleDirection(dir) {
      if (!isPlaying || isPaused) return;
      if (dir === 'UP' && dy === 0) { nextDx = 0; nextDy = -1; playSound('move'); }
      else if (dir === 'DOWN' && dy === 0) { nextDx = 0; nextDy = 1; playSound('move'); }
      else if (dir === 'LEFT' && dx === 0) { nextDx = -1; nextDy = 0; playSound('move'); }
      else if (dir === 'RIGHT' && dx === 0) { nextDx = 1; nextDy = 0; playSound('move'); }
    }

    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      if (key === 'arrowup' || key === 'w') {
        e.preventDefault();
        handleDirection('UP');
      } else if (key === 'arrowdown' || key === 's') {
        e.preventDefault();
        handleDirection('DOWN');
      } else if (key === 'arrowleft' || key === 'a') {
        e.preventDefault();
        handleDirection('LEFT');
      } else if (key === 'arrowright' || key === 'd') {
        e.preventDefault();
        handleDirection('RIGHT');
      } else if (key === ' ' || key === 'p') {
        e.preventDefault();
        if (isPlaying) togglePause();
        else startGame();
      }
    });

    function update() {
      if (!isPlaying || isPaused) return;

      dx = nextDx;
      dy = nextDy;

      const head = { x: snake[0].x + dx, y: snake[0].y + dy };

      // Wall collision
      if (head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT) {
        gameOver();
        return;
      }

      // Self collision
      if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        gameOver();
        return;
      }

      snake.unshift(head);

      // Check food collision
      if (head.x === food.x && head.y === food.y) {
        score += 10;
        document.getElementById('scoreDisplay').textContent = score;
        createExplosion(food.x, food.y, '#10b981');
        playSound('eat');
        spawnFood();
      } else if (goldenFood && head.x === goldenFood.x && head.y === goldenFood.y) {
        score += 35;
        document.getElementById('scoreDisplay').textContent = score;
        createExplosion(goldenFood.x, goldenFood.y, '#fbbf24');
        playSound('eat');
        goldenFood = null;
      } else {
        snake.pop();
      }

      // Golden food timer
      if (goldenFood) {
        goldenFood.life--;
        if (goldenFood.life <= 0) goldenFood = null;
      }

      render();
    }

    function render() {
      // Clear with dark subtle fade
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Grid lines
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1;
      for (let i = 0; i <= TILE_COUNT; i++) {
        ctx.beginPath();
        ctx.moveTo(i * GRID_SIZE, 0);
        ctx.lineTo(i * GRID_SIZE, canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * GRID_SIZE);
        ctx.lineTo(canvas.width, i * GRID_SIZE);
        ctx.stroke();
      }

      // Draw Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.035;
        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      // Draw Food (Neon Emerald Orb)
      const foodX = food.x * GRID_SIZE + GRID_SIZE / 2;
      const foodY = food.y * GRID_SIZE + GRID_SIZE / 2;
      const pulse = Math.sin(Date.now() / 150) * 2;

      ctx.fillStyle = '#34d399';
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(foodX, foodY, (GRID_SIZE / 2 - 2) + pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw Golden Bonus Food if present
      if (goldenFood) {
        const gx = goldenFood.x * GRID_SIZE + GRID_SIZE / 2;
        const gy = goldenFood.y * GRID_SIZE + GRID_SIZE / 2;
        ctx.fillStyle = '#fbbf24';
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(gx, gy, GRID_SIZE / 2 - 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Draw Snake
      snake.forEach((segment, idx) => {
        const isHead = idx === 0;
        const x = segment.x * GRID_SIZE;
        const y = segment.y * GRID_SIZE;

        if (isHead) {
          ctx.fillStyle = '#38bdf8';
          ctx.shadowColor = '#0284c7';
          ctx.shadowBlur = 10;
        } else {
          // Gradient tail
          const ratio = 1 - (idx / snake.length) * 0.6;
          ctx.fillStyle = 'rgba(56, 189, 248, ' + ratio + ')';
          ctx.shadowBlur = 0;
        }

        ctx.beginPath();
        ctx.roundRect(x + 1.5, y + 1.5, GRID_SIZE - 3, GRID_SIZE - 3, isHead ? 6 : 4);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw Eyes on Head
        if (isHead) {
          ctx.fillStyle = '#0f172a';
          let eyeX1 = x + 5, eyeY1 = y + 5, eyeX2 = x + 15, eyeY2 = y + 5;
          if (dx === 1) { eyeX1 = x + 13; eyeY1 = y + 5; eyeX2 = x + 13; eyeY2 = y + 13; }
          else if (dx === -1) { eyeX1 = x + 5; eyeY1 = y + 5; eyeX2 = x + 5; eyeY2 = y + 13; }
          else if (dy === 1) { eyeX1 = x + 5; eyeY1 = y + 13; eyeX2 = x + 13; eyeY2 = y + 13; }
          ctx.fillRect(eyeX1, eyeY1, 2.5, 2.5);
          ctx.fillRect(eyeX2, eyeY2, 2.5, 2.5);
        }
      });
    }

    // Initial render
    render();
  </script>
</body>
</html>`;
