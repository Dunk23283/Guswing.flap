let scene, camera, renderer, bird, gates = [], clouds = [], islands = [], windLines = [], bullets = [], drones = [], particles = [], missiles = [], boss;
let score = 0, bestScore = 0, credits = 0, abilityMeter = 100, hp = 200, glassCracks = 0, bossHP = 0;
let gameActive = false, isPaused = false, gameState = 'SPLASH', selectedMode = 'normal';
let velocity = 0, forwardVelocity = 0, boostMode = false, abilityActive = false;
const gravity = -0.008, jumpStrength = 0.18, baseForwardSpeed = 0.45;
const gateInterval = 70;
let frameCount = 0;
let cameraShake = 0;
let isFiringBeam = false;
let empActive = false;

// Customization
let currentSkin = 'Default MK-1';
let currentLaserColor = 0x00ffff;
let currentTrailColor = null;

const hangarItems = {
    skins: [
        { name: 'Default MK-1', price: 0, unlocked: true, type: 'standard' },
        { name: 'Royal Guard', price: 0, unlocked: true, type: 'massive', color: 0xffd700, glow: 0xffffff },
        { name: 'Nebula Hunter', price: 0, unlocked: true, type: 'curved', glow: 0xaa00ff },
        { name: 'Shadow Stealth', price: 0, unlocked: true, type: 'sharp', glow: 0x333333 },
        { name: 'Solar Flare', price: 0, unlocked: true, type: 'massive', glow: 0xffaa00 },
        { name: 'Cryo Spear', price: 0, unlocked: true, type: 'long', glow: 0x00ffff },
        { name: 'Void Reaver', price: 0, unlocked: true, type: 'split', glow: 0xff00ff },
        { name: 'Jungle Predator', price: 0, unlocked: true, type: 'standard', color: 0x228b22, glow: 0x00ff00 },
        { name: 'Cyber Demon', price: 0, unlocked: true, type: 'mechanical', glow: 0xff0000 },
        { name: 'Gold Master', price: 0, unlocked: true, type: 'divine', color: 0xffd700, glow: 0xffd700 }
    ],
    lasers: [
        { name: 'Cyan Beam', color: 0x00ffff, price: 0, unlocked: true },
        { name: 'Fire Red', color: 0xff4500, price: 0, unlocked: true },
        { name: 'Toxic Green', color: 0x00ff00, price: 0, unlocked: true },
        { name: 'Phantom Purple', color: 0xaa00ff, price: 0, unlocked: true },
        { name: 'Solar Gold', color: 0xffd700, price: 0, unlocked: true }
    ],
    trails: [
        { name: 'None', color: null, price: 0, unlocked: true },
        { name: 'Cyan Streak', color: 0x00ffff, price: 0, unlocked: true },
        { name: 'Red Overdrive', color: 0xff4500, price: 0, unlocked: true },
        { name: 'Void Pulse', color: 0xff00ff, price: 0, unlocked: true }
    ]
};

// Security
let _v1 = 0;
function _check() { if (score !== _v1) { alert("SECURITY BREACH DETECTED: AUTO-BAN ENABLED"); location.reload(); } }
setInterval(() => { if (gameActive && !isPaused) _check(); }, 100);

// Audio
let audioCtx, jumpBuffer, coinBuffer, boostBuffer, shootBuffer, clickBuffer, motorSource, motorGain, musicSource, musicGain, missileBuffer, hangarSource, hangarGain;
let bgMusic = new Audio("bg_music.mp3");
bgMusic.loop = true;

function speak(text) { if (!soundEnabled || !window.speechSynthesis) return; const utterance = new SpeechSynthesisUtterance(text); utterance.rate = 1.2; utterance.pitch = 0.8; utterance.volume = 0.5; window.speechSynthesis.speak(utterance); }

// Settings
let soundEnabled = true, highGFX = 'ultra-pro-max', selectedMap = 'void', canBoost = true;
const maps = {
    'void': { sky: 0x87ceeb, fog: 0x87ceeb, island: 0x2a444a, ring: 0x8b5a2b, glow: 0xf0c55d, prop: 'rock' },
    'forest': { sky: 0x2d5a27, fog: 0x2d5a27, island: 0x1a3317, ring: 0x5d4037, glow: 0x8bc34a, prop: 'tree' },
    'sneek': { sky: 0x0a0a0f, fog: 0x0a0a0f, island: 0x111111, ring: 0x333333, glow: 0x00ffff, prop: 'crystal' },
    'zenith': { sky: 0xffa07a, fog: 0xffa07a, island: 0x4b0082, ring: 0xffd700, glow: 0xff4500, prop: 'mountain' },
    'volcano': { sky: 0x1a0505, fog: 0x1a0505, island: 0x000000, ring: 0xff0000, glow: 0xffaa00, prop: 'lava' },
    'cyber': { sky: 0x000000, fog: 0x002222, island: 0x001111, ring: 0x00ffff, glow: 0xff00ff, prop: 'data' },
    'abyss': { sky: 0x000814, fog: 0x000814, island: 0x001d3d, ring: 0x003566, glow: 0xffc300, prop: 'reef' },
    'glacier': { sky: 0xe0f2f1, fog: 0xe0f2f1, island: 0xb2ebf2, ring: 0x00bcd4, glow: 0xffffff, prop: 'ice' }
};

function init() {
    scene = new THREE.Scene();
    const theme = maps[selectedMap] || maps['void'];
    scene.background = new THREE.Color(theme.sky);
    scene.fog = new THREE.FogExp2(theme.fog, 0.01);
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document.body.appendChild(renderer.domElement);

    const setupAudio = () => {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            createProceduralSounds(); startMotorSound(); startIntenseMusic(); startHangarMusic();
        }
        if (audioCtx.state === 'suspended') audioCtx.resume();
    };

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(10, 20, 10); scene.add(sun);

    loadStats(); createBird(); createEnvironment();

    const bindBtn = (id, fn) => { const el = document.getElementById(id); if (el) el.onclick = (e) => { playSound(clickBuffer, 1.5); fn(e); }; };
    bindBtn('enter-button', () => { setupAudio(); showMenu('MAIN'); });
    bindBtn('launch-button', () => { setupAudio(); startGame(); });
    bindBtn('hangar-button', () => showMenu('HANGAR'));
    bindBtn('gamemodes-button', () => showMenu('GAMEMODES'));
    bindBtn('maps-button', () => showMenu('MAPS'));
    bindBtn('info-button', () => showMenu('INFO'));
    bindBtn('settings-button', () => showMenu('SETTINGS'));
    bindBtn('exit-button', () => window.close());
    bindBtn('close-maps', () => showMenu(gameActive ? 'PAUSE' : 'MAIN'));
    bindBtn('close-gamemodes', () => showMenu(gameActive ? 'PAUSE' : 'MAIN'));
    bindBtn('close-info', () => showMenu('MAIN'));
    bindBtn('close-settings', () => showMenu(gameActive ? 'PAUSE' : 'MAIN'));
    bindBtn('close-hangar', () => showMenu('MAIN'));
    bindBtn('respawn-button', startGame);
    bindBtn('exit-to-menu-button', () => { gameActive = false; isPaused = false; showMenu('MAIN'); });
    bindBtn('pause-button', () => showMenu('PAUSE'));
    bindBtn('resume-button', resumeGameWithCountdown);
    bindBtn('restart-button-pause', startGame);
    bindBtn('pause-maps-button', () => showMenu('MAPS'));
    bindBtn('pause-modes-button', () => showMenu('GAMEMODES'));
    bindBtn('pause-exit-button', () => { gameActive = false; isPaused = false; showMenu('MAIN'); });

    document.querySelectorAll('[data-map]').forEach(btn => { btn.onclick = (e) => { playSound(clickBuffer, 1.2); document.querySelectorAll('[data-map]').forEach(b => b.classList.remove('active')); e.currentTarget.classList.add('active'); selectedMap = e.currentTarget.dataset.map; updateMapTheme(); }; });
    document.querySelectorAll('[data-mode]').forEach(btn => { btn.onclick = (e) => { playSound(clickBuffer, 1.2); document.querySelectorAll('[data-mode]').forEach(b => b.classList.remove('active')); e.currentTarget.classList.add('active'); selectedMode = e.currentTarget.dataset.mode; }; });
    document.querySelectorAll('[data-gfx]').forEach(btn => { btn.onclick = (e) => { playSound(clickBuffer, 1.2); document.querySelectorAll('[data-gfx]').forEach(b => b.classList.remove('active')); e.currentTarget.classList.add('active'); highGFX = e.currentTarget.dataset.gfx; applyGraphics(); }; });
    bindBtn('toggle-sound', (e) => { soundEnabled = !soundEnabled; document.getElementById('sound-status').innerText = soundEnabled ? 'ENABLED' : 'DISABLED'; e.currentTarget.classList.toggle('disabled', !soundEnabled); if (motorGain) motorGain.gain.setTargetAtTime(soundEnabled && gameState === 'GAME' ? 0.1 : 0, audioCtx.currentTime, 0.1); if (bgMusic) { if (soundEnabled) bgMusic.play(); else bgMusic.pause(); } });

    bindBtn('tab-skins', () => renderHangar('skins'));
    bindBtn('tab-lasers', () => renderHangar('lasers'));
    bindBtn('tab-trails', () => renderHangar('trails'));

    window.addEventListener('resize', onWindowResize);
    document.addEventListener('keydown', (e) => { if (e.code === 'Escape') { if (gameState === 'GAME') showMenu('PAUSE'); else if (gameState === 'PAUSE') resumeGameWithCountdown(); } if (e.code === 'Space' || e.code === 'KeyW') handleInput(); if (e.code === 'KeyF') useAbility(); if (e.code === 'KeyE') fireMissiles(); });
    document.addEventListener('mousedown', (e) => { if (e.button === 0) handleInput(); if (e.button === 2) isFiringBeam = true; });
    document.addEventListener('mouseup', (e) => { if (e.button === 2) isFiringBeam = false; });
    window.addEventListener('contextmenu', (e) => e.preventDefault());
    showMenu('SPLASH'); animate();
}

function applyGraphics() {
    speak("Graphics mode " + highGFX.replace(/-/g, ' '));
    switch(highGFX) {
        case 'extreme-low': renderer.setPixelRatio(0.5); scene.fog.density = 0.05; break;
        case 'low': renderer.setPixelRatio(0.75); scene.fog.density = 0.03; break;
        case 'medium': renderer.setPixelRatio(1); scene.fog.density = 0.02; break;
        case 'high': renderer.setPixelRatio(1.25); scene.fog.density = 0.015; break;
        case 'extreme': renderer.setPixelRatio(1.5); scene.fog.density = 0.012; break;
        case 'very-extreme': renderer.setPixelRatio(1.75); scene.fog.density = 0.01; break;
        case 'ultra-pro-max': renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.5)); scene.fog.density = 0.008; break;
    }
}

function updateMapTheme() { const theme = maps[selectedMap] || maps['void']; scene.background.setHex(theme.sky); scene.fog.color.setHex(theme.fog); createEnvironment(); }

function showMenu(state) {
    gameState = state; document.querySelectorAll('.overlay').forEach(o => o.style.display = 'none'); document.getElementById('hud').style.display = 'none';
    if (state === 'SPLASH') document.getElementById('splash-screen').style.display = 'flex';
    if (state === 'MAIN') {
        document.getElementById('main-menu').style.display = 'flex';
        document.getElementById('menu-best-score').innerText = bestScore.toString().padStart(3, '0');
        if (soundEnabled) bgMusic.play().catch(e => console.log("Music play failed", e));
        if (hangarGain) hangarGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.2);
    }
    if (state === 'MAPS') document.getElementById('maps-menu').style.display = 'flex';
    if (state === 'GAMEMODES') document.getElementById('gamemodes-menu').style.display = 'flex';
    if (state === 'INFO') document.getElementById('info-menu').style.display = 'flex';
    if (state === 'SETTINGS') document.getElementById('settings-menu').style.display = 'flex';
    if (state === 'HANGAR') {
        document.getElementById('hangar-menu').style.display = 'flex';
        renderHangar('skins');
        if (hangarGain && soundEnabled) hangarGain.gain.setTargetAtTime(0.3, audioCtx.currentTime, 0.5);
    }
    if (state === 'PAUSE') { isPaused = true; document.getElementById('pause-menu').style.display = 'flex'; if (motorGain) motorGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1); }
    if (state === 'COUNTDOWN') document.getElementById('countdown-overlay').style.display = 'flex';
    if (state === 'GAME_OVER') document.getElementById('game-over').style.display = 'flex';
    if (state === 'GAME') { isPaused = false; document.getElementById('hud').style.display = 'block'; if (motorGain) motorGain.gain.setTargetAtTime(0.1, audioCtx.currentTime, 0.5); }
    if (motorGain && state !== 'PAUSE' && state !== 'COUNTDOWN') motorGain.gain.value = (soundEnabled && state === 'GAME') ? 0.1 : 0;
}

function resumeGameWithCountdown() {
    showMenu('COUNTDOWN');
    let count = 5;
    const countEl = document.getElementById('resume-countdown-val');
    countEl.innerText = count;
    const interval = setInterval(() => {
        count--;
        if (count <= 0) { clearInterval(interval); showMenu('GAME'); }
        else { countEl.innerText = count; }
    }, 1000);
}

function renderHangar(tab) {
    const grid = document.getElementById('hangar-grid'); grid.innerHTML = '';
    document.querySelectorAll('.hangar-tabs button').forEach(b => b.classList.remove('active'));
    const tabBtn = document.getElementById('tab-' + tab); if (tabBtn) tabBtn.classList.add('active');

    hangarItems[tab].forEach((item) => {
        const isEquipped = (tab === 'skins' && currentSkin === item.name) || (tab === 'lasers' && currentLaserColor === item.color) || (tab === 'trails' && (currentTrailColor === item.color || (currentTrailColor === null && item.name === 'None')));
        const btn = document.createElement('button');
        btn.className = 'btn-mode anim-click' + (item.unlocked ? '' : ' locked') + (isEquipped ? ' active' : '');
        btn.innerHTML = `<span class="mode-title">${item.name}</span><span class="mode-desc">${isEquipped ? 'EQUIPPED' : (item.unlocked ? 'OWNED' : 'COST: ' + item.price + ' CREDITS')}</span>`;
        btn.onclick = () => {
            if (item.unlocked) {
                if (isEquipped) {
                    if (tab === 'skins') currentSkin = 'Default MK-1';
                    if (tab === 'lasers') currentLaserColor = 0x00ffff;
                    if (tab === 'trails') currentTrailColor = null;
                    speak("Unequipped");
                } else {
                    if (tab === 'skins') currentSkin = item.name;
                    if (tab === 'lasers') currentLaserColor = item.color;
                    if (tab === 'trails') currentTrailColor = item.color;
                    speak(item.name + " equipped");
                }
                createBird(); saveStats(); renderHangar(tab);
            } else if (credits >= item.price) {
                credits -= item.price; item.unlocked = true; saveStats(); renderHangar(tab); speak("Purchase complete");
            } else { speak("Insufficient credits"); }
        };
        grid.appendChild(btn);
    });
}

function loadStats() {
    bestScore = parseInt(localStorage.getItem('GUSTWING_BEST_ORIG') || '0');
    credits = parseInt(localStorage.getItem('GUSTWING_CREDITS') || '0');
    currentSkin = localStorage.getItem('GUSTWING_SKIN') || 'Default MK-1';
    currentLaserColor = parseInt(localStorage.getItem('GUSTWING_LASER') || '0x00ffff');
    currentTrailColor = localStorage.getItem('GUSTWING_TRAIL') === 'null' ? null : parseInt(localStorage.getItem('GUSTWING_TRAIL') || 'null');

    // Always unlock everything as per user request
    hangarItems.skins.forEach(s => s.unlocked = true);
    hangarItems.lasers.forEach(l => l.unlocked = true);
    hangarItems.trails.forEach(t => t.unlocked = true);
}

function saveStats() {
    localStorage.setItem('GUSTWING_BEST_ORIG', bestScore);
    localStorage.setItem('GUSTWING_CREDITS', credits);
    localStorage.setItem('GUSTWING_SKIN', currentSkin);
    localStorage.setItem('GUSTWING_LASER', currentLaserColor);
    localStorage.setItem('GUSTWING_TRAIL', currentTrailColor);
}

function createBird() {
    if (bird) scene.remove(bird); bird = new THREE.Group();
    const skinData = hangarItems.skins.find(s => s.name === currentSkin) || hangarItems.skins[0];
    const color = skinData.color || 0x333333, glowColor = skinData.glow || 0xff4500;

    let bodyGeo;
    switch(skinData.type) {
        case 'curved': bodyGeo = new THREE.CapsuleGeometry(0.5, 1.5, 4, 8); break;
        case 'sharp': bodyGeo = new THREE.OctahedronGeometry(1.2, 0); break;
        case 'massive': bodyGeo = new THREE.BoxGeometry(1.5, 0.8, 2); break;
        case 'long': bodyGeo = new THREE.CylinderGeometry(0.3, 0.5, 3, 8); break;
        case 'divine': bodyGeo = new THREE.TorusKnotGeometry(0.6, 0.2, 64, 8); break;
        case 'mechanical': bodyGeo = new THREE.IcosahedronGeometry(1.0, 0); break;
        case 'split': bodyGeo = new THREE.TorusGeometry(0.8, 0.3, 16, 32); break;
        default: bodyGeo = new THREE.CylinderGeometry(0.2, 0.4, 1, 8);
    }

    const bodyMat = new THREE.MeshStandardMaterial({ color, metalness: 0.9, roughness: 0.1, emissive: glowColor, emissiveIntensity: 0.5 });
    const body = new THREE.Mesh(bodyGeo, bodyMat); body.rotation.x = Math.PI / 2; bird.add(body);

    const fireGeo = new THREE.ConeGeometry(0.3, 1.5, 8), fireMat = new THREE.MeshBasicMaterial({ color: glowColor, transparent: true, opacity: 0.8 });
    const addMotor = (x, y, z) => {
        const m = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 0.8, 8), bodyMat);
        m.position.set(x, y, z); m.rotation.x = Math.PI / 2; bird.add(m);
        const f = new THREE.Mesh(fireGeo, fireMat.clone()); f.position.set(0, -0.6, 0); f.rotation.x = Math.PI; m.add(f); return f;
    };

    bird.lFire = addMotor(-1.4, -0.6, -1); bird.rFire = addMotor(1.4, -0.6, -1);
    const blasterGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.2, 8), positions = [[-2.0, 0.2, -0.5], [-1.4, 0.2, -0.5], [-0.8, 0.2, -0.5], [0.8, 0.2, -0.5], [1.4, 0.2, -0.5], [2.0, 0.2, -0.5]];
    bird.guns = []; bird.beams = [];
    positions.forEach(p => {
        const b = new THREE.Mesh(blasterGeo, bodyMat.clone()); b.position.set(...p); b.rotation.x = Math.PI / 2; bird.add(b); bird.guns.push(b);
        const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 200, 8), new THREE.MeshBasicMaterial({ color: currentLaserColor, transparent: true, opacity: 0.6 }));
        beam.position.set(0, 100, 0); beam.visible = false; b.add(beam); bird.beams.push(beam);
    });
    bird.position.set(0, 15, 0); scene.add(bird);
}

function createEnvironment() {
    islands.forEach(i => scene.remove(i)); clouds.forEach(c => scene.remove(c)); windLines.forEach(w => scene.remove(w)); islands = []; clouds = []; windLines = []; const theme = maps[selectedMap] || maps['void'], isAbyss = selectedMap === 'abyss';
    for (let i = 0; i < 60; i++) { createIsland((Math.random() - 0.5) * 80, -20, (Math.random() - 0.8) * 800, false, theme.island); createIsland((Math.random() - 0.5) * 80, 40, (Math.random() - 0.8) * 800, true, theme.island); }
    const particleMat = isAbyss ? new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 }) : new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 });
    for (let i = 0; i < 50; i++) { if (isAbyss) { const bubble = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), particleMat); bubble.position.set((Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40, (Math.random() - 0.8) * 800); scene.add(bubble); windLines.push(bubble); } else { const points = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 10)]; const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), particleMat); line.position.set((Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40, (Math.random() - 0.8) * 800); scene.add(line); windLines.push(line); } }
    for (let i = 0; i < 30; i++) createCloud();
}

function createIsland(x, y, z, inverted, color) { const group = new THREE.Group(); const theme = maps[selectedMap] || maps['void']; let geo; if (theme.prop === 'mountain' || theme.prop === 'ice') { geo = new THREE.ConeGeometry(12 + Math.random() * 10, 40 + Math.random() * 30, 6); } else if (theme.prop === 'data') { geo = new THREE.BoxGeometry(10 + Math.random() * 10, 30 + Math.random() * 20, 10); } else if (theme.prop === 'reef') { geo = new THREE.DodecahedronGeometry(10 + Math.random() * 5, 1); } else { geo = new THREE.ConeGeometry(8 + Math.random() * 8, 25 + Math.random() * 25, 4); } const mat = new THREE.MeshStandardMaterial({ color: color, flatShading: true, emissive: (theme.prop === 'data' || theme.prop === 'reef') ? maps[selectedMap].glow : 0, emissiveIntensity: theme.prop === 'data' ? 0.2 : (theme.prop === 'reef' ? 0.1 : 0), metalness: theme.prop === 'ice' ? 0.5 : 0.1, roughness: theme.prop === 'ice' ? 0.1 : 0.7 }); const island = new THREE.Mesh(geo, mat); group.add(island); let propGeo, propMat; if (theme.prop === 'tree') { propGeo = new THREE.BoxGeometry(1, 4, 1); propMat = new THREE.MeshStandardMaterial({ color: 0x228b22 }); } else if (theme.prop === 'lava') { propGeo = new THREE.DodecahedronGeometry(2); propMat = new THREE.MeshStandardMaterial({ color: 0xff4500, emissive: 0xff0000, emissiveIntensity: 1 }); } else if (theme.prop === 'data') { propGeo = new THREE.BoxGeometry(2, 2, 2); propMat = new THREE.MeshStandardMaterial({ color: 0xff00ff, emissive: 0xff00ff, emissiveIntensity: 1 }); } else if (theme.prop === 'reef') { propGeo = new THREE.IcosahedronGeometry(2, 0); propMat = new THREE.MeshStandardMaterial({ color: 0xff00ff, emissive: 0x00ffff, emissiveIntensity: 0.5 }); } else if (theme.prop === 'ice') { propGeo = new THREE.BoxGeometry(2, 6, 2); propMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, emissive: 0x00ffff, emissiveIntensity: 0.2 }); } else { propGeo = new THREE.DodecahedronGeometry(2); propMat = new THREE.MeshStandardMaterial({ color: 0x777777 }); } for(let i=0; i<3; i++) { const p = new THREE.Mesh(propGeo, propMat.clone()); p.position.set((Math.random()-0.5)*10, 15, (Math.random()-0.5)*10); group.add(p); } group.position.set(x, y, z); if (inverted) group.rotation.x = Math.PI; scene.add(group); islands.push(group); }
function createCloud() { const group = new THREE.Group(); for(let i=0; i<4; i++) { const p = new THREE.Mesh(new THREE.DodecahedronGeometry(2, 0), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 })); p.position.set(i * 2, Math.random() * 2, Math.random() * 2); group.add(p); } group.position.set((Math.random() - 0.5) * 150, 20 + Math.random() * 15, bird.position.z - 150 - Math.random() * 150); scene.add(group); clouds.push(group); }
function createGate() { if (selectedMode === 'drones') return; const group = new THREE.Group(); const theme = maps[selectedMap] || maps['void']; const ring = new THREE.Mesh(new THREE.TorusGeometry(5, 0.6, 8, 32), new THREE.MeshStandardMaterial({ color: theme.ring })); group.add(ring); group.ring = ring; const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.2, 16), new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffd700 })); coin.rotation.x = Math.PI / 2; group.add(coin); group.coin = coin; group.position.set(0, (Math.random() - 0.5) * 15 + 10, bird.position.z - 120); scene.add(group); gates.push({ mesh: group, passed: false, radius: 5, coinCollected: false }); }
function spawnDrone() { const drone = new THREE.Group(); const isVolcano = selectedMap === 'volcano', isAbyss = selectedMap === 'abyss', isTitan = selectedMode === 'boss_titan', size = isTitan ? 2 : 1; let bodyGeo, bodyMat; if (isAbyss) { bodyGeo = new THREE.SphereGeometry(1.2 * size, 16, 16); bodyMat = new THREE.MeshStandardMaterial({color: 0x000000, emissive: 0xff0000, emissiveIntensity: 2}); } else { bodyGeo = isVolcano ? new THREE.IcosahedronGeometry(1.5 * size, 0) : new THREE.SphereGeometry(size, 8, 8); bodyMat = new THREE.MeshStandardMaterial({color: isVolcano ? 0xff4500 : 0xff4444, emissive: isVolcano ? 0xff0000 : 0, emissiveIntensity: isVolcano ? 2 : 0}); } const body = new THREE.Mesh(bodyGeo, bodyMat); drone.add(body); const glow = new THREE.Mesh(bodyGeo.clone().scale(1.2, 1.2, 1.2), new THREE.MeshBasicMaterial({color: isAbyss ? 0xff0000 : (isVolcano ? 0xffaa00 : 0xff0000), transparent: true, opacity: 0.3})); drone.add(glow); drone.position.set((Math.random()-0.5)*40, (Math.random()-0.5)*20 + 10, bird.position.z - 150); const zSpeed = (isTitan || selectedMode === 'drones') ? 1.2 : 0.8; drone.velocity = new THREE.Vector3((Math.random()-0.5)*0.2, (Math.random()-0.5)*0.2, zSpeed); if (isAbyss) drone.isMine = true; scene.add(drone); drones.push(drone); }
function spawnLavaSpike() { const spike = new THREE.Group(); const geo = new THREE.ConeGeometry(0.8, 6, 8); const mat = new THREE.MeshStandardMaterial({ color: 0xff4500, emissive: 0xff0000, emissiveIntensity: 5, metalness: 0.5, roughness: 0.2 }); const mesh = new THREE.Mesh(geo, mat); mesh.rotation.x = -Math.PI / 2; spike.add(mesh); const targetIsland = islands[Math.floor(Math.random() * islands.length)]; if (targetIsland && targetIsland.position.z < bird.position.z - 50) { spike.position.set(targetIsland.position.x, targetIsland.position.y + 15, targetIsland.position.z); } else { spike.position.set((Math.random() - 0.5) * 40, -10, bird.position.z - 120); } spike.velocity = new THREE.Vector3((Math.random() - 0.5) * 0.1, 0.5 + Math.random() * 0.3, 0.5 + Math.random() * 0.5); spike.isLavaSpike = true; scene.add(spike); drones.push(spike); }
function spawnSentinel() { const group = new THREE.Group(); const isTitan = selectedMode === 'boss_titan', scale = isTitan ? 2 : 1, hullMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9 }); const hull = new THREE.Mesh(new THREE.CylinderGeometry(15 * scale, 20 * scale, 5 * scale, 32), hullMat); group.add(hull); const dome = new THREE.Mesh(new THREE.SphereGeometry(8 * scale, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xff00ff, transparent: true, opacity: 0.6 })); dome.position.y = 2.5 * scale; group.add(dome); group.position.set(0, 20, bird.position.z - 100); scene.add(group); boss = group; bossHP = isTitan ? 2000 : 1000; speak(isTitan ? "Titan Class Threat Detected." : "Sentinel Mother-ship inbound."); }
function spawnIceSpike() { const spike = new THREE.Group(); const mesh = new THREE.Mesh(new THREE.ConeGeometry(1.5, 8, 4), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, emissive: 0x00ffff, emissiveIntensity: 1 })); mesh.rotation.x = Math.PI; spike.add(mesh); spike.position.set((Math.random() - 0.5) * 40, 40, bird.position.z - 100 - Math.random() * 50); spike.velocity = new THREE.Vector3(0, -0.5 - Math.random() * 0.5, 0.5); spike.isIceSpike = true; scene.add(spike); drones.push(spike); }
function createExplosion(pos, color) { for(let i=0; i<10; i++) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), new THREE.MeshBasicMaterial({color: color})); p.position.copy(pos); p.velocity = new THREE.Vector3((Math.random()-0.5)*0.5, (Math.random()-0.5)*0.5, (Math.random()-0.5)*0.5); p.life = 60; scene.add(p); particles.push(p); } }
function createProceduralSounds() { const fill = (buf, fn) => { let d = buf.getChannelData(0); for(let i=0; i<d.length; i++) d[i] = fn(i, d.length); }; jumpBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.1, audioCtx.sampleRate); fill(jumpBuffer, (i, l) => Math.sin(i * 0.1 * Math.exp(-i * 0.005)) * (1 - i/l)); coinBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.2, audioCtx.sampleRate); fill(coinBuffer, (i, l) => Math.sin(i * 0.5) * Math.exp(-i * 0.002)); boostBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 1.5, audioCtx.sampleRate); fill(boostBuffer, (i, l) => (Math.random()*2-1) * Math.exp(-i * 0.0001)); shootBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.1, audioCtx.sampleRate); fill(shootBuffer, (i, l) => (Math.random()*2-1) * Math.exp(-i * 0.01)); clickBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.05, audioCtx.sampleRate); fill(clickBuffer, (i, l) => (Math.random()*2-1) * Math.exp(-i * 0.05)); missileBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.5, audioCtx.sampleRate); fill(missileBuffer, (i, l) => (Math.random()*2-1) * (1 - i/l) * 0.5); }
function startMotorSound() { const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 2, audioCtx.sampleRate); let d = buf.getChannelData(0); for(let i=0; i<d.length; i++) d[i] = (Math.random()*2-1)*0.01 + Math.sin(i*0.01)*0.01; motorSource = audioCtx.createBufferSource(); motorSource.buffer = buf; motorSource.loop = true; motorGain = audioCtx.createGain(); motorGain.gain.value = 0; motorSource.connect(motorGain); motorGain.connect(audioCtx.destination); motorSource.start(); }
function startIntenseMusic() { const duration = 2, sampleRate = audioCtx.sampleRate, buf = audioCtx.createBuffer(1, sampleRate * duration, sampleRate); let d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) { const time = i / sampleRate, volume = Math.exp(-(time % 0.25) * 10); d[i] = (Math.sin(time * 50 * Math.PI) * 0.5 + Math.sin(time * 100 * Math.PI) * 0.2) * volume; } musicSource = audioCtx.createBufferSource(); musicSource.buffer = buf; musicSource.loop = true; musicGain = audioCtx.createGain(); musicGain.gain.value = 0.15; musicSource.connect(musicGain); musicGain.connect(audioCtx.destination); musicSource.start(); }
function startHangarMusic() { const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 4, audioCtx.sampleRate); let d = buf.getChannelData(0); for(let i=0; i<d.length; i++) d[i] = (Math.random()*2-1)*0.005 + Math.sin(i*0.001)*0.02; hangarSource = audioCtx.createBufferSource(); hangarSource.buffer = buf; hangarSource.loop = true; hangarGain = audioCtx.createGain(); hangarGain.gain.value = 0; hangarSource.connect(hangarGain); hangarGain.connect(audioCtx.destination); hangarSource.start(); }
function playSound(buffer, rate = 1) { if (!soundEnabled || !audioCtx || !buffer) return; const s = audioCtx.createBufferSource(); s.buffer = buffer; s.playbackRate.value = rate; const g = audioCtx.createGain(); g.gain.value = 0.2; s.connect(g); g.connect(audioCtx.destination); s.start(); }
function handleInput() { if (gameState === 'GAME') { velocity = jumpStrength; forwardVelocity = 0.3; playSound(jumpBuffer); } }
function useAbility() { if (canBoost && !abilityActive) { abilityActive = true; canBoost = false; boostMode = true; playSound(boostBuffer); speak("Boost Ready"); const blue = 0x00ffff; bird.lMotor.material.emissive.setHex(blue); bird.rMotor.material.emissive.setHex(blue); bird.lMotor.material.emissiveIntensity = 5; bird.rMotor.material.emissiveIntensity = 5; bird.guns.forEach((g, i) => { g.material.emissive.setHex(blue); g.material.emissiveIntensity = 5; bird.beams[i].material.opacity = 0.9; }); setTimeout(() => { boostMode = false; abilityActive = false; bird.lMotor.material.emissiveIntensity = 0; bird.rMotor.material.emissiveIntensity = 0; bird.guns.forEach((g, i) => { g.material.emissiveIntensity = 0; bird.beams[i].material.opacity = 0.6; }); abilityMeter = 0; let cooldownInterval = setInterval(() => { abilityMeter += 1; if (abilityMeter >= 100) { abilityMeter = 100; canBoost = true; clearInterval(cooldownInterval); speak("System fully recharged"); } }, 100); }, 15000); } }
function fireMissiles() { if (gameState !== 'GAME' || frameCount % 30 !== 0) return; for(let i=0; i<4; i++) { const missile = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1), new THREE.MeshStandardMaterial({color: 0xffff00})); missile.position.copy(bird.position); missile.position.x += (i - 1.5) * 2; missile.rotation.x = Math.PI / 2; missile.velocity = new THREE.Vector3(0, 0, -2); scene.add(missile); missiles.push(missile); } playSound(missileBuffer); }
function startGame() { gameActive = true; isPaused = false; showMenu('GAME'); score = 0; _v1 = 0; velocity = 0; forwardVelocity = 0; hp = 200; glassCracks = 0; empActive = false; if (boss) scene.remove(boss); boss = null; bossHP = 0; document.getElementById('cockpit-cracks').style.display = 'none'; if (canBoost) abilityMeter = 100; if (soundEnabled) bgMusic.play().catch(e => console.log("Music play failed", e)); createBird(); createEnvironment(); frameCount = 0; if (motorGain) motorGain.gain.setTargetAtTime(0.1, audioCtx.currentTime, 0.5); }
function gameOver() { gameActive = false; isPaused = false; gameState = 'GAME_OVER'; if (score > bestScore) bestScore = score; const earned = Math.floor(score / 5); credits += earned; saveStats(); showMenu('GAME_OVER'); document.getElementById('final-score').innerText = score; if (motorGain) motorGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1); bgMusic.pause(); bgMusic.currentTime = 0; }
function onWindowResize() { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); }
function showGrade(text) { const el = document.createElement('div'); el.innerText = text; el.style.position = 'absolute'; el.style.top = '40%'; el.style.left = '50%'; el.style.transform = 'translate(-50%, -50%)'; el.style.fontSize = '8rem'; el.style.fontWeight = '900'; el.style.color = text === 'PERFECT' ? '#f0c55d' : '#00ffff'; el.style.textShadow = '0 0 20px ' + el.style.color; el.style.pointerEvents = 'none'; el.style.transition = 'all 0.5s'; el.style.zIndex = '100'; document.body.appendChild(el); if (text === 'PERFECT') { glassCracks = Math.max(0, glassCracks - 1); if (glassCracks === 0) document.getElementById('cockpit-cracks').style.display = 'none'; } setTimeout(() => { el.style.top = '30%'; el.style.opacity = '0'; setTimeout(() => el.remove(), 500); }, 100); }
function animate() {
    requestAnimationFrame(animate);
    if (gameState === 'GAME') {
        velocity += gravity; bird.position.y += velocity; forwardVelocity *= 0.98; const curForwardSpeed = (baseForwardSpeed + forwardVelocity) * (boostMode ? 3 : 1); bird.position.z -= curForwardSpeed;
        camera.fov += ((75 + (boostMode ? 30 : 0)) - camera.fov) * 0.1; camera.updateProjectionMatrix(); cameraShake *= 0.9;
        const fScale = (1 + Math.abs(velocity) * 5) * (boostMode ? 3 : 1); bird.lFire.scale.y = bird.rFire.scale.y = fScale; bird.lFire.material.color.setHex(boostMode ? 0x00ffff : 0xff4500);
        camera.position.set(bird.position.x + (Math.random()-0.5)*cameraShake, bird.position.y + (Math.random()-0.5)*cameraShake, bird.position.z + 10);
        camera.lookAt(bird.position.x, bird.position.y, bird.position.z - 20);
        if (bird.position.y < 5) speak("Altitude Warning");
        if (selectedMap === 'sneek' && score > 50 && score % 100 < 20) { if (!empActive) { empActive = true; scene.background.setHex(0x000000); scene.fog.color.setHex(0x000000); speak("EMP Blackout Detected"); gates.forEach(g => { g.mesh.ring.material.color.setHex(0x00ffff); g.mesh.ring.material.emissive.setHex(0x00ffff); g.mesh.ring.material.emissiveIntensity = 1; }); } } else if (empActive) { empActive = false; updateMapTheme(); }
        bird.beams.forEach((b, i) => { b.visible = isFiringBeam; b.material.color.setHex(currentLaserColor); if (isFiringBeam && frameCount % 5 === 0) playSound(shootBuffer, 2); });
        clouds.forEach(c => { if (c.position.z > bird.position.z + 50) c.position.z -= 400; });
        windLines.forEach(w => { w.visible = boostMode || forwardVelocity > 0.1; if (w.position.z > bird.position.z + 50) w.position.z -= 600; });
        frameCount++; if (frameCount % gateInterval === 0) createGate();
        const droneRate = (selectedMap === 'volcano' || selectedMode === 'drones' || selectedMap === 'abyss') ? 30 : 150;
        if (frameCount % droneRate === 0) spawnDrone();
        if (selectedMap === 'volcano' && frameCount % 30 === 0) spawnLavaSpike();
        if (selectedMap === 'glacier' && frameCount % 20 === 0) spawnIceSpike();
        missiles.forEach((m, i) => { m.position.add(m.velocity); let target = drones[0] || boss; if (target) { const dir = new THREE.Vector3().subVectors(target.position, m.position).normalize(); m.velocity.lerp(dir.multiplyScalar(2), 0.1); } if (m.position.z < bird.position.z - 200) { scene.remove(m); missiles.splice(i, 1); } });
        particles.forEach((p, i) => { p.position.add(p.velocity); p.life--; if(p.life <= 0) { scene.remove(p); particles.splice(i, 1); } });
        drones.forEach((d, i) => {
            d.position.z += d.velocity ? d.velocity.z : 0.2; if (d.velocity) { d.position.x += d.velocity.x; d.position.y += d.velocity.y; }
            if (isFiringBeam) { bird.beams.forEach(beam => { const beamWorldPos = new THREE.Vector3(); beam.getWorldPosition(beamWorldPos); if (Math.abs(d.position.x - beamWorldPos.x) < 2.5 && Math.abs(d.position.y - beamWorldPos.y) < 2.5 && d.position.z < bird.position.z) { const explodeColor = d.isLavaSpike ? 0xff4500 : (d.isIceSpike ? 0x00ffff : 0xff0000); createExplosion(d.position, explodeColor); scene.remove(d); drones.splice(i, 1); score += 10; _v1 = score; speak("Target Neutralized"); } }); }
            missiles.forEach((m, mi) => { if (m.position.distanceTo(d.position) < 3) { const explodeColor = d.isLavaSpike ? 0xff4500 : (d.isIceSpike ? 0x00ffff : 0xffaa00); createExplosion(d.position, explodeColor); scene.remove(d); drones.splice(i, 1); scene.remove(m); missiles.splice(mi, 1); score += 15; _v1 = score; speak("Critical Hit"); } });
            if (bird.position.distanceTo(d.position) < 3 && !boostMode) { hp -= 50; glassCracks++; document.getElementById('cockpit-cracks').style.display = 'block'; scene.remove(d); drones.splice(i, 1); }
            if (d.position.z > bird.position.z + 50 || (d.isIceSpike && d.position.y < -15)) { scene.remove(d); drones.splice(i, 1); }
        });
        if (boss) {
            boss.position.z -= baseForwardSpeed * 0.8; boss.position.y += Math.sin(Date.now() * 0.001) * 0.1;
            if (isFiringBeam) { bird.beams.forEach(beam => { const beamWorldPos = new THREE.Vector3(); beam.getWorldPosition(beamWorldPos); if (Math.abs(boss.position.x - beamWorldPos.x) < 15 && Math.abs(boss.position.y - beamWorldPos.y) < 5 && boss.position.z < bird.position.z) { bossHP -= 2; if (frameCount % 10 === 0) createExplosion(boss.position, 0xff00ff); } }); }
            missiles.forEach((m, mi) => { if (m.position.distanceTo(boss.position) < 10) { bossHP -= 50; createExplosion(boss.position, 0xffaa00); scene.remove(m); missiles.splice(mi, 1); } });
            if (bossHP <= 0) { createExplosion(boss.position, 0x00ffff); scene.remove(boss); boss = null; score += 500; _v1 = score; speak("Mission Accomplished."); }
        }
        gates.forEach((g, i) => {
            if (empActive || boss) { const scale = 1 + Math.sin(Date.now() * 0.002) * 0.3; g.mesh.scale.set(scale, scale, 1); g.radius = 5 * scale; }
            const d = bird.position.distanceTo(g.mesh.position);
            if (Math.abs(g.mesh.position.z - bird.position.z) < 1.0) { if (d > 4.2 && !boostMode) { hp -= 20; glassCracks++; document.getElementById('cockpit-cracks').style.display = 'block'; if (hp <= 0) gameOver(); } if (!g.coinCollected && d < 1.8) { g.coinCollected = true; g.mesh.coin.visible = false; score += 5; _v1 = score; playSound(coinBuffer); cameraShake = 0.5; } }
            if (!g.passed && g.mesh.position.z > bird.position.z) { g.passed = true; score++; _v1 = score; const dist = Math.sqrt(Math.pow(bird.position.x - g.mesh.position.x, 2) + Math.pow(bird.position.y - g.mesh.position.y, 2)); if (dist < 1) showGrade('PERFECT'); else if (dist < 2.5) showGrade('NOT BAD'); else showGrade('NICE TRY'); }
            if (g.mesh.position.z > bird.position.z + 50) { scene.remove(g.mesh); gates.splice(i, 1); }
        });
        document.getElementById('score').innerText = score.toString().padStart(2, '0'); document.getElementById('best-score').innerText = bestScore.toString().padStart(2, '0'); document.getElementById('alt-value').innerText = Math.max(0, Math.round(bird.position.y * 10)).toString().padStart(2, '0'); document.getElementById('ability-fill').style.width = abilityMeter + '%'; document.getElementById('ability-percent').innerText = Math.round(abilityMeter) + '%'; document.getElementById('speed-value').innerText = Math.round(120 + (baseForwardSpeed + forwardVelocity) * 1000).toString().padStart(3, '0');
        if (hp <= 0 || bird.position.y < -12 || bird.position.y > 45) gameOver();
    } else { camera.position.set(0, 10, 15); camera.lookAt(0, 10, 0); bird.position.y = 10 + Math.sin(Date.now() * 0.002) * 0.5; }
    renderer.render(scene, camera);
}
init(); window.showMenu = showMenu;

function renderHangar(tab) {
    const grid = document.getElementById('hangar-grid'); grid.innerHTML = '';
    document.querySelectorAll('.hangar-tabs button').forEach(b => b.classList.remove('active'));
    const tabBtn = document.getElementById('tab-' + tab); if (tabBtn) tabBtn.classList.add('active');

    hangarItems[tab].forEach((item) => {
        const isEquipped = (tab === 'skins' && currentSkin === item.name) || (tab === 'lasers' && currentLaserColor === item.color) || (tab === 'trails' && (currentTrailColor === item.color || (currentTrailColor === null && item.name === 'None')));
        const btn = document.createElement('button');
        btn.className = 'btn-mode anim-click' + (item.unlocked ? '' : ' locked') + (isEquipped ? ' active' : '');
        btn.innerHTML = `<span class="mode-title">${item.name}</span><span class="mode-desc">${isEquipped ? 'EQUIPPED' : (item.unlocked ? 'OWNED' : 'COST: ' + item.price + ' CREDITS')}</span>`;
        btn.onclick = () => {
            if (item.unlocked) {
                if (isEquipped) {
                    if (tab === 'skins') currentSkin = 'Default MK-1';
                    if (tab === 'lasers') currentLaserColor = 0x00ffff;
                    if (tab === 'trails') currentTrailColor = null;
                    speak("Unequipped");
                } else {
                    if (tab === 'skins') currentSkin = item.name;
                    if (tab === 'lasers') currentLaserColor = item.color;
                    if (tab === 'trails') currentTrailColor = item.color;
                    speak(item.name + " equipped");
                }
                createBird(); saveStats(); renderHangar(tab);
            } else if (credits >= item.price) {
                credits -= item.price; item.unlocked = true; saveStats(); renderHangar(tab); speak("Purchase complete");
            } else { speak("Insufficient credits"); }
        };
        grid.appendChild(btn);
    });
}

function loadStats() {
    bestScore = parseInt(localStorage.getItem('GUSTWING_BEST_ORIG') || '0');
    credits = parseInt(localStorage.getItem('GUSTWING_CREDITS') || '0');
    currentSkin = localStorage.getItem('GUSTWING_SKIN') || 'Default MK-1';
    currentLaserColor = parseInt(localStorage.getItem('GUSTWING_LASER') || '0x00ffff');
    currentTrailColor = localStorage.getItem('GUSTWING_TRAIL') === 'null' ? null : parseInt(localStorage.getItem('GUSTWING_TRAIL') || 'null');

    // Always unlock everything as per user request
    hangarItems.skins.forEach(s => s.unlocked = true);
    hangarItems.lasers.forEach(l => l.unlocked = true);
    hangarItems.trails.forEach(t => t.unlocked = true);
}

function saveStats() {
    localStorage.setItem('GUSTWING_BEST_ORIG', bestScore);
    localStorage.setItem('GUSTWING_CREDITS', credits);
    localStorage.setItem('GUSTWING_SKIN', currentSkin);
    localStorage.setItem('GUSTWING_LASER', currentLaserColor);
    localStorage.setItem('GUSTWING_TRAIL', currentTrailColor);
}
