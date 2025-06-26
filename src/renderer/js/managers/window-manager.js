import { ICON_CROSS, ICON_RESTORE, ICON_MAXIMIZE, ICON_MINIMIZE, ICON_BASKET_UP, ICON_LOGO, ICON_SPARKLE, ICON_SPARKLES } from "../common/svg-icons.js";

/**
 * WindowManager
 * Verwaltet die UI-Elemente der Fensterleiste (Minimieren, Maximieren, Schließen)
 * und setzt die App-Logos.
 */
const WindowManager = {
    ui: {},
    sparkleMode: {
        clicks: 0,
        active: false,
    },

    /**
     * Initialisiert den Manager, holt DOM-Elemente und registriert Listener.
     */
    async init() {
        this._queryDOMElements();
        this._setLogos();
        this._bindEventListeners();
        this._updateSparkleButtonVisuals(); // Initialen Zustand des Sparkle-Buttons setzen
        console.log("WindowManager erfolgreich initialisiert.");

        if (await window.electronAPI.getAdminStatus()) this.ui.appTitle.textContent = "Gemmar Admin";
    },

    /** Holt alle benötigten DOM-Elemente. */
    _queryDOMElements() {
        this.ui = {
            minimizeButton: document.getElementById('minimizeButton'),
            maximizeButton: document.getElementById('maximizeButton'),
            closeButton: document.getElementById('closeButton'),
            appLogo: document.getElementById('appLogo'),
            appTitle: document.getElementById('appTitle'),
            resultsPlaceholderLogo: document.getElementById('resultsPlaceholderLogo'),
            uploadIcon: document.getElementById('fileUploadIcon'),
            sparkleButton: document.getElementById('sparkleButton'),
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

        // --- Sparkle Button Logik ---
        if (this.ui.sparkleButton) {
            this.ui.sparkleButton.innerHTML = ICON_SPARKLE;
            this.ui.sparkleButton.addEventListener('click', () => this._handleSparkleClick());
        }
    },

    _handleSparkleClick() {
        const CLICKS_FOR_ICON_CHANGE = 5;
        const CLICKS_TO_ACTIVATE_MODE = 10;

        if (this.sparkleMode.active) {
            this._toggleSparkleMode(false);
            this.sparkleMode.clicks = 0;
        } else {
            this.sparkleMode.clicks++;

            if (this.sparkleMode.clicks === CLICKS_FOR_ICON_CHANGE) {
                this.ui.sparkleButton.innerHTML = ICON_SPARKLES;
            } else if (this.sparkleMode.clicks >= CLICKS_TO_ACTIVATE_MODE) {
                this._toggleSparkleMode(true);
                this.sparkleMode.clicks = 0;
            }
        }
        this._updateSparkleButtonVisuals(); // Visuals nach Klick aktualisieren
    },

    _toggleSparkleMode(activate) {
        this.sparkleMode.active = activate;
        if (activate) {
            document.body.classList.add('sparkle-mode-active');
            this.ui.sparkleButton.innerHTML = '✨';
        } else {
            document.body.classList.remove('sparkle-mode-active');
            this.ui.sparkleButton.innerHTML = ICON_SPARKLE;
        }
        this._updateSparkleButtonVisuals(); // Visuals nach Moduswechsel aktualisieren
        console.log(`Sparkle Mode: ${this.sparkleMode.active ? 'activated' : 'deactivated'}`);
    },

    /**
     * Aktualisiert den Tooltip und die Füllfarbe des Sparkle-Buttons.
     */
    _updateSparkleButtonVisuals() {
        if (!this.ui.sparkleButton) return;

        // --- SVG-Füllung/Farbe aktualisieren (nur wenn ein SVG sichtbar ist) ---
        // Wenn der Modus aktiv ist, ist das Emoji sichtbar, keine SVG-Füllung nötig.
        // Setze den Prozentsatz auf 100%, falls das CSS noch darauf reagieren sollte.
        if (this.sparkleMode.active) {
            this.ui.sparkleButton.style.setProperty('--sparkle-fill-percentage', '100%');
            return;
        }

        // Berechnung des Füllprozentsatzes basierend auf Klicks (0 bis 9 Klicks)
        // Bei 9 Klicks soll es 90% gelb sein.
        const maxClicksForColorTransition = 9; // Klicks 0 bis 9
        let fillPercentage = (this.sparkleMode.clicks / maxClicksForColorTransition) * 90;

        // Sicherstellen, dass der Wert zwischen 0 und 90 (inklusive) bleibt
        fillPercentage = Math.min(Math.max(fillPercentage, 0), 90);

        // Setze die CSS-Variable, die im CSS für color-mix verwendet wird
        this.ui.sparkleButton.style.setProperty('--sparkle-fill-percentage', `${fillPercentage}%`);
    }
};

export default WindowManager;