/**
 * templates3DBattleship.ts
 * Videojuego 3D Completo: Hundir la Flota 3D (Naval Battleship 3D)
 * Desarrollado con Three.js, Web Audio API procedural, Shader de Océano y HUD táctico en Tailwind CSS.
 */

export const BATTLESHIP_3D_HTML = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hundir la Flota 3D — NONA Naval Battleship</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/three@0.160.0/build/three.min.js"></script>
  <script src="https://unpkg.com/three@0.160.0/examples/js/controls/OrbitControls.js"></script>
  <script src="https://unpkg.com/canvas-confetti@1.9.2/dist/confetti.browser.js"></script>
  <style>
    body { margin: 0; overflow: hidden; background: #020617; user-select: none; font-family: system-ui, -apple-system, sans-serif; }
    #canvas3d { width: 100vw; height: 100vh; display: block; }
    .radar-sweep {
      animation: sweep 4s linear infinite;
      transform-origin: center;
    }
    @keyframes sweep {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body class="text-white relative">
  <!-- 3D WebGL Canvas Container -->
  <div id="container3d" class="absolute inset-0"></div>

  <!-- HUD Overlay -->
  <div class="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 sm:p-6">
    
    <!-- Top Bar: Title, Radar & Status -->
    <div class="flex items-start justify-between gap-4">
      <div class="pointer-events-auto bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 rounded-2xl p-4 shadow-2xl max-w-sm">
        <div class="flex items-center gap-2 mb-1">
          <span class="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
          <h1 class="text-lg font-black tracking-wider text-cyan-300 uppercase">Hundir la Flota 3D</h1>
          <span class="text-[10px] px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono font-bold">TACTICAL</span>
        </div>
        <p id="instructionText" class="text-xs text-slate-300">
          Haz clic en cualquier coordenada de la cuadrícula oceánica para abrir fuego con tus baterías de artillería.
        </p>
        <div id="turnBadge" class="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-200 text-xs font-bold">
          <span class="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
          <span>TU TURNO — Selecciona blanco</span>
        </div>
      </div>

      <!-- Tactical Radar Mini-Widget -->
      <div class="pointer-events-auto bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 rounded-2xl p-3 shadow-2xl flex items-center gap-3">
        <div class="relative w-16 h-16 rounded-full border border-cyan-500/40 bg-slate-950 flex items-center justify-center overflow-hidden">
          <!-- Concentric circles -->
          <div class="absolute w-12 h-12 rounded-full border border-cyan-500/20"></div>
          <div class="absolute w-6 h-6 rounded-full border border-cyan-500/20"></div>
          <div class="absolute inset-x-0 top-1/2 h-[1px] bg-cyan-500/30"></div>
          <div class="absolute inset-y-0 left-1/2 w-[1px] bg-cyan-500/30"></div>
          <!-- Rotating sweep line -->
          <div class="radar-sweep absolute inset-0 bg-gradient-to-tr from-transparent via-cyan-500/10 to-cyan-400/40 rounded-full"></div>
          <div class="w-1.5 h-1.5 rounded-full bg-cyan-400 z-10"></div>
        </div>
        <div class="text-xs space-y-1 font-mono">
          <div class="text-slate-400 text-[10px]">ESTADO DE LA FLOTA</div>
          <div class="text-cyan-300 font-bold flex items-center justify-between gap-3">
            <span>TUS BUQUES:</span>
            <span id="playerShipsCount" class="text-emerald-400 font-bold">5 / 5</span>
          </div>
          <div class="text-rose-400 font-bold flex items-center justify-between gap-3">
            <span>FLOTA ENEMIGA:</span>
            <span id="enemyShipsCount" class="text-rose-400 font-bold">5 / 5</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Controls & Battle Log -->
    <div class="flex items-end justify-between gap-4">
      <!-- Battle Log Terminal -->
      <div class="pointer-events-auto bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-2xl p-3 shadow-2xl w-80 max-h-36 overflow-hidden flex flex-col font-mono text-[11px]">
        <div class="text-slate-400 text-[10px] pb-1 border-b border-slate-800 flex items-center justify-between">
          <span>REGISTRO DE COMBATE</span>
          <span class="text-cyan-400">EN VIVO</span>
        </div>
        <div id="battleLog" class="space-y-1 overflow-y-auto mt-1 flex-1 pr-1 text-slate-300">
          <div class="text-slate-500">Sistemas navales activados. Flota enemiga detectada en cuadrícula.</div>
        </div>
      </div>

      <!-- Action Buttons & Camera Presets -->
      <div class="pointer-events-auto flex items-center gap-2">
        <button id="btnSound" class="px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 backdrop-blur-md transition-all cursor-pointer">
          <span id="soundIcon">🔊</span>
          <span>Audio</span>
        </button>
        <button id="btnViewCamera" class="px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 backdrop-blur-md transition-all cursor-pointer">
          <span>📷 Cambiar Cámara</span>
        </button>
        <button id="btnRestart" class="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition-all cursor-pointer">
          <span>🔄 Nueva Partida</span>
        </button>
      </div>
    </div>
  </div>

  <!-- Victory / Defeat Modal -->
  <div id="endModal" class="hidden absolute inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
    <div class="bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl space-y-4">
      <div id="modalIcon" class="w-16 h-16 mx-auto rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-3xl">
        🏆
      </div>
      <h2 id="modalTitle" class="text-2xl font-black tracking-wide text-white">¡VICTORIA NAVAL!</h2>
      <p id="modalDesc" class="text-sm text-slate-300 leading-relaxed">
        Has hundido todos los buques de la flota enemiga con precisión estratégica. El almirante enemigo se ha rendido.
      </p>
      <div class="bg-slate-950/70 rounded-2xl p-4 border border-slate-800 grid grid-cols-2 gap-2 text-xs font-mono">
        <div>
          <div class="text-slate-400">DISPAROS TOTALES</div>
          <div id="statShots" class="text-base font-bold text-cyan-300">0</div>
        </div>
        <div>
          <div class="text-slate-400">PRECISIÓN</div>
          <div id="statAccuracy" class="text-base font-bold text-emerald-400">0%</div>
        </div>
      </div>
      <button id="modalBtnPlayAgain" class="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-sm tracking-wider uppercase shadow-xl transition-all cursor-pointer">
        Jugar de Nuevo
      </button>
    </div>
  </div>

  <!-- THREE.JS & GAME LOGIC SCRIPT -->
  <script>
    // =========================================================================
    // PROCEDURAL WEB AUDIO SYNTHESIZER
    // =========================================================================
    let audioCtx = null;
    let isSoundMuted = false;

    function initAudio() {
      if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContextClass();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
    }

    function playCannonShotSound() {
      if (isSoundMuted || !audioCtx) return;
      try {
        const t = audioCtx.currentTime;
        const bufferSize = audioCtx.sampleRate * 0.4;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, t);
        filter.frequency.exponentialRampToValueAtTime(80, t + 0.35);

        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(1.0, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.38);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        noise.start(t);

        const osc = audioCtx.createOscillator();
        const oscGain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(30, t + 0.4);
        oscGain.gain.setValueAtTime(0.8, t);
        oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

        osc.connect(oscGain);
        oscGain.connect(audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.4);
      } catch (e) {}
    }

    function playSplashSound() {
      if (isSoundMuted || !audioCtx) return;
      try {
        const t = audioCtx.currentTime;
        const bufferSize = audioCtx.sampleRate * 0.35;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audioCtx.sampleRate * 0.08));
        }
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1200, t);
        filter.Q.value = 3.0;

        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.6, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        noise.start(t);
      } catch (e) {}
    }

    function playExplosionSound() {
      if (isSoundMuted || !audioCtx) return;
      try {
        const t = audioCtx.currentTime;
        const bufferSize = audioCtx.sampleRate * 0.7;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, t);
        filter.frequency.exponentialRampToValueAtTime(40, t + 0.65);

        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(1.0, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.68);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        noise.start(t);
      } catch (e) {}
    }

    function playVictoryFanfare() {
      if (isSoundMuted || !audioCtx) return;
      const notes = [261.63, 329.63, 392.00, 523.25];
      notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.value = freq;
        const startTime = audioCtx.currentTime + idx * 0.12;
        g.gain.setValueAtTime(0.2, startTime);
        g.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);
        osc.connect(g);
        g.connect(audioCtx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.65);
      });
    }

    // =========================================================================
    // GAME STATE & FLEET MODELS
    // =========================================================================
    const GRID_SIZE = 10;
    const CELL_SIZE = 3.2;

    const SHIP_TYPES = [
      { name: 'Portaaviones', size: 5, color: 0x334155 },
      { name: 'Acorazado', size: 4, color: 0x475569 },
      { name: 'Crucero', size: 3, color: 0x64748b },
      { name: 'Submarino', size: 3, color: 0x1e293b },
      { name: 'Destructor', size: 2, color: 0x0f172a }
    ];

    let playerFleet = [];
    let enemyFleet = [];
    let playerBoard = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
    let enemyBoard = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
    let isPlayerTurn = true;
    let totalShots = 0;
    let hitShots = 0;
    let isGameOver = false;

    // =========================================================================
    // THREE.JS SCENE SETUP
    // =========================================================================
    const container = document.getElementById('container3d');
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);
    scene.fog = new THREE.FogExp2(0x020617, 0.012);

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.5, 1000);
    camera.position.set(0, 42, 55);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.15;
    controls.minDistance = 15;
    controls.maxDistance = 120;
    controls.target.set(0, 0, 0);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 0.65);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(30, 60, 40);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 200;
    dirLight.shadow.camera.left = -40;
    dirLight.shadow.camera.right = 40;
    dirLight.shadow.camera.top = 40;
    dirLight.shadow.camera.bottom = -40;
    scene.add(dirLight);

    const blueLight = new THREE.PointLight(0x06b6d4, 1.5, 80);
    blueLight.position.set(0, 15, 0);
    scene.add(blueLight);

    // Dynamic 3D Ocean Surface
    const oceanGeo = new THREE.PlaneGeometry(300, 300, 64, 64);
    oceanGeo.rotateX(-Math.PI / 2);
    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x032845,
      roughness: 0.15,
      metalness: 0.8,
      flatShading: true,
    });
    const oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
    oceanMesh.receiveShadow = true;
    scene.add(oceanMesh);

    // 10x10 Tactical Ocean Grid
    const gridOffset = -(GRID_SIZE * CELL_SIZE) / 2 + CELL_SIZE / 2;
    const cellMeshes = [];
    const interactiveGridGroup = new THREE.Group();
    scene.add(interactiveGridGroup);

    const cellGeo = new THREE.BoxGeometry(CELL_SIZE - 0.2, 0.3, CELL_SIZE - 0.2);
    const defaultCellMat = new THREE.MeshStandardMaterial({
      color: 0x082f49,
      roughness: 0.4,
      metalness: 0.6,
      transparent: true,
      opacity: 0.75,
    });
    const hoverCellMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.6,
    });

    for (let r = 0; r < GRID_SIZE; r++) {
      cellMeshes[r] = [];
      for (let c = 0; c < GRID_SIZE; c++) {
        const cell = new THREE.Mesh(cellGeo, defaultCellMat.clone());
        cell.position.set(gridOffset + c * CELL_SIZE, 0.15, gridOffset + r * CELL_SIZE);
        cell.receiveShadow = true;
        cell.userData = { row: r, col: c, isShot: false };
        interactiveGridGroup.add(cell);
        cellMeshes[r][c] = cell;
      }
    }

    // Grid Coordinates Text Markers (A-J, 1-10)
    const gridBorderGeo = new THREE.BoxGeometry(GRID_SIZE * CELL_SIZE + 0.6, 0.4, GRID_SIZE * CELL_SIZE + 0.6);
    const gridBorderMat = new THREE.MeshStandardMaterial({ color: 0x0e7490, metalness: 0.8, roughness: 0.2 });
    const gridBorder = new THREE.Mesh(gridBorderGeo, gridBorderMat);
    gridBorder.position.y = -0.05;
    scene.add(gridBorder);

    // Particle Systems for Explosions & Splashes
    const particles = [];

    function spawnExplosion(x, z) {
      playExplosionSound();
      const count = 45;
      const geom = new THREE.BufferGeometry();
      const positions = new Float32Array(count * 3);
      const velocities = [];

      for (let i = 0; i < count; i++) {
        positions[i * 3] = x;
        positions[i * 3 + 1] = 1.0;
        positions[i * 3 + 2] = z;

        velocities.push({
          x: (Math.random() - 0.5) * 8,
          y: Math.random() * 9 + 4,
          z: (Math.random() - 0.5) * 8
        });
      }

      geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const mat = new THREE.PointsMaterial({
        color: 0xf97316,
        size: 0.8,
        transparent: true,
        opacity: 1.0,
      });

      const pSystem = new THREE.Points(geom, mat);
      scene.add(pSystem);
      particles.push({ mesh: pSystem, velocities, life: 1.0, maxLife: 1.0, decay: 0.02 });

      const fireCone = new THREE.Mesh(
        new THREE.ConeGeometry(0.8, 2.0, 6),
        new THREE.MeshBasicMaterial({ color: 0xef4444 })
      );
      fireCone.position.set(x, 1.0, z);
      scene.add(fireCone);
    }

    function spawnWaterSplash(x, z) {
      playSplashSound();
      const count = 35;
      const geom = new THREE.BufferGeometry();
      const positions = new Float32Array(count * 3);
      const velocities = [];

      for (let i = 0; i < count; i++) {
        positions[i * 3] = x;
        positions[i * 3 + 1] = 0.5;
        positions[i * 3 + 2] = z;

        velocities.push({
          x: (Math.random() - 0.5) * 4,
          y: Math.random() * 7 + 2,
          z: (Math.random() - 0.5) * 4
        });
      }

      geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const mat = new THREE.PointsMaterial({
        color: 0x38bdf8,
        size: 0.6,
        transparent: true,
        opacity: 0.9,
      });

      const pSystem = new THREE.Points(geom, mat);
      scene.add(pSystem);
      particles.push({ mesh: pSystem, velocities, life: 1.0, maxLife: 1.0, decay: 0.03 });

      const buoy = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.4, 0.6, 8),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3 })
      );
      buoy.position.set(x, 0.3, z);
      scene.add(buoy);
    }

    const activeProjectiles = [];

    function fireProjectile(fromX, fromY, fromZ, toX, toY, toZ, onImpact) {
      playCannonShotSound();
      const shell = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xfacc15 })
      );
      shell.position.set(fromX, fromY, fromZ);
      scene.add(shell);

      activeProjectiles.push({
        mesh: shell,
        start: new THREE.Vector3(fromX, fromY, fromZ),
        end: new THREE.Vector3(toX, toY, toZ),
        progress: 0,
        speed: 0.035,
        onImpact
      });
    }

    function deployFleets() {
      playerBoard = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
      enemyBoard = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
      playerFleet = [];
      enemyFleet = [];

      SHIP_TYPES.forEach(st => {
        let placed = false;
        let attempts = 0;
        while (!placed && attempts < 200) {
          attempts++;
          const horizontal = Math.random() > 0.5;
          const maxR = horizontal ? GRID_SIZE : GRID_SIZE - st.size;
          const maxC = horizontal ? GRID_SIZE - st.size : GRID_SIZE;
          const r = Math.floor(Math.random() * maxR);
          const c = Math.floor(Math.random() * maxC);

          let canPlace = true;
          for (let i = 0; i < st.size; i++) {
            const checkR = horizontal ? r : r + i;
            const checkC = horizontal ? c + i : c;
            if (enemyBoard[checkR][checkC] !== null) {
              canPlace = false;
              break;
            }
          }

          if (canPlace) {
            const shipObj = {
              name: st.name,
              size: st.size,
              hits: 0,
              coords: []
            };
            for (let i = 0; i < st.size; i++) {
              const placeR = horizontal ? r : r + i;
              const placeC = horizontal ? c + i : c;
              enemyBoard[placeR][placeC] = shipObj;
              shipObj.coords.push({ r: placeR, c: placeC });
            }
            enemyFleet.push(shipObj);
            placed = true;
          }
        }
      });

      SHIP_TYPES.forEach(st => {
        const shipObj = {
          name: st.name,
          size: st.size,
          hits: 0,
          coords: []
        };
        playerFleet.push(shipObj);
      });

      logEvent('Flota enemiga desplegada en sigilo. ¡Artillería lista para disparar!');
    }

    function logEvent(text, type = 'normal') {
      const log = document.getElementById('battleLog');
      const item = document.createElement('div');
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      item.className = type === 'hit' 
        ? 'text-rose-400 font-bold' 
        : type === 'sink' 
        ? 'text-amber-400 font-black' 
        : type === 'miss' 
        ? 'text-cyan-300' 
        : 'text-slate-300';
      item.innerHTML = '<span class="text-slate-500">[' + time + ']</span> ' + text;
      log.prepend(item);
    }

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let hoveredCell = null;

    window.addEventListener('mousemove', (e) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveGridGroup.children);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (!hit.userData.isShot) {
          if (hoveredCell && hoveredCell !== hit) {
            hoveredCell.material = defaultCellMat;
          }
          hoveredCell = hit;
          hoveredCell.material = hoverCellMat;
          container.style.cursor = 'crosshair';
          return;
        }
      }

      if (hoveredCell) {
        hoveredCell.material = defaultCellMat;
        hoveredCell = null;
      }
      container.style.cursor = 'default';
    });

    window.addEventListener('click', (e) => {
      initAudio();
      if (!isPlayerTurn || isGameOver) return;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveGridGroup.children);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (!hit.userData.isShot) {
          hit.userData.isShot = true;
          totalShots++;

          const r = hit.userData.row;
          const c = hit.userData.col;
          const coordName = String.fromCharCode(65 + c) + (r + 1);

          const fromX = -45;
          const fromY = 25;
          const fromZ = 45;
          const toX = hit.position.x;
          const toY = hit.position.y;
          const toZ = hit.position.z;

          isPlayerTurn = false;
          updateTurnBadge(false);

          fireProjectile(fromX, fromY, fromZ, toX, toY, toZ, () => {
            const ship = enemyBoard[r][c];
            if (ship) {
              hitShots++;
              ship.hits++;
              hit.material = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.2 });
              spawnExplosion(toX, toZ);
              
              if (ship.hits >= ship.size) {
                logEvent('🎯 ¡IMPACTO CRÍTICO en ' + coordName + '! ¡Has HUNDIDO el ' + ship.name + ' enemigo!', 'sink');
                updateEnemyFleetCount();
                checkGameOver();
              } else {
                logEvent('💥 ¡IMPACTO en ' + coordName + '! Daños severos en buque enemigo.', 'hit');
              }
            } else {
              hit.material = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1 });
              spawnWaterSplash(toX, toZ);
              logEvent('🌊 Disparo en ' + coordName + ': Agua. Sin daños reportados.', 'miss');
            }

            if (!isGameOver) {
              setTimeout(enemyTurn, 1200);
            }
          });
        }
      }
    });

    function updateTurnBadge(playerTurn) {
      const badge = document.getElementById('turnBadge');
      if (playerTurn) {
        badge.className = 'mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-200 text-xs font-bold';
        badge.innerHTML = '<span class="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span><span>TU TURNO — Selecciona blanco</span>';
      } else {
        badge.className = 'mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs font-bold';
        badge.innerHTML = '<span class="w-2 h-2 rounded-full bg-rose-400 animate-pulse"></span><span>TURNO ENEMIGO — Almirante calculando...</span>';
      }
    }

    function enemyTurn() {
      if (isGameOver) return;

      logEvent('⚠️ El almirante enemigo ha ordenado una andanada de contrabatería...', 'miss');
      playCannonShotSound();

      setTimeout(() => {
        const randShipIdx = Math.floor(Math.random() * playerFleet.length);
        const targetShip = playerFleet[randShipIdx];
        const isEnemyHit = Math.random() < 0.45;

        if (isEnemyHit && targetShip && targetShip.hits < targetShip.size) {
          targetShip.hits++;
          playExplosionSound();
          logEvent('🚨 ¡Alerta! El enemigo impactó nuestro ' + targetShip.name + '.', 'hit');
          if (targetShip.hits >= targetShip.size) {
            logEvent('💥 ¡Nuestro ' + targetShip.name + ' ha sido destruido!', 'sink');
            updatePlayerFleetCount();
            checkGameOver();
          }
        } else {
          playSplashSound();
          logEvent('🛡️ El proyectil enemigo cayó inofensivamente en mar abierto.', 'normal');
        }

        isPlayerTurn = true;
        updateTurnBadge(true);
      }, 1000);
    }

    function updateEnemyFleetCount() {
      const remaining = enemyFleet.filter(s => s.hits < s.size).length;
      document.getElementById('enemyShipsCount').textContent = remaining + ' / 5';
    }

    function updatePlayerFleetCount() {
      const remaining = playerFleet.filter(s => s.hits < s.size).length;
      document.getElementById('playerShipsCount').textContent = remaining + ' / 5';
    }

    function checkGameOver() {
      const enemyRemaining = enemyFleet.filter(s => s.hits < s.size).length;
      const playerRemaining = playerFleet.filter(s => s.hits < s.size).length;

      if (enemyRemaining === 0) {
        isGameOver = true;
        playVictoryFanfare();
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        showEndModal(true);
      } else if (playerRemaining === 0) {
        isGameOver = true;
        showEndModal(false);
      }
    }

    function showEndModal(isVictory) {
      const modal = document.getElementById('endModal');
      const title = document.getElementById('modalTitle');
      const desc = document.getElementById('modalDesc');
      const icon = document.getElementById('modalIcon');
      const statShots = document.getElementById('statShots');
      const statAccuracy = document.getElementById('statAccuracy');

      statShots.textContent = totalShots;
      const acc = totalShots > 0 ? Math.round((hitShots / totalShots) * 100) : 0;
      statAccuracy.textContent = acc + '%';

      if (isVictory) {
        icon.innerHTML = '🏆';
        title.textContent = '¡VICTORIA NAVAL ABSOLUTA!';
        title.className = 'text-2xl font-black tracking-wide text-cyan-300';
        desc.textContent = 'Has neutralizado por completo la flota hostil. El dominio de los mares es tuyo.';
      } else {
        icon.innerHTML = '💀';
        title.textContent = 'DERROTA NAVAL';
        title.className = 'text-2xl font-black tracking-wide text-rose-500';
        desc.textContent = 'Todos nuestros buques han sido hundidos por el fuego de artillería enemiga.';
      }

      modal.classList.remove('hidden');
    }

    function restartGame() {
      document.getElementById('endModal').classList.add('hidden');
      isGameOver = false;
      isPlayerTurn = true;
      totalShots = 0;
      hitShots = 0;

      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          const cell = cellMeshes[r][c];
          cell.userData.isShot = false;
          cell.material = defaultCellMat.clone();
        }
      }

      const toRemove = [];
      scene.children.forEach(child => {
        if (child.geometry && (child.geometry instanceof THREE.ConeGeometry || child.geometry instanceof THREE.CylinderGeometry)) {
          if (child !== gridBorder) toRemove.push(child);
        }
      });
      toRemove.forEach(c => scene.remove(c));

      deployFleets();
      updateEnemyFleetCount();
      updatePlayerFleetCount();
      updateTurnBadge(true);
    }

    document.getElementById('btnRestart').addEventListener('click', restartGame);
    document.getElementById('modalBtnPlayAgain').addEventListener('click', restartGame);

    document.getElementById('btnSound').addEventListener('click', () => {
      initAudio();
      isSoundMuted = !isSoundMuted;
      document.getElementById('soundIcon').textContent = isSoundMuted ? '🔇' : '🔊';
    });

    let camPresetIdx = 0;
    const camPresets = [
      { x: 0, y: 42, z: 55, targetX: 0, targetY: 0, targetZ: 0 },
      { x: 0, y: 68, z: 0.1, targetX: 0, targetY: 0, targetZ: 0 },
      { x: 45, y: 30, z: 45, targetX: 0, targetY: 0, targetZ: 0 }
    ];

    document.getElementById('btnViewCamera').addEventListener('click', () => {
      camPresetIdx = (camPresetIdx + 1) % camPresets.length;
      const p = camPresets[camPresetIdx];
      camera.position.set(p.x, p.y, p.z);
      controls.target.set(p.targetX, p.targetY, p.targetZ);
    });

    let clock = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      const pos = oceanGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const u = pos.getX(i);
        const w = pos.getZ(i);
        const y = Math.sin(u * 0.15 + elapsedTime * 1.5) * Math.cos(w * 0.15 + elapsedTime * 1.2) * 0.45;
        pos.setY(i, y);
      }
      pos.needsUpdate = true;

      for (let i = activeProjectiles.length - 1; i >= 0; i--) {
        const proj = activeProjectiles[i];
        proj.progress += proj.speed;

        if (proj.progress >= 1.0) {
          scene.remove(proj.mesh);
          proj.onImpact();
          activeProjectiles.splice(i, 1);
        } else {
          const currentPos = new THREE.Vector3().lerpVectors(proj.start, proj.end, proj.progress);
          const heightArc = Math.sin(proj.progress * Math.PI) * 14;
          currentPos.y += heightArc;
          proj.mesh.position.copy(currentPos);
        }
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= p.decay;

        if (p.life <= 0) {
          scene.remove(p.mesh);
          particles.splice(i, 1);
        } else {
          p.mesh.material.opacity = p.life / p.maxLife;
          const posAttr = p.mesh.geometry.attributes.position;
          for (let j = 0; j < p.velocities.length; j++) {
            const v = p.velocities[j];
            posAttr.setX(j, posAttr.getX(j) + v.x * 0.05);
            posAttr.setY(j, posAttr.getY(j) + v.y * 0.05);
            posAttr.setZ(j, posAttr.getZ(j) + v.z * 0.05);
            v.y -= 0.18;
          }
          posAttr.needsUpdate = true;
        }
      }

      controls.update();
      renderer.render(scene, camera);
    }

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    deployFleets();
    animate();
  </script>
</body>
</html>`;
