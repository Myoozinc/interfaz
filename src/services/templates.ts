import type { ProjectTemplate } from '../types';

export const STARTER_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'ecommerce-store-pro',
    name: '🛍️ E-Commerce Store Pro',
    description: 'Tienda moderna con catálogo de productos, carrito deslizante, filtros y checkout interactivo',
    icon: 'ShoppingBag',
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
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased selection:bg-indigo-500 selection:text-white">

  <!-- Navbar -->
  <header class="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-6 py-4">
    <div class="max-w-7xl mx-auto flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
          <i data-lucide="zap" class="w-5 h-5"></i>
        </div>
        <span class="font-extrabold text-xl tracking-tight text-white">AURA<span class="text-indigo-400">.</span>store</span>
      </div>

      <div class="flex items-center gap-3">
        <button onclick="toggleCart()" class="relative p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 text-slate-300 hover:text-white transition-all shadow-sm flex items-center gap-2 cursor-pointer">
          <i data-lucide="shopping-cart" class="w-5 h-5"></i>
          <span id="cartCount" class="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">0</span>
        </button>
      </div>
    </div>
  </header>

  <!-- Hero -->
  <section class="max-w-7xl mx-auto px-6 py-12 text-center">
    <span class="px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold inline-flex items-center gap-1.5 mb-4">
      <i data-lucide="sparkles" class="w-3.5 h-3.5"></i> Colección Cyberpunk 2026
    </span>
    <h1 class="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight">
      Tecnología y Gadgets de <span class="bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">Próxima Generación</span>
    </h1>
    <p class="text-slate-400 text-base max-w-xl mx-auto mt-4">
      Equipamiento futurista con envío global exprés y garantía de por vida.
    </p>
  </section>

  <!-- Products Grid -->
  <main class="max-w-7xl mx-auto px-6 pb-20 flex-1">
    <div id="productGrid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- Injected via JS -->
    </div>
  </main>

  <!-- Slide-Over Cart Modal -->
  <div id="cartModal" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs hidden flex justify-end">
    <div class="bg-slate-900 border-l border-slate-800 w-full max-w-md h-full flex flex-col shadow-2xl p-6">
      <div class="flex items-center justify-between border-b border-slate-800 pb-4">
        <h2 class="text-lg font-bold text-white flex items-center gap-2">
          <i data-lucide="shopping-bag" class="text-indigo-400"></i> Tu Carrito
        </h2>
        <button onclick="toggleCart()" class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <div id="cartItems" class="flex-1 overflow-y-auto py-4 space-y-3">
        <!-- Cart Items Injected via JS -->
      </div>

      <div class="border-t border-slate-800 pt-4 space-y-4">
        <div class="flex justify-between items-center text-sm">
          <span class="text-slate-400">Total a Pagar:</span>
          <span id="cartTotal" class="text-2xl font-extrabold text-indigo-400">$0.00</span>
        </div>
        <button onclick="checkout()" class="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer">
          <i data-lucide="credit-card" class="w-4 h-4"></i> Finalizar Compra
        </button>
      </div>
    </div>
  </div>

  <script>
    const products = [
      { id: 1, name: 'Neural Headset Pro', price: 299, desc: 'Interfaz de audio neural con cancelación activa 8K', icon: 'headphones', badge: 'Popular' },
      { id: 2, name: 'Quantum Watch Ultra', price: 199, desc: 'Monitor biométrico con batería holográfica de 30 días', icon: 'watch', badge: 'Nuevo' },
      { id: 3, name: 'HoloLens Cyber Goggles', price: 449, desc: 'Visor de realidad aumentada con visión nocturna', icon: 'glasses', badge: 'Top Ventas' },
      { id: 4, name: 'Cyber Drone Stealth', price: 599, desc: 'Dron autónomo 4K con seguimiento de IA y 45min vuelo', icon: 'camera', badge: 'Pro' },
      { id: 5, name: 'Bionic Power Grip', price: 129, desc: 'Guante háptico con retroalimentación de fuerza para VR', icon: 'hand', badge: 'Gamer' },
      { id: 6, name: 'Plasma Core Speaker', price: 179, desc: 'Altavoz de levitación magnética con graves de 360°', icon: 'radio', badge: 'Exclusivo' }
    ];

    let cart = JSON.parse(localStorage.getItem('aura_cart') || '[]');

    function renderProducts() {
      const grid = document.getElementById('productGrid');
      grid.innerHTML = products.map(p => \`
        <div class="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between hover:border-indigo-500/50 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/5 group">
          <div>
            <div class="flex justify-between items-start mb-4">
              <div class="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <i data-lucide="\${p.icon}" class="w-6 h-6"></i>
              </div>
              <span class="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-slate-800 text-indigo-300 border border-slate-700">\${p.badge}</span>
            </div>
            <h3 class="text-lg font-bold text-white mb-1">\${p.name}</h3>
            <p class="text-xs text-slate-400 mb-4 leading-relaxed">\${p.desc}</p>
          </div>
          <div class="flex items-center justify-between pt-4 border-t border-slate-800/80">
            <span class="text-xl font-extrabold text-white">$\${p.price}</span>
            <button onclick="addToCart(\${p.id})" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20 cursor-pointer">
              <i data-lucide="plus" class="w-3.5 h-3.5"></i> Agregar
            </button>
          </div>
        </div>
      \`).join('');
      lucide.createIcons();
    }

    function toggleCart() {
      const modal = document.getElementById('cartModal');
      modal.classList.toggle('hidden');
      renderCart();
    }

    function addToCart(id) {
      const prod = products.find(p => p.id === id);
      cart.push(prod);
      localStorage.setItem('aura_cart', JSON.stringify(cart));
      updateCartBadge();
      if (window.playSynthSound) window.playSynthSound('click');
    }

    function updateCartBadge() {
      document.getElementById('cartCount').innerText = cart.length;
    }

    function renderCart() {
      const list = document.getElementById('cartItems');
      const totalEl = document.getElementById('cartTotal');
      if (cart.length === 0) {
        list.innerHTML = '<div class="text-center py-12 text-slate-500 text-sm">Tu carrito está vacío 🛒</div>';
        totalEl.innerText = '$0.00';
        return;
      }
      list.innerHTML = cart.map((item, idx) => \`
        <div class="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700 flex items-center justify-between">
          <div>
            <h4 class="text-sm font-bold text-white">\${item.name}</h4>
            <span class="text-xs font-semibold text-indigo-400">$\${item.price}</span>
          </div>
          <button onclick="removeFromCart(\${idx})" class="p-1.5 text-slate-400 hover:text-red-400 transition-colors">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </div>
      \`).join('');
      const total = cart.reduce((acc, item) => acc + item.price, 0);
      totalEl.innerText = '$' + total.toFixed(2);
      lucide.createIcons();
    }

    function removeFromCart(index) {
      cart.splice(index, 1);
      localStorage.setItem('aura_cart', JSON.stringify(cart));
      updateCartBadge();
      renderCart();
    }

    function checkout() {
      if (cart.length === 0) return alert('Agrega al menos un producto al carrito');
      if (window.playSynthSound) window.playSynthSound('win');
      alert('🎉 ¡Pago procesado con éxito! Gracias por tu compra.');
      cart = [];
      localStorage.removeItem('aura_cart');
      updateCartBadge();
      toggleCart();
    }

    document.addEventListener('DOMContentLoaded', () => {
      renderProducts();
      updateCartBadge();
    });
  </script>
</body>
</html>`
      }
    ]
  },
  {
    id: 'tamagotchi-pro',
    name: '🐾 Mascota Virtual Pro',
    description: 'Criatura interactiva animada con estadísticas de necesidades, tienda de comida, juegos y sonido',
    icon: 'HeartHandshake',
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
  <title>NONA — Mascota Virtual</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    @keyframes floatPet {
      0%, 100% { transform: translateY(0) scale(1); }
      50% { transform: translateY(-12px) scale(1.03); }
    }
    @keyframes blinkEyes {
      0%, 90%, 100% { transform: scaleY(1); }
      95% { transform: scaleY(0.1); }
    }
    .pet-floating { animation: floatPet 2.5s ease-in-out infinite; }
    .pet-eyes { animation: blinkEyes 4s infinite; }
  </style>
</head>
<body class="bg-slate-950 text-white min-h-screen flex items-center justify-center p-4 font-sans selection:bg-indigo-500">
  <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-6">
    
    <!-- Top Header -->
    <div class="flex items-center justify-between border-b border-slate-800 pb-4">
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></div>
        <span class="font-bold text-sm tracking-wide">PULPO VIRTUAL</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-xs bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full font-bold border border-indigo-500/30">
          NIVEL <span id="petLevel">1</span>
        </span>
      </div>
    </div>

    <!-- Pet Canvas Display -->
    <div class="relative bg-slate-950/80 border border-slate-800/80 rounded-2xl h-56 flex flex-col items-center justify-center overflow-hidden">
      <div id="petSpeech" class="absolute top-3 bg-slate-800/90 text-indigo-300 text-xs px-3 py-1 rounded-full border border-slate-700 shadow-md font-semibold transition-all">
        ¡Hola! Cuídame bien 🐙
      </div>
      
      <!-- Animated SVG Character -->
      <div id="petAvatar" class="pet-floating w-28 h-28 flex items-center justify-center text-7xl transition-transform cursor-pointer" onclick="petClick()">
        🐙
      </div>

      <div class="absolute bottom-2 text-[10px] text-slate-500 font-mono">
        XP: <span id="petXP">0</span>/100
      </div>
    </div>

    <!-- Status Bars -->
    <div class="space-y-3 bg-slate-950/40 p-4 rounded-2xl border border-slate-800/60">
      <div>
        <div class="flex justify-between text-xs font-semibold mb-1">
          <span class="text-slate-300 flex items-center gap-1"><i data-lucide="utensils" class="w-3.5 h-3.5 text-amber-400"></i> Hambre</span>
          <span id="hungerText" class="text-amber-400">80%</span>
        </div>
        <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
          <div id="hungerBar" class="bg-amber-400 h-full transition-all duration-300" style="width: 80%"></div>
        </div>
      </div>

      <div>
        <div class="flex justify-between text-xs font-semibold mb-1">
          <span class="text-slate-300 flex items-center gap-1"><i data-lucide="zap" class="w-3.5 h-3.5 text-emerald-400"></i> Energía</span>
          <span id="energyText" class="text-emerald-400">90%</span>
        </div>
        <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
          <div id="energyBar" class="bg-emerald-400 h-full transition-all duration-300" style="width: 90%"></div>
        </div>
      </div>

      <div>
        <div class="flex justify-between text-xs font-semibold mb-1">
          <span class="text-slate-300 flex items-center gap-1"><i data-lucide="smile" class="w-3.5 h-3.5 text-pink-400"></i> Felicidad</span>
          <span id="funText" class="text-pink-400">85%</span>
        </div>
        <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
          <div id="funBar" class="bg-pink-400 h-full transition-all duration-300" style="width: 85%"></div>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="grid grid-cols-3 gap-3">
      <button onclick="feedPet()" class="p-3 bg-slate-800 hover:bg-amber-500/20 border border-slate-700 hover:border-amber-400 text-amber-300 font-bold text-xs rounded-2xl flex flex-col items-center gap-1.5 transition-all shadow-sm cursor-pointer">
        <i data-lucide="pizza" class="w-5 h-5"></i> Alimentar
      </button>
      <button onclick="playPet()" class="p-3 bg-slate-800 hover:bg-pink-500/20 border border-slate-700 hover:border-pink-400 text-pink-300 font-bold text-xs rounded-2xl flex flex-col items-center gap-1.5 transition-all shadow-sm cursor-pointer">
        <i data-lucide="gamepad-2" class="w-5 h-5"></i> Jugar
      </button>
      <button onclick="sleepPet()" class="p-3 bg-slate-800 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-400 text-emerald-300 font-bold text-xs rounded-2xl flex flex-col items-center gap-1.5 transition-all shadow-sm cursor-pointer">
        <i data-lucide="moon" class="w-5 h-5"></i> Dormir
      </button>
    </div>

  </div>

  <script>
    let state = {
      hunger: 80,
      energy: 90,
      fun: 85,
      level: 1,
      xp: 0
    };

    function updateUI() {
      document.getElementById('hungerBar').style.width = state.hunger + '%';
      document.getElementById('hungerText').innerText = state.hunger + '%';
      document.getElementById('energyBar').style.width = state.energy + '%';
      document.getElementById('energyText').innerText = state.energy + '%';
      document.getElementById('funBar').style.width = state.fun + '%';
      document.getElementById('funText').innerText = state.fun + '%';
      document.getElementById('petLevel').innerText = state.level;
      document.getElementById('petXP').innerText = state.xp;
    }

    function addXP(amount) {
      state.xp += amount;
      if (state.xp >= 100) {
        state.level += 1;
        state.xp = 0;
        say('🎉 ¡Subí de Nivel ' + state.level + '!');
        if (window.playSynthSound) window.playSynthSound('win');
      }
      updateUI();
    }

    function say(text) {
      const el = document.getElementById('petSpeech');
      el.innerText = text;
    }

    function feedPet() {
      state.hunger = Math.min(100, state.hunger + 25);
      say('🍕 ¡Qué rica comida!');
      addXP(15);
      if (window.playSynthSound) window.playSynthSound('eat');
    }

    function playPet() {
      if (state.energy < 15) return say('😴 Estoy muy cansado para jugar');
      state.fun = Math.min(100, state.fun + 25);
      state.energy = Math.max(0, state.energy - 15);
      say('🎾 ¡Me encanta jugar contigo!');
      addXP(20);
      if (window.playSynthSound) window.playSynthSound('happy');
    }

    function sleepPet() {
      state.energy = 100;
      state.hunger = Math.max(0, state.hunger - 10);
      say('💤 Zzz... descansando');
      addXP(10);
      if (window.playSynthSound) window.playSynthSound('click');
    }

    function petClick() {
      say('💖 ¡Te quiero humano!');
      addXP(5);
      if (window.playSynthSound) window.playSynthSound('happy');
    }

    // Passive decay timer
    setInterval(() => {
      state.hunger = Math.max(0, state.hunger - 1);
      state.fun = Math.max(0, state.fun - 1);
      updateUI();
    }, 5000);

    document.addEventListener('DOMContentLoaded', () => {
      lucide.createIcons();
      updateUI();
    });
  </script>
</body>
</html>`
      }
    ]
  },
  {
    id: 'mobile-app-ios',
    name: '📱 Mobile Fitness App (iOS Mockup)',
    description: 'Aplicación móvil de salud y entrenamiento con marco de iPhone y barra de pestañas inferior',
    icon: 'Smartphone',
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
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>body { font-family: 'Plus Jakarta Sans', sans-serif; }</style>
</head>
<body class="bg-slate-950 text-white min-h-screen flex items-center justify-center p-4">
  
  <!-- iPhone 15 Frame -->
  <div class="w-[360px] h-[680px] bg-slate-900 border-4 border-slate-800 rounded-[45px] shadow-2xl flex flex-col overflow-hidden relative">
    
    <!-- Dynamic Island Notch -->
    <div class="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-50 flex items-center justify-between px-2">
      <div class="w-2.5 h-2.5 rounded-full bg-slate-950 border border-slate-800"></div>
      <div class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
    </div>

    <!-- Status Bar -->
    <div class="pt-3 px-6 flex justify-between items-center text-[10px] text-slate-400 font-bold shrink-0">
      <span>09:41</span>
      <div class="flex items-center gap-1.5">
        <i data-lucide="wifi" class="w-3 h-3"></i>
        <i data-lucide="battery" class="w-3.5 h-3.5"></i>
      </div>
    </div>

    <!-- Screen Content -->
    <div class="flex-1 overflow-y-auto p-5 space-y-5">
      <div class="flex justify-between items-center pt-2">
        <div>
          <span class="text-xs text-slate-400 font-medium">Hola, Alex</span>
          <h2 class="text-xl font-extrabold text-white">Tu Actividad</h2>
        </div>
        <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center font-bold text-xs">
          AX
        </div>
      </div>

      <!-- Activity Rings Card -->
      <div class="bg-gradient-to-br from-indigo-600/30 to-violet-600/30 border border-indigo-500/40 p-4 rounded-3xl flex items-center justify-between">
        <div>
          <span class="text-[11px] text-indigo-300 font-semibold uppercase tracking-wider">Calorías Quemadas</span>
          <div class="text-2xl font-black text-white mt-1">680 <span class="text-xs font-normal text-indigo-300">/ 800 kcal</span></div>
          <span class="text-[10px] text-emerald-400 font-bold">🔥 85% de tu meta diaria</span>
        </div>
        <div class="w-14 h-14 rounded-full border-4 border-indigo-500 flex items-center justify-center text-xs font-bold text-indigo-200">
          85%
        </div>
      </div>

      <!-- Daily Workout Stats -->
      <div class="grid grid-cols-2 gap-3">
        <div class="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/80">
          <i data-lucide="heart" class="w-4 h-4 text-pink-400 mb-1.5"></i>
          <span class="text-[10px] text-slate-400 block">Ritmo Cardíaco</span>
          <span class="text-lg font-bold text-white">74 <span class="text-[10px] font-normal text-slate-400">BPM</span></span>
        </div>
        <div class="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/80">
          <i data-lucide="footprints" class="w-4 h-4 text-emerald-400 mb-1.5"></i>
          <span class="text-[10px] text-slate-400 block">Pasos</span>
          <span class="text-lg font-bold text-white">8,420</span>
        </div>
      </div>

      <!-- Workout Routine -->
      <div class="space-y-2.5">
        <h3 class="text-xs font-bold text-slate-300 uppercase tracking-wider">Rutina de Hoy</h3>
        <div class="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <i data-lucide="flame" class="w-4 h-4"></i>
            </div>
            <div>
              <h4 class="text-xs font-bold text-white">Cardio HIIT 30m</h4>
              <span class="text-[10px] text-slate-400">350 kcal • Nivel Medio</span>
            </div>
          </div>
          <button onclick="startWorkout()" class="p-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white">
            <i data-lucide="play" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Bottom Tab Bar -->
    <div class="h-16 bg-slate-950 border-t border-slate-800 px-6 flex items-center justify-between shrink-0">
      <button class="text-indigo-400 flex flex-col items-center gap-1 text-[9px] font-bold"><i data-lucide="activity" class="w-4 h-4"></i>Inicio</button>
      <button class="text-slate-500 flex flex-col items-center gap-1 text-[9px] font-bold"><i data-lucide="dumbbell" class="w-4 h-4"></i>Entrenar</button>
      <button class="text-slate-500 flex flex-col items-center gap-1 text-[9px] font-bold"><i data-lucide="award" class="w-4 h-4"></i>Logros</button>
      <button class="text-slate-500 flex flex-col items-center gap-1 text-[9px] font-bold"><i data-lucide="user" class="w-4 h-4"></i>Perfil</button>
    </div>

  </div>

  <script>
    function startWorkout() {
      if (window.playSynthSound) window.playSynthSound('win');
      alert('🏋️‍♂️ ¡Entrenamiento HIIT iniciado!');
    }
    document.addEventListener('DOMContentLoaded', () => lucide.createIcons());
  </script>
</body>
</html>`
      }
    ]
  },
  {
    id: 'analytics-dashboard',
    name: '📊 Dashboard Financiero & SaaS',
    description: 'Panel de control interactivo con métricas, gráficos, transacciones y CRUD',
    icon: 'BarChart3',
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
  <title>NONA Analytics</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
</head>
<body class="bg-slate-950 text-white min-h-screen p-6 font-sans">
  <div class="max-w-6xl mx-auto space-y-6">
    
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-3xl border border-slate-800">
      <div>
        <h1 class="text-xl font-bold text-white">Métricas y Rendimiento SaaS</h1>
        <p class="text-xs text-slate-400">Datos en tiempo real sincronizados</p>
      </div>
      <button onclick="refreshData()" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md">
        <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i> Actualizar
      </button>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
      <div class="bg-slate-900 p-5 rounded-3xl border border-slate-800">
        <span class="text-xs text-slate-400 font-semibold">Ingresos Recurrentes (MRR)</span>
        <div class="mt-2 flex items-baseline justify-between">
          <span class="text-2xl font-black text-white">$48,250</span>
          <span class="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">+18.4%</span>
        </div>
      </div>
      <div class="bg-slate-900 p-5 rounded-3xl border border-slate-800">
        <span class="text-xs text-slate-400 font-semibold">Usuarios Activos</span>
        <div class="mt-2 flex items-baseline justify-between">
          <span class="text-2xl font-black text-white">3,890</span>
          <span class="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20">+12.1%</span>
        </div>
      </div>
      <div class="bg-slate-900 p-5 rounded-3xl border border-slate-800">
        <span class="text-xs text-slate-400 font-semibold">Tasa de Conversión</span>
        <div class="mt-2 flex items-baseline justify-between">
          <span class="text-2xl font-black text-white">4.82%</span>
          <span class="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">+0.6%</span>
        </div>
      </div>
    </div>

  </div>
  <script>
    function refreshData() {
      if (window.playSynthSound) window.playSynthSound('click');
      alert('📊 Métricas actualizadas con éxito.');
    }
    document.addEventListener('DOMContentLoaded', () => lucide.createIcons());
  </script>
</body>
</html>`
      }
    ]
  }
];
