// --- SVG-Konstanten für die Fenstersteuerung ---
const SVG_CLOSE = `<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
const SVG_MINIMIZE = `<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="17" y1="12" x2="7" y2="12"></line></svg>`;
const SVG_RESTORE = `<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"><g transform="translate(-2, 2)"><path d="M 7 8 A 1 1 0 0 1 8 7 H 16 A 1 1 0 0 1 17 8 V 16 A 1 1 0 0 1 16 17 H 8 A 1 1 0 0 1 7 16 Z" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M 11 4 A 1 1 0 0 1 12 3 H 20 A 1 1 0 0 1 21 4 V 12 A 1 1 0 0 1 20 13 H 17 L 17 7 L 11 7 L 11 4 Z" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="miter"/></g></svg>`;
const SVG_MAXIMIZE = `<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="12" height="12" rx="1"></rect></svg>`;
const SVG_LOGO = `<svg id="svg" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="400" height="400" viewBox="0, 0, 400,400"><g id="svgg" fill="#3c4257"><path class="logo-main" id="path0" d="M143.848 143.883 C 116.554 145.633,93.687 165.875,89.169 192.285 C 83.999 222.510,100.502 250.300,129.102 259.530 C 136.728 261.991,141.417 262.495,156.689 262.498 L 167.773 262.500 167.773 248.549 L 167.773 234.597 156.006 234.511 C 146.282 234.440,143.974 234.372,142.714 234.115 C 126.931 230.906,117.491 219.198,117.491 202.832 C 117.491 190.162,123.351 180.243,133.993 174.898 C 140.180 171.791,142.673 171.535,167.188 171.496 L 178.027 171.479 180.957 166.985 C 182.568 164.513,185.207 160.493,186.820 158.052 C 190.578 152.365,193.808 147.407,195.088 145.361 L 196.096 143.750 170.460 143.785 C 156.360 143.805,144.385 143.849,143.848 143.883 M207.876 149.756 C 205.721 153.059,201.661 159.249,198.854 163.511 C 196.047 167.772,193.750 171.310,193.750 171.371 C 193.750 171.433,204.890 171.505,218.506 171.532 L 243.262 171.582 243.311 217.041 L 243.360 262.500 257.813 262.500 L 272.266 262.500 272.266 216.992 L 272.266 171.484 291.895 171.484 L 311.523 171.484 311.523 157.617 L 311.523 143.750 261.659 143.750 L 211.794 143.750 207.876 149.756 M199.183 202.490 C 192.394 208.694,185.868 214.651,184.680 215.727 L 182.520 217.685 182.569 240.093 L 182.619 262.500 197.169 262.500 L 211.719 262.500 211.719 226.855 C 211.719 207.251,211.675 191.211,211.622 191.211 C 211.568 191.211,205.971 196.287,199.183 202.490 " stroke="none" fill-rule="evenodd"></path><path class="logo-accent" id="path2" d="M157.889 193.799 C 149.390 206.224,141.797 217.398,141.797 217.480 C 141.797 217.534,150.963 217.578,162.165 217.578 L 182.533 217.578 195.699 205.548 C 202.941 198.932,209.485 192.956,210.243 192.269 L 211.621 191.020 185.707 191.018 L 159.793 191.016 157.889 193.799 " stroke="none" fill-rule="evenodd"></path></g></svg>`;

/**
 * WindowManager
 * Verwaltet die UI-Elemente der Fensterleiste (Minimieren, Maximieren, Schließen)
 * und setzt die App-Logos.
 */
const WindowManager = {
    ui: {},

    /**
     * Initialisiert den Manager, holt DOM-Elemente und registriert Listener.
     */
    init() {
        this._queryDOMElements();
        this._setLogos();
        this._bindEventListeners();
        console.log("WindowManager erfolgreich initialisiert.");
    },

    /** Holt alle benötigten DOM-Elemente. */
    _queryDOMElements() {
        this.ui = {
            minimizeButton: document.getElementById('minimizeButton'),
            maximizeButton: document.getElementById('maximizeButton'),
            closeButton: document.getElementById('closeButton'),
            appLogo: document.getElementById('appLogo'),
            resultsPlaceholderLogo: document.getElementById('resultsPlaceholderLogo'),
        };
    },

    /** Setzt die SVG-Logos an den entsprechenden Stellen. */
    _setLogos() {
        if (this.ui.appLogo) this.ui.appLogo.innerHTML = SVG_LOGO;
        if (this.ui.resultsPlaceholderLogo) this.ui.resultsPlaceholderLogo.innerHTML = SVG_LOGO;
    },

    /** Registriert die Event-Listener für die Fenstersteuerung. */
    _bindEventListeners() {
        // Prüfen, ob die Electron API überhaupt verfügbar ist.
        if (!window.electronAPI || typeof window.electronAPI.minimizeWindow !== 'function') {
            if (this.ui.minimizeButton) this.ui.minimizeButton.style.display = 'none';
            if (this.ui.maximizeButton) this.ui.maximizeButton.style.display = 'none';
            if (this.ui.closeButton) this.ui.closeButton.style.display = 'none';
            return;
        }

        if (this.ui.minimizeButton) {
            this.ui.minimizeButton.innerHTML = SVG_MINIMIZE;
            this.ui.minimizeButton.addEventListener('click', () => window.electronAPI.minimizeWindow());
        }

        if (this.ui.maximizeButton) {
            this.ui.maximizeButton.innerHTML = SVG_MAXIMIZE;
            this.ui.maximizeButton.addEventListener('click', () => window.electronAPI.maximizeWindow());
            
            if (window.electronAPI.onWindowMaximizeStatusChange) {
                window.electronAPI.onWindowMaximizeStatusChange((isMaximized) => {
                    this.ui.maximizeButton.innerHTML = isMaximized ? SVG_RESTORE : SVG_MAXIMIZE;
                    this.ui.maximizeButton.setAttribute('data-custom-tooltip', isMaximized ? 'Restore' : 'Maximize');
                });
            }
        }

        if (this.ui.closeButton) {
            this.ui.closeButton.innerHTML = SVG_CLOSE;
            this.ui.closeButton.addEventListener('click', () => window.electronAPI.closeWindow());
        }
    }
};

export default WindowManager;
