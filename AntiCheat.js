(function() {
    const secureStorage = { score: 0, integrityHash: btoa(Math.random().toString()) };
    Object.defineProperty(window, '_v1', {
        get: function() { return secureStorage.score; },
        set: function(val) {
            if (typeof val !== 'number') { window.triggerKernelFailure(); return; }
            secureStorage.score = val;
        }
    });
    const originals = { requestAnimationFrame: window.requestAnimationFrame, setInterval: window.setInterval, setTimeout: window.setTimeout };
    setInterval(() => {
        if (window.requestAnimationFrame !== originals.requestAnimationFrame ||
            window.setInterval !== originals.setInterval ||
            window.setTimeout !== originals.setTimeout) {
            window.triggerKernelFailure();
        }
    }, 5000);
    window.triggerKernelFailure = function() {
        const errorScreen = document.getElementById('error-404');
        if (errorScreen) {
            errorScreen.style.display = 'flex';
            document.getElementById('ui-container').style.display = 'none';
            setTimeout(() => { location.reload(); }, 3000);
        }
    };
})();
