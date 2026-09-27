/**
 * Plantilla interactiva de alta fidelidad: Landing Page de Barbería & Peluquería Moderna
 * Estética Apple/Linear Dark Luxury con reserva interactiva de turnos, catálogo de servicios y animaciones dinámicas.
 */
export function getBarbershopTemplate(brandName: string = 'Temochoeso'): string {
  const safeName = brandName.trim() || 'Temochoeso';

  return `<!DOCTYPE html>
<html lang="es" class="dark scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeName} — Barbería & Grooming Club</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;0,700;1,600&display=swap" rel="stylesheet">
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: {
            sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
            serif: ['"Playfair Display"', 'Georgia', 'serif'],
          },
          colors: {
            gold: {
              400: '#fbbf24',
              500: '#f59e0b',
              600: '#d97706',
            }
          },
          animation: {
            'fade-in': 'fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            'float': 'float 4s ease-in-out infinite',
            'pulse-subtle': 'pulseSubtle 3s ease-in-out infinite',
          },
          keyframes: {
            fadeIn: {
              '0%': { opacity: '0', transform: 'translateY(16px)' },
              '100%': { opacity: '1', transform: 'translateY(0)' },
            },
            float: {
              '0%, 100%': { transform: 'translateY(0px)' },
              '50%': { transform: 'translateY(-8px)' },
            },
            pulseSubtle: {
              '0%, 100%': { opacity: '1' },
              '50%': { opacity: '0.65' },
            }
          }
        }
      }
    }
  </script>
  <style>
    body {
      background-color: #05070b;
      color: #f1f5f9;
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    }
    .glass-card {
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .glass-card-hover {
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .glass-card-hover:hover {
      transform: translateY(-4px);
      border-color: rgba(245, 158, 11, 0.35);
      box-shadow: 0 16px 32px -10px rgba(245, 158, 11, 0.12);
    }
    .gold-gradient-text {
      background: linear-gradient(135deg, #fef08a 0%, #f59e0b 50%, #b45309 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  </style>
</head>
<body class="min-h-screen selection:bg-amber-500 selection:text-slate-950 flex flex-col antialiased overflow-x-hidden">

  <!-- Ambient Glow Background -->
  <div class="fixed inset-0 pointer-events-none z-0 overflow-hidden">
    <div class="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-amber-500/10 rounded-full blur-[140px]"></div>
    <div class="absolute top-[40%] -right-40 w-[500px] h-[500px] bg-amber-600/5 rounded-full blur-[140px]"></div>
    <div class="absolute bottom-10 -left-40 w-[500px] h-[500px] bg-amber-700/5 rounded-full blur-[140px]"></div>
  </div>

  <!-- Top Sticky Navigation -->
  <header class="sticky top-0 z-40 w-full backdrop-blur-xl bg-slate-950/80 border-b border-white/5 transition-all">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
      
      <!-- Brand Logo -->
      <a href="#" class="flex items-center gap-3 group">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-300 p-0.5 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
          <div class="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-amber-400">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="6" cy="6" r="3"></circle>
              <circle cx="6" cy="18" r="3"></circle>
              <line x1="20" y1="4" x2="8.12" y2="15.88"></line>
              <line x1="14.47" y1="14.48" x2="20" y2="20"></line>
              <line x1="8.12" y1="8.12" x2="12" y2="12"></line>
            </svg>
          </div>
        </div>
        <div>
          <span class="font-extrabold text-base tracking-widest text-white uppercase block leading-none font-serif">${safeName}</span>
          <span class="text-[10px] tracking-widest text-amber-400 uppercase font-semibold block mt-0.5">Barbería & Estilo</span>
        </div>
      </a>

      <!-- Desktop Navigation Links -->
      <nav class="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-wider text-slate-400">
        <a href="#services" class="hover:text-amber-400 transition-colors">Servicios</a>
        <a href="#barbers" class="hover:text-amber-400 transition-colors">Barberos</a>
        <a href="#reviews" class="hover:text-amber-400 transition-colors">Reseñas</a>
        <a href="#hours" class="hover:text-amber-400 transition-colors">Ubicación</a>
      </nav>

      <!-- Action Button -->
      <div class="flex items-center gap-3">
        <button onclick="openBookingModal()" class="px-4 py-2 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-102 active:scale-95 transition-all cursor-pointer flex items-center gap-2">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <span>Reservar Cita</span>
        </button>
      </div>

    </div>
  </header>

  <!-- Hero Section -->
  <section class="relative z-10 pt-16 pb-20 px-4 sm:px-6 max-w-7xl mx-auto text-center">
    
    <!-- Top Pill Badge -->
    <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-6 animate-pulse-subtle">
      <span class="flex h-2 w-2 rounded-full bg-amber-400 animate-ping"></span>
      <span>Turnos Disponibles Para Hoy • Calificación 4.9 ★★★★★</span>
    </div>

    <!-- Main Headline -->
    <h1 class="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-[1.1] mb-6">
      El Arte del Corte Clásico & Moderno en <span class="gold-gradient-text font-serif italic">${safeName}</span>
    </h1>

    <!-- Subtitle -->
    <p class="text-slate-400 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed mb-10">
      Diseño de imagen a la medida, degradados de precisión, toalla caliente y perfilado de barba con navaja artesanal. Una experiencia de relajación y estilo sin prisas.
    </p>

    <!-- CTA Buttons & Live Indicator -->
    <div class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
      <button onclick="openBookingModal()" class="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-slate-950 font-extrabold text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2.5">
        <svg class="w-4 h-4 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
        <span>Agendar Turno Online</span>
      </button>

      <a href="#services" class="w-full sm:w-auto px-8 py-4 glass-card hover:bg-slate-800/80 text-white font-semibold text-sm rounded-2xl border border-white/10 hover:border-amber-400/40 transition-all flex items-center justify-center gap-2">
        <span>Explorar Servicios</span>
        <svg class="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M7 13l5 5 5-5M7 6l5 5 5-5"/>
        </svg>
      </a>
    </div>

    <!-- Quick Metrics / Highlights -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto pt-6 border-t border-white/5">
      <div class="p-4 rounded-2xl glass-card">
        <div class="text-2xl sm:text-3xl font-black text-amber-400 font-serif">4.9 / 5</div>
        <div class="text-xs text-slate-400 mt-1">+1,400 Clientes Felices</div>
      </div>
      <div class="p-4 rounded-2xl glass-card">
        <div class="text-2xl sm:text-3xl font-black text-white font-serif">10+</div>
        <div class="text-xs text-slate-400 mt-1">Años de Maestría</div>
      </div>
      <div class="p-4 rounded-2xl glass-card">
        <div class="text-2xl sm:text-3xl font-black text-amber-400 font-serif">100%</div>
        <div class="text-xs text-slate-400 mt-1">Higiene & Esterilización</div>
      </div>
      <div class="p-4 rounded-2xl glass-card">
        <div class="text-2xl sm:text-3xl font-black text-white font-serif">VIP</div>
        <div class="text-xs text-slate-400 mt-1">Bebida de Cortesía</div>
      </div>
    </div>

  </section>

  <!-- Interactive Services Catalog -->
  <section id="services" class="relative z-10 py-20 px-4 sm:px-6 max-w-7xl mx-auto w-full">
    
    <div class="text-center max-w-2xl mx-auto mb-12">
      <span class="text-xs uppercase tracking-widest text-amber-400 font-bold">Catálogo de Alta Gama</span>
      <h2 class="text-3xl sm:text-4xl font-extrabold text-white mt-2 font-serif">Nuestros Servicios Exclusivos</h2>
      <p class="text-slate-400 text-sm mt-3">Selecciona tu servicio preferido para pre-cargar tu turno al instante.</p>
    </div>

    <!-- Filter Category Pills -->
    <div class="flex items-center justify-center gap-2 mb-10 overflow-x-auto pb-2">
      <button onclick="filterServices('all')" id="btn-all" class="px-4 py-2 rounded-xl text-xs font-bold transition-all bg-amber-400 text-slate-950 shadow-md">Todos</button>
      <button onclick="filterServices('corte')" id="btn-corte" class="px-4 py-2 rounded-xl text-xs font-bold transition-all glass-card text-slate-300 hover:text-white">Cortes</button>
      <button onclick="filterServices('barba')" id="btn-barba" class="px-4 py-2 rounded-xl text-xs font-bold transition-all glass-card text-slate-300 hover:text-white">Barba</button>
      <button onclick="filterServices('combo')" id="btn-combo" class="px-4 py-2 rounded-xl text-xs font-bold transition-all glass-card text-slate-300 hover:text-white">Combos VIP</button>
    </div>

    <!-- Service Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="servicesGrid">
      
      <!-- Card 1 -->
      <div class="service-card corte glass-card glass-card-hover p-6 rounded-3xl flex flex-col justify-between" data-category="corte">
        <div>
          <div class="flex items-center justify-between mb-4">
            <span class="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">45 Minutos</span>
            <span class="text-2xl font-black text-amber-400 font-serif">$22.00</span>
          </div>
          <h3 class="text-xl font-bold text-white mb-2">Corte Fade & Degradado</h3>
          <p class="text-xs text-slate-400 leading-relaxed mb-6">
            Low, Mid o High fade con tijera superior, lavado energizante con mentol y peinado con cera mate de fijación fuerte.
          </p>
        </div>
        <button onclick="selectServiceAndBook('Corte Fade & Degradado', 22)" class="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-amber-400 hover:text-slate-950 font-bold text-xs uppercase tracking-wider text-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer">
          <span>Seleccionar Servicio</span>
        </button>
      </div>

      <!-- Card 2 -->
      <div class="service-card barba glass-card glass-card-hover p-6 rounded-3xl flex flex-col justify-between" data-category="barba">
        <div>
          <div class="flex items-center justify-between mb-4">
            <span class="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">35 Minutos</span>
            <span class="text-2xl font-black text-amber-400 font-serif">$18.00</span>
          </div>
          <h3 class="text-xl font-bold text-white mb-2">Ritual de Barba con Toalla Caliente</h3>
          <p class="text-xs text-slate-400 leading-relaxed mb-6">
            Afeitado o perfilado con navaja japonesa, aceites esenciales de cedro, vaporizador ozono y bálsamo hidratante.
          </p>
        </div>
        <button onclick="selectServiceAndBook('Ritual de Barba', 18)" class="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-amber-400 hover:text-slate-950 font-bold text-xs uppercase tracking-wider text-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer">
          <span>Seleccionar Servicio</span>
        </button>
      </div>

      <!-- Card 3 (Featured) -->
      <div class="service-card combo glass-card glass-card-hover p-6 rounded-3xl flex flex-col justify-between border-amber-500/40 relative shadow-2xl shadow-amber-500/10" data-category="combo">
        <div class="absolute -top-3 right-6 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-md">
          Más Popular
        </div>
        <div>
          <div class="flex items-center justify-between mb-4">
            <span class="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">75 Minutos</span>
            <span class="text-2xl font-black text-amber-400 font-serif">$36.00</span>
          </div>
          <h3 class="text-xl font-bold text-white mb-2">Combo Presidencial VIP</h3>
          <p class="text-xs text-slate-400 leading-relaxed mb-6">
            Corte completo + Barba spa + Mascarilla facial de carbón activo purificante + Masaje capilar descontracturante.
          </p>
        </div>
        <button onclick="selectServiceAndBook('Combo Presidencial VIP', 36)" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md">
          <span>Reservar Combo VIP</span>
        </button>
      </div>

      <!-- Card 4 -->
      <div class="service-card corte glass-card glass-card-hover p-6 rounded-3xl flex flex-col justify-between" data-category="corte">
        <div>
          <div class="flex items-center justify-between mb-4">
            <span class="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">30 Minutos</span>
            <span class="text-2xl font-black text-amber-400 font-serif">$19.00</span>
          </div>
          <h3 class="text-xl font-bold text-white mb-2">Corte Clásico a Tijera</h3>
          <p class="text-xs text-slate-400 leading-relaxed mb-6">
            Estilo tradicional ejecutivo, perfilado limpio de patillas y nuca, secado modelado y loción refrescante aftershave.
          </p>
        </div>
        <button onclick="selectServiceAndBook('Corte Clásico a Tijera', 19)" class="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-amber-400 hover:text-slate-950 font-bold text-xs uppercase tracking-wider text-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer">
          <span>Seleccionar Servicio</span>
        </button>
      </div>

      <!-- Card 5 -->
      <div class="service-card combo glass-card glass-card-hover p-6 rounded-3xl flex flex-col justify-between" data-category="combo">
        <div>
          <div class="flex items-center justify-between mb-4">
            <span class="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">90 Minutos</span>
            <span class="text-2xl font-black text-amber-400 font-serif">$48.00</span>
          </div>
          <h3 class="text-xl font-bold text-white mb-2">Colorimetría & Platinado</h3>
          <p class="text-xs text-slate-400 leading-relaxed mb-6">
            Decoloración profesional sin maltratar tu cabello, matización plata/blanco hielo o reflejos y tratamiento plex.
          </p>
        </div>
        <button onclick="selectServiceAndBook('Colorimetría & Platinado', 48)" class="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-amber-400 hover:text-slate-950 font-bold text-xs uppercase tracking-wider text-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer">
          <span>Seleccionar Servicio</span>
        </button>
      </div>

      <!-- Card 6 -->
      <div class="service-card barba glass-card glass-card-hover p-6 rounded-3xl flex flex-col justify-between" data-category="barba">
        <div>
          <div class="flex items-center justify-between mb-4">
            <span class="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">20 Minutos</span>
            <span class="text-2xl font-black text-amber-400 font-serif">$12.00</span>
          </div>
          <h3 class="text-xl font-bold text-white mb-2">Perfilado & Cejas Express</h3>
          <p class="text-xs text-slate-400 leading-relaxed mb-6">
            Líneas geométricas limpias en contorno de barba, pómulos y diseño natural de cejas con navaja descartable.
          </p>
        </div>
        <button onclick="selectServiceAndBook('Perfilado & Cejas', 12)" class="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-amber-400 hover:text-slate-950 font-bold text-xs uppercase tracking-wider text-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer">
          <span>Seleccionar Servicio</span>
        </button>
      </div>

    </div>

  </section>

  <!-- Barber Specialists Section -->
  <section id="barbers" class="relative z-10 py-16 px-4 sm:px-6 max-w-7xl mx-auto w-full bg-slate-900/30 rounded-3xl border border-white/5 my-8">
    <div class="text-center max-w-2xl mx-auto mb-12">
      <span class="text-xs uppercase tracking-widest text-amber-400 font-bold">Maestros de la Navaja</span>
      <h2 class="text-3xl font-extrabold text-white mt-2 font-serif">Nuestros Barberos Especialistas</h2>
      <p class="text-slate-400 text-sm mt-3">Elige a tu profesional de confianza al momento de agendar.</p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
      
      <div class="p-6 rounded-2xl glass-card text-center flex flex-col items-center">
        <div class="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 p-0.5 mb-4 shadow-lg shadow-amber-500/20">
          <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80" alt="Barbero" class="w-full h-full object-cover rounded-full">
        </div>
        <h3 class="font-bold text-lg text-white">Mateo "Fade Master" Ortiz</h3>
        <span class="text-xs text-amber-400 font-semibold mb-2">Especialista en Fades & Urban Style</span>
        <p class="text-xs text-slate-400">8 años dominando texturas, degradados con navaja y diseños geométricos.</p>
      </div>

      <div class="p-6 rounded-2xl glass-card text-center flex flex-col items-center border-amber-500/30">
        <div class="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 p-0.5 mb-4 shadow-lg shadow-amber-500/20">
          <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80" alt="Barbero" class="w-full h-full object-cover rounded-full">
        </div>
        <h3 class="font-bold text-lg text-white">Daniel "Blade" Silva</h3>
        <span class="text-xs text-amber-400 font-semibold mb-2">Master Barber Clásico & Barbas Spa</span>
        <p class="text-xs text-slate-400">Experto en cortes ejecutivos, toalla caliente y tratamientos de cuidado facial.</p>
      </div>

      <div class="p-6 rounded-2xl glass-card text-center flex flex-col items-center">
        <div class="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 p-0.5 mb-4 shadow-lg shadow-amber-500/20">
          <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80" alt="Barbero" class="w-full h-full object-cover rounded-full">
        </div>
        <h3 class="font-bold text-lg text-white">Lucas "Craft" Romero</h3>
        <span class="text-xs text-amber-400 font-semibold mb-2">Colorista & Estilista Contemporáneo</span>
        <p class="text-xs text-slate-400">Platinados, tintes, permanentes modernas y asesoría personalizada de visagismo.</p>
      </div>

    </div>
  </section>

  <!-- Reviews Section -->
  <section id="reviews" class="relative z-10 py-16 px-4 sm:px-6 max-w-7xl mx-auto w-full">
    <div class="text-center max-w-2xl mx-auto mb-10">
      <span class="text-xs uppercase tracking-widest text-amber-400 font-bold">Opiniones Reales</span>
      <h2 class="text-3xl font-extrabold text-white mt-2 font-serif">Lo Que Dicen Nuestros Clientes</h2>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="p-6 rounded-2xl glass-card">
        <div class="flex text-amber-400 mb-3 text-sm">★★★★★</div>
        <p class="text-xs text-slate-300 leading-relaxed mb-4">"El mejor fade que me han hecho en años. El ambiente es super relajante, café de cortesía y puntualidad impecable."</p>
        <span class="text-xs font-bold text-white block">Alejandro Morales</span>
        <span class="text-[10px] text-slate-400">Cliente frecuente (2 años)</span>
      </div>
      <div class="p-6 rounded-2xl glass-card">
        <div class="flex text-amber-400 mb-3 text-sm">★★★★★</div>
        <p class="text-xs text-slate-300 leading-relaxed mb-4">"El ritual de barba con toalla caliente es una joya. Salí como nuevo para mi casamiento. Muy recomendado ${safeName}."</p>
        <span class="text-xs font-bold text-white block">Esteban Rossi</span>
        <span class="text-[10px] text-slate-400">Combo Presidencial VIP</span>
      </div>
      <div class="p-6 rounded-2xl glass-card">
        <div class="flex text-amber-400 mb-3 text-sm">★★★★★</div>
        <p class="text-xs text-slate-300 leading-relaxed mb-4">"Agendé desde la página en 1 minuto, llegué y me atendieron al instante sin esperar. Profesionales de primera."</p>
        <span class="text-xs font-bold text-white block">Guillermo Vargas</span>
        <span class="text-[10px] text-slate-400">Corte Fade & Cejas</span>
      </div>
    </div>
  </section>

  <!-- Location & Hours Section -->
  <section id="hours" class="relative z-10 py-16 px-4 sm:px-6 max-w-7xl mx-auto w-full">
    <div class="p-8 rounded-3xl glass-card border border-amber-500/20 flex flex-col md:flex-row items-center justify-between gap-8">
      <div>
        <span class="text-xs uppercase tracking-widest text-amber-400 font-bold">Encuéntranos</span>
        <h3 class="text-2xl sm:text-3xl font-bold text-white mt-1 font-serif">Horarios & Ubicación</h3>
        <p class="text-xs text-slate-400 mt-2 max-w-md">Estamos ubicados en el centro de la ciudad con estacionamiento exclusivo para clientes.</p>
        
        <div class="mt-6 space-y-2 text-xs text-slate-300">
          <div class="flex items-center gap-2">
            <span class="text-amber-400 font-bold">📍 Dirección:</span>
            <span>Av. San Martín 1420, Barrio Centro</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-amber-400 font-bold">🕒 Horarios:</span>
            <span>Lunes a Sábado de 10:00 a 20:30 hs</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-amber-400 font-bold">📞 Teléfono / WhatsApp:</span>
            <span>+54 9 11 5543-9821</span>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-3 w-full md:w-auto">
        <button onclick="openBookingModal()" class="px-8 py-3.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg hover:scale-102 transition-all cursor-pointer">
          Agendar mi Lugar Ahora
        </button>
        <button onclick="copyAddress()" id="copyAddressBtn" class="px-6 py-2.5 glass-card hover:bg-slate-800 text-white font-semibold text-xs rounded-xl border border-white/10 transition-all flex items-center justify-center gap-2">
          <span>Copiar Dirección al Portapapeles</span>
        </button>
      </div>
    </div>
  </section>

  <!-- Interactive Booking Modal (Popup) -->
  <div id="bookingModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md opacity-0 pointer-events-none transition-opacity duration-300">
    <div class="glass-card max-w-lg w-full rounded-3xl p-6 sm:p-8 border border-amber-500/30 shadow-2xl relative max-h-[90vh] overflow-y-auto">
      
      <!-- Close Button -->
      <button onclick="closeBookingModal()" class="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition-colors">
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      <div class="mb-6">
        <span class="text-xs uppercase tracking-widest text-amber-400 font-bold">Reserva Online 24/7</span>
        <h3 class="text-2xl font-bold text-white mt-1 font-serif">Agendar Turno en ${safeName}</h3>
      </div>

      <form id="bookingForm" onsubmit="handleBookingSubmit(event)" class="space-y-4 text-xs">
        
        <!-- Service Select -->
        <div>
          <label class="block text-slate-300 font-semibold mb-1.5">Servicio Deseado</label>
          <select id="modalService" required class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-400 text-xs">
            <option value="Corte Fade & Degradado ($22)">Corte Fade & Degradado ($22)</option>
            <option value="Ritual de Barba ($18)">Ritual de Barba con Toalla Caliente ($18)</option>
            <option value="Combo Presidencial VIP ($36)">Combo Presidencial VIP ($36)</option>
            <option value="Corte Clásico a Tijera ($19)">Corte Clásico a Tijera ($19)</option>
            <option value="Colorimetría & Platinado ($48)">Colorimetría & Platinado ($48)</option>
            <option value="Perfilado & Cejas ($12)">Perfilado & Cejas ($12)</option>
          </select>
        </div>

        <!-- Barber Select -->
        <div>
          <label class="block text-slate-300 font-semibold mb-1.5">Barbero Especialista</label>
          <select id="modalBarber" required class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-400 text-xs">
            <option value="Cualquiera disponible">Cualquiera disponible (Más rápido)</option>
            <option value="Mateo Ortiz (Fade Master)">Mateo Ortiz (Fade Master)</option>
            <option value="Daniel Silva (Barbas & Clásico)">Daniel Silva (Barbas & Clásico)</option>
            <option value="Lucas Romero (Color & Tijera)">Lucas Romero (Color & Tijera)</option>
          </select>
        </div>

        <!-- Date & Time Grid -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-slate-300 font-semibold mb-1.5">Fecha</label>
            <input type="date" id="modalDate" required class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400 text-xs">
          </div>
          <div>
            <label class="block text-slate-300 font-semibold mb-1.5">Horario</label>
            <select id="modalTime" required class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-400 text-xs">
              <option value="10:30 hs">10:30 hs</option>
              <option value="11:30 hs">11:30 hs</option>
              <option value="13:00 hs">13:00 hs</option>
              <option value="15:00 hs">15:00 hs</option>
              <option value="16:30 hs">16:30 hs</option>
              <option value="18:00 hs">18:00 hs</option>
              <option value="19:30 hs">19:30 hs</option>
            </select>
          </div>
        </div>

        <!-- Client Info -->
        <div>
          <label class="block text-slate-300 font-semibold mb-1.5">Tu Nombre y Apellido</label>
          <input type="text" id="modalName" required placeholder="Ej: Santiago Martínez" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400 text-xs">
        </div>

        <div>
          <label class="block text-slate-300 font-semibold mb-1.5">WhatsApp / Teléfono</label>
          <input type="tel" id="modalPhone" required placeholder="Ej: +54 9 11 2345 6789" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400 text-xs">
        </div>

        <button type="submit" class="w-full py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer mt-4">
          Confirmar y Agendar Turno
        </button>

      </form>
    </div>
  </div>

  <!-- Success Notification Toast -->
  <div id="toastSuccess" class="fixed bottom-6 right-6 z-50 glass-card border border-emerald-500/50 p-4 rounded-2xl shadow-2xl flex items-center gap-3 translate-y-20 opacity-0 transition-all duration-300 pointer-events-none">
    <div class="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg">✓</div>
    <div>
      <h4 class="text-xs font-bold text-white" id="toastTitle">¡Turno Confirmado!</h4>
      <p class="text-[11px] text-slate-300" id="toastDesc">Te enviamos los datos de la reserva.</p>
    </div>
  </div>

  <!-- Footer -->
  <footer class="mt-auto relative z-10 w-full bg-slate-950 border-t border-white/5 py-8 px-4 text-center text-xs text-slate-500">
    <p>© ${new Date().getFullYear()} ${safeName} Barbería & Grooming Club. Todos los derechos reservados.</p>
  </footer>

  <script>
    // Set default date for booking to tomorrow
    const today = new Date();
    today.setDate(today.getDate() + 1);
    const dateInput = document.getElementById('modalDate');
    if (dateInput) {
      dateInput.value = today.toISOString().split('T')[0];
    }

    function openBookingModal() {
      const modal = document.getElementById('bookingModal');
      modal.classList.remove('opacity-0', 'pointer-events-none');
      modal.classList.add('opacity-100');
    }

    function closeBookingModal() {
      const modal = document.getElementById('bookingModal');
      modal.classList.add('opacity-0', 'pointer-events-none');
      modal.classList.remove('opacity-100');
    }

    function selectServiceAndBook(serviceName, price) {
      const select = document.getElementById('modalService');
      if (select) {
        for (let i = 0; i < select.options.length; i++) {
          if (select.options[i].text.includes(serviceName)) {
            select.selectedIndex = i;
            break;
          }
        }
      }
      openBookingModal();
    }

    function filterServices(category) {
      const cards = document.querySelectorAll('.service-card');
      cards.forEach(card => {
        if (category === 'all' || card.getAttribute('data-category') === category) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });

      ['all', 'corte', 'barba', 'combo'].forEach(cat => {
        const btn = document.getElementById('btn-' + cat);
        if (btn) {
          if (cat === category) {
            btn.className = 'px-4 py-2 rounded-xl text-xs font-bold transition-all bg-amber-400 text-slate-950 shadow-md';
          } else {
            btn.className = 'px-4 py-2 rounded-xl text-xs font-bold transition-all glass-card text-slate-300 hover:text-white';
          }
        }
      });
    }

    function copyAddress() {
      navigator.clipboard.writeText('Av. San Martín 1420, Barrio Centro');
      const btn = document.getElementById('copyAddressBtn');
      if (btn) {
        btn.innerHTML = '<span>¡Dirección Copiada! ✓</span>';
        setTimeout(() => {
          btn.innerHTML = '<span>Copiar Dirección al Portapapeles</span>';
        }, 2000);
      }
    }

    function handleBookingSubmit(e) {
      e.preventDefault();
      const service = document.getElementById('modalService').value;
      const barber = document.getElementById('modalBarber').value;
      const date = document.getElementById('modalDate').value;
      const time = document.getElementById('modalTime').value;
      const name = document.getElementById('modalName').value;

      closeBookingModal();

      // Confetti celebration
      if (window.confetti) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#fbbf24', '#ffffff', '#d97706']
        });
      }

      // Show Toast
      const toast = document.getElementById('toastSuccess');
      const toastTitle = document.getElementById('toastTitle');
      const toastDesc = document.getElementById('toastDesc');
      if (toast && toastTitle && toastDesc) {
        toastTitle.textContent = \`¡Turno agendado para \${name}!\`;
        toastDesc.textContent = \`\${service} con \${barber} el \${date} a las \${time}.\`;
        toast.classList.remove('translate-y-20', 'opacity-0', 'pointer-events-none');
        setTimeout(() => {
          toast.classList.add('translate-y-20', 'opacity-0', 'pointer-events-none');
        }, 5000);
      }
    }
  </script>
</body>
</html>`;
}
