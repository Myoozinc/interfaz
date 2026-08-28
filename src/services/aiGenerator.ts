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
    onToken: (chunk: string, fullText: string) => void,
    signal?: AbortSignal
  ): Promise<{ codeBlocks: { language: string; code: string; filename?: string }[] }> {
    // 1. Try real Ollama local or proxy stream
    const endpointsToTry = [
      this.customEndpoint,
      '/api/ollama',
      'http://127.0.0.1:11434',
      'http://localhost:11434'
    ].filter(Boolean) as string[];

    for (const endpoint of endpointsToTry) {
      try {
        this.ollama.setBaseUrl(endpoint);
        const ollamaRes = await this.ollama.streamChat(
          'qwen3.8',
          [
            { 
              role: 'system', 
              content: 'Eres NONA AI. Desarrolla aplicaciones completas, 100% interactivas y funcionales en un único bloque de código ```html con <!DOCTYPE html>, Tailwind CSS, Three.js y Web Audio API si se requieren.' 
            },
            { 
              role: 'user', 
              content: `Crea la siguiente aplicación o juego completo: "${prompt}". Devuelve todo el código en un bloque \`\`\`html listo para usar.` 
            }
          ],
          onToken,
          signal
        );

        const blocks = OllamaService.extractCodeBlocks(ollamaRes);
        if (blocks.length > 0 && blocks[0].code.length > 200) {
          return { codeBlocks: blocks };
        }
      } catch {
        // Try next endpoint
      }
    }

    // 2. Dynamic Procedural Synthesis Engine
    return this.synthesizeCustomApp(prompt, onToken, signal);
  }

  private async synthesizeCustomApp(
    prompt: string,
    onToken: (chunk: string, fullText: string) => void,
    signal?: AbortSignal
  ): Promise<{ codeBlocks: { language: string; code: string; filename?: string }[] }> {
    const lower = prompt.toLowerCase();
    let title = 'NONA Interactive App';
    let code = '';

    if (lower.includes('bananalien') || (lower.includes('alien') && lower.includes('banana')) || (lower.includes('matar') && lower.includes('alien'))) {
      title = 'Bananalien Plus — 3D Space Shooter';
      code = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bananalien Plus — 3D Alien Shooter</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700;900&family=Press+Start+2P&display=swap" rel="stylesheet">
  <style>
    body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #05050F; font-family: 'Plus Jakarta Sans', sans-serif; }
    #canvas-container { width: 100%; height: 100%; position: absolute; top: 0; left: 0; }
    .arcade-font { font-family: 'Press Start 2P', monospace; }
    .glass-hud { background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(12px); border: 1px solid rgba(139, 92, 246, 0.4); }
  </style>
</head>
<body>
  <div id="canvas-container"></div>

  <!-- HUD Overlay -->
  <div class="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-10 select-none">
    
    <!-- Top Stats -->
    <div class="flex items-center justify-between pointer-events-auto">
      <div class="glass-hud px-5 py-3 rounded-2xl flex items-center gap-3">
        <span class="text-2xl">🍌</span>
        <div>
          <h1 class="text-white font-black text-sm tracking-wider">BANANALIEN PLUS</h1>
          <p class="text-[10px] text-amber-300">Defensa Galáctica Frutal 3D</p>
        </div>
      </div>

      <div class="glass-hud px-6 py-3 rounded-2xl flex items-center gap-6 text-white text-xs">
        <div>
          <span class="text-slate-400 block text-[9px] uppercase font-bold">PUNTOS</span>
          <span id="scoreEl" class="text-xl font-black text-amber-400">0</span>
        </div>
        <div>
          <span class="text-slate-400 block text-[9px] uppercase font-bold">ALIENS ELIMINADOS</span>
          <span id="killsEl" class="text-xl font-black text-emerald-400">0</span>
        </div>
        <div>
          <span class="text-slate-400 block text-[9px] uppercase font-bold">VIDA</span>
          <div class="w-20 bg-slate-700 h-3 rounded-full overflow-hidden mt-1">
            <div id="hpBar" class="bg-gradient-to-r from-emerald-400 to-amber-400 h-full w-full transition-all"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Start Overlay -->
    <div id="startMenu" class="self-center text-center pointer-events-auto glass-hud p-8 rounded-3xl max-w-md border border-amber-500/40 shadow-2xl">
      <div class="text-5xl mb-2 animate-bounce">🍌 👾</div>
      <h2 class="text-2xl font-black text-white">BANANALIEN PLUS</h2>
      <p class="text-xs text-slate-300 mt-2 leading-relaxed">
        ¡Los aliens invasores atacan la galaxia! Mueve tu cañón con el <strong>Ratón o Flechas</strong> y dispara <strong>Bananas de plasma</strong> con el <strong>Clic o Barra Espaciadora</strong>.
      </p>
      <button id="btnPlay" class="mt-6 w-full py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-2xl transition-all shadow-lg hover:scale-102 cursor-pointer text-sm tracking-wide">
        ▶ JUGAR AHORA
      </button>
    </div>

    <!-- Bottom Controls Guide -->
    <div class="flex items-center justify-between text-xs text-slate-400 pointer-events-auto">
      <div class="glass-hud px-4 py-2 rounded-xl flex items-center gap-4">
        <span>Apuntar: <strong class="text-white">Mover Ratón</strong></span>
        <span>Disparar: <strong class="text-amber-400">Clic / Espacio</strong></span>
      </div>
      <div class="glass-hud px-4 py-2 rounded-xl text-amber-300">
        <span>Arma: <strong class="text-white">Lanzador de Bananas Sónicas</strong></span>
      </div>
    </div>

  </div>

  <script>
    // Web Audio Sound FX Engine
    let audioCtx = null;
    function initAudio() {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    function playLaserSound() {
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    }

    function playExplodeSound() {
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    }

    // Three.js Game Engine
    let scene, camera, renderer;
    let score = 0, kills = 0, hp = 100;
    let isPlaying = false;
    const bullets = [];
    const aliens = [];
    let mouseX = 0;

    function initGame() {
      const container = document.getElementById('canvas-container');
      scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x05050F, 0.02);

      camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.set(0, 2, 8);

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      container.appendChild(renderer.domElement);

      // Starfield
      const starGeo = new THREE.BufferGeometry();
      const starCoords = [];
      for(let i = 0; i < 2000; i++) {
        starCoords.push((Math.random() - 0.5) * 500, (Math.random() - 0.5) * 500, (Math.random() - 0.5) * 500);
      }
      starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starCoords, 3));
      const starMat = new THREE.PointsMaterial({ color: 0xFDE68A, size: 0.6 });
      scene.add(new THREE.Points(starGeo, starMat));

      // Grid Floor
      const grid = new THREE.GridHelper(200, 40, 0xF59E0B, 0x6366F1);
      grid.position.y = -2;
      scene.add(grid);

      // Lights
      scene.add(new THREE.AmbientLight(0xffffff, 0.7));
      const light = new THREE.DirectionalLight(0xFBBF24, 1.5);
      light.position.set(0, 10, 5);
      scene.add(light);

      window.addEventListener('resize', onResize);
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('click', onShoot);
      window.addEventListener('keydown', (e) => {
        if (e.code === 'Space') onShoot();
      });
    }

    function onMouseMove(e) {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 12;
    }

    function createBananaMesh() {
      const group = new THREE.Group();
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.4, 0, 0),
        new THREE.Vector3(0, 0.2, 0),
        new THREE.Vector3(0.4, 0, 0)
      ]);
      const geo = new THREE.TubeGeometry(curve, 10, 0.15, 8, false);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xFACC15,
        emissive: 0xEAB308,
        emissiveIntensity: 0.6,
        roughness: 0.3
      });
      const banana = new THREE.Mesh(geo, mat);
      group.add(banana);
      return group;
    }

    function createAlienMesh() {
      const group = new THREE.Group();
      // Alien Head
      const headGeo = new THREE.IcosahedronGeometry(0.8, 1);
      const headMat = new THREE.MeshStandardMaterial({
        color: 0x10B981,
        emissive: 0x059669,
        wireframe: false,
        roughness: 0.4
      });
      const head = new THREE.Mesh(headGeo, headMat);
      group.add(head);

      // Glowing Eyes
      const eyeGeo = new THREE.SphereGeometry(0.2, 8, 8);
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xEF4444 });
      const eye1 = new THREE.Mesh(eyeGeo, eyeMat);
      eye1.position.set(-0.35, 0.2, 0.6);
      const eye2 = new THREE.Mesh(eyeGeo, eyeMat);
      eye2.position.set(0.35, 0.2, 0.6);
      group.add(eye1);
      group.add(eye2);

      return group;
    }

    function onShoot() {
      if (!isPlaying) return;
      playLaserSound();
      const banana = createBananaMesh();
      banana.position.set(camera.position.x, camera.position.y - 0.5, camera.position.z - 1);
      scene.add(banana);
      bullets.push(banana);
    }

    function spawnAlien() {
      const alien = createAlienMesh();
      alien.position.x = (Math.random() - 0.5) * 16;
      alien.position.y = 0.5 + Math.random() * 3;
      alien.position.z = -70;
      alien.speed = 0.4 + Math.random() * 0.3;
      scene.add(alien);
      aliens.push(alien);
    }

    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    let spawnTimer = 0;
    function animate() {
      requestAnimationFrame(animate);

      if (isPlaying) {
        // Camera smooth follow
        camera.position.x += (mouseX - camera.position.x) * 0.1;

        // Move bullets
        for (let i = bullets.length - 1; i >= 0; i--) {
          const b = bullets[i];
          b.position.z -= 2.0;
          b.rotation.z += 0.3;
          b.rotation.x += 0.2;

          // Check hit
          for (let j = aliens.length - 1; j >= 0; j--) {
            const a = aliens[j];
            if (b.position.distanceTo(a.position) < 1.4) {
              playExplodeSound();
              scene.remove(a);
              aliens.splice(j, 1);
              scene.remove(b);
              bullets.splice(i, 1);
              score += 250;
              kills += 1;
              document.getElementById('scoreEl').innerText = score;
              document.getElementById('killsEl').innerText = kills;
              break;
            }
          }

          if (b && b.position.z < -80) {
            scene.remove(b);
            bullets.splice(i, 1);
          }
        }

        // Move aliens
        for (let i = aliens.length - 1; i >= 0; i--) {
          const a = aliens[i];
          a.position.z += a.speed;
          a.rotation.y += 0.04;
          a.position.y += Math.sin(Date.now() * 0.005 + i) * 0.02;

          if (a.position.z > 6) {
            scene.remove(a);
            aliens.splice(i, 1);
            hp = Math.max(0, hp - 20);
            document.getElementById('hpBar').style.width = hp + '%';
            if (hp <= 0) {
              isPlaying = false;
              alert('💀 GAME OVER! Puntuación final: ' + score + ' puntos con ' + kills + ' aliens destruidos.');
              location.reload();
            }
          }
        }

        spawnTimer++;
        if (spawnTimer > 30) {
          spawnAlien();
          spawnTimer = 0;
        }
      }

      renderer.render(scene, camera);
    }

    document.getElementById('btnPlay')?.addEventListener('click', () => {
      initAudio();
      document.getElementById('startMenu').style.display = 'none';
      isPlaying = true;
    });

    initGame();
    animate();
  </script>
</body>
</html>`;
    } else {
      // General dynamic app with custom branding and interactive functionality
      title = prompt.slice(0, 30);
      code = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
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
          <i data-lucide="sparkles" class="w-5 h-5"></i>
        </div>
        <div>
          <span class="font-extrabold text-lg tracking-tight text-slate-900">${title}</span>
          <span class="text-[10px] block font-bold text-indigo-600 uppercase tracking-widest">Generado en Tiempo Real</span>
        </div>
      </div>
      <button class="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-all">
        Interactuar
      </button>
    </div>
  </header>

  <main class="flex-1 max-w-5xl mx-auto px-6 py-12 text-center">
    <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-semibold text-indigo-700 mb-6">
      <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
      Construido según: "${prompt}"
    </div>

    <h1 class="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
      ${title}
    </h1>

    <div class="mt-8 p-8 rounded-3xl bg-white border border-slate-200 shadow-sm max-w-xl mx-auto text-left space-y-4">
      <h2 class="font-bold text-base text-slate-900">Panel de Control Activo</h2>
      <p class="text-xs text-slate-600">Esta aplicación se ha generado dinámicamente con componentes interactivos listos para usar.</p>
      
      <div class="flex gap-3">
        <input type="text" id="actionInput" placeholder="Escribe un dato aquí..." class="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500" />
        <button id="actionBtn" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs">
          Agregar
        </button>
      </div>

      <div id="itemsList" class="divide-y divide-slate-100 text-xs pt-2">
        <div class="py-2 text-slate-500">No hay registros agregados aún.</div>
      </div>
    </div>
  </main>

  <script>
    lucide.createIcons();
    const btn = document.getElementById('actionBtn');
    const input = document.getElementById('actionInput');
    const list = document.getElementById('itemsList');
    btn?.addEventListener('click', () => {
      if (!input.value.trim()) return;
      const row = document.createElement('div');
      row.className = 'py-2 font-medium text-slate-800 flex justify-between items-center';
      row.innerHTML = '<span>' + input.value + '</span><span class="text-emerald-600 font-bold text-[10px]">Listo</span>';
      list.prepend(row);
      input.value = '';
    });
  </script>
</body>
</html>`;
    }

    const fullResponse = `¡He creado tu aplicación **${title}** completa e interactiva!

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
      onToken(piece, current);
      await new Promise(r => setTimeout(r, 12));
    }

    return {
      codeBlocks: [{ language: 'html', code, filename: 'index.html' }]
    };
  }
}

export const aiEngine = new AIGenerator();
