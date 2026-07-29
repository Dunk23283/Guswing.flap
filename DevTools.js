(function() {
    // 1. REFRESH/REDIRECT LOGIC
    const _f = () => {
        let c = parseInt(sessionStorage.getItem('_gc') || '0');
        c++;
        sessionStorage.setItem('_gc', c.toString());
        if (c > 2) {
            window.location.href = 'about:blank';
        } else {
            window.location.reload();
        }
    };

    // 2. DIMENSION DETECTION
    setInterval(function() {
        if (window.outerWidth - window.innerWidth > 160 || window.outerHeight - window.innerHeight > 160) {
            window.location.href = 'about:blank';
        }
    }, 200);

    // 3. AGGRESSIVE CONSOLE KILLER
    setInterval(function() { console.clear(); }, 50);
    setInterval(function() { console.clear(); }, 5000);

    // 4. CONSOLE OVERRIDES
    try {
        const noop = function() {};
        const methods = ['log', 'warn', 'error', 'info', 'debug', 'table', 'trace', 'dir'];
        methods.forEach(m => { window.console[m] = noop; });

        Object.defineProperty(window, 'console', {
            get: function() { return null; },
            set: function() { }
        });
    } catch (e) {}

    // 5. EVAL BLOCKER
    window.eval = function() { throw new Error('eval disabled'); };

    // 6. KEYBOARD SHORTCUTS
    window.addEventListener('keydown', function(e) {
        if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && ['I','J','C'].includes(e.key)) || (e.ctrlKey && e.key === 'u')) {
            e.preventDefault();
            e.stopPropagation();
            _f();
            return false;
        }
    }, true);

    // 7. MEMORY BOMB & DEBUGGER
    setInterval(function() {
        const s = performance.now();
        debugger;
        if (performance.now() - s > 100) {
            // Massive memory allocation to force tab crash if devtools persist
            var arr = [];
            for (var i = 0; i < 1000000; i++) {
                arr.push(new Array(1000).join('x'));
            }
            arr = null;
            _f();
        }
    }, 50);

    // 8. DEATH LOOP
    (function deathLoop() {
        debugger;
        setTimeout(deathLoop, 10);
    })();

    // 9. CONTEXT MENU
    window.addEventListener('contextmenu', e => e.preventDefault(), true);
})();
