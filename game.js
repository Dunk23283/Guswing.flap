let scene, camera, renderer, bird, gates = [], clouds = [], islands = [], windLines = [], bullets = [], drones = [], particles = [], missiles = [], boss;
let score = 0, bestScore = 0, credits = 0, abilityMeter = 100, volcanoMeter = 100, hp = 200, glassCracks = 0, bossHP = 0;
let gameActive = false, isPaused = false, gameState = 'SPLASH', selectedMode = 'normal';
let velocity = 0, forwardVelocity = 0, boostMode = false, volcanoActive = false;
const gravity = -0.008, jumpStrength = 0.18, baseForwardSpeed = 0.45;
const gateInterval = 70;
let frameCount = 0;
let cameraShake = 0;
let isFiringBeam = false;
let empActive = false;

let currentSkin = 'Default MK-1';
let currentLaserColor = 0x00ffff;
let currentTrailColor = null;

const hangarItems = {
    skins: [
        { name: 'Default MK-1', unlocked: true, type: 'standard' },
        { name: 'Royal Guard', unlocked: true, type: 'massive', color: 0xffd700, glow: 0xffffff },
        { name: 'Nebula Hunter', unlocked: true, type: 'curved', glow: 0xaa00ff },
        { name: 'Shadow Stealth', unlocked: true, type: 'sharp', glow: 0x333333 },
        { name: 'Solar Flare', unlocked: true, type: 'massive', glow: 0xffaa00 },
        { name: 'Cryo Spear', unlocked: true, type: 'long', glow: 0x00ffff },
        { name: 'Void Reaver', unlocked: true, type: 'split', glow: 0xff00ff },
        { name: 'Jungle Predator', unlocked: true, type: 'standard', color: 0x228b22, glow: 0x00ff00 },
        { name: 'Cyber Demon', unlocked: true, type: 'mechanical', glow: 0xff0000 },
        { name: 'Gold Master', unlocked: true, type: 'divine', color: 0xffd700, glow: 0xffd700 },
        { name: 'Phantom X', unlocked: true, type: 'sharp', color: 0x111111, glow: 0x00ffff },
        { name: 'Titan Prime', unlocked: true, type: 'massive', color: 0x444444, glow: 0xff0000 },
        { name: 'Vanguard Zero', unlocked: true, type: 'sharp', color: 0xffffff, glow: 0xffd700 },
        { name: 'Wraith Wing', unlocked: true, type: 'curved', color: 0x222222, glow: 0x8a2be2 }
    ],
    lasers: [
        { name: 'Cyan Beam', color: 0x00ffff, unlocked: true },
        { name: 'Fire Red', color: 0xff4500, unlocked: true },
        { name: 'Toxic Green', color: 0x00ff00, unlocked: true },
        { name: 'Phantom Purple', color: 0xaa00ff, unlocked: true },
        { name: 'Solar Gold', color: 0xffd700, unlocked: true }
    ],
    trails: [
        { name: 'None', color: null, unlocked: true },
        { name: 'Cyan Streak', color: 0x00ffff, unlocked: true },
        { name: 'Red Overdrive', color: 0xff4500, unlocked: true },
        { name: 'Void Pulse', color: 0xff00ff, unlocked: true }
    ]
};

setInterval(() => { if (score !== window._v1) window.triggerKernelFailure(); }, 100);

let audioCtx, jumpBuffer, coinBuffer, boostBuffer, shootBuffer, clickBuffer, motorSource, motorGain, musicSource, musicGain, missileBuffer;
let bgMusic = new Audio("bg_music.mp3"); bgMusic.loop = true;

function speak(text) { if (!soundEnabled || !window.speechSynthesis) return; const u = new SpeechSynthesisUtterance(text); u.rate = 1.2; u.volume = 0.4; window.speechSynthesis.speak(u); }

let soundEnabled = true, highGFX = 'ultra-pro-max', selectedMap = 'void';
const maps = {
    'void': { sky: 0x87ceeb, fog: 0x87ceeb, island: 0x2a444a, ring: 0x8b5a2b, glow: 0xf0c55d, prop: 'rock' },
    'bengale': { sky: 0xffcc33, fog: 0xffcc33, island: 0x8b4513, ring: 0xffaa00, glow: 0xffffff, prop: 'temple' },
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
            createProceduralSounds(); startMotorSound(); startIntenseMusic();
        }
        if (audioCtx.state === 'suspended') audioCtx.resume();
    };

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(10, 20, 10); scene.add(sun);

    bestScore = parseInt(localStorage.getItem('GUSTWING_BEST') || '0');
    createBird(); createEnvironment();

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

    window.addEventListener('resize', () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); });
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Escape') { if (gameState === 'GAME') showMenu('PAUSE'); else if (gameState === 'PAUSE') resumeGameWithCountdown(); }
        if (e.code === 'Space' || e.code === 'KeyW') handleInput();
        if (e.code === 'KeyF') useSonicBoost();
        if (e.code === 'KeyG') useVolcanoSpeed();
        if (e.code === 'KeyE') fireMissiles();
    });
    document.addEventListener('mousedown', (e) => { if (e.button === 0) handleInput(); if (e.button === 2) isFiringBeam = true; });
    document.addEventListener('mouseup', (e) => { if (e.button === 2) isFiringBeam = false; });

    showMenu('SPLASH'); animate();
}

function applyGraphics() {
    switch(highGFX) {
        case 'extreme-low': renderer.setPixelRatio(0.5); break;
        case 'low': renderer.setPixelRatio(0.75); break;
        case 'medium': renderer.setPixelRatio(1); break;
        case 'high': renderer.setPixelRatio(1.25); break;
        case 'extreme': renderer.setPixelRatio(1.5); break;
        case 'very-extreme': renderer.setPixelRatio(1.75); break;
        case 'ultra-pro-max': renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); break;
    }
}

function updateMapTheme() { const theme = maps[selectedMap] || maps['void']; scene.background.setHex(theme.sky); scene.fog.color.setHex(theme.fog); createEnvironment(); }

function showMenu(state) {
    gameState = state; document.querySelectorAll('.overlay').forEach(o => o.style.display = 'none'); document.getElementById('hud').style.display = 'none';
    if (state === 'SPLASH') document.getElementById('splash-screen').style.display = 'flex';
    if (state === 'MAIN') { document.getElementById('main-menu').style.display = 'flex'; document.getElementById('menu-best-score').innerText = bestScore.toString().padStart(3, '0'); if (soundEnabled) bgMusic.play().catch(e => {}); }
    if (state === 'MAPS') document.getElementById('maps-menu').style.display = 'flex';
    if (state === 'GAMEMODES') document.getElementById('gamemodes-menu').style.display = 'flex';
    if (state === 'INFO') document.getElementById('info-menu').style.display = 'flex';
    if (state === 'SETTINGS') document.getElementById('settings-menu').style.display = 'flex';
    if (state === 'HANGAR') { document.getElementById('hangar-menu').style.display = 'flex'; renderHangar('skins'); }
    if (state === 'PAUSE') { isPaused = true; document.getElementById('pause-menu').style.display = 'flex'; if (motorGain) motorGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1); }
    if (state === 'COUNTDOWN') document.getElementById('countdown-overlay').style.display = 'flex';
    if (state === 'GAME_OVER') document.getElementById('game-over').style.display = 'flex';
    if (state === 'GAME') { isPaused = false; document.getElementById('hud').style.display = 'block'; if (motorGain) motorGain.gain.setTargetAtTime(0.1, audioCtx.currentTime, 0.5); }
}

function resumeGameWithCountdown() {
    showMenu('COUNTDOWN'); let count = 5; const el = document.getElementById('resume-countdown-val');
    const itv = setInterval(() => { count--; if (count <= 0) { clearInterval(itv); showMenu('GAME'); } else el.innerText = count; }, 1000);
}

function useSonicBoost() {
    if (abilityMeter >= 100 && !boostMode && !volcanoActive) {
        boostMode = true; speak("Sonic Overdrive Engaged");
        setTimeout(() => { boostMode = false; abilityMeter = 0; speak("Recharging..."); }, 10000);
    }
}

function useVolcanoSpeed() {
    if (volcanoMeter >= 100 && !boostMode && !volcanoActive) {
        volcanoActive = true; speak("Volcano Speed Activated");
        setTimeout(() => { volcanoActive = false; volcanoMeter = 0; speak("Cooling Down..."); }, 10000);
    }
}

function renderHangar(tab) {
    const grid = document.getElementById('hangar-grid'); grid.innerHTML = '';
    document.querySelectorAll('.hangar-tabs button').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-' + tab).classList.add('active');
    hangarItems[tab].forEach(item => {
        const isEq = (tab === 'skins' && currentSkin === item.name) || (tab === 'lasers' && currentLaserColor === item.color);
        const btn = document.createElement('button'); btn.className = 'btn-mode anim-click' + (isEq ? ' active' : '');
        btn.innerHTML = `<span class="mode-title">${item.name}</span><span class="mode-desc">${isEq ? 'EQUIPPED' : 'OWNED'}</span>`;
        btn.onclick = () => { if (tab === 'skins') { if(isEq) currentSkin='Default MK-1'; else currentSkin=item.name; } if (tab === 'lasers') { if(isEq) currentLaserColor=0x00ffff; else currentLaserColor=item.color; } createBird(); renderHangar(tab); };
        grid.appendChild(btn);
    });
}

function createBird() {
    if (bird) scene.remove(bird); bird = new THREE.Group();
    const skin = hangarItems.skins.find(s => s.name === currentSkin) || hangarItems.skins[0];
    let geo;
    switch(skin.type) {
        case 'curved': geo = new THREE.CapsuleGeometry(0.5, 1.5, 4, 8); break;
        case 'sharp': geo = new THREE.OctahedronGeometry(1.2, 0); break;
        case 'massive': geo = new THREE.BoxGeometry(1.5, 0.8, 2); break;
        case 'long': geo = new THREE.CylinderGeometry(0.3, 0.5, 3, 8); break;
        case 'divine': geo = new THREE.TorusKnotGeometry(0.6, 0.2, 64, 8); break;
        case 'mechanical': geo = new THREE.IcosahedronGeometry(1.0, 0); break;
        case 'split': geo = new THREE.TorusGeometry(0.8, 0.3, 16, 32); break;
        default: geo = new THREE.CylinderGeometry(0.2, 0.4, 1, 8);
    }
    const mat = new THREE.MeshStandardMaterial({ color: skin.color || 0x333333, metalness: 0.9, roughness: 0.1, emissive: skin.glow || 0x000000, emissiveIntensity: 0.5 });
    const mesh = new THREE.Mesh(geo, mat); mesh.rotation.x = Math.PI / 2; bird.add(mesh);

    bird.lFire = addMotor(-1.4, -0.6, -1, skin.glow || 0xff4500);
    bird.rFire = addMotor(1.4, -0.6, -1, skin.glow || 0xff4500);

    bird.beams = [];
    const bPos = [[-2,0.2,-0.5],[-1.4,0.2,-0.5],[-0.8,0.2,-0.5],[0.8,0.2,-0.5],[1.4,0.2,-0.5],[2,0.2,-0.5]];
    bPos.forEach(p => {
        const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 200, 8), new THREE.MeshBasicMaterial({ color: currentLaserColor, transparent: true, opacity: 0.6 }));
        beam.position.set(0, 100, 0); beam.visible = false;
        const gun = new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.08,1.2,8), mat);
        gun.position.set(...p); gun.rotation.x = Math.PI/2; gun.add(beam); bird.add(gun); bird.beams.push(beam);
    });
    bird.position.set(0, 15, 0); scene.add(bird);
}

function addMotor(x,y,z,glow) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.3,0.8,8), new THREE.MeshStandardMaterial({color:0x333333}));
    m.position.set(x,y,z); m.rotation.x = Math.PI/2; bird.add(m);
    const f = new THREE.Mesh(new THREE.ConeGeometry(0.3,1.5,8), new THREE.MeshBasicMaterial({color:glow, transparent:true, opacity:0.8}));
    f.position.set(0,-0.6,0); f.rotation.x = Math.PI; m.add(f); return f;
}

function createEnvironment() {
    islands.forEach(i => scene.remove(i)); clouds.forEach(c => scene.remove(c)); windLines.forEach(w => scene.remove(w));
    islands = []; clouds = []; windLines = []; const theme = maps[selectedMap] || maps['void'];
    for (let i = 0; i < 60; i++) { createIsland((Math.random()-0.5)*80, -20, (Math.random()-0.8)*800, false, theme.island); createIsland((Math.random()-0.5)*80, 40, (Math.random()-0.8)*800, true, theme.island); }
    for (let i = 0; i < 30; i++) createCloud();
}

function createIsland(x, y, z, inv, color) {
    const group = new THREE.Group(); const theme = maps[selectedMap] || maps['void'];
    let geo = new THREE.ConeGeometry(10, 30, 4);
    const mat = new THREE.MeshStandardMaterial({ color, flatShading: true });
    group.add(new THREE.Mesh(geo, mat)); group.position.set(x, y, z);
    if (inv) group.rotation.x = Math.PI; scene.add(group); islands.push(group);
}

function createCloud() {
    const g = new THREE.Group(); g.add(new THREE.Mesh(new THREE.DodecahedronGeometry(2), new THREE.MeshStandardMaterial({color:0xffffff, transparent:true, opacity:0.6})));
    g.position.set((Math.random()-0.5)*150, 20+Math.random()*15, bird.position.z-150-Math.random()*150); scene.add(g); clouds.push(g);
}

function createGate() {
    if (selectedMode === 'drones') return;
    const g = new THREE.Group(); const theme = maps[selectedMap] || maps['void'];
    const radius = 8, tube = 0.8;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 8, 32), new THREE.MeshStandardMaterial({ color: theme.ring }));
    g.add(ring); g.ring = ring;
    const coin = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.3, 16), new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffd700 }));
    coin.rotation.x = Math.PI / 2; g.add(coin); g.coin = coin;
    g.position.set(0, (Math.random()-0.5)*15+10, bird.position.z - 120);
    scene.add(g); gates.push({ mesh: g, passed: false, coinCollected: false, radius: radius, tube: tube });
}

function spawnDrone() {
    const d = new THREE.Group(); d.add(new THREE.Mesh(new THREE.SphereGeometry(1,8,8), new THREE.MeshStandardMaterial({color:0xff0000})));
    d.position.set((Math.random()-0.5)*40, (Math.random()-0.5)*20+10, bird.position.z-150);
    d.velocity = new THREE.Vector3(0,0,0.8); scene.add(d); drones.push(d);
}

function fireMissiles() {
    for(let i=0; i<4; i++) {
        const m = new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.1,1), new THREE.MeshStandardMaterial({color:0xffff00}));
        m.position.copy(bird.position); m.position.x += (i-1.5)*2; m.rotation.x = Math.PI/2; m.velocity = new THREE.Vector3(0,0,-2);
        scene.add(m); missiles.push(m);
    }
}

function startGame() {
    gameActive = true; showMenu('GAME'); score = 0; window._v1 = 0; velocity = 0; hp = 200;
    gates.forEach(g => scene.remove(g.mesh)); gates = []; drones.forEach(d => scene.remove(d)); drones = [];
    createBird(); createEnvironment(); frameCount = 0;
}

function gameOver() {
    gameActive = false; if (score > bestScore) { bestScore = score; localStorage.setItem('GUSTWING_BEST', bestScore); }
    showMenu('GAME_OVER'); document.getElementById('final-score').innerText = score;
}

function playSound(buf, r=1) { if(!soundEnabled || !audioCtx || !buf) return; const s = audioCtx.createBufferSource(); s.buffer = buf; s.playbackRate.value = r; const g = audioCtx.createGain(); g.gain.value = 0.2; s.connect(g); g.connect(audioCtx.destination); s.start(); }
function startMotorSound() { motorGain = audioCtx.createGain(); motorGain.gain.value = 0; motorGain.connect(audioCtx.destination); }
function startIntenseMusic() {}
function createProceduralSounds() {
    clickBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate*0.05, audioCtx.sampleRate);
    coinBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate*0.2, audioCtx.sampleRate);
    let cd = coinBuffer.getChannelData(0); for(let i=0; i<cd.length; i++) cd[i] = Math.sin(i*0.5)*Math.exp(-i*0.002);
}
function handleInput() { if(gameState==='GAME') { velocity = jumpStrength; } }

function loadStats() {
    bestScore = parseInt(localStorage.getItem('GUSTWING_BEST') || '0');
    currentSkin = localStorage.getItem('GUSTWING_SKIN_S') || 'Default MK-1';
    currentLaserColor = parseInt(localStorage.getItem('GUSTWING_LASER_S') || '0x00ffff');
}
function saveStats() {
    localStorage.setItem('GUSTWING_BEST', bestScore);
    localStorage.setItem('GUSTWING_SKIN_S', currentSkin);
    localStorage.setItem('GUSTWING_LASER_S', currentLaserColor);
}

function showGrade(text) {
    const el = document.createElement('div');
    el.innerText = text;
    el.style.position = 'absolute'; el.style.top = '40%'; el.style.left = '50%';
    el.style.transform = 'translate(-50%, -50%)'; el.style.fontSize = '8rem'; el.style.fontWeight = '900';
    el.style.color = (text === 'PERFECT') ? '#f0c55d' : (text === 'NOT BAD' ? '#00ffff' : '#ff4545');
    el.style.textShadow = '0 0 20px ' + el.style.color;
    el.style.pointerEvents = 'none'; el.style.transition = 'all 0.5s'; el.style.zIndex = '100';
    document.body.appendChild(el);
    setTimeout(() => { el.style.top = '30%'; el.style.opacity = '0'; setTimeout(() => el.remove(), 500); }, 100);
}

function animate() {
    requestAnimationFrame(animate);
    if (gameState === 'GAME') {
        velocity += gravity; bird.position.y += velocity; const curSpeed = (baseForwardSpeed + (boostMode?2:0) + (volcanoActive?4:0)); bird.position.z -= curSpeed;
        camera.position.set(bird.position.x, bird.position.y, bird.position.z + 10); camera.lookAt(bird.position.x, bird.position.y, bird.position.z - 20);

        if(!boostMode && !volcanoActive) { abilityMeter = Math.min(100, abilityMeter+0.1); volcanoMeter = Math.min(100, volcanoMeter+0.05); }
        document.getElementById('ability-fill').style.width = abilityMeter + '%';
        document.getElementById('volcano-fill').style.width = volcanoMeter + '%';

        bird.beams.forEach(b => { b.visible = isFiringBeam; });
        frameCount++; if (frameCount % gateInterval === 0) createGate();
        if (frameCount % 150 === 0) spawnDrone();

        drones.forEach((d, i) => {
            d.position.z += 0.5;
            if (bird.position.distanceTo(d.position) < 3) gameOver();
        });

        gates.forEach((g, i) => {
            if (score >= 85) {
                const scale = 1 + Math.sin(Date.now() * 0.005) * 0.5;
                g.mesh.scale.set(scale, scale, 1);
                g.radius = 8 * scale;
            }
            const dist = bird.position.distanceTo(g.mesh.position);
            const holeRadius = g.radius - 0.8;

            if (Math.abs(g.mesh.position.z - bird.position.z) < 1.0) {
                if (!boostMode && !volcanoActive) {
                    if (dist > holeRadius) gameOver();
                }
                if (!g.coinCollected && dist < 2.5) {
                    g.coinCollected = true; g.mesh.coin.visible = false;
                    credits += 10; playSound(coinBuffer);
                }
            }
            if (!g.passed && g.mesh.position.z > bird.position.z) {
                g.passed = true; score++; window._v1 = score;
                const dXY = Math.sqrt(Math.pow(bird.position.x - g.mesh.position.x, 2) + Math.pow(bird.position.y - g.mesh.position.y, 2));
                if (dXY < 1.0) showGrade('PERFECT');
                else if (dXY < 3.0) showGrade('NOT BAD');
                else if (dXY < 5.0) showGrade('BAD');
                else showGrade('NICE TRY');
            }
        });

        document.getElementById('score').innerText = score;
        document.getElementById('best-score').innerText = bestScore;
        document.getElementById('speed-value').innerText = Math.round(curSpeed * 100);
        document.getElementById('alt-value').innerText = Math.max(0, Math.round(bird.position.y * 10));

        if (bird.position.y < -12 || bird.position.y > 45) gameOver();
    }
    renderer.render(scene, camera);
}
init();
