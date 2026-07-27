(function() {
    // Block Keyboard Shortcuts
    document.addEventListener('keydown', function(e) {
        if (
            e.keyCode === 123 || // F12
            (e.ctrlKey && e.shiftKey && e.keyCode === 73) || // Ctrl+Shift+I
            (e.ctrlKey && e.shiftKey && e.keyCode === 74) || // Ctrl+Shift+J
            (e.ctrlKey && e.keyCode === 85) // Ctrl+U
        ) {
            e.preventDefault();
            return false;
        }
    });

    // Block Context Menu
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });

    // Detect DevTools Opening
    let devtoolsOpen = false;
    const threshold = 160;

    setInterval(() => {
        const widthThreshold = window.outerWidth - window.innerWidth > threshold;
        const heightThreshold = window.outerHeight - window.innerHeight > threshold;

        if (widthThreshold || heightThreshold) {
            if (!devtoolsOpen) {
                devtoolsOpen = true;
                document.body.innerHTML = '<div style="background:#000;color:red;height:100vh;display:flex;align-items:center;justify-content:center;font-family:monospace;font-size:2rem;text-align:center;">SYSTEM BREACH DETECTED<br>DEVTOOLS ARE RESTRICTED</div>';
                window.location.reload();
            }
        } else {
            devtoolsOpen = false;
        }
    }, 1000);

    // Anti-Debugger Loop
    (function() {
        (function a() {
            try {
                (function b(i) {
                    if (('' + (i / i)).length !== 1 || i % 20 === 0) {
                        (function() { }).constructor('debugger')();
                    } else {
                        debugger;
                    }
                    b(++i);
                })(0);
            } catch (e) {
                setTimeout(a, 5000);
            }
        })();
    })();
})();
