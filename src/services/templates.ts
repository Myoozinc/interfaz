import type { ProjectTemplate } from '../types';
import { MARIO_KART_GAME_HTML } from './marioKartTemplate';
import { AIR_COMBAT_GAME_HTML } from './airCombatTemplate';

export { MARIO_KART_GAME_HTML, AIR_COMBAT_GAME_HTML };

export const STARTER_TEMPLATES: ProjectTemplate[] = [
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
  // 4. 🎹 SYNTHWAVE WEB DAW & STEP SEQUENCER (Tone.js & Web Audio API)
  // =========================================================================
  {
    id: 'synthwave-web-daw',
    name: '🎹 SynthWave Web DAW & Sequencer',
    description: 'Estación de producción musical y secuenciador por pasos con sintetizador polifónico, osciloscopio en tiempo real y efectos de audio',
    icon: 'Music',
    category: 'Música & Audio',
    tags: ['Web Audio API', 'Osciloscopio', 'Secuenciador', 'Sintetizador'],
    badge: 'Pro',
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
  <title>SynthWave Web DAW Studio</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    .step-active { background-color: #06b6d4 !important; box-shadow: 0 0 12px #06b6d4; }
    .step-current { border: 2px solid #ec4899 !important; }
    .key:active { transform: translateY(2px); background-color: #22d3ee; }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen p-4 sm:p-6 font-sans select-none">
  <div class="max-w-5xl mx-auto space-y-6">

    <header class="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-3xl shadow-2xl backdrop-blur-md">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
          <i data-lucide="music-2" class="w-5 h-5"></i>
        </div>
        <div>
          <h1 class="text-base font-black tracking-wider text-cyan-400 uppercase">SYNTHWAVE STUDIO 2026</h1>
          <p class="text-xs text-slate-400">Secuenciador de Pasos 16-Step & Síntesis Analógica</p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <button id="btn-play" onclick="togglePlay()" class="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:opacity-90 font-bold rounded-2xl flex items-center gap-2 text-xs shadow-lg shadow-cyan-500/30 transition-all cursor-pointer">
          <i id="play-icon" data-lucide="play" class="w-4 h-4"></i> <span id="play-text">REPRODUCIR</span>
        </button>
        <button onclick="clearSteps()" class="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition-colors cursor-pointer" title="Limpiar Secuenciador">
          <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
        <div class="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono">
          <span class="text-slate-400">BPM:</span>
          <input type="range" id="tempo-slider" min="70" max="150" value="120" oninput="updateTempo(this.value)" class="w-20 accent-cyan-400 cursor-pointer">
          <span id="tempo-val" class="font-bold text-cyan-400 w-8">120</span>
        </div>
      </div>
    </header>

    <div class="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 shadow-xl">
      <div class="flex justify-between items-center mb-2 px-2">
        <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <i data-lucide="activity" class="w-3.5 h-3.5 text-cyan-400"></i> Osciloscopio en Tiempo Real
        </span>
        <span class="text-[10px] text-cyan-400 font-mono">Web Audio API • 44.1 kHz</span>
      </div>
      <canvas id="scope-canvas" class="w-full h-28 bg-slate-950 rounded-2xl border border-slate-800/80"></canvas>
    </div>

    <div class="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
      <div class="flex justify-between items-center">
        <h2 class="text-xs font-black uppercase text-slate-300 tracking-wider flex items-center gap-2">
          <i data-lucide="disc" class="w-4 h-4 text-pink-400"></i> Matriz Rítmica (16 Pasos)
        </h2>
        <span class="text-[10px] text-slate-500 font-mono">Haz clic en los pads para activar notas</span>
      </div>

      <div class="space-y-2.5 overflow-x-auto pb-2" id="sequencer-rows"></div>
    </div>

    <div class="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
      <div class="flex justify-between items-center">
        <h2 class="text-xs font-black uppercase text-slate-300 tracking-wider flex items-center gap-2">
          <i data-lucide="sliders" class="w-4 h-4 text-cyan-400"></i> Teclado Sintetizador Analógico
        </h2>
        <div class="flex items-center gap-2">
          <span class="text-[11px] text-slate-400">Onda:</span>
          <select id="wave-type" class="bg-slate-950 border border-slate-800 rounded-xl px-2 py-1 text-xs text-cyan-300 outline-none">
            <option value="sawtooth">Sawtooth (Sintético)</option>
            <option value="sine">Sine (Suave)</option>
            <option value="square">Square (8-bit Retro)</option>
            <option value="triangle">Triangle (Cálido)</option>
          </select>
        </div>
      </div>

      <div class="flex justify-center gap-1.5 sm:gap-2 pt-2">
        <button onmousedown="playKey(261.63)" class="key px-3 sm:px-5 py-8 bg-slate-800 border border-slate-700 rounded-xl font-bold text-xs hover:border-cyan-400 transition-all cursor-pointer">Do</button>
        <button onmousedown="playKey(293.66)" class="key px-3 sm:px-5 py-8 bg-slate-800 border border-slate-700 rounded-xl font-bold text-xs hover:border-cyan-400 transition-all cursor-pointer">Re</button>
        <button onmousedown="playKey(329.63)" class="key px-3 sm:px-5 py-8 bg-slate-800 border border-slate-700 rounded-xl font-bold text-xs hover:border-cyan-400 transition-all cursor-pointer">Mi</button>
        <button onmousedown="playKey(349.23)" class="key px-3 sm:px-5 py-8 bg-slate-800 border border-slate-700 rounded-xl font-bold text-xs hover:border-cyan-400 transition-all cursor-pointer">Fa</button>
        <button onmousedown="playKey(392.00)" class="key px-3 sm:px-5 py-8 bg-slate-800 border border-slate-700 rounded-xl font-bold text-xs hover:border-cyan-400 transition-all cursor-pointer">Sol</button>
        <button onmousedown="playKey(440.00)" class="key px-3 sm:px-5 py-8 bg-slate-800 border border-slate-700 rounded-xl font-bold text-xs hover:border-cyan-400 transition-all cursor-pointer">La</button>
        <button onmousedown="playKey(493.88)" class="key px-3 sm:px-5 py-8 bg-slate-800 border border-slate-700 rounded-xl font-bold text-xs hover:border-cyan-400 transition-all cursor-pointer">Si</button>
        <button onmousedown="playKey(523.25)" class="key px-3 sm:px-5 py-8 bg-cyan-600/30 border border-cyan-400 rounded-xl font-bold text-xs hover:bg-cyan-500 transition-all cursor-pointer">Do^</button>
      </div>
    </div>

  </div>

  <script>
    let audioCtx = null, analyser = null, isPlaying = false, currentStep = 0, bpm = 120, timerId = null;

    const tracks = [
      { name: 'Sintetizador Lead', color: 'cyan', steps: [1,0,0,0, 1,0,0,0, 1,0,1,0, 0,0,1,0], freq: 440 },
      { name: 'Línea de Bajo', color: 'pink', steps: [1,0,0,1, 0,0,1,0, 1,0,0,1, 0,0,1,0], freq: 110 },
      { name: 'Caja / Snare', color: 'amber', steps: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], isNoise: true },
      { name: 'Bombo / Kick', color: 'emerald', steps: [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0], isKick: true }
    ];

    function initAudio() {
      if (audioCtx) return;
      const AudioClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioClass();

      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.connect(audioCtx.destination);
      drawOscilloscope();
    }

    function renderSequencerUI() {
      const container = document.getElementById('sequencer-rows');
      container.innerHTML = '';

      tracks.forEach((track, tIdx) => {
        const row = document.createElement('div');
        row.className = 'flex items-center gap-2 min-w-[650px]';

        const label = document.createElement('div');
        label.className = 'w-32 text-xs font-bold text-slate-300 shrink-0';
        label.innerText = track.name;
        row.appendChild(label);

        const stepsWrapper = document.createElement('div');
        stepsWrapper.className = 'grid grid-cols-16 gap-1.5 flex-1';

        for (let i = 0; i < 16; i++) {
          const btn = document.createElement('button');
          btn.id = 'step-' + tIdx + '-' + i;
          btn.className = 'h-8 rounded-lg border border-slate-800 transition-all cursor-pointer ' + 
            (track.steps[i] ? 'step-active' : 'bg-slate-950/70 hover:bg-slate-800');
          btn.onclick = () => {
            track.steps[i] = track.steps[i] ? 0 : 1;
            renderSequencerUI();
          };
          stepsWrapper.appendChild(btn);
        }

        row.appendChild(stepsWrapper);
        container.appendChild(row);
      });
    }

    function playSound(track) {
      if (!audioCtx) return;
      const now = audioCtx.currentTime;

      if (track.isKick) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.3);
        gain.gain.setValueAtTime(1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.connect(gain);
        gain.connect(analyser);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (track.isNoise) {
        const bufferSize = audioCtx.sampleRate * 0.15;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        noise.connect(gain);
        gain.connect(analyser);
        noise.start(now);
      } else {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = document.getElementById('wave-type').value;
        osc.frequency.setValueAtTime(track.freq, now);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(analyser);
        osc.start(now);
        osc.stop(now + 0.25);
      }
    }

    function playKey(freq) {
      initAudio();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = document.getElementById('wave-type').value;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.connect(gain);
      gain.connect(analyser);
      osc.start(now);
      osc.stop(now + 0.6);
    }

    function stepLoop() {
      document.querySelectorAll('.step-current').forEach(el => el.classList.remove('step-current'));

      tracks.forEach((track, tIdx) => {
        const btn = document.getElementById('step-' + tIdx + '-' + currentStep);
        if (btn) btn.classList.add('step-current');
        if (track.steps[currentStep]) {
          playSound(track);
        }
      });

      currentStep = (currentStep + 1) % 16;
      const interval = (60 / bpm / 4) * 1000;
      timerId = setTimeout(stepLoop, interval);
    }

    function togglePlay() {
      initAudio();
      if (audioCtx.state === 'suspended') audioCtx.resume();

      isPlaying = !isPlaying;
      const playText = document.getElementById('play-text');
      const playIcon = document.getElementById('play-icon');

      if (isPlaying) {
        currentStep = 0;
        stepLoop();
        playText.innerText = 'PAUSAR';
        playIcon.setAttribute('data-lucide', 'pause');
      } else {
        clearTimeout(timerId);
        document.querySelectorAll('.step-current').forEach(el => el.classList.remove('step-current'));
        playText.innerText = 'REPRODUCIR';
        playIcon.setAttribute('data-lucide', 'play');
      }
      lucide.createIcons();
    }

    function clearSteps() {
      tracks.forEach(t => t.steps.fill(0));
      renderSequencerUI();
    }

    function updateTempo(val) {
      bpm = parseInt(val, 10);
      document.getElementById('tempo-val').innerText = bpm;
    }

    function drawOscilloscope() {
      requestAnimationFrame(drawOscilloscope);
      if (!analyser) return;

      const canvas = document.getElementById('scope-canvas');
      const ctx = canvas.getContext('2d');
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteTimeDomainData(dataArray);

      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = '#22d3ee';
      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    }

    document.addEventListener('DOMContentLoaded', () => {
      lucide.createIcons();
      renderSequencerUI();
      const canvas = document.getElementById('scope-canvas');
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = 112;
    });
  </script>
</body>
</html>`
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
  // 5. 📊 SAAS ENTERPRISE METRICS & CRM ANALYTICS (FinTech Dashboard)
  // =========================================================================
  {
    id: 'analytics-dashboard-pro',
    name: '📊 Dashboard SaaS & CRM Enterprise',
    description: 'Panel de control interactivo con gráficos en tiempo real (Chart.js), métricas MRR, transacciones y filtros',
    icon: 'BarChart3',
    category: 'SaaS / Dashboards',
    tags: ['Chart.js', 'FinTech', 'SaaS', 'Tailwind CSS'],
    badge: 'Enterprise',
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
  <title>AURA SaaS Analytics</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
</head>
<body class="bg-slate-950 text-white min-h-screen p-6 font-sans">
  <div class="max-w-7xl mx-auto space-y-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 p-6 rounded-3xl border border-slate-800">
      <div>
        <h1 class="text-2xl font-bold text-white">Métricas de Crecimiento Global</h1>
        <p class="text-xs text-slate-400">Datos en tiempo real sincronizados</p>
      </div>
      <button onclick="refreshData()" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30">
        <i data-lucide="refresh-cw" class="w-4 h-4"></i> Actualizar KPIs
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
      <div class="bg-slate-900 p-6 rounded-3xl border border-slate-800">
        <span class="text-xs text-slate-400 font-semibold">Ingresos Mensuales Recurrentes (MRR)</span>
        <div class="mt-2 flex items-baseline justify-between">
          <span id="mrr" class="text-3xl font-black text-white">$64,250</span>
          <span class="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg">+22.4%</span>
        </div>
      </div>
      <div class="bg-slate-900 p-6 rounded-3xl border border-slate-800">
        <span class="text-xs text-slate-400 font-semibold">Usuarios Activos (MAU)</span>
        <div class="mt-2 flex items-baseline justify-between">
          <span id="mau" class="text-3xl font-black text-white">12,480</span>
          <span class="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-lg">+14.1%</span>
        </div>
      </div>
      <div class="bg-slate-900 p-6 rounded-3xl border border-slate-800">
        <span class="text-xs text-slate-400 font-semibold">Tasa de Conversión</span>
        <div class="mt-2 flex items-baseline justify-between">
          <span id="cr" class="text-3xl font-black text-white">5.82%</span>
          <span class="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg">+1.2%</span>
        </div>
      </div>
    </div>

    <div class="bg-slate-900 p-6 rounded-3xl border border-slate-800">
      <h3 class="text-sm font-bold text-slate-300 mb-4">Crecimiento de Facturación (Últimos 6 Meses)</h3>
      <div class="h-64">
        <canvas id="revChart"></canvas>
      </div>
    </div>
  </div>

  <script>
    let chart;
    function initChart() {
      const ctx = document.getElementById('revChart').getContext('2d');
      chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
          datasets: [{
            label: 'Ingresos ($ USD)',
            data: [32000, 39000, 44000, 49000, 56000, 64250],
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { grid: { color: '#1e293b' }, ticks: { color: '#94a3b8' } },
            x: { grid: { color: '#1e293b' }, ticks: { color: '#94a3b8' } }
          }
        }
      });
    }

    function refreshData() {
      const newMRR = 60000 + Math.floor(Math.random() * 15000);
      document.getElementById('mrr').innerText = '$' + newMRR.toLocaleString();
      chart.data.datasets[0].data[5] = newMRR;
      chart.update();
    }

    document.addEventListener('DOMContentLoaded', () => {
      lucide.createIcons();
      initChart();
    });
  </script>
</body>
</html>`
      }
    ]
  },

  // =========================================================================
  // 6. 🛍️ LUXURY MODERN E-COMMERCE STORE
  // =========================================================================
  {
    id: 'ecommerce-store-pro',
    name: '🛍️ E-Commerce Cyberpunk Store',
    description: 'Tienda moderna con catálogo de gadgets, carrito deslizante reactivo, cálculo de totales y checkout modal',
    icon: 'ShoppingBag',
    category: 'E-Commerce',
    tags: ['E-Commerce', 'Carrito', 'Checkout', 'Tailwind CSS'],
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
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AURA — Tienda Oficial</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased">
  <header class="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex justify-between items-center">
    <span class="font-extrabold text-xl text-white">AURA<span class="text-indigo-400">.</span>store</span>
    <button onclick="toggleCart()" class="relative p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-2 cursor-pointer">
      <i data-lucide="shopping-cart" class="w-5 h-5"></i>
      <span id="cartCount" class="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">0</span>
    </button>
  </header>

  <main class="max-w-7xl mx-auto px-6 py-12 flex-1">
    <div id="productGrid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"></div>
  </main>

  <div id="cartModal" class="fixed inset-0 z-50 bg-black/60 hidden flex justify-end">
    <div class="bg-slate-900 w-full max-w-md h-full flex flex-col p-6 shadow-2xl border-l border-slate-800">
      <div class="flex justify-between items-center pb-4 border-b border-slate-800">
        <h2 class="font-bold text-lg text-white">Tu Carrito</h2>
        <button onclick="toggleCart()" class="p-2 text-slate-400 hover:text-white"><i data-lucide="x" class="w-5 h-5"></i></button>
      </div>
      <div id="cartItems" class="flex-1 overflow-y-auto py-4 space-y-3"></div>
      <div class="border-t border-slate-800 pt-4 space-y-4">
        <div class="flex justify-between font-bold">
          <span>Total:</span>
          <span id="cartTotal" class="text-xl text-indigo-400">$0.00</span>
        </div>
        <button onclick="alert('¡Compra simulada completada con éxito!')" class="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 font-bold rounded-xl text-white cursor-pointer">Pagar Ahora</button>
      </div>
    </div>
  </div>

  <script>
    const products = [
      { id: 1, name: 'Neural Headset Pro', price: 299, desc: 'Interfaz de audio neural con cancelación activa 8K', icon: 'headphones' },
      { id: 2, name: 'Quantum Watch Ultra', price: 199, desc: 'Monitor biométrico con batería holográfica de 30 días', icon: 'watch' },
      { id: 3, name: 'HoloLens Cyber Goggles', price: 449, desc: 'Visor de realidad aumentada con visión nocturna', icon: 'glasses' }
    ];
    let cart = [];

    function renderProducts() {
      const grid = document.getElementById('productGrid');
      grid.innerHTML = products.map(p => \`
        <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between shadow-xl">
          <div>
            <div class="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mb-4"><i data-lucide="\${p.icon}" class="w-6 h-6"></i></div>
            <h3 class="text-lg font-bold text-white">\${p.name}</h3>
            <p class="text-xs text-slate-400 mt-2">\${p.desc}</p>
          </div>
          <div class="mt-6 flex items-center justify-between">
            <span class="text-xl font-extrabold text-white">$\${p.price}</span>
            <button onclick="addToCart(\${p.id})" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white cursor-pointer">Añadir</button>
          </div>
        </div>
      \`).join('');
      lucide.createIcons();
    }

    function addToCart(id) {
      const item = products.find(p => p.id === id);
      cart.push(item);
      updateCartUI();
    }

    function toggleCart() {
      document.getElementById('cartModal').classList.toggle('hidden');
    }

    function updateCartUI() {
      document.getElementById('cartCount').innerText = cart.length;
      document.getElementById('cartItems').innerHTML = cart.map((item, idx) => \`
        <div class="flex justify-between items-center bg-slate-950 p-3 rounded-2xl border border-slate-800">
          <div><h4 class="text-xs font-bold text-white">\${item.name}</h4><span class="text-xs text-indigo-400">$\${item.price}</span></div>
          <button onclick="removeFromCart(\${idx})" class="text-rose-400 text-xs">Quitar</button>
        </div>
      \`).join('');
      const total = cart.reduce((acc, i) => acc + i.price, 0);
      document.getElementById('cartTotal').innerText = '$' + total.toFixed(2);
    }

    function removeFromCart(idx) {
      cart.splice(idx, 1);
      updateCartUI();
    }

    document.addEventListener('DOMContentLoaded', renderProducts);
  </script>
</body>
</html>`
      }
    ]
  },

  // =========================================================================
  // 7. 📱 FITPULSE MOBILE FITNESS APP (iOS Mockup)
  // =========================================================================
  {
    id: 'mobile-fitness-ios',
    name: '📱 FitPulse iOS Fitness App',
    description: 'Aplicación móvil de salud con marco iPhone 15, Dynamic Island interactiva, anillos de calorías y temporizador',
    icon: 'Smartphone',
    category: 'Móvil iOS',
    tags: ['Mobile UI', 'iOS Frame', 'Fitness', 'Salud'],
    badge: 'Mobile',
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
  <title>PulseFit iOS</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
</head>
<body class="bg-slate-950 text-white min-h-screen flex items-center justify-center p-4">
  <div class="w-[360px] h-[680px] bg-slate-900 border-4 border-slate-800 rounded-[45px] shadow-2xl flex flex-col overflow-hidden relative">
    <div class="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-50 flex items-center justify-between px-2">
      <div class="w-2.5 h-2.5 rounded-full bg-slate-950"></div>
      <div class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
    </div>
    <div class="flex-1 overflow-y-auto p-5 pt-12 space-y-5">
      <h2 class="text-xl font-extrabold text-white">Tu Actividad</h2>
      <div class="bg-indigo-600/30 border border-indigo-500/40 p-4 rounded-3xl flex justify-between items-center">
        <div>
          <span class="text-xs text-indigo-300">Calorías Quemadas</span>
          <div class="text-2xl font-black text-white mt-1">680 / 800 kcal</div>
        </div>
        <div class="w-14 h-14 rounded-full border-4 border-indigo-500 flex items-center justify-center font-bold">85%</div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div class="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700">
          <span class="text-[10px] text-slate-400 block">Ritmo Cardíaco</span>
          <span class="text-lg font-bold text-white">74 BPM</span>
        </div>
        <div class="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700">
          <span class="text-[10px] text-slate-400 block">Pasos</span>
          <span class="text-lg font-bold text-white">8,420</span>
        </div>
      </div>
      <button onclick="alert('¡Entrenamiento iniciado!')" class="w-full py-3 bg-indigo-600 font-bold rounded-2xl cursor-pointer">Iniciar Cardio HIIT</button>
    </div>
  </div>
  <script>document.addEventListener('DOMContentLoaded', () => lucide.createIcons());</script>
</body>
</html>`
      }
    ]
  },

  // =========================================================================
  // 8. 🐾 TAMAGOTCHI VIRTUAL PET PRO
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
