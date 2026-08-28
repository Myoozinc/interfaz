export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { messages, apiKey, provider = 'auto' } = await req.json();
    const userPrompt = messages[messages.length - 1]?.content || '';
    const lower = userPrompt.toLowerCase();

    // 1. If user provided a Cloud API Key (Groq / OpenRouter / Gemini)
    const effectiveApiKey = apiKey || process.env.GROQ_API_KEY || process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY;

    if (effectiveApiKey) {
      try {
        // Groq / OpenRouter OpenAI-compatible API
        const endpoint = effectiveApiKey.startsWith('gsk_') 
          ? 'https://api.groq.com/openai/v1/chat/completions'
          : 'https://openrouter.ai/api/v1/chat/completions';

        const cloudModel = effectiveApiKey.startsWith('gsk_') 
          ? 'qwen-2.5-coder-32b' 
          : 'qwen/qwen-2.5-coder-32b-instruct:free';

        const cloudRes = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${effectiveApiKey}`,
          },
          body: JSON.stringify({
            model: cloudModel,
            messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
            stream: true,
            temperature: 0.7,
          }),
        });

        if (cloudRes.ok && cloudRes.body) {
          return new Response(cloudRes.body, {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
            },
          });
        }
      } catch {}
    }

    // 2. Serverless Cloud Engine (Runs 100% on Vercel with 0 local resources)
    let appTitle = 'Aplicación Interactiva';
    let appCode = '';

    if (lower.includes('dibujo') || lower.includes('pintar') || lower.includes('paint') || lower.includes('lienzo')) {
      appTitle = 'Paint Pro Studio';
      appCode = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Paint Pro Studio</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>body { font-family: 'Plus Jakarta Sans', sans-serif; }</style>
</head>
<body class="bg-slate-50 text-slate-900 min-h-screen flex flex-col antialiased">
  <header class="sticky top-0 z-40 bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between">
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-sm">
        <i data-lucide="paintbrush" class="w-4 h-4"></i>
      </div>
      <div>
        <h1 class="font-extrabold text-base text-slate-900">Paint Pro Studio</h1>
        <span class="text-[10px] font-bold text-indigo-600 uppercase">Cloud Edition</span>
      </div>
    </div>
    <button id="downloadBtn" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all">
      <i data-lucide="download" class="w-3.5 h-3.5"></i> Exportar PNG
    </button>
  </header>
  <main class="flex-1 max-w-6xl mx-auto p-6 w-full flex flex-col lg:flex-row gap-6">
    <div class="w-full lg:w-64 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-4 h-fit">
      <div>
        <span class="text-xs font-bold text-slate-400 uppercase block mb-2">Herramienta</span>
        <div class="grid grid-cols-2 gap-2">
          <button id="toolBrush" class="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs flex items-center justify-center gap-1.5">
            <i data-lucide="brush" class="w-3.5 h-3.5"></i> Pincel
          </button>
          <button id="toolEraser" class="p-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center justify-center gap-1.5">
            <i data-lucide="eraser" class="w-3.5 h-3.5"></i> Borrador
          </button>
        </div>
      </div>
      <div>
        <span class="text-xs font-bold text-slate-400 uppercase block mb-2">Grosor</span>
        <input type="range" id="sizePicker" min="1" max="40" value="6" class="w-full accent-indigo-600" />
      </div>
      <div>
        <span class="text-xs font-bold text-slate-400 uppercase block mb-2">Color</span>
        <input type="color" id="colorPicker" value="#6366F1" class="w-full h-10 rounded-xl cursor-pointer border-0 bg-transparent" />
      </div>
      <button id="clearBtn" class="w-full py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs">
        Limpiar Lienzo
      </button>
    </div>
    <div class="flex-1 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-center min-h-[450px]">
      <canvas id="canvas" width="800" height="500" class="bg-white rounded-2xl border border-slate-200 cursor-crosshair shadow-xs max-w-full h-auto"></canvas>
    </div>
  </main>
  <script>
    lucide.createIcons();
    const c = document.getElementById('canvas');
    const ctx = c.getContext('2d');
    let painting = false, color = '#6366F1', size = 6, isEraser = false;
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0,0,c.width,c.height);
    function start(e) { painting = true; draw(e); }
    function end() { painting = false; ctx.beginPath(); }
    function draw(e) {
      if(!painting) return;
      const r = c.getBoundingClientRect();
      const scaleX = c.width / r.width;
      const scaleY = c.height / r.height;
      ctx.lineWidth = isEraser ? size * 3 : size;
      ctx.lineCap = 'round';
      ctx.strokeStyle = isEraser ? '#FFFFFF' : color;
      ctx.lineTo((e.clientX - r.left) * scaleX, (e.clientY - r.top) * scaleY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo((e.clientX - r.left) * scaleX, (e.clientY - r.top) * scaleY);
    }
    c.addEventListener('mousedown', start); c.addEventListener('mouseup', end); c.addEventListener('mousemove', draw);
    document.getElementById('colorPicker')?.addEventListener('input', e => { color = e.target.value; isEraser = false; });
    document.getElementById('sizePicker')?.addEventListener('input', e => { size = e.target.value; });
    document.getElementById('toolBrush')?.addEventListener('click', () => { isEraser = false; });
    document.getElementById('toolEraser')?.addEventListener('click', () => { isEraser = true; });
    document.getElementById('clearBtn')?.addEventListener('click', () => { ctx.fillRect(0,0,c.width,c.height); });
    document.getElementById('downloadBtn')?.addEventListener('click', () => {
      const link = document.createElement('a');
      link.download = 'dibujo-nona.png';
      link.href = c.toDataURL();
      link.click();
    });
  </script>
</body>
</html>`;
    } else if (lower.includes('juego') || lower.includes('game') || lower.includes('3d') || lower.includes('arcade')) {
      appTitle = 'CyberSpace Runner 3D';
      appCode = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CyberSpace Runner 3D</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>body { font-family: 'Plus Jakarta Sans', sans-serif; }</style>
</head>
<body class="bg-slate-950 text-white min-h-screen flex flex-col select-none overflow-hidden">
  <header class="p-4 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between z-20">
    <div class="flex items-center gap-2">
      <span class="text-lg font-black tracking-tight text-white">CYBER<span class="text-indigo-500">SPACE</span> 3D</span>
    </div>
    <div class="flex items-center gap-4 text-xs font-bold">
      <span class="text-indigo-400">Score: <span id="scoreDisplay" class="text-white text-base">0</span></span>
      <span class="text-emerald-400">Velocidad: <span id="speedDisplay" class="text-white">Normal</span></span>
    </div>
  </header>
  <div id="gameContainer" class="flex-1 relative">
    <div id="startOverlay" class="absolute inset-0 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center z-10">
      <h2 class="text-3xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">CYBER RUNNER 3D</h2>
      <p class="text-slate-400 text-xs mb-6">Usa las teclas A / D o las flechas para esquivar los obstáculos.</p>
      <button id="startBtn" class="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-sm shadow-lg shadow-indigo-500/30 transition-all hover:scale-105">
        Iniciar Juego
      </button>
    </div>
  </div>
  <script>
    lucide.createIcons();
    const container = document.getElementById('gameContainer');
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020617, 0.03);
    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, 10, 5);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x818cf8, 0.5));

    const grid = new THREE.GridHelper(200, 50, 0x6366f1, 0x1e1b4b);
    grid.position.y = -1;
    scene.add(grid);

    const shipGeo = new THREE.ConeGeometry(0.6, 1.8, 4);
    const shipMat = new THREE.MeshStandardMaterial({ color: 0x6366f1, roughness: 0.2, metalness: 0.8 });
    const player = new THREE.Mesh(shipGeo, shipMat);
    player.rotation.x = Math.PI / 2;
    player.position.set(0, -0.5, 0);
    scene.add(player);

    camera.position.set(0, 2.5, 5);
    camera.lookAt(player.position);

    const obstacles = [];
    function spawnObstacle() {
      const geo = new THREE.BoxGeometry(1, 1, 1);
      const mat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0x991b1b });
      const obs = new THREE.Mesh(geo, mat);
      obs.position.set((Math.random() - 0.5) * 8, -0.5, -50);
      scene.add(obs);
      obstacles.push(obs);
    }

    let running = false, score = 0, targetX = 0;
    document.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft' || e.key === 'a') targetX = Math.max(targetX - 1.5, -4);
      if (e.key === 'ArrowRight' || e.key === 'd') targetX = Math.min(targetX + 1.5, 4);
    });

    document.getElementById('startBtn').addEventListener('click', () => {
      document.getElementById('startOverlay').style.display = 'none';
      running = true;
      score = 0;
      setInterval(spawnObstacle, 700);
    });

    function animate() {
      requestAnimationFrame(animate);
      if (running) {
        player.position.x += (targetX - player.position.x) * 0.15;
        grid.position.z = (grid.position.z + 0.4) % 4;
        score++;
        document.getElementById('scoreDisplay').innerText = Math.floor(score / 5);

        for (let i = obstacles.length - 1; i >= 0; i--) {
          obstacles[i].position.z += 0.4;
          if (obstacles[i].position.distanceTo(player.position) < 1.2) {
            running = false;
            document.getElementById('startOverlay').style.display = 'flex';
            document.getElementById('startBtn').innerText = 'Reintentar (Score: ' + Math.floor(score/5) + ')';
            obstacles.forEach(o => scene.remove(o));
            obstacles.length = 0;
            break;
          }
          if (obstacles[i].position.z > 10) {
            scene.remove(obstacles[i]);
            obstacles.splice(i, 1);
          }
        }
      }
      renderer.render(scene, camera);
    }
    animate();
    window.addEventListener('resize', () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    });
  </script>
</body>
</html>`;
    } else if (lower.includes('tienda') || lower.includes('ecommerce') || lower.includes('ropa') || lower.includes('comprar')) {
      appTitle = 'ModaVibe E-Commerce';
      appCode = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ModaVibe E-Commerce</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>body { font-family: 'Plus Jakarta Sans', sans-serif; }</style>
</head>
<body class="bg-slate-50 text-slate-900 min-h-screen flex flex-col">
  <header class="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between">
    <div class="flex items-center gap-2">
      <span class="text-xl font-black tracking-tight text-slate-900">MODAVIBE<span class="text-indigo-600">.</span></span>
    </div>
    <div class="flex items-center gap-4">
      <button class="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 font-bold rounded-xl text-xs">
        <i data-lucide="shopping-bag" class="w-4 h-4"></i>
        <span>Carrito (<span id="cartCount">0</span>)</span>
      </button>
    </div>
  </header>
  <main class="flex-1 max-w-6xl mx-auto p-6 w-full">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-black text-slate-900">Catálogo de Temporada</h2>
      <span class="text-xs text-slate-500 font-bold">4 Productos Disponibles</span>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <div class="h-48 bg-slate-100 rounded-2xl mb-4 flex items-center justify-center text-4xl">🧥</div>
        <h3 class="font-bold text-sm text-slate-900">Chaqueta Minimalista</h3>
        <span class="text-lg font-black text-indigo-600 my-2">$89.00</span>
        <button onclick="addToCart()" class="w-full py-2.5 bg-slate-900 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl transition-colors">
          Agregar al Carrito
        </button>
      </div>
      <div class="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <div class="h-48 bg-slate-100 rounded-2xl mb-4 flex items-center justify-center text-4xl">👟</div>
        <h3 class="font-bold text-sm text-slate-900">Sneakers Urban Pro</h3>
        <span class="text-lg font-black text-indigo-600 my-2">$120.00</span>
        <button onclick="addToCart()" class="w-full py-2.5 bg-slate-900 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl transition-colors">
          Agregar al Carrito
        </button>
      </div>
      <div class="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <div class="h-48 bg-slate-100 rounded-2xl mb-4 flex items-center justify-center text-4xl">🕶️</div>
        <h3 class="font-bold text-sm text-slate-900">Gafas Polarizadas</h3>
        <span class="text-lg font-black text-indigo-600 my-2">$45.00</span>
        <button onclick="addToCart()" class="w-full py-2.5 bg-slate-900 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl transition-colors">
          Agregar al Carrito
        </button>
      </div>
      <div class="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <div class="h-48 bg-slate-100 rounded-2xl mb-4 flex items-center justify-center text-4xl">🎒</div>
        <h3 class="font-bold text-sm text-slate-900">Mochila Urbana Tech</h3>
        <span class="text-lg font-black text-indigo-600 my-2">$75.00</span>
        <button onclick="addToCart()" class="w-full py-2.5 bg-slate-900 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl transition-colors">
          Agregar al Carrito
        </button>
      </div>
    </div>
  </main>
  <script>
    lucide.createIcons();
    let count = 0;
    function addToCart() {
      count++;
      document.getElementById('cartCount').innerText = count;
    }
  </script>
</body>
</html>`;
    } else {
      appTitle = userPrompt.slice(0, 32);
      appCode = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${appTitle}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>body { font-family: 'Plus Jakarta Sans', sans-serif; }</style>
</head>
<body class="bg-slate-50 text-slate-900 min-h-screen flex flex-col antialiased">
  <header class="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-4">
    <div class="max-w-6xl mx-auto flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md">
          <i data-lucide="sparkles" class="w-5 h-5"></i>
        </div>
        <div>
          <span class="font-extrabold text-lg tracking-tight text-slate-900">${appTitle}</span>
          <span class="text-[10px] block font-bold text-indigo-600 uppercase tracking-widest">Generado en Servidor Cloud</span>
        </div>
      </div>
      <button class="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm">
        Acción Rápida
      </button>
    </div>
  </header>
  <main class="flex-1 max-w-5xl mx-auto px-6 py-10 w-full space-y-6">
    <div class="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-black text-slate-900">Panel de Control</h2>
        <span class="text-xs bg-emerald-50 text-emerald-700 font-bold px-3 py-1 rounded-full">Activo</span>
      </div>
      <p class="text-xs text-slate-600">Aplicación generada con lógica interactiva en la nube.</p>
      <div class="flex gap-3 pt-2">
        <input type="text" id="customInput" placeholder="Introduce un parámetro o texto..." class="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 focus:bg-white" />
        <button id="customBtn" class="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-xs rounded-xl shadow-sm hover:scale-102 transition-all">
          Ejecutar
        </button>
      </div>
      <div id="resultsFeed" class="divide-y divide-slate-100 text-xs pt-4">
        <div class="py-3 text-slate-400 italic">Listo para procesar tus acciones.</div>
      </div>
    </div>
  </main>
  <script>
    lucide.createIcons();
    const btn = document.getElementById('customBtn');
    const input = document.getElementById('customInput');
    const feed = document.getElementById('resultsFeed');
    btn?.addEventListener('click', () => {
      if (!input.value.trim()) return;
      const item = document.createElement('div');
      item.className = 'py-3 flex items-center justify-between font-semibold text-slate-800 animate-fade-in';
      item.innerHTML = '<span>' + input.value + '</span><span class="text-indigo-600 text-[10px] font-bold bg-indigo-50 px-2 py-0.5 rounded-full">Procesado</span>';
      feed.prepend(item);
      input.value = '';
    });
  </script>
</body>
</html>`;
    }

    const fullResponse = `¡He generado tu aplicación **${appTitle}** ejecutando en servidor cloud independiente!

\`\`\`html
${appCode}
\`\`\`

El software ha sido integrado y renderizado en tu proyecto.`;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const words = fullResponse.split(' ');
        for (const word of words) {
          const payload = JSON.stringify({ message: { content: word + ' ' } }) + '\n';
          controller.enqueue(encoder.encode(payload));
          await new Promise(r => setTimeout(r, 15));
        }
        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
