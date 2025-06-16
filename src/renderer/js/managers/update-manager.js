import ModalManager from "./modal-manager.js";

const SVG_CLOSE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;

/**
 * UpdateManager
 * Verwaltet die Anzeige des Update-Status in der UI und die Interaktion mit dem Benutzer.
 */
const UpdateManager = {
    // Gekapselter Zustand und DOM-Referenzen
    updateInfo: null,
    versionBox: null,
    versionBoxTitle: null,
    versionBoxSubtitle: null,

    /**
     * Initialisiert den Manager, holt DOM-Elemente und registriert Listener.
     */
    init() {
        // 1. DOM-Elemente selbst holen
        this.versionBox = document.getElementById('versionBox');
        this.versionBoxTitle = document.getElementById('versionBoxTitle');
        this.versionBoxSubtitle = document.getElementById('versionBoxSubtitle');

        if (!this.versionBox || !this.versionBoxTitle || !this.versionBoxSubtitle) {
            console.error("UpdateManager: Ein oder mehrere versionBox-Elemente nicht gefunden!");
            return;
        }

        // 2. Event-Listener registrieren
        this.versionBox.addEventListener('click', this.handleVersionBoxClick.bind(this));
        
        window.electronAPI.receive('update-status', (payload) => {
            console.log('UpdateManager: IPC "update-status" empfangen:', payload);
            this.updateInfo = payload;
            
            // Logik für automatische Popups bei Statusänderung
            if (payload.status === 'available') {
                this.showUpdatePrompt(payload);
            } else if (payload.status === 'downloaded') {
                this.showRestartPrompt(payload);
            }
            
            this.updateVersionBoxUI(payload.status, payload);
        });

        // 3. Initialen Zustand setzen
        this.updateVersionBoxUI('init');
        console.log("UpdateManager erfolgreich initialisiert.");
    },

    /**
     * Aktualisiert die UI der versionBox basierend auf dem Update-Status.
     * @param {string} status - Der aktuelle Update-Status.
     * @param {object} [data=null] - Zusätzliche Daten wie Version, Prozent etc.
     */
    async updateVersionBoxUI(status, data = null) {
        if (!this.versionBox) return;

        this.versionBox.className = 'info-box'; // Reset zu Basisklasse
        this.versionBox.style.setProperty('--download-progress', '0%');

        switch (status) {
            case 'init':
            case 'idle':
            case 'not-available':
                try {
                    const appVersion = await window.electronAPI.getAppVersion();
                    this.versionBoxTitle.textContent = `Version ${appVersion}`;
                } catch (error) {
                    this.versionBoxTitle.textContent = 'Unknown version';
                }
                this.versionBoxSubtitle.textContent = 'Click to view the patchnotes';
                break;

            case 'checking':
                this.versionBoxTitle.textContent = "Searching for updates...";
                this.versionBoxSubtitle.textContent = 'Please hold on for a moment...';
                this.versionBox.classList.add('update-checking');
                break;

            case 'available':
                this.versionBoxTitle.textContent = `Update to Version ${data.version}`;
                this.versionBoxSubtitle.textContent = 'Click to view the update details';
                this.versionBox.classList.add('update-available');
                break;

            case 'downloading':
                this.versionBoxTitle.textContent = "Downloading...";
                this.versionBoxSubtitle.textContent = `${data.percent ? data.percent + '%' : ''} ${data.speed || ''}`;
                this.versionBox.classList.add('update-downloading');
                if (data.percent) {
                    this.versionBox.style.setProperty('--download-progress', `${data.percent}%`);
                }
                break;

            case 'downloaded':
                this.versionBoxTitle.textContent = "Download complete";
                this.versionBoxSubtitle.textContent = 'Click to install and restart';
                this.versionBox.classList.add('update-available');
                break;

            case 'error':
                 try {
                    const appVersion = await window.electronAPI.getAppVersion();
                    this.versionBoxTitle.textContent = `Version ${appVersion} (Update-Error)`;
                } catch (error) {
                    this.versionBoxTitle.textContent = 'Unknown version (Update-Error)';
                }
                this.versionBoxSubtitle.textContent = "An error occurred during update";
                this.versionBox.classList.add('update-error');
                break;
        }
    },

    /**
     * Behandelt Klicks auf die versionBox.
     */
    handleVersionBoxClick() {
        if (!this.updateInfo) {
            console.log("Klick auf versionBox, kein Update-Status bekannt. (Aktion für Patchnotes hier).");
            // Hier könnte man z.B. immer die Patchnotes der aktuellen Version anzeigen
            return;
        }

        switch (this.updateInfo.status) {
            case 'available':
                this.showUpdatePrompt(this.updateInfo);
                break;
            case 'downloaded':
                this.showRestartPrompt(this.updateInfo);
                break;
            default:
                console.log(`Klick auf versionBox im Status '${this.updateInfo.status}', keine Aktion definiert.`);
                break;
        }
    },

    /**
     * Öffentliches Interface, um das "Herunterladen?"-Modal anzuzeigen.
     */
    showUpdatePrompt(details) {
        this._showUpdateModal({
            title: `Update to version ${details.version} available`,
            notes: details.notes,
            buttons: [
                { text: 'Later', class: 'modal-action-button button-secondary', onClick: ({ close }) => close() },
                { 
                    text: 'Download', 
                    class: 'modal-action-button button-primary',
                    onClick: ({ close }) => {
                        window.electronAPI.send('update-download', details);
                        close();
                    }
                }
            ]
        });
    },

    /**
     * Öffentliches Interface, um das "Neustarten?"-Modal anzuzeigen.
     */
    showRestartPrompt(details) {
        this._showUpdateModal({
            title: `Update to version ${details.version} installed`,
            notes: details.notes,
            buttons: [
                { text: 'Later', class: 'modal-action-button button-secondary', onClick: ({ close }) => close() },
                { 
                    text: 'Restart & Install', 
                    class: 'modal-action-button button-primary',
                    onClick: () => {
                        window.electronAPI.send('restart-and-install');
                    }
                }
            ]
        });
    },

    /**
     * Private Hilfsfunktion, die die eigentliche Modal-Erstellung übernimmt.
     * @private
     */
    _showUpdateModal({ title, notes, buttons }) {
        ModalManager.show({
            title: title,
            size: 'medium',
            headerButtons: [{
                class: 'modal-header-button close-button',
                tooltip: 'Close',
                svg: SVG_CLOSE,
                onClick: ({ close }) => close()
            }],
            contentTree: {
                tag: 'div',
                props: {
                    className: 'patch-notes-content',
                    innerHTML: (notes || 'No patchnotes available').replace(/\n/g, '<br>')
                }
            },
            actionButtons: buttons
        });
    }
};

export default UpdateManager;
