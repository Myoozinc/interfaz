export const ECOMMERCE_STORE_HTML = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LUMEN Pro Tech Store</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #07090e; }
    .glass-card { background: rgba(18, 24, 38, 0.85); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.08); }
    .product-img:hover { transform: scale(1.05); }
  </style>
</head>
<body class="select-none text-slate-100 min-h-screen flex flex-col font-sans">
  
  <!-- Navigation Header -->
  <header class="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex justify-between items-center">
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-400 to-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-cyan-500/20">
        ⚡
      </div>
      <div>
        <h1 class="text-sm font-black tracking-widest text-white uppercase">LUMEN PRO</h1>
        <p class="text-[10px] text-slate-400 font-medium">Flagship Hardware & Audio 2026</p>
      </div>
    </div>

    <!-- Search & Cart Trigger -->
    <div class="flex items-center gap-3">
      <div class="relative hidden sm:block w-64">
        <i data-lucide="search" class="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"></i>
        <input type="text" id="search-input" oninput="filterProducts()" placeholder="Buscar audífonos, chips M3, relojes..." class="w-full bg-slate-900 border border-slate-800 rounded-full pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500 transition-colors">
      </div>

      <button onclick="toggleCartDrawer(true)" class="relative p-2.5 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white transition-all cursor-pointer shadow-md">
        <i data-lucide="shopping-bag" class="w-4 h-4"></i>
        <span id="cart-badge" class="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg">0</span>
      </button>
    </div>
  </header>

  <!-- Category Pills Bar -->
  <div class="px-4 sm:px-8 py-4 flex items-center gap-2 overflow-x-auto border-b border-slate-900 bg-slate-950/40">
    <button onclick="selectCategory('Todos')" id="cat-todos" class="px-4 py-1.5 rounded-full bg-cyan-500 text-slate-950 font-black text-xs transition-all cursor-pointer shadow-md shadow-cyan-500/20">Todos</button>
    <button onclick="selectCategory('Audio')" id="cat-audio" class="px-4 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs font-bold transition-all cursor-pointer">Audio Hi-Fi</button>
    <button onclick="selectCategory('Pro')" id="cat-pro" class="px-4 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs font-bold transition-all cursor-pointer">Dispositivos Pro</button>
    <button onclick="selectCategory('Wearables')" id="cat-wearables" class="px-4 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs font-bold transition-all cursor-pointer">Wearables</button>
    <button onclick="selectCategory('Accesorios')" id="cat-accesorios" class="px-4 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs font-bold transition-all cursor-pointer">Accesorios</button>
  </div>

  <!-- Main Product Grid -->
  <main class="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
    <div id="product-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- Product Cards injected by JS -->
    </div>
  </main>

  <!-- Slide-out Shopping Cart Drawer -->
  <div id="cart-backdrop" onclick="toggleCartDrawer(false)" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 opacity-0 pointer-events-none transition-opacity duration-300"></div>
  <aside id="cart-drawer" class="fixed top-0 right-0 bottom-0 w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl z-50 translate-x-full transition-transform duration-300 flex flex-col">
    <div class="p-5 border-b border-slate-800 flex justify-between items-center">
      <div class="flex items-center gap-2">
        <i data-lucide="shopping-bag" class="w-5 h-5 text-cyan-400"></i>
        <h2 class="text-base font-bold text-white">Tu Bolsa de Compras (<span id="drawer-count">0</span>)</h2>
      </div>
      <button onclick="toggleCartDrawer(false)" class="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer">
        <i data-lucide="x" class="w-5 h-5"></i>
      </button>
    </div>

    <!-- Items List -->
    <div id="cart-items" class="flex-1 overflow-y-auto p-5 space-y-3.5 divide-y divide-slate-800/60">
      <!-- Injected by JS -->
    </div>

    <!-- Subtotal & Checkout Button -->
    <div class="p-5 border-t border-slate-800 bg-slate-950/50 space-y-4">
      <!-- Promo Code Input -->
      <div class="flex gap-2">
        <input type="text" id="promo-input" placeholder="Código de cupón (ej: NONA2026)" class="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white uppercase outline-none focus:border-cyan-500">
        <button onclick="applyPromo()" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl cursor-pointer">Aplicar</button>
      </div>

      <div class="space-y-1.5 text-xs text-slate-400">
        <div class="flex justify-between"><span>Subtotal:</span><span id="cart-subtotal" class="text-white font-mono font-bold">/bin/zsh</span></div>
        <div class="flex justify-between"><span>Descuento Promo:</span><span id="cart-discount" class="text-emerald-400 font-mono font-bold">-/bin/zsh</span></div>
        <div class="flex justify-between"><span>Envío Express:</span><span class="text-emerald-400 font-bold">GRATIS</span></div>
        <div class="flex justify-between text-sm font-black text-white pt-2 border-t border-slate-800">
          <span>Total:</span>
          <span id="cart-total" class="font-mono text-cyan-400 text-base">/bin/zsh</span>
        </div>
      </div>

      <button onclick="openCheckout()" class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black text-sm tracking-wide uppercase transition-all shadow-lg shadow-cyan-500/25 active:scale-95 cursor-pointer flex items-center justify-center gap-2">
        <i data-lucide="lock" class="w-4 h-4"></i> Proceder al Pago Seguro
      </button>
    </div>
  </aside>

  <!-- Checkout Modal -->
  <div id="checkout-modal" class="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 opacity-0 pointer-events-none transition-opacity duration-300">
    <div class="glass-card max-w-md w-full p-6 rounded-3xl shadow-2xl space-y-4 border border-slate-700">
      <div class="flex justify-between items-center">
        <h3 class="text-base font-extrabold text-white flex items-center gap-2">
          <span>💳 Pasarela de Pago Segura</span>
        </h3>
        <button onclick="closeCheckout()" class="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"><i data-lucide="x" class="w-4 h-4"></i></button>
      </div>

      <div class="bg-slate-900/90 p-3 rounded-2xl border border-slate-800 space-y-2 text-xs">
        <div class="flex justify-between text-slate-400"><span>Artículos a pagar:</span><span id="modal-item-count" class="text-white font-bold">0</span></div>
        <div class="flex justify-between text-slate-400"><span>Total final a cobrar:</span><span id="modal-total-amount" class="text-cyan-400 font-bold font-mono text-sm">/bin/zsh</span></div>
      </div>

      <div class="space-y-3 text-xs">
        <div>
          <label class="block text-slate-400 font-medium mb-1">Nombre en la tarjeta</label>
          <input type="text" value="Alex Morgan" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500">
        </div>
        <div>
          <label class="block text-slate-400 font-medium mb-1">Número de Tarjeta de Crédito</label>
          <input type="text" value="•••• •••• •••• 4242" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-cyan-500">
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-slate-400 font-medium mb-1">Expiración</label>
            <input type="text" value="12/28" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500">
          </div>
          <div>
            <label class="block text-slate-400 font-medium mb-1">CVC</label>
            <input type="text" value="888" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500">
          </div>
        </div>
      </div>

      <button onclick="confirmPayment()" class="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm tracking-wide uppercase transition-all shadow-lg shadow-emerald-500/25 active:scale-95 cursor-pointer">
        Confirmar y Pagar
      </button>
    </div>
  </div>

  <script>
    const PRODUCTS = [
      {
        id: 'p1',
        title: 'LUMEN Studio Max Headphones',
        category: 'Audio',
        price: 549,
        tag: 'Bestseller',
        tagColor: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
        desc: 'Cancelación activa de ruido híbrida, audio espacial 360º y transductores de titanio de 45mm.',
        icon: 'headphones'
      },
      {
        id: 'p2',
        title: 'CyberBook Pro M3 Max 16"',
        category: 'Pro',
        price: 2499,
        tag: 'Flagship',
        tagColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
        desc: 'Pantalla Liquid Retina XDR de 120Hz, 64GB Unified RAM y hasta 22 horas de autonomía de batería.',
        icon: 'laptop'
      },
      {
        id: 'p3',
        title: 'Titanium Ultra Watch 3',
        category: 'Wearables',
        price: 799,
        tag: 'Nuevo',
        tagColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        desc: 'Caja de titanio aeroespacial de 49mm, GPS de doble frecuencia y sensor de profundidad marina a 100m.',
        icon: 'watch'
      },
      {
        id: 'p4',
        title: 'Acoustic Pod Mini Hi-Res',
        category: 'Audio',
        price: 199,
        tag: 'Audio 360',
        tagColor: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
        desc: 'Sonido computacional de alta fidelidad con calibración automática de sala acústica y conectividad AirPlay 3.',
        icon: 'speaker'
      },
      {
        id: 'p5',
        title: 'Pro Gaming Controller ForceFeedback',
        category: 'Accesorios',
        price: 179,
        tag: 'Háptico',
        tagColor: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
        desc: 'Gatillos adaptativos con resistencia variable, palancas magnéticas Hall Effect sin drift y 1000Hz polling.',
        icon: 'gamepad-2'
      },
      {
        id: 'p6',
        title: 'MagCharge Dual Wireless Pad',
        category: 'Accesorios',
        price: 129,
        tag: 'Carga Rápida',
        tagColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        desc: 'Base de carga magnética Qi2 de 25W de inducción rápida con acabado en cristal esmerilado.',
        icon: 'zap'
      }
    ];

    let cart = [
      { product: PRODUCTS[0], quantity: 1 }
    ];
    let activeCategory = 'Todos';
    let discountRate = 0;

    function renderProducts(list) {
      const grid = document.getElementById('product-grid');
      grid.innerHTML = list.map(prod => \`
        <div class="glass-card rounded-3xl p-6 flex flex-col justify-between hover:border-cyan-500/40 transition-all duration-300 group shadow-xl">
          <div>
            <div class="flex justify-between items-start gap-2 mb-4">
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border \${prod.tagColor}">
                \${prod.tag}
              </span>
              <div class="flex items-center text-amber-400 text-xs">
                ★★★★★ <span class="text-[10px] text-slate-500 ml-1">(4.9)</span>
              </div>
            </div>

            <!-- Visual Icon Showcase -->
            <div class="h-40 w-full rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center text-cyan-400 mb-5 border border-slate-800/80 group-hover:scale-[1.02] transition-transform duration-300">
              <i data-lucide="\${prod.icon}" class="w-16 h-16 text-cyan-400/90 group-hover:text-cyan-300 transition-colors"></i>
            </div>

            <h3 class="text-base font-extrabold text-white group-hover:text-cyan-300 transition-colors mb-1">
              \${prod.title}
            </h3>
            <p class="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-4">
              \${prod.desc}
            </p>
          </div>

          <div class="flex items-center justify-between pt-4 border-t border-slate-800/60">
            <div class="flex flex-col">
              <span class="text-[10px] text-slate-500 font-bold uppercase">Precio</span>
              <span class="text-xl font-black text-white font-mono">$\${prod.price.toLocaleString()}</span>
            </div>
            <button onclick="addToCart('\${prod.id}')" class="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-lg shadow-cyan-500/20 cursor-pointer">
              <i data-lucide="plus" class="w-3.5 h-3.5"></i> Añadir
            </button>
          </div>
        </div>
      \`).join('');

      lucide.createIcons();
    }

    function selectCategory(cat) {
      activeCategory = cat;
      ['todos', 'audio', 'pro', 'wearables', 'accesorios'].forEach(c => {
        const btn = document.getElementById('cat-' + c);
        if (btn) {
          btn.className = 'px-4 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs font-bold transition-all cursor-pointer';
        }
      });

      const activeBtn = document.getElementById('cat-' + cat.toLowerCase());
      if (activeBtn) {
        activeBtn.className = 'px-4 py-1.5 rounded-full bg-cyan-500 text-slate-950 font-black text-xs transition-all cursor-pointer shadow-md shadow-cyan-500/20';
      }

      filterProducts();
    }

    function filterProducts() {
      const q = document.getElementById('search-input')?.value.toLowerCase() || '';
      const filtered = PRODUCTS.filter(p => {
        const matchCat = activeCategory === 'Todos' || p.category === activeCategory;
        const matchQuery = p.title.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q);
        return matchCat && matchQuery;
      });
      renderProducts(filtered);
    }

    function addToCart(prodId) {
      const prod = PRODUCTS.find(p => p.id === prodId);
      if (!prod) return;

      const existing = cart.find(c => c.product.id === prodId);
      if (existing) {
        existing.quantity += 1;
      } else {
        cart.push({ product: prod, quantity: 1 });
      }

      updateCartUI();
      toggleCartDrawer(true);
    }

    function changeQuantity(prodId, delta) {
      const item = cart.find(c => c.product.id === prodId);
      if (!item) return;

      item.quantity += delta;
      if (item.quantity <= 0) {
        cart = cart.filter(c => c.product.id !== prodId);
      }
      updateCartUI();
    }

    function updateCartUI() {
      const totalCount = cart.reduce((acc, c) => acc + c.quantity, 0);
      document.getElementById('cart-badge').innerText = totalCount;
      document.getElementById('drawer-count').innerText = totalCount;

      const itemsContainer = document.getElementById('cart-items');
      if (cart.length === 0) {
        itemsContainer.innerHTML = '<div class="text-center p-8 text-slate-500 text-xs">Tu bolsa de compras está vacía.</div>';
      } else {
        itemsContainer.innerHTML = cart.map(item => \`
          <div class="flex items-center justify-between gap-3 pt-3.5">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-cyan-400 shrink-0">
                <i data-lucide="\${item.product.icon}" class="w-5 h-5"></i>
              </div>
              <div>
                <div class="text-xs font-bold text-white">\${item.product.title}</div>
                <div class="text-[11px] text-cyan-400 font-mono font-bold">$\${item.product.price}</div>
              </div>
            </div>
            <div class="flex items-center gap-2 bg-slate-800 px-2 py-1 rounded-xl">
              <button onclick="changeQuantity('\${item.product.id}', -1)" class="text-slate-400 hover:text-white font-bold cursor-pointer">-</button>
              <span class="text-xs font-bold text-white w-4 text-center">\${item.quantity}</span>
              <button onclick="changeQuantity('\${item.product.id}', 1)" class="text-slate-400 hover:text-white font-bold cursor-pointer">+</button>
            </div>
          </div>
        \`).join('');
        lucide.createIcons();
      }

      const subtotal = cart.reduce((acc, c) => acc + c.product.price * c.quantity, 0);
      const discount = subtotal * discountRate;
      const total = subtotal - discount;

      document.getElementById('cart-subtotal').innerText = '$' + subtotal.toLocaleString();
      document.getElementById('cart-discount').innerText = '-$' + discount.toLocaleString();
      document.getElementById('cart-total').innerText = '$' + total.toLocaleString();
    }

    function toggleCartDrawer(open) {
      const drawer = document.getElementById('cart-drawer');
      const backdrop = document.getElementById('cart-backdrop');
      if (open) {
        drawer.style.transform = 'translateX(0)';
        backdrop.style.opacity = '1';
        backdrop.style.pointerEvents = 'auto';
      } else {
        drawer.style.transform = 'translateX(100%)';
        backdrop.style.opacity = '0';
        backdrop.style.pointerEvents = 'none';
      }
    }

    function applyPromo() {
      const code = document.getElementById('promo-input').value.trim().toUpperCase();
      if (code === 'NONA2026') {
        discountRate = 0.15;
        updateCartUI();
        alert('🎉 ¡Cupón NONA2026 aplicado! 15% de descuento en tu orden.');
      } else {
        alert('Código de cupón inválido. Prueba con: NONA2026');
      }
    }

    function openCheckout() {
      if (cart.length === 0) {
        alert('Tu bolsa está vacía.');
        return;
      }
      toggleCartDrawer(false);
      const totalCount = cart.reduce((acc, c) => acc + c.quantity, 0);
      const total = cart.reduce((acc, c) => acc + c.product.price * c.quantity, 0) * (1 - discountRate);

      document.getElementById('modal-item-count').innerText = totalCount + ' artículo(s)';
      document.getElementById('modal-total-amount').innerText = '$' + total.toLocaleString();

      const modal = document.getElementById('checkout-modal');
      modal.style.opacity = '1';
      modal.style.pointerEvents = 'auto';
    }

    function closeCheckout() {
      const modal = document.getElementById('checkout-modal');
      modal.style.opacity = '0';
      modal.style.pointerEvents = 'none';
    }

    function confirmPayment() {
      closeCheckout();
      confetti({
        particleCount: 100,
        spread: 90,
        origin: { y: 0.6 }
      });
      alert('🎉 ¡Pago procesado con éxito! Gracias por tu compra en LUMEN Pro.');
      cart = [];
      updateCartUI();
    }

    document.addEventListener('DOMContentLoaded', () => {
      renderProducts(PRODUCTS);
      updateCartUI();
      lucide.createIcons();
    });
  </script>
</body>
</html>`;
