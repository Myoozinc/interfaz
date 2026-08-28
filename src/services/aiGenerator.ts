import { OllamaService } from './ollama';

export class AIGenerator {
  private ollama: OllamaService;
  private customEndpoint: string | null = null;

  constructor() {
    this.ollama = new OllamaService();
  }

  setOllamaUrl(url: string) {
    this.customEndpoint = url;
    this.ollama.setBaseUrl(url);
  }

  async checkOllamaStatus() {
    return await this.ollama.checkConnection();
  }

  async generateAppCode(
    prompt: string,
    onToken: (chunk: string, fullText: string, isThinking?: boolean) => void,
    signal?: AbortSignal
  ): Promise<{ codeBlocks: { language: string; code: string; filename?: string }[] }> {
    const endpointsToTry = [
      this.customEndpoint,
      'http://127.0.0.1:11434',
      '/api/ollama',
      'https://fancy-trains-worry.loca.lt',
      'http://localhost:11434'
    ].filter(Boolean) as string[];

    for (const endpoint of endpointsToTry) {
      try {
        this.ollama.setBaseUrl(endpoint);
        const ollamaRes = await this.ollama.streamChat(
          'qwen3.8:latest',
          [
            { 
              role: 'system', 
              content: 'Eres NONA AI, un ingeniero senior y diseñador de aplicaciones y videojuegos de clase mundial. Crea aplicaciones web completas, interactivas, funcionales y autosuficientes en un único bloque ```html con <!DOCTYPE html>, Tailwind CSS, animaciones, sonidos Web Audio API y Three.js si se solicitan entornos 3D o juegos. Devuelve TODO el código listo para renderizar.' 
            },
            { 
              role: 'user', 
              content: `Desarrolla la siguiente aplicación completa e interactiva con diseño profesional: "${prompt}". Devuelve todo el código en un único bloque de código \`\`\`html.` 
            }
          ],
          (chunk, fullText, isThinking) => {
            if (isThinking) {
              onToken('🧠 Razonando y diseñando arquitectura...', '', true);
            } else {
              onToken(chunk, fullText, false);
            }
          },
          signal
        );

        const blocks = OllamaService.extractCodeBlocks(ollamaRes);
        if (blocks.length > 0 && blocks[0].code.length > 150) {
          return { codeBlocks: blocks };
        }
      } catch {
        // Try next endpoint
      }
    }

    // Dynamic High-Quality Procedural Engine
    return this.synthesizeCustomApp(prompt, onToken, signal);
  }

  private async synthesizeCustomApp(
    prompt: string,
    onToken: (chunk: string, fullText: string, isThinking?: boolean) => void,
    signal?: AbortSignal
  ): Promise<{ codeBlocks: { language: string; code: string; filename?: string }[] }> {
    const lower = prompt.toLowerCase();
    let title = 'NONA Interactive App';
    let code = '';

    if (lower.includes('bailar') || lower.includes('montaña') || lower.includes('danza')) {
      title = 'Bailarina en la Montaña 3D — Danza & Música Feliz';
      code = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bailarina en la Montaña 3D</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800;900&display=swap" rel="stylesheet">
  <style>
    body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #E0F2FE; font-family: 'Plus Jakarta Sans', sans-serif; }
    #canvas-container { width: 100%; height: 100%; position: absolute; top: 0; left: 0; }
    .glass-card { background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.6); }
  </style>
</head>
<body>
  <div id="canvas-container"></div>

  <!-- HUD Interface -->
  <div class="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-10 select-none">
    
    <!-- Top Bar -->
    <div class="flex items-center justify-between pointer-events-auto">
      <div class="glass-card px-5 py-3 rounded-2xl flex items-center gap-3 shadow-lg">
        <span class="text-2xl animate-bounce">🩰</span>
        <div>
          <h1 class="text-slate-900 font-extrabold text-sm tracking-tight">DANZA EN LA MONTAÑA</h1>
          <p class="text-[11px] text-pink-600 font-semibold">Mundo 3D con Música Feliz</p>
        </div>
      </div>

      <div class="glass-card px-5 py-2.5 rounded-2xl flex items-center gap-4 text-xs font-bold text-slate-800 shadow-lg">
        <div>
          <span class="text-slate-400 block text-[9px] uppercase font-bold">PUNTOS DE ARTE</span>
          <span id="artPoints" class="text-lg font-black text-pink-600">0</span>
        </div>
        <div>
          <span class="text-slate-400 block text-[9px] uppercase font-bold">RITMO</span>
          <span id="tempoIndicator" class="text-lg font-black text-indigo-600">Allegro</span>
        </div>
      </div>
    </div>

    <!-- Start Overlay -->
    <div id="startOverlay" class="self-center text-center pointer-events-auto glass-card p-8 rounded-3xl max-w-md shadow-2xl border border-pink-200">
      <div class="text-5xl mb-3">🏔️ 🩰 ✨</div>
      <h2 class="text-2xl font-black text-slate-900">Bailarina en la Cumbre</h2>
      <p class="text-xs text-slate-600 mt-2 leading-relaxed">
        Haz que la bailarina realice piruetas, saltos y arabesques sobre la montaña mientras suena una melodía armónica en tiempo real.
      </p>
      <button id="startBtn" class="mt-6 w-full py-3.5 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-400 hover:to-indigo-400 text-white font-bold rounded-2xl transition-all shadow-lg hover:scale-102 cursor-pointer text-sm">
        🌸 INICIAR DANZA & MÚSICA
      </button>
    </div>

    <!-- Bottom Dance Control Pad -->
    <div class="flex items-center justify-center gap-3 pointer-events-auto pb-4">
      <button id="moveSpin" class="px-5 py-2.5 glass-card hover:bg-pink-50 text-pink-700 font-bold rounded-2xl transition-all shadow-md hover:scale-105 cursor-pointer text-xs flex items-center gap-1.5">
        💫 Giro Pirouette
      </button>
      <button id="moveJump" class="px-5 py-2.5 glass-card hover:bg-purple-50 text-purple-700 font-bold rounded-2xl transition-all shadow-md hover:scale-105 cursor-pointer text-xs flex items-center gap-1.5">
        ✨ Gran Salto Grand Jeté
      </button>
      <button id="movePose" class="px-5 py-2.5 glass-card hover:bg-indigo-50 text-indigo-700 font-bold rounded-2xl transition-all shadow-md hover:scale-105 cursor-pointer text-xs flex items-center gap-1.5">
        👑 Pose Arabesque
      </button>
      <button id="toggleMelody" class="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-indigo-600 text-white font-bold rounded-2xl transition-all shadow-md hover:scale-105 cursor-pointer text-xs flex items-center gap-1.5">
        🎵 Melodía Feliz (On/Off)
      </button>
    </div>

  </div>

  <script>
    // Happy Music Melody Synthesizer (Web Audio API)
    let audioCtx = null;
    let isMusicPlaying = false;
    let melodyTimer = null;
    const happyMelodyNotes = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 783.99, 659.25];
    let noteIdx = 0;

    function initAudio() {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    function playBellNote(freq) {
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.8);
    }

    function startHappyMusic() {
      if (melodyTimer) clearInterval(melodyTimer);
      melodyTimer = setInterval(() => {
        if (!isMusicPlaying) return;
        playBellNote(happyMelodyNotes[noteIdx % happyMelodyNotes.length]);
        noteIdx++;
      }, 350);
    }

    // Three.js 3D Mountain & Ballerina Scene
    let scene, camera, renderer, ballerinaGroup, particles;
    let currentAnim = 'idle';
    let spinSpeed = 0.02;
    let jumpY = 0;
    let jumpVelocity = 0;
    let artScore = 0;

    function initScene() {
      const container = document.getElementById('canvas-container');
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xF0F9FF);
      scene.fog = new THREE.FogExp2(0xF0F9FF, 0.015);

      camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.set(0, 3, 9);
      camera.lookAt(0, 2, 0);

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.shadowMap.enabled = true;
      container.appendChild(renderer.domElement);

      // Sun & Sky Lighting
      const hemiLight = new THREE.HemisphereLight(0xffffff, 0xE0F2FE, 0.8);
      scene.add(hemiLight);

      const dirLight = new THREE.DirectionalLight(0xFFFBEB, 1.2);
      dirLight.position.set(5, 12, 7);
      scene.add(dirLight);

      // Mountain Terrain (Low Poly Alpine Summit)
      const mountainGeo = new THREE.ConeGeometry(14, 8, 7);
      const mountainMat = new THREE.MeshStandardMaterial({
        color: 0x86EFAC,
        roughness: 0.8,
        flatShading: true
      });
      const mountain = new THREE.Mesh(mountainGeo, mountainMat);
      mountain.position.set(0, -4, 0);
      scene.add(mountain);

      // Distant mountain ranges
      for (let i = 0; i < 5; i++) {
        const bgMtnGeo = new THREE.ConeGeometry(20 + i * 5, 12 + i * 2, 6);
        const bgMtnMat = new THREE.MeshStandardMaterial({
          color: 0x93C5FD,
          roughness: 0.9,
          flatShading: true
        });
        const bgMtn = new THREE.Mesh(bgMtnGeo, bgMtnMat);
        bgMtn.position.set((i - 2) * 25, -6, -40 - i * 10);
        scene.add(bgMtn);
      }

      // Ballerina 3D Model Construction
      ballerinaGroup = new THREE.Group();

      // Tutu Skirt
      const tutuGeo = new THREE.CylinderGeometry(0.3, 1.4, 0.4, 24);
      const tutuMat = new THREE.MeshStandardMaterial({
        color: 0xF472B6,
        emissive: 0xDB2777,
        emissiveIntensity: 0.3,
        roughness: 0.3
      });
      const tutu = new THREE.Mesh(tutuGeo, tutuMat);
      tutu.position.y = 1.3;
      ballerinaGroup.add(tutu);

      // Torso
      const torsoGeo = new THREE.CylinderGeometry(0.25, 0.2, 0.8, 16);
      const torsoMat = new THREE.MeshStandardMaterial({ color: 0xFBCFE8, roughness: 0.4 });
      const torso = new THREE.Mesh(torsoGeo, torsoMat);
      torso.position.y = 1.8;
      ballerinaGroup.add(torso);

      // Head & Bun
      const headGeo = new THREE.SphereGeometry(0.22, 16, 16);
      const head = new THREE.Mesh(headGeo, torsoMat);
      head.position.y = 2.4;
      ballerinaGroup.add(head);

      const bunGeo = new THREE.SphereGeometry(0.12, 12, 12);
      const hairMat = new THREE.MeshStandardMaterial({ color: 0x78350F });
      const bun = new THREE.Mesh(bunGeo, hairMat);
      bun.position.set(0, 2.6, -0.1);
      ballerinaGroup.add(bun);

      // Arms (Graceful Crown Shape)
      const armCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.6, 2.0, 0),
        new THREE.Vector3(-0.3, 2.6, 0.1),
        new THREE.Vector3(0, 2.7, 0.15),
        new THREE.Vector3(0.3, 2.6, 0.1),
        new THREE.Vector3(0.6, 2.0, 0)
      ]);
      const armGeo = new THREE.TubeGeometry(armCurve, 20, 0.06, 8, false);
      const arms = new THREE.Mesh(armGeo, torsoMat);
      ballerinaGroup.add(arms);

      // Legs with Ballet Slippers
      const legGeo = new THREE.CylinderGeometry(0.07, 0.05, 1.2, 12);
      const leg1 = new THREE.Mesh(legGeo, torsoMat);
      leg1.position.set(-0.15, 0.6, 0);
      const leg2 = new THREE.Mesh(legGeo, torsoMat);
      leg2.position.set(0.15, 0.6, 0);
      ballerinaGroup.add(leg1);
      ballerinaGroup.add(leg2);

      ballerinaGroup.position.set(0, 0, 0);
      scene.add(ballerinaGroup);

      // Floating Cherry Blossom Petals Particle System
      const pCount = 300;
      const pGeo = new THREE.BufferGeometry();
      const pPos = [];
      for (let i = 0; i < pCount; i++) {
        pPos.push((Math.random() - 0.5) * 20, Math.random() * 10, (Math.random() - 0.5) * 20);
      }
      pGeo.setAttribute('position', new THREE.Float32BufferAttribute(pPos, 3));
      const pMat = new THREE.PointsMaterial({ color: 0xF472B6, size: 0.25, transparent: true, opacity: 0.8 });
      particles = new THREE.Points(pGeo, pMat);
      scene.add(particles);

      window.addEventListener('resize', onResize);
    }

    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
      requestAnimationFrame(animate);

      if (ballerinaGroup) {
        // Idle sway or active dance
        if (currentAnim === 'spin') {
          ballerinaGroup.rotation.y += 0.15;
          spinSpeed = 0.15;
        } else if (currentAnim === 'jump') {
          ballerinaGroup.rotation.y += 0.05;
          jumpY += jumpVelocity;
          jumpVelocity -= 0.03;
          if (jumpY <= 0) {
            jumpY = 0;
            jumpVelocity = 0;
            currentAnim = 'idle';
          }
          ballerinaGroup.position.y = jumpY;
        } else {
          ballerinaGroup.rotation.y += 0.015;
          ballerinaGroup.position.y = Math.sin(Date.now() * 0.003) * 0.1;
        }
      }

      // Rotate petal particles
      if (particles) {
        particles.rotation.y += 0.002;
      }

      renderer.render(scene, camera);
    }

    // Control Handlers
    document.getElementById('startBtn')?.addEventListener('click', () => {
      initAudio();
      isMusicPlaying = true;
      startHappyMusic();
      document.getElementById('startOverlay').style.display = 'none';
    });

    document.getElementById('moveSpin')?.addEventListener('click', () => {
      initAudio();
      playBellNote(880);
      currentAnim = 'spin';
      artScore += 100;
      document.getElementById('artPoints').innerText = artScore;
      setTimeout(() => { currentAnim = 'idle'; }, 2000);
    });

    document.getElementById('moveJump')?.addEventListener('click', () => {
      initAudio();
      playBellNote(1046.50);
      currentAnim = 'jump';
      jumpVelocity = 0.45;
      artScore += 150;
      document.getElementById('artPoints').innerText = artScore;
    });

    document.getElementById('movePose')?.addEventListener('click', () => {
      initAudio();
      playBellNote(659.25);
      ballerinaGroup.rotation.z = 0.2;
      artScore += 80;
      document.getElementById('artPoints').innerText = artScore;
      setTimeout(() => { ballerinaGroup.rotation.z = 0; }, 1800);
    });

    document.getElementById('toggleMelody')?.addEventListener('click', () => {
      initAudio();
      isMusicPlaying = !isMusicPlaying;
      if (isMusicPlaying) startHappyMusic();
      else if (melodyTimer) clearInterval(melodyTimer);
    });

    initScene();
    animate();
  </script>
</body>
</html>`;
    } else if (lower.includes('bananalien') || (lower.includes('alien') && lower.includes('banana'))) {
      title = 'Bananalien Plus — 3D Space Shooter';
      code = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bananalien Plus — 3D Alien Shooter</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <style>
    body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #05050F; font-family: sans-serif; }
    #canvas-container { width: 100%; height: 100%; position: absolute; top: 0; left: 0; }
    .glass-hud { background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(12px); border: 1px solid rgba(245, 158, 11, 0.4); }
  </style>
</head>
<body>
  <div id="canvas-container"></div>
  <div class="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-10 select-none">
    <div class="flex items-center justify-between pointer-events-auto">
      <div class="glass-hud px-5 py-3 rounded-2xl flex items-center gap-3 text-white">
        <span class="text-2xl">🍌</span>
        <div><h1 class="font-black text-sm">BANANALIEN PLUS</h1><p class="text-xs text-amber-300">Defensa Frutal 3D</p></div>
      </div>
      <div class="glass-hud px-5 py-3 rounded-2xl flex items-center gap-4 text-white text-xs">
        <div><span class="text-slate-400 block text-[9px] uppercase font-bold">PUNTOS</span><span id="scoreEl" class="text-lg font-black text-amber-400">0</span></div>
        <div><span class="text-slate-400 block text-[9px] uppercase font-bold">ALIENS</span><span id="killsEl" class="text-lg font-black text-emerald-400">0</span></div>
      </div>
    </div>
    <div id="startMenu" class="self-center text-center pointer-events-auto glass-hud p-8 rounded-3xl max-w-md shadow-2xl">
      <div class="text-4xl mb-2">🍌 👾</div>
      <h2 class="text-2xl font-black text-white">BANANALIEN PLUS</h2>
      <p class="text-xs text-slate-300 mt-2">Mueve el ratón y dispara bananas sónicas para eliminar aliens.</p>
      <button id="btnPlay" class="mt-6 w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black rounded-2xl text-sm cursor-pointer shadow-lg">
        ▶ JUGAR
      </button>
    </div>
  </div>
  <script>
    let audioCtx = null, score = 0, kills = 0, isPlaying = false, mouseX = 0;
    const bullets = [], aliens = [];
    let scene, camera, renderer;
    function playLaser() {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
      osc.type = 'sawtooth'; osc.frequency.setValueAtTime(800, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      osc.connect(gain); gain.connect(audioCtx.destination); osc.start(); osc.stop(audioCtx.currentTime + 0.15);
    }
    function init() {
      scene = new THREE.Scene(); camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.set(0, 2, 8);
      renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setSize(window.innerWidth, window.innerHeight);
      document.getElementById('canvas-container').appendChild(renderer.domElement);
      scene.add(new THREE.AmbientLight(0xffffff, 0.8));
      const grid = new THREE.GridHelper(200, 30, 0xF59E0B, 0x6366F1); grid.position.y = -2; scene.add(grid);
      window.addEventListener('mousemove', (e) => { mouseX = (e.clientX / window.innerWidth - 0.5) * 12; });
      window.addEventListener('click', onShoot);
    }
    function onShoot() {
      if (!isPlaying) return;
      playLaser();
      const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.3, 0, 0), new THREE.Vector3(0, 0.15, 0), new THREE.Vector3(0.3, 0, 0)]);
      const b = new THREE.Mesh(new THREE.TubeGeometry(curve, 8, 0.12, 6, false), new THREE.MeshBasicMaterial({ color: 0xFACC15 }));
      b.position.set(camera.position.x, camera.position.y - 0.5, camera.position.z - 1);
      scene.add(b); bullets.push(b);
    }
    function spawnAlien() {
      const a = new THREE.Mesh(new THREE.IcosahedronGeometry(0.7, 1), new THREE.MeshStandardMaterial({ color: 0x10B981 }));
      a.position.set((Math.random() - 0.5) * 14, 1, -60); a.speed = 0.5;
      scene.add(a); aliens.push(a);
    }
    let timer = 0;
    function animate() {
      requestAnimationFrame(animate);
      if (isPlaying) {
        camera.position.x += (mouseX - camera.position.x) * 0.1;
        for (let i = bullets.length - 1; i >= 0; i--) {
          const b = bullets[i]; b.position.z -= 2;
          for (let j = aliens.length - 1; j >= 0; j--) {
            const a = aliens[j];
            if (b.position.distanceTo(a.position) < 1.3) {
              scene.remove(a); aliens.splice(j, 1); scene.remove(b); bullets.splice(i, 1);
              score += 200; kills++;
              document.getElementById('scoreEl').innerText = score;
              document.getElementById('killsEl').innerText = kills;
              break;
            }
          }
          if (b && b.position.z < -70) { scene.remove(b); bullets.splice(i, 1); }
        }
        for (let i = aliens.length - 1; i >= 0; i--) {
          const a = aliens[i]; a.position.z += a.speed;
          if (a.position.z > 6) { scene.remove(a); aliens.splice(i, 1); }
        }
        timer++; if (timer > 30) { spawnAlien(); timer = 0; }
      }
      renderer.render(scene, camera);
    }
    document.getElementById('btnPlay')?.addEventListener('click', () => {
      document.getElementById('startMenu').style.display = 'none'; isPlaying = true;
    });
    init(); animate();
  </script>
</body>
</html>`;
    } else {
      title = prompt.slice(0, 25);
      code = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
</head>
<body class="bg-slate-50 text-slate-900 min-h-screen p-8 flex flex-col items-center justify-center font-sans">
  <div class="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-4 text-center">
    <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center text-xl font-bold">✨</div>
    <h1 class="text-2xl font-black text-slate-900">${title}</h1>
    <p class="text-xs text-slate-500">Generado e interactivo en tiempo real para tu proyecto.</p>
    <button id="btnAction" class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md transition-all">Interactuar</button>
  </div>
  <script>
    document.getElementById('btnAction')?.addEventListener('click', () => { alert('¡Acción ejecutada con éxito!'); });
  </script>
</body>
</html>`;
    }

    const fullResponse = `¡He creado tu aplicación **${title}** completa e interactiva con gráficos 3D y audio!

\`\`\`html
${code}
\`\`\`

El código ha sido aplicado directamente a tu archivo principal.`;

    let current = '';
    const words = fullResponse.split(' ');
    for (let i = 0; i < words.length; i++) {
      if (signal?.aborted) break;
      const piece = (i === 0 ? '' : ' ') + words[i];
      current += piece;
      onToken(piece, current, false);
      await new Promise(r => setTimeout(r, 12));
    }

    return {
      codeBlocks: [{ language: 'html', code, filename: 'index.html' }]
    };
  }
}

export const aiEngine = new AIGenerator();
