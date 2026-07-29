(function() {
    document.addEventListener('keydown', function(e) {
        if (
            e.keyCode === 123 ||
            (e.ctrlKey && e.shiftKey && e.keyCode === 73) ||
            (e.ctrlKey && e.shiftKey && e.keyCode === 74) ||
            (e.ctrlKey && e.shiftKey && e.keyCode === 67) ||
            (e.ctrlKey && e.keyCode === 85) ||
            (e.ctrlKey && e.keyCode === 83) ||
            (e.ctrlKey && e.keyCode === 72)
        ) {
            e.preventDefault();
            window.triggerKernelFailure();
            return false;
        }
    });
    document.addEventListener('contextmenu', e => { e.preventDefault(); });
    let devtoolsOpen = false;
    const element = new Image();
    Object.defineProperty(element, 'id', { get: function() { devtoolsOpen = true; window.triggerKernelFailure(); } });
    setInterval(() => { devtoolsOpen = false; console.log(element); console.clear(); const threshold = 160; if (window.outerWidth - window.innerWidth > threshold || window.outerHeight - window.innerHeight > threshold) { window.triggerKernelFailure(); } }, 1000);
    setInterval(() => { (function() { return false; }['constructor']('debugger')['call']()); }, 100);
})();
