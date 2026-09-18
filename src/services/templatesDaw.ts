export const SYNTHWAVE_DAW_HTML = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NONA SynthWave DAW Studio</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    body { background: #0b0f19; font-family: system-ui, -apple-system, sans-serif; }
    .glass-panel { background: rgba(17, 24, 39, 0.85); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.08); }
    .step-btn { transition: all 0.12s ease; }
    .step-btn.active-step { box-shadow: 0 0 12px currentColor; }
    .current-tick { outline: 2px solid #38bdf8; outline-offset: 1px; }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #0f172a; }
    ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
  </style>
</head>
<body class="text-slate-100 min-h-screen flex flex-col select-none overflow-x-hidden">

  <!-- Top DAW Nav -->
  <header class="border-b border-slate-800/80 bg-slate-950/80 px-4 py-3 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md">
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-fuchsia-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-fuchsia-600/30">
        <i data-lucide="music" class="w-5 h-5"></i>
      </div>
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-sm font-black tracking-wider uppercase bg-gradient-to-r from-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">SYNTHWAVE DAW 2026</h1>
          <span class="px-2 py-0.5 rounded-full text-[9px] font-bold bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30">WEB AUDIO</span>
        </div>
        <p class="text-[11px] text-slate-400 font-medium">Secuenciador polifónico de 16 pasos y sintetizador de ritmos</p>
      </div>
    </div>

    <!-- Transport & Presets Bar -->
    <div class="flex items-center gap-3">
      <!-- Preset selector -->
      <div class="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs">
        <span class="text-[10px] uppercase font-bold text-slate-400 mr-1">Preset:</span>
        <button onclick="loadPreset('synthwave')" class="px-2 py-0.5 rounded-lg font-semibold text-[11px] bg-slate-800 hover:bg-slate-700 transition-colors">Synthwave</button>
        <button onclick="loadPreset('cyberpunk')" class="px-2 py-0.5 rounded-lg font-semibold text-[11px] hover:bg-slate-800 text-slate-400 transition-colors">Cyberpunk</button>
        <button onclick="loadPreset('lofi')" class="px-2 py-0.5 rounded-lg font-semibold text-[11px] hover:bg-slate-800 text-slate-400 transition-colors">Lo-Fi</button>
      </div>

      <!-- Playback Controls -->
      <div class="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5">
        <button id="btnPlay" onclick="togglePlay()" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-emerald-500/20 cursor-pointer">
          <i id="iconPlay" data-lucide="play" class="w-4 h-4 fill-current"></i>
          <span id="textPlay">REPRODUCIR</span>
        </button>

        <button onclick="stopSequencer()" class="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer" title="Detener">
          <i data-lucide="square" class="w-4 h-4"></i>
        </button>

        <button onclick="clearGrid()" class="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer" title="Limpiar Grilla">
          <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>

        <button onclick="randomizePattern()" class="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer" title="Aleatorio">
          <i data-lucide="shuffle" class="w-4 h-4"></i>
        </button>
      </div>

      <!-- Tempo & Swing -->
      <div class="flex items-center gap-3 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
        <div class="flex items-center gap-2">
          <span class="text-[10px] font-bold text-slate-400 uppercase">BPM</span>
          <input type="range" id="tempoSlider" min="60" max="180" value="120" oninput="updateTempo(this.value)" class="w-20 accent-fuchsia-500 cursor-pointer">
          <span id="tempoVal" class="font-mono font-bold text-cyan-400 w-8">120</span>
        </div>
      </div>
    </div>
  </header>

  <!-- Main Studio Workspace -->
  <main class="flex-1 p-4 max-w-7xl mx-auto w-full flex flex-col gap-4">

    <!-- Top Visualizer & Status Display -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- Oscilloscope / Spectrum canvas -->
      <div class="md:col-span-2 glass-panel rounded-2xl p-4 flex flex-col justify-between h-36 relative overflow-hidden">
        <div class="flex items-center justify-between z-10">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Espectrómetro en Tiempo Real</span>
          </div>
          <div class="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
            <span>Audio Context: <span id="audioStatus" class="text-amber-400 font-bold">Inactivo</span></span>
          </div>
        </div>
        <canvas id="visualizerCanvas" class="w-full h-24 rounded-lg bg-slate-950/60 border border-slate-800/60"></canvas>
      </div>

      <!-- Quick FX & Master Rack -->
      <div class="glass-panel rounded-2xl p-4 flex flex-col justify-between">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rack de Master & Efectos</span>
        <div class="space-y-2 text-xs">
          <div>
            <div class="flex justify-between text-[10px] text-slate-400 mb-1">
              <span>Volumen Master</span>
              <span id="masterVolVal" class="font-mono text-cyan-400 font-bold">80%</span>
            </div>
            <input type="range" id="masterVol" min="0" max="100" value="80" oninput="updateMasterVol(this.value)" class="w-full accent-cyan-400 cursor-pointer">
          </div>
          <div class="grid grid-cols-2 gap-2 pt-1">
            <button id="fxReverbBtn" onclick="toggleFx('reverb')" class="py-1.5 px-2 rounded-xl text-center font-bold text-[11px] bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-500 cursor-pointer transition-all">
              Reverb Space: <span id="reverbStatus" class="text-rose-400">OFF</span>
            </button>
            <button id="fxDistortBtn" onclick="toggleFx('distortion')" class="py-1.5 px-2 rounded-xl text-center font-bold text-[11px] bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-500 cursor-pointer transition-all">
              Analog Drive: <span id="distortStatus" class="text-rose-400">OFF</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Step Grid Matrix -->
    <div class="glass-panel rounded-2xl p-4 shadow-2xl flex flex-col gap-2">
      <!-- Step Numbers Header (1-16) -->
      <div class="flex items-center gap-2 pb-1 border-b border-slate-800 text-[10px] font-mono text-slate-500">
        <div class="w-40 shrink-0 font-bold text-slate-400 uppercase">Pista / Instrumento</div>
        <div class="flex-1 grid grid-cols-16 gap-1.5 text-center">
          <script>
            for(let i=1; i<=16; i++) {
              const isBar = (i - 1) % 4 === 0;
              document.write('<div class="'+ (isBar ? "text-cyan-400 font-black" : "") +'">'+ i +'</div>');
            }
          </script>
        </div>
      </div>

      <!-- Tracks Container -->
      <div id="tracksList" class="flex flex-col gap-2.5 pt-1">
        <!-- Rendered dynamically by JS -->
      </div>
    </div>

    <!-- Keyboard / Synth Pad Controller -->
    <div class="glass-panel rounded-2xl p-4">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <i data-lucide="sliders" class="w-4 h-4 text-cyan-400"></i>
          <span class="text-xs font-bold text-slate-300 uppercase tracking-wider">Pads de Disparo en Vivo (Live Pads)</span>
        </div>
        <span class="text-[10px] text-slate-500">Haz clic para escuchar o probar cada instrumento al instante</span>
      </div>
      <div class="grid grid-cols-3 sm:grid-cols-6 gap-2">
        <button onclick="triggerInstrument(0)" class="py-3 px-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold text-xs flex flex-col items-center gap-1 active:scale-95 transition-all cursor-pointer">
          <span class="text-base">🥁</span>
          <span>Kick 808</span>
        </button>
        <button onclick="triggerInstrument(1)" class="py-3 px-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold text-xs flex flex-col items-center gap-1 active:scale-95 transition-all cursor-pointer">
          <span class="text-base">💥</span>
          <span>Snare Crisp</span>
        </button>
        <button onclick="triggerInstrument(2)" class="py-3 px-2 rounded-xl bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 font-bold text-xs flex flex-col items-center gap-1 active:scale-95 transition-all cursor-pointer">
          <span class="text-base">✨</span>
          <span>Closed Hat</span>
        </button>
        <button onclick="triggerInstrument(3)" class="py-3 px-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex flex-col items-center gap-1 active:scale-95 transition-all cursor-pointer">
          <span class="text-base">👏</span>
          <span>Hand Clap</span>
        </button>
        <button onclick="triggerInstrument(4)" class="py-3 px-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-bold text-xs flex flex-col items-center gap-1 active:scale-95 transition-all cursor-pointer">
          <span class="text-base">⚡</span>
          <span>Sub Bass</span>
        </button>
        <button onclick="triggerInstrument(5)" class="py-3 px-2 rounded-xl bg-fuchsia-500/10 hover:bg-fuchsia-500/20 border border-fuchsia-500/30 text-fuchsia-300 font-bold text-xs flex flex-col items-center gap-1 active:scale-95 transition-all cursor-pointer">
          <span class="text-base">🌌</span>
          <span>Neon Lead</span>
        </button>
      </div>
    </div>
  </main>

  <script>
    // --- Web Audio Synthesizer Engine ---
    let audioCtx = null;
    let masterGain = null;
    let analyser = null;
    let isPlaying = false;
    let currentStep = 0;
    let timerId = null;
    let bpm = 120;
    let fxReverb = false;
    let fxDistortion = false;

    const TRACKS = [
      { name: "Kick 808", color: "#f43f5e", bgClass: "bg-rose-500", textClass: "text-rose-400", borderClass: "border-rose-500/40", steps: new Array(16).fill(false) },
      { name: "Snare Crisp", color: "#f59e0b", bgClass: "bg-amber-500", textClass: "text-amber-400", borderClass: "border-amber-500/40", steps: new Array(16).fill(false) },
      { name: "Hi-Hat Closed", color: "#eab308", bgClass: "bg-yellow-500", textClass: "text-yellow-400", borderClass: "border-yellow-500/40", steps: new Array(16).fill(false) },
      { name: "Clap Snap", color: "#10b981", bgClass: "bg-emerald-500", textClass: "text-emerald-400", borderClass: "border-emerald-500/40", steps: new Array(16).fill(false) },
      { name: "Sub Bass C2", color: "#06b6d4", bgClass: "bg-cyan-500", textClass: "text-cyan-400", borderClass: "border-cyan-500/40", steps: new Array(16).fill(false) },
      { name: "Neon Pluck G4", color: "#d946ef", bgClass: "bg-fuchsia-500", textClass: "text-fuchsia-400", borderClass: "border-fuchsia-500/40", steps: new Array(16).fill(false) },
    ];

    function initAudio() {
      if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
        masterGain = audioCtx.createGain();
        masterGain.gain.setValueAtTime(0.8, audioCtx.currentTime);

        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 128;
        masterGain.connect(analyser);
        analyser.connect(audioCtx.destination);

        const status = document.getElementById('audioStatus');
        if (status) {
          status.innerText = "Activo (48kHz)";
          status.className = "text-emerald-400 font-bold";
        }
        drawVisualizer();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
    }

    // Instrument Synthesizers
    function playKick(time) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.setValueAtTime(140, time);
      osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.38);
      gain.gain.setValueAtTime(1.0, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.38);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(time);
      osc.stop(time + 0.39);
    }

    function playSnare(time) {
      // Noise burst + tone snap
      const bufferSize = audioCtx.sampleRate * 0.2;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;
      const noiseFilter = audioCtx.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.value = 800;

      const noiseGain = audioCtx.createGain();
      noiseGain.gain.setValueAtTime(0.7, time);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(masterGain);

      const osc = audioCtx.createOscillator();
      const oscGain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, time);
      oscGain.gain.setValueAtTime(0.5, time);
      oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
      osc.connect(oscGain);
      oscGain.connect(masterGain);

      noise.start(time);
      osc.start(time);
      osc.stop(time + 0.2);
    }

    function playHiHat(time) {
      const bufferSize = audioCtx.sampleRate * 0.05;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.8;
      }
      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 6500;
      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.4, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      noise.start(time);
    }

    function playClap(time) {
      const bufferSize = audioCtx.sampleRate * 0.25;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.9;
      }
      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1100;
      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.8, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.24);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      noise.start(time);
    }

    function playBass(time) {
      const osc = audioCtx.createOscillator();
      const filter = audioCtx.createBiquadFilter();
      const gain = audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(65.41, time); // C2
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(380, time);
      filter.frequency.exponentialRampToValueAtTime(90, time + 0.35);

      gain.gain.setValueAtTime(0.7, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.38);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);

      osc.start(time);
      osc.stop(time + 0.4);
    }

    function playLead(time) {
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc1.type = 'square';
      osc2.type = 'sawtooth';
      osc1.frequency.setValueAtTime(392.00, time); // G4
      osc2.frequency.setValueAtTime(395.00, time); // slight detune

      gain.gain.setValueAtTime(0.4, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(masterGain);

      osc1.start(time);
      osc2.start(time);
      osc1.stop(time + 0.28);
      osc2.stop(time + 0.28);
    }

    function triggerInstrument(trackIndex) {
      initAudio();
      const t = audioCtx.currentTime;
      switch(trackIndex) {
        case 0: playKick(t); break;
        case 1: playSnare(t); break;
        case 2: playHiHat(t); break;
        case 3: playClap(t); break;
        case 4: playBass(t); break;
        case 5: playLead(t); break;
      }
    }

    // --- Sequencer Tick & Step Execution ---
    function stepTick() {
      if (!isPlaying || !audioCtx) return;

      const t = audioCtx.currentTime;
      for (let i = 0; i < TRACKS.length; i++) {
        if (TRACKS[i].steps[currentStep]) {
          switch(i) {
            case 0: playKick(t); break;
            case 1: playSnare(t); break;
            case 2: playHiHat(t); break;
            case 3: playClap(t); break;
            case 4: playBass(t); break;
            case 5: playLead(t); break;
          }
        }
      }

      // Update UI cursor
      updateStepUI(currentStep);
      currentStep = (currentStep + 1) % 16;

      const intervalMs = (60 / bpm / 4) * 1000;
      timerId = setTimeout(stepTick, intervalMs);
    }

    function updateStepUI(stepIndex) {
      document.querySelectorAll('.step-col').forEach(el => {
        el.classList.remove('current-tick');
      });
      document.querySelectorAll('.step-col-' + stepIndex).forEach(el => {
        el.classList.add('current-tick');
      });
    }

    function togglePlay() {
      initAudio();
      isPlaying = !isPlaying;
      const btn = document.getElementById('btnPlay');
      const text = document.getElementById('textPlay');
      const icon = document.getElementById('iconPlay');

      if (isPlaying) {
        btn.classList.replace('bg-emerald-500', 'bg-rose-500');
        btn.classList.replace('hover:bg-emerald-400', 'hover:bg-rose-400');
        text.innerText = "PAUSAR";
        icon.setAttribute('data-lucide', 'pause');
        stepTick();
      } else {
        btn.classList.replace('bg-rose-500', 'bg-emerald-500');
        btn.classList.replace('hover:bg-rose-400', 'hover:bg-emerald-400');
        text.innerText = "REPRODUCIR";
        icon.setAttribute('data-lucide', 'play');
        if (timerId) clearTimeout(timerId);
      }
      lucide.createIcons();
    }

    function stopSequencer() {
      isPlaying = false;
      if (timerId) clearTimeout(timerId);
      currentStep = 0;
      updateStepUI(-1);
      const btn = document.getElementById('btnPlay');
      const text = document.getElementById('textPlay');
      const icon = document.getElementById('iconPlay');
      btn.classList.replace('bg-rose-500', 'bg-emerald-500');
      btn.classList.replace('hover:bg-rose-400', 'hover:bg-emerald-400');
      text.innerText = "REPRODUCIR";
      icon.setAttribute('data-lucide', 'play');
      lucide.createIcons();
    }

    function toggleStep(trackIndex, stepIndex) {
      TRACKS[trackIndex].steps[stepIndex] = !TRACKS[trackIndex].steps[stepIndex];
      renderTracks();
      if (TRACKS[trackIndex].steps[stepIndex]) {
        triggerInstrument(trackIndex);
      }
    }

    function clearGrid() {
      TRACKS.forEach(t => t.steps.fill(false));
      renderTracks();
    }

    function randomizePattern() {
      TRACKS.forEach((track, idx) => {
        for (let s = 0; s < 16; s++) {
          if (idx === 0) track.steps[s] = (s % 4 === 0) || (Math.random() < 0.2);
          else if (idx === 1) track.steps[s] = (s === 4 || s === 12);
          else if (idx === 2) track.steps[s] = (s % 2 === 0) || (Math.random() < 0.3);
          else if (idx === 3) track.steps[s] = (s === 4 || s === 12);
          else track.steps[s] = Math.random() < 0.25;
        }
      });
      renderTracks();
    }

    function loadPreset(presetName) {
      clearGrid();
      if (presetName === 'synthwave') {
        bpm = 124;
        // Kick on 0, 4, 8, 12 (4 on the floor)
        [0, 4, 8, 12].forEach(s => TRACKS[0].steps[s] = true);
        // Snare on 4, 12
        [4, 12].forEach(s => TRACKS[1].steps[s] = true);
        // HiHats on 2, 6, 10, 14 (offbeats)
        [2, 6, 10, 14].forEach(s => TRACKS[2].steps[s] = true);
        // Clap with snare
        [4, 12].forEach(s => TRACKS[3].steps[s] = true);
        // Bass driving eighth notes
        [0, 2, 4, 6, 8, 10, 12, 14].forEach(s => TRACKS[4].steps[s] = true);
        // Lead melody hook
        [0, 3, 6, 10, 14].forEach(s => TRACKS[5].steps[s] = true);
      } else if (presetName === 'cyberpunk') {
        bpm = 138;
        [0, 3, 6, 8, 11, 14].forEach(s => TRACKS[0].steps[s] = true);
        [4, 12].forEach(s => TRACKS[1].steps[s] = true);
        for(let i=0; i<16; i++) TRACKS[2].steps[i] = true;
        [10, 14].forEach(s => TRACKS[3].steps[s] = true);
        [0, 1, 3, 4, 6, 8, 9, 11, 14].forEach(s => TRACKS[4].steps[s] = true);
        [2, 5, 8, 13].forEach(s => TRACKS[5].steps[s] = true);
      } else if (presetName === 'lofi') {
        bpm = 84;
        [0, 6, 10].forEach(s => TRACKS[0].steps[s] = true);
        [4, 12].forEach(s => TRACKS[1].steps[s] = true);
        [2, 4, 6, 8, 10, 12, 14].forEach(s => TRACKS[2].steps[s] = true);
        [4, 12].forEach(s => TRACKS[3].steps[s] = true);
        [0, 3, 8, 11].forEach(s => TRACKS[4].steps[s] = true);
        [0, 7, 13].forEach(s => TRACKS[5].steps[s] = true);
      }
      document.getElementById('tempoSlider').value = bpm;
      document.getElementById('tempoVal').innerText = bpm;
      renderTracks();
    }

    function updateTempo(val) {
      bpm = parseInt(val, 10);
      document.getElementById('tempoVal').innerText = bpm;
    }

    function updateMasterVol(val) {
      document.getElementById('masterVolVal').innerText = val + '%';
      if (masterGain && audioCtx) {
        masterGain.gain.setValueAtTime(val / 100, audioCtx.currentTime);
      }
    }

    function toggleFx(type) {
      if (type === 'reverb') {
        fxReverb = !fxReverb;
        const s = document.getElementById('reverbStatus');
        s.innerText = fxReverb ? "ON" : "OFF";
        s.className = fxReverb ? "text-emerald-400" : "text-rose-400";
      } else if (type === 'distortion') {
        fxDistortion = !fxDistortion;
        const s = document.getElementById('distortStatus');
        s.innerText = fxDistortion ? "ON" : "OFF";
        s.className = fxDistortion ? "text-emerald-400" : "text-rose-400";
      }
    }

    // --- DOM Track Rendering ---
    function renderTracks() {
      const container = document.getElementById('tracksList');
      if (!container) return;

      container.innerHTML = TRACKS.map((track, tIdx) => {
        const stepsHtml = track.steps.map((isActive, sIdx) => {
          const isBarStart = sIdx % 4 === 0;
          return \`
            <button 
              onclick="toggleStep(\${tIdx}, \${sIdx})"
              class="step-col step-col-\${sIdx} h-10 rounded-lg flex items-center justify-center transition-all cursor-pointer \${
                isActive 
                  ? track.bgClass + ' text-white shadow-lg active-step' 
                  : (isBarStart ? 'bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700' : 'bg-slate-900/60 hover:bg-slate-800/60 border border-slate-800')
              }"
              title="Pista \${track.name} - Paso \${sIdx + 1}"
            >
              \${isActive ? '<div class="w-2 h-2 rounded-full bg-white shadow"></div>' : ''}
            </button>
          \`;
        }).join('');

        return \`
          <div class="flex items-center gap-2 bg-slate-950/40 p-2 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-colors">
            <div class="w-40 shrink-0 flex items-center justify-between pr-2">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full" style="background-color: \${track.color}"></span>
                <span class="text-xs font-bold \${track.textClass}">\${track.name}</span>
              </div>
              <button onclick="triggerInstrument(\${tIdx})" class="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors cursor-pointer" title="Escuchar Pista">
                <i data-lucide="volume-2" class="w-3.5 h-3.5"></i>
              </button>
            </div>
            <div class="flex-1 grid grid-cols-16 gap-1.5">
              \${stepsHtml}
            </div>
          </div>
        \`;
      }).join('');

      lucide.createIcons();
    }

    // --- Oscilloscope Visualizer Loop ---
    function drawVisualizer() {
      requestAnimationFrame(drawVisualizer);
      const canvas = document.getElementById('visualizerCanvas');
      if (!canvas || !analyser) return;

      const ctx = canvas.getContext('2d');
      const width = canvas.width = canvas.offsetWidth;
      const height = canvas.height = canvas.offsetHeight;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, width, height);

      // Gradient background glow
      const barWidth = (width / bufferLength) * 1.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * height;

        const gradient = ctx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, '#06b6d4');
        gradient.addColorStop(0.5, '#a855f7');
        gradient.addColorStop(1, '#ec4899');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);

        x += barWidth;
      }
    }

    // Init on startup
    window.addEventListener('DOMContentLoaded', () => {
      lucide.createIcons();
      loadPreset('synthwave');
    });
  </script>
</body>
</html>`;
