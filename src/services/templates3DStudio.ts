export const THREE_D_STUDIO_HTML = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NONA 3D Geometry Studio Pro</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    body { margin: 0; overflow: hidden; background: #090d16; font-family: system-ui, -apple-system, sans-serif; }
    canvas { display: block; width: 100vw; height: 100vh; }
    .glass-panel { background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
  </style>
</head>
<body class="select-none text-slate-100 flex flex-col h-screen w-screen overflow-hidden">

  <!-- Top Studio Header -->
  <header class="absolute top-3 left-3 right-3 flex justify-between items-center z-20 pointer-events-none">
    <div class="glass-panel px-4 py-2.5 rounded-2xl flex items-center gap-3 pointer-events-auto shadow-xl">
      <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
        <i data-lucide="box" class="w-4 h-4"></i>
      </div>
      <div>
        <h1 class="text-xs font-black tracking-wider text-white uppercase flex items-center gap-1.5">
          <span>3D GEOMETRY STUDIO PRO</span>
          <span class="px-1.5 py-0.2 bg-indigo-500/20 text-indigo-400 text-[9px] font-bold rounded-full border border-indigo-500/30">WebGL</span>
        </h1>
        <p class="text-[10px] text-slate-400 font-medium">Modelador interactivo de figuras tridimensionales</p>
      </div>
    </div>

    <!-- Quick Viewport & Lighting Presets -->
    <div class="glass-panel px-3 py-1.5 rounded-2xl flex items-center gap-2 pointer-events-auto shadow-xl text-xs">
      <span class="text-[10px] text-slate-400 font-bold uppercase mr-1">Luz:</span>
      <button onclick="setLighting('studio')" id="btn-light-studio" class="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-[11px] transition-all cursor-pointer">Estudio</button>
      <button onclick="setLighting('sunset')" id="btn-light-sunset" class="px-2.5 py-1 rounded-lg hover:bg-slate-800 text-slate-400 font-bold text-[11px] transition-all cursor-pointer">Atardecer</button>
      <button onclick="setLighting('cyberpunk')" id="btn-light-cyber" class="px-2.5 py-1 rounded-lg hover:bg-slate-800 text-slate-400 font-bold text-[11px] transition-all cursor-pointer">Neón</button>
      <div class="h-4 w-px bg-slate-700 mx-1"></div>
      <button onclick="resetCamera()" title="Restablecer Cámara" class="p-1.5 hover:bg-slate-800 text-slate-300 rounded-lg transition-all cursor-pointer">
        <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
      </button>
      <button onclick="takeSnapshot()" title="Descargar Captura PNG" class="p-1.5 bg-emerald-600/80 hover:bg-emerald-500 text-white rounded-lg transition-all cursor-pointer">
        <i data-lucide="camera" class="w-3.5 h-3.5"></i>
      </button>
    </div>
  </header>

  <!-- Left Toolbar: Primitives Catalog -->
  <aside class="absolute top-20 left-3 z-20 glass-panel p-3 rounded-2xl shadow-2xl flex flex-col gap-2 pointer-events-auto w-48">
    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Añadir Geometría</span>
    <div class="grid grid-cols-2 gap-1.5">
      <button onclick="addShape('cube')" class="p-2 rounded-xl bg-slate-800/80 hover:bg-indigo-600/30 hover:border-indigo-500 border border-slate-700 flex flex-col items-center gap-1 transition-all text-left group cursor-pointer">
        <i data-lucide="box" class="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform"></i>
        <span class="text-[10px] font-bold text-slate-300">Cubo</span>
      </button>
      <button onclick="addShape('sphere')" class="p-2 rounded-xl bg-slate-800/80 hover:bg-indigo-600/30 hover:border-indigo-500 border border-slate-700 flex flex-col items-center gap-1 transition-all text-left group cursor-pointer">
        <i data-lucide="circle" class="w-4 h-4 text-violet-400 group-hover:scale-110 transition-transform"></i>
        <span class="text-[10px] font-bold text-slate-300">Esfera</span>
      </button>
      <button onclick="addShape('cylinder')" class="p-2 rounded-xl bg-slate-800/80 hover:bg-indigo-600/30 hover:border-indigo-500 border border-slate-700 flex flex-col items-center gap-1 transition-all text-left group cursor-pointer">
        <i data-lucide="cylinder" class="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform"></i>
        <span class="text-[10px] font-bold text-slate-300">Cilindro</span>
      </button>
      <button onclick="addShape('cone')" class="p-2 rounded-xl bg-slate-800/80 hover:bg-indigo-600/30 hover:border-indigo-500 border border-slate-700 flex flex-col items-center gap-1 transition-all text-left group cursor-pointer">
        <i data-lucide="triangle" class="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform"></i>
        <span class="text-[10px] font-bold text-slate-300">Cono</span>
      </button>
      <button onclick="addShape('torus')" class="p-2 rounded-xl bg-slate-800/80 hover:bg-indigo-600/30 hover:border-indigo-500 border border-slate-700 flex flex-col items-center gap-1 transition-all text-left group cursor-pointer">
        <i data-lucide="donut" class="w-4 h-4 text-pink-400 group-hover:scale-110 transition-transform"></i>
        <span class="text-[10px] font-bold text-slate-300">Toro</span>
      </button>
      <button onclick="addShape('dodecahedron')" class="p-2 rounded-xl bg-slate-800/80 hover:bg-indigo-600/30 hover:border-indigo-500 border border-slate-700 flex flex-col items-center gap-1 transition-all text-left group cursor-pointer">
        <i data-lucide="sparkles" class="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform"></i>
        <span class="text-[10px] font-bold text-slate-300">Cristal</span>
      </button>
    </div>

    <div class="h-px bg-slate-800 my-1"></div>
    <div class="flex items-center justify-between px-1">
      <span class="text-[10px] text-slate-400">Total figuras:</span>
      <span id="shape-count" class="text-xs font-black text-indigo-400 font-mono">0</span>
    </div>
    <button onclick="clearAllShapes()" class="w-full py-1.5 px-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer">
      <i data-lucide="trash-2" class="w-3 h-3"></i> Limpiar Escena
    </button>
  </aside>

  <!-- Right Inspector: Selected Object Properties & Materials -->
  <aside id="inspector" class="absolute top-20 right-3 z-20 glass-panel p-4 rounded-2xl shadow-2xl flex flex-col gap-3 pointer-events-auto w-64 max-h-[80vh] overflow-y-auto">
    <div class="flex items-center justify-between border-b border-slate-800 pb-2">
      <span class="text-xs font-black text-white flex items-center gap-1.5 uppercase">
        <i data-lucide="sliders" class="w-3.5 h-3.5 text-indigo-400"></i> Inspector de Material
      </span>
      <span id="selected-name" class="text-[10px] font-bold text-indigo-400 bg-indigo-500/20 px-2 py-0.5 rounded-full">Ninguno</span>
    </div>

    <!-- Color Palette Picker -->
    <div class="space-y-1.5">
      <label class="text-[11px] font-bold text-slate-300">Color de Superficie</label>
      <div class="flex items-center gap-2">
        <input type="color" id="mat-color" value="#6366f1" onchange="updateMaterialColor(this.value)" class="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0">
        <div class="flex gap-1">
          <button onclick="setColor('#6366f1')" class="w-5 h-5 rounded-md bg-indigo-500 border border-white/20 cursor-pointer"></button>
          <button onclick="setColor('#ec4899')" class="w-5 h-5 rounded-md bg-pink-500 border border-white/20 cursor-pointer"></button>
          <button onclick="setColor('#06b6d4')" class="w-5 h-5 rounded-md bg-cyan-500 border border-white/20 cursor-pointer"></button>
          <button onclick="setColor('#10b981')" class="w-5 h-5 rounded-md bg-emerald-500 border border-white/20 cursor-pointer"></button>
          <button onclick="setColor('#f59e0b')" class="w-5 h-5 rounded-md bg-amber-500 border border-white/20 cursor-pointer"></button>
        </div>
      </div>
    </div>

    <!-- Sliders: Metalness, Roughness, Wireframe -->
    <div class="space-y-3 pt-1">
      <div class="space-y-1">
        <div class="flex justify-between text-[10px] text-slate-400">
          <span>Metalicidad</span>
          <span id="val-metal" class="font-mono text-slate-200">0.3</span>
        </div>
        <input type="range" id="mat-metal" min="0" max="1" step="0.05" value="0.3" oninput="updateMetalness(this.value)" class="w-full accent-indigo-500 cursor-pointer">
      </div>

      <div class="space-y-1">
        <div class="flex justify-between text-[10px] text-slate-400">
          <span>Rugosidad</span>
          <span id="val-rough" class="font-mono text-slate-200">0.4</span>
        </div>
        <input type="range" id="mat-rough" min="0" max="1" step="0.05" value="0.4" oninput="updateRoughness(this.value)" class="w-full accent-indigo-500 cursor-pointer">
      </div>

      <div class="space-y-1">
        <div class="flex justify-between text-[10px] text-slate-400">
          <span>Escala</span>
          <span id="val-scale" class="font-mono text-slate-200">1.0x</span>
        </div>
        <input type="range" id="mat-scale" min="0.2" max="3" step="0.1" value="1.0" oninput="updateScale(this.value)" class="w-full accent-indigo-500 cursor-pointer">
      </div>

      <div class="flex items-center justify-between pt-1">
        <label for="mat-wireframe" class="text-[11px] font-bold text-slate-300">Modo Wireframe</label>
        <input type="checkbox" id="mat-wireframe" onchange="toggleWireframe(this.checked)" class="w-4 h-4 accent-indigo-600 rounded cursor-pointer">
      </div>

      <div class="flex items-center justify-between">
        <label for="auto-rotate" class="text-[11px] font-bold text-slate-300">Giro Automático</label>
        <input type="checkbox" id="auto-rotate" onchange="toggleAutoRotate(this.checked)" checked class="w-4 h-4 accent-indigo-600 rounded cursor-pointer">
      </div>
    </div>

    <!-- Action: Delete selected -->
    <div class="pt-2 border-t border-slate-800 flex gap-2">
      <button onclick="deleteSelectedShape()" class="flex-1 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer">
        <i data-lucide="trash" class="w-3 h-3"></i> Eliminar
      </button>
      <button onclick="duplicateSelectedShape()" class="flex-1 py-1.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer">
        <i data-lucide="copy" class="w-3 h-3"></i> Duplicar
      </button>
    </div>
  </aside>

  <!-- Bottom Instructions HUD -->
  <footer class="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 glass-panel px-4 py-1.5 rounded-full shadow-xl flex items-center gap-4 text-[11px] text-slate-400 pointer-events-none">
    <span class="flex items-center gap-1"><kbd class="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 font-mono text-[9px]">Clic Izq</kbd> Orbitar</span>
    <span class="flex items-center gap-1"><kbd class="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 font-mono text-[9px]">Clic Der</kbd> Desplazar</span>
    <span class="flex items-center gap-1"><kbd class="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 font-mono text-[9px]">Rueda</kbd> Zoom</span>
  </footer>

  <!-- 3D Canvas Mounting Area -->
  <div id="webgl-container" class="w-full h-full"></div>

  <script>
    let scene, camera, renderer, controls;
    let dirLight, ambLight;
    let shapes = [];
    let selectedMesh = null;
    let isAutoRotating = true;
    let raycaster, mouse;

    function init() {
      const container = document.getElementById('webgl-container');
      
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x090d16);
      scene.fog = new THREE.FogExp2(0x090d16, 0.02);

      camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.set(0, 5, 10);

      renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      container.appendChild(renderer.domElement);

      controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.maxPolarAngle = Math.PI / 2 + 0.05;

      ambLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambLight);

      dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
      dirLight.position.set(8, 14, 8);
      dirLight.castShadow = true;
      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;
      scene.add(dirLight);

      const grid = new THREE.GridHelper(30, 30, 0x6366f1, 0x1e293b);
      grid.position.y = -0.01;
      scene.add(grid);

      const floorGeo = new THREE.PlaneGeometry(60, 60);
      floorGeo.rotateX(-Math.PI / 2);
      const floorMat = new THREE.MeshStandardMaterial({ color: 0x070a12, roughness: 0.8, metalness: 0.2 });
      const floor = new THREE.Mesh(floorGeo, floorMat);
      floor.receiveShadow = true;
      scene.add(floor);

      raycaster = new THREE.Raycaster();
      mouse = new THREE.Vector2();

      addShape('cube', { x: -3, y: 1, z: 0 }, '#6366f1');
      addShape('sphere', { x: 0, y: 1.2, z: 0 }, '#ec4899');
      addShape('torus', { x: 3, y: 1.3, z: 0 }, '#06b6d4');

      window.addEventListener('resize', onResize);
      renderer.domElement.addEventListener('pointerdown', onPointerDown);

      animate();
    }

    function addShape(type, customPos, customColor) {
      let geo;
      const col = customColor || '#6366f1';

      switch(type) {
        case 'cube': geo = new THREE.BoxGeometry(1.8, 1.8, 1.8); break;
        case 'sphere': geo = new THREE.SphereGeometry(1.2, 32, 32); break;
        case 'cylinder': geo = new THREE.CylinderGeometry(0.9, 0.9, 2.2, 32); break;
        case 'cone': geo = new THREE.ConeGeometry(1.1, 2.2, 32); break;
        case 'torus': geo = new THREE.TorusGeometry(1.0, 0.38, 24, 48); break;
        case 'dodecahedron': geo = new THREE.DodecahedronGeometry(1.3, 0); break;
        default: geo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
      }

      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(col),
        metalness: 0.3,
        roughness: 0.35,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      if (customPos) {
        mesh.position.set(customPos.x, customPos.y, customPos.z);
      } else {
        const offset = (shapes.length % 5 - 2) * 2.5;
        const zOffset = Math.floor(shapes.length / 5) * -3;
        mesh.position.set(offset, 1.2, zOffset);
      }

      mesh.name = type.charAt(0).toUpperCase() + type.slice(1) + ' #' + (shapes.length + 1);
      scene.add(mesh);
      shapes.push(mesh);
      selectShape(mesh);
      updateStats();
    }

    function selectShape(mesh) {
      if (selectedMesh) {
        selectedMesh.material.emissive.setHex(0x000000);
      }
      selectedMesh = mesh;
      if (mesh) {
        mesh.material.emissive.setHex(0x222233);
        document.getElementById('selected-name').innerText = mesh.name;
        document.getElementById('mat-color').value = '#' + mesh.material.color.getHexString();
        document.getElementById('mat-metal').value = mesh.material.metalness;
        document.getElementById('val-metal').innerText = mesh.material.metalness;
        document.getElementById('mat-rough').value = mesh.material.roughness;
        document.getElementById('val-rough').innerText = mesh.material.roughness;
        document.getElementById('mat-wireframe').checked = Boolean(mesh.material.wireframe);
        document.getElementById('val-scale').innerText = mesh.scale.x.toFixed(1) + 'x';
        document.getElementById('mat-scale').value = mesh.scale.x;
      } else {
        document.getElementById('selected-name').innerText = 'Ninguno';
      }
    }

    function onPointerDown(event) {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(shapes);
      if (intersects.length > 0) {
        selectShape(intersects[0].object);
      }
    }

    function updateMaterialColor(hex) {
      if (!selectedMesh) return;
      selectedMesh.material.color.set(hex);
    }

    function setColor(hex) {
      document.getElementById('mat-color').value = hex;
      updateMaterialColor(hex);
    }

    function updateMetalness(val) {
      if (!selectedMesh) return;
      selectedMesh.material.metalness = parseFloat(val);
      document.getElementById('val-metal').innerText = val;
    }

    function updateRoughness(val) {
      if (!selectedMesh) return;
      selectedMesh.material.roughness = parseFloat(val);
      document.getElementById('val-rough').innerText = val;
    }

    function updateScale(val) {
      if (!selectedMesh) return;
      const s = parseFloat(val);
      selectedMesh.scale.set(s, s, s);
      document.getElementById('val-scale').innerText = s.toFixed(1) + 'x';
    }

    function toggleWireframe(enabled) {
      if (!selectedMesh) return;
      selectedMesh.material.wireframe = enabled;
    }

    function toggleAutoRotate(enabled) {
      isAutoRotating = enabled;
    }

    function deleteSelectedShape() {
      if (!selectedMesh) return;
      scene.remove(selectedMesh);
      shapes = shapes.filter(s => s !== selectedMesh);
      selectedMesh.geometry.dispose();
      selectedMesh.material.dispose();
      selectShape(shapes[shapes.length - 1] || null);
      updateStats();
    }

    function duplicateSelectedShape() {
      if (!selectedMesh) return;
      const clone = selectedMesh.clone();
      clone.material = selectedMesh.material.clone();
      clone.position.x += 1.5;
      clone.position.z += 1.5;
      clone.name = selectedMesh.name + ' (Copia)';
      scene.add(clone);
      shapes.push(clone);
      selectShape(clone);
      updateStats();
    }

    function clearAllShapes() {
      shapes.forEach(s => {
        scene.remove(s);
        s.geometry.dispose();
        s.material.dispose();
      });
      shapes = [];
      selectShape(null);
      updateStats();
    }

    function setLighting(mode) {
      ['studio', 'sunset', 'cyber'].forEach(m => {
        const btn = document.getElementById('btn-light-' + m);
        if (btn) {
          btn.className = 'px-2.5 py-1 rounded-lg hover:bg-slate-800 text-slate-400 font-bold text-[11px] transition-all cursor-pointer';
        }
      });

      if (mode === 'studio') {
        document.getElementById('btn-light-studio').className = 'px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-[11px] transition-all cursor-pointer';
        scene.background.setHex(0x090d16);
        dirLight.color.setHex(0xffffff);
        ambLight.color.setHex(0xffffff);
        dirLight.intensity = 1.2;
      } else if (mode === 'sunset') {
        document.getElementById('btn-light-sunset').className = 'px-2.5 py-1 rounded-lg bg-amber-600 text-white font-bold text-[11px] transition-all cursor-pointer';
        scene.background.setHex(0x1a0b1e);
        dirLight.color.setHex(0xf59e0b);
        ambLight.color.setHex(0xec4899);
        dirLight.intensity = 1.6;
      } else if (mode === 'cyberpunk') {
        document.getElementById('btn-light-cyber').className = 'px-2.5 py-1 rounded-lg bg-pink-600 text-white font-bold text-[11px] transition-all cursor-pointer';
        scene.background.setHex(0x050510);
        dirLight.color.setHex(0x06b6d4);
        ambLight.color.setHex(0xd946ef);
        dirLight.intensity = 1.8;
      }
    }

    function resetCamera() {
      camera.position.set(0, 5, 10);
      controls.target.set(0, 1, 0);
      controls.update();
    }

    function takeSnapshot() {
      const link = document.createElement('a');
      link.download = 'nona-3d-geometry-snapshot.png';
      link.href = renderer.domElement.toDataURL('image/png');
      link.click();
    }

    function updateStats() {
      document.getElementById('shape-count').innerText = shapes.length;
    }

    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
      requestAnimationFrame(animate);
      controls.update();

      if (isAutoRotating) {
        shapes.forEach((s, idx) => {
          s.rotation.y += 0.008 * (idx % 2 === 0 ? 1 : -1);
          s.rotation.x += 0.004;
        });
      }

      renderer.render(scene, camera);
    }

    document.addEventListener('DOMContentLoaded', () => {
      lucide.createIcons();
      init();
    });
  </script>
</body>
</html>`;
