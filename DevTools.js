(function() {
    const _f = () => window.triggerKernelFailure();

    // Hardened Shortcut Blocking
    window.addEventListener('keydown', e => {
        if (e.keyCode === 123 || (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) || (e.ctrlKey && e.keyCode === 85)) {
            e.preventDefault();
            _f();
        }
    }, true);

    // Context Menu Killing
    window.addEventListener('contextmenu', e => e.preventDefault(), true);

    // Undock / Resize Detection
    const _t = 160;
    setInterval(() => {
        if (window.outerWidth - window.innerWidth > _t || window.outerHeight - window.innerHeight > _t) {
            _f();
        }
    }, 500);

    // Aggressive Console Poisoning
    const _o = new Image();
    Object.defineProperty(_o, 'id', { get: () => { _f(); } });

    setInterval(() => {
        console.log(_o);
        console.clear();
    }, 200);

    // Multi-Layer Debugger Loop
    const _d = function() {
        const start = performance.now();
        debugger;
        const end = performance.now();
        if (end - start > 100) {
            _f();
        }
    };

    setInterval(_d, 100);

    // Protect core functions from being proxied or hooked
    const _p = [
        window.triggerKernelFailure,
        console.log,
        console.clear,
        Function.prototype.constructor
    ];

    _p.forEach(fn => {
        if (fn.toString().indexOf('[native code]') === -1 && fn.name !== 'triggerKernelFailure') {
            _f();
        }
    });

    // Detect Source Tab via Performance Side-channel
    (function check() {
        const s = performance.now();
        for (let i = 0; i < 1e6; i++) { Math.sqrt(i); }
        const e = performance.now();
        if (e - s > 50) { // If simple loop takes too long, tools are likely siphoning resources
            // This is subtle, maybe just log for now or trigger failure
        }
        setTimeout(check, 1000);
    })();

    // Final infinite debugger trap
    setInterval(() => {
        (function() { return false; }['constructor']('debugger')['call']());
    }, 50);
})();
