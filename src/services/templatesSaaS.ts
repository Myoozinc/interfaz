export const SAAS_ANALYTICS_HTML = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AURA SaaS Enterprise Analytics & CRM</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #0f172a; }
    ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen p-4 sm:p-6 select-none">
  <div class="max-w-7xl mx-auto space-y-6">
    
    <!-- Top Nav Header -->
    <header class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-3xl shadow-xl">
      <div class="flex items-center gap-3">
        <div class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
          <i data-lucide="bar-chart-3" class="w-6 h-6"></i>
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-lg font-extrabold text-white tracking-tight">AURA CRM & SaaS Growth Platform</h1>
            <span class="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> En Vivo
            </span>
          </div>
          <p class="text-xs text-slate-400">Métricas consolidadas de facturación recurrente, retención y actividad</p>
        </div>
      </div>

      <div class="flex items-center gap-2.5 w-full sm:w-auto justify-end">
        <!-- Range Filter Buttons -->
        <div class="bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 flex items-center text-xs font-semibold">
          <button onclick="setTimeRange('7D')" id="btn-7d" class="px-2.5 py-1 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer">7D</button>
          <button onclick="setTimeRange('30D')" id="btn-30d" class="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold transition-all cursor-pointer shadow-sm">30D</button>
          <button onclick="setTimeRange('YTD')" id="btn-ytd" class="px-2.5 py-1 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer">YTD</button>
        </div>
        <button onclick="exportCsv()" class="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer">
          <i data-lucide="download" class="w-3.5 h-3.5 text-slate-400"></i> CSV
        </button>
        <button onclick="simulateNewTransaction()" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-indigo-600/30">
          <i data-lucide="plus" class="w-3.5 h-3.5"></i> Simular Pago
        </button>
      </div>
    </header>

    <!-- 4 KPI Summary Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-slate-900/80 border border-slate-800 p-5 rounded-3xl hover:border-slate-700 transition-all">
        <div class="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
          <span>MRR (Ingreso Mensual)</span>
          <div class="w-7 h-7 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center"><i data-lucide="dollar-sign" class="w-4 h-4"></i></div>
        </div>
        <div class="flex items-baseline justify-between">
          <span id="kpi-mrr" class="text-2xl font-black text-white font-mono">,250</span>
          <span class="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg">+18.4%</span>
        </div>
        <span class="text-[11px] text-slate-500 mt-2 block">ARR proyectado: ,011,000</span>
      </div>

      <div class="bg-slate-900/80 border border-slate-800 p-5 rounded-3xl hover:border-slate-700 transition-all">
        <div class="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
          <span>Suscripciones Activas</span>
          <div class="w-7 h-7 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center"><i data-lucide="users" class="w-4 h-4"></i></div>
        </div>
        <div class="flex items-baseline justify-between">
          <span id="kpi-users" class="text-2xl font-black text-white font-mono">18,420</span>
          <span class="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-lg">+12.1%</span>
        </div>
        <span class="text-[11px] text-slate-500 mt-2 block">Retención a 90 días: 94.2%</span>
      </div>

      <div class="bg-slate-900/80 border border-slate-800 p-5 rounded-3xl hover:border-slate-700 transition-all">
        <div class="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
          <span>Tasa de Conversión</span>
          <div class="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center"><i data-lucide="zap" class="w-4 h-4"></i></div>
        </div>
        <div class="flex items-baseline justify-between">
          <span id="kpi-conv" class="text-2xl font-black text-white font-mono">5.84%</span>
          <span class="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg">+0.8%</span>
        </div>
        <span class="text-[11px] text-slate-500 mt-2 block">Visitantes a Pro Trial</span>
      </div>

      <div class="bg-slate-900/80 border border-slate-800 p-5 rounded-3xl hover:border-slate-700 transition-all">
        <div class="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
          <span>Churn Mensual</span>
          <div class="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center"><i data-lucide="shield-alert" class="w-4 h-4"></i></div>
        </div>
        <div class="flex items-baseline justify-between">
          <span id="kpi-churn" class="text-2xl font-black text-white font-mono">1.18%</span>
          <span class="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg">-0.3%</span>
        </div>
        <span class="text-[11px] text-slate-500 mt-2 block">Benchmark industria: 2.5%</span>
      </div>
    </div>

    <!-- Charts Row: Main Area Chart & Traffic Doughnut -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- Main Line Chart (2 Cols) -->
      <div class="lg:col-span-2 bg-slate-900/80 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col justify-between">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-sm font-bold text-white">Crecimiento de Facturación e Ingresos Recurrentes</h2>
            <p class="text-xs text-slate-400">Comparativa mensual 2026</p>
          </div>
          <span class="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-xl border border-indigo-500/20">+24.6% vs mes anterior</span>
        </div>
        <div class="h-72 w-full relative">
          <canvas id="revenueChart"></canvas>
        </div>
      </div>

      <!-- Traffic Channels Doughnut (1 Col) -->
      <div class="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col justify-between">
        <div>
          <h2 class="text-sm font-bold text-white mb-1">Fuentes de Adquisición</h2>
          <p class="text-xs text-slate-400 mb-4">Origen de usuarios nuevos</p>
        </div>
        <div class="h-52 w-full relative flex items-center justify-center">
          <canvas id="channelsChart"></canvas>
        </div>
        <div class="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-800 mt-2">
          <div class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Orgánico (42%)</div>
          <div class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full bg-pink-500"></span> Ads (28%)</div>
          <div class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full bg-cyan-400"></span> Referidos (18%)</div>
          <div class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> Directo (12%)</div>
        </div>
      </div>

    </div>

    <!-- Filterable Transactions & CRM Table -->
    <div class="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 class="text-sm font-bold text-white">Últimas Transacciones de Clientes</h2>
          <p class="text-xs text-slate-400">Pagos de suscripciones procesados por Stripe / LemonSqueezy</p>
        </div>
        
        <div class="flex items-center gap-2 w-full sm:w-auto">
          <div class="relative flex-1 sm:w-64">
            <i data-lucide="search" class="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2"></i>
            <input type="text" id="search-tx" oninput="filterTransactions()" placeholder="Buscar por cliente o plan..." class="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors">
          </div>
          <select id="filter-status" onchange="filterTransactions()" class="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 outline-none focus:border-indigo-500 transition-colors cursor-pointer">
            <option value="todos">Todos</option>
            <option value="Completado">Completado</option>
            <option value="Pendiente">Pendiente</option>
          </select>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-slate-300">
          <thead class="text-[11px] uppercase tracking-wider text-slate-500 bg-slate-950/40 border-b border-slate-800">
            <tr>
              <th class="py-3 px-4">Cliente</th>
              <th class="py-3 px-4">Plan</th>
              <th class="py-3 px-4">Monto</th>
              <th class="py-3 px-4">Fecha</th>
              <th class="py-3 px-4">Estado</th>
              <th class="py-3 px-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody id="tx-tbody" class="divide-y divide-slate-800/60 font-medium">
            <!-- Rows injected by JS -->
          </tbody>
        </table>
      </div>
    </div>

  </div>

  <!-- Toast Notification -->
  <div id="toast" class="fixed bottom-6 right-6 bg-slate-900 border border-indigo-500/40 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 pointer-events-none opacity-0 transition-opacity duration-300 z-50">
    <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-400"></i>
    <span id="toast-text" class="text-xs font-bold">Notificación</span>
  </div>

  <script>
    let revChart, chanChart;
    let transactions = [
      { id: 'tx_101', name: 'Sophia Taylor', email: 'sophia@acme.ai', plan: 'Enterprise Annual', amount: 2400, date: 'Hace 4 min', status: 'Completado' },
      { id: 'tx_102', name: 'David Vance', email: 'david@fintech.io', plan: 'Team Pro', amount: 390, date: 'Hace 22 min', status: 'Completado' },
      { id: 'tx_103', name: 'Elena Rostova', email: 'elena@neural.app', plan: 'Startup Scale', amount: 890, date: 'Hace 1 hora', status: 'Completado' },
      { id: 'tx_104', name: 'Liam Zhang', email: 'liam@nexus.co', plan: 'Team Pro', amount: 390, date: 'Hace 3 horas', status: 'Pendiente' },
      { id: 'tx_105', name: 'Lucas Rossi', email: 'lucas@studio.design', plan: 'Pro Monthly', amount: 99, date: 'Hace 5 horas', status: 'Completado' }
    ];

    function initCharts() {
      // 1. Revenue Area Chart
      const revCtx = document.getElementById('revenueChart').getContext('2d');
      const grad = revCtx.createLinearGradient(0, 0, 0, 280);
      grad.addColorStop(0, 'rgba(99, 102, 241, 0.45)');
      grad.addColorStop(1, 'rgba(99, 102, 241, 0.0)');

      revChart = new Chart(revCtx, {
        type: 'line',
        data: {
          labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct'],
          datasets: [{
            label: 'Ingresos MRR ($)',
            data: [38000, 42000, 47500, 53000, 61000, 67500, 74000, 79200, 81500, 84250],
            borderColor: '#6366f1',
            borderWidth: 3,
            fill: true,
            backgroundColor: grad,
            tension: 0.4,
            pointBackgroundColor: '#6366f1',
            pointRadius: 4,
            pointHoverRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#0f172a',
              borderColor: '#334155',
              borderWidth: 1,
              titleFont: { size: 12, weight: 'bold' },
              padding: 10,
              callbacks: {
                label: (ctx) => 'MRR: $' + ctx.parsed.y.toLocaleString()
              }
            }
          },
          scales: {
            x: { grid: { color: 'rgba(255, 255, 255, 0.04)' }, ticks: { color: '#94a3b8', font: { size: 11 } } },
            y: { grid: { color: 'rgba(255, 255, 255, 0.04)' }, ticks: { color: '#94a3b8', font: { size: 11 }, callback: (v) => '$' + (v/1000) + 'k' } }
          }
        }
      });

      // 2. Channels Doughnut Chart
      const chanCtx = document.getElementById('channelsChart').getContext('2d');
      chanChart = new Chart(chanCtx, {
        type: 'doughnut',
        data: {
          labels: ['Orgánico', 'Publicidad', 'Referidos', 'Directo'],
          datasets: [{
            data: [42, 28, 18, 12],
            backgroundColor: ['#6366f1', '#ec4899', '#22d3ee', '#10b981'],
            borderWidth: 0,
            hoverOffset: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { backgroundColor: '#0f172a', borderColor: '#334155', borderWidth: 1 }
          },
          cutout: '72%'
        }
      });
    }

    function renderTransactions(list) {
      const tbody = document.getElementById('tx-tbody');
      tbody.innerHTML = list.map(tx => \`
        <tr class="hover:bg-slate-800/40 transition-colors">
          <td class="py-3.5 px-4">
            <div class="font-bold text-white">\${tx.name}</div>
            <div class="text-[11px] text-slate-400">\${tx.email}</div>
          </td>
          <td class="py-3.5 px-4 text-slate-300 font-semibold">\${tx.plan}</td>
          <td class="py-3.5 px-4 font-black text-white font-mono">$\${tx.amount.toLocaleString()}</td>
          <td class="py-3.5 px-4 text-slate-400">\${tx.date}</td>
          <td class="py-3.5 px-4">
            <span class="px-2.5 py-1 rounded-full text-[10px] font-bold \${
              tx.status === 'Completado' 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }">
              \${tx.status}
            </span>
          </td>
          <td class="py-3.5 px-4 text-right">
            <button onclick="resendReceipt('\${tx.name}')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold transition-all cursor-pointer">
              Factura
            </button>
          </td>
        </tr>
      \`).join('');
    }

    function filterTransactions() {
      const query = document.getElementById('search-tx').value.toLowerCase();
      const status = document.getElementById('filter-status').value;

      const filtered = transactions.filter(t => {
        const matchesQuery = t.name.toLowerCase().includes(query) || t.email.toLowerCase().includes(query) || t.plan.toLowerCase().includes(query);
        const matchesStatus = status === 'todos' || t.status === status;
        return matchesQuery && matchesStatus;
      });

      renderTransactions(filtered);
    }

    function simulateNewTransaction() {
      const names = ['Mateo Alva', 'Camila Benitez', 'Oliver Green', 'Valeria Rios'];
      const plans = ['Enterprise Annual (,400)', 'Startup Scale ()', 'Team Pro ()'];
      const chosenName = names[Math.floor(Math.random() * names.length)];
      const isAnnual = Math.random() > 0.6;
      const amount = isAnnual ? 2400 : 390;

      const newTx = {
        id: 'tx_' + Date.now().toString().slice(-4),
        name: chosenName,
        email: chosenName.toLowerCase().replace(' ', '.') + '@tech.com',
        plan: isAnnual ? 'Enterprise Annual' : 'Team Pro',
        amount,
        date: 'Justo ahora',
        status: 'Completado'
      };

      transactions.unshift(newTx);
      renderTransactions(transactions);

      // Update MRR
      const curMrr = parseInt(document.getElementById('kpi-mrr').innerText.replace(/[^0-9]/g, ''), 10);
      const updatedMrr = curMrr + Math.round(amount / 12);
      document.getElementById('kpi-mrr').innerText = '$' + updatedMrr.toLocaleString();

      showToast('🎉 Nuevo pago recibido de ' + chosenName + ': $' + amount);
    }

    function setTimeRange(range) {
      ['7d', '30d', 'ytd'].forEach(r => {
        const btn = document.getElementById('btn-' + r);
        if (btn) btn.className = 'px-2.5 py-1 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer';
      });
      document.getElementById('btn-' + range.toLowerCase()).className = 'px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold transition-all cursor-pointer shadow-sm';

      if (range === '7D') {
        revChart.data.labels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
        revChart.data.datasets[0].data = [12000, 14500, 13800, 16900, 18400, 21000, 22450];
      } else if (range === '30D') {
        revChart.data.labels = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];
        revChart.data.datasets[0].data = [65000, 72000, 78000, 84250];
      } else {
        revChart.data.labels = ['Q1', 'Q2', 'Q3', 'Q4'];
        revChart.data.datasets[0].data = [180000, 245000, 310000, 385000];
      }
      revChart.update();
      showToast('Filtro de tiempo aplicado: ' + range);
    }

    function exportCsv() {
      const rows = [
        ['ID', 'Cliente', 'Email', 'Plan', 'Monto', 'Fecha', 'Estado'],
        ...transactions.map(t => [t.id, t.name, t.email, t.plan, t.amount, t.date, t.status])
      ];
      const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', 'aura_transacciones.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Exportación CSV completada.');
    }

    function resendReceipt(customer) {
      showToast('Factura fiscal enviada por email a ' + customer);
    }

    function showToast(msg) {
      const toast = document.getElementById('toast');
      document.getElementById('toast-text').innerText = msg;
      toast.style.opacity = '1';
      setTimeout(() => { toast.style.opacity = '0'; }, 3000);
    }

    document.addEventListener('DOMContentLoaded', () => {
      lucide.createIcons();
      initCharts();
      renderTransactions(transactions);
    });
  </script>
</body>
</html>`;
