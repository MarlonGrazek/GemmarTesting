import { ICON_CROSS, ICON_RESTORE, ICON_MAXIMIZE, ICON_MINIMIZE, ICON_BASKET_UP, ICON_LOGO } from "../common/svg-icons.js";

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
            uploadIcon: document.getElementById('fileUploadIcon'),
        };
    },

    _setLogos() {
        if (this.ui.appLogo) this.ui.appLogo.innerHTML = ICON_LOGO;
        if (this.ui.resultsPlaceholderLogo) this.ui.resultsPlaceholderLogo.innerHTML = ICON_LOGO;
        if (this.ui.uploadIcon) this.ui.uploadIcon.innerHTML = ICON_BASKET_UP;
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
            this.ui.minimizeButton.innerHTML = ICON_MINIMIZE;
            this.ui.minimizeButton.addEventListener('click', () => window.electronAPI.minimizeWindow());
        }

        if (this.ui.maximizeButton) {
            this.ui.maximizeButton.innerHTML = ICON_MAXIMIZE;
            this.ui.maximizeButton.addEventListener('click', () => window.electronAPI.maximizeWindow());

            if (window.electronAPI.onWindowMaximizeStatusChange) {
                window.electronAPI.onWindowMaximizeStatusChange((isMaximized) => {
                    this.ui.maximizeButton.innerHTML = isMaximized ? ICON_RESTORE : ICON_MAXIMIZE;
                    this.ui.maximizeButton.setAttribute('data-custom-tooltip', isMaximized ? 'Restore' : 'Maximize');
                });
            }
        }

        if (this.ui.closeButton) {
            this.ui.closeButton.innerHTML = ICON_CROSS;
            this.ui.closeButton.addEventListener('click', () => window.electronAPI.closeWindow());
        }
    }
};

export default WindowManager;
