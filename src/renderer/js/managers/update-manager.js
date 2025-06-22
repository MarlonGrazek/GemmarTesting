import ModalManager from "./modal-manager.js";

import { ICON_CROSS } from "../common/svg-icons.js";

const UpdateManager = {
    updateInfo: null,
    ui: {},

    init() {
        this._queryDOMElements();
        if (!this.ui.versionBox) {
            console.error("UpdateManager: Initialisierung fehlgeschlagen, versionBox nicht gefunden.");
            return;
        }
        this._bindEventListeners();
        this.updateVersionBoxUI('init');
        console.log("UpdateManager erfolgreich initialisiert.");
    },

    _queryDOMElements() {
        this.ui = {
            versionBox: document.getElementById('versionBox'),
            versionBoxTitle: document.getElementById('versionBoxTitle'),
            versionBoxSubtitle: document.getElementById('versionBoxSubtitle'),
        };
    },

    _bindEventListeners() {
        this.ui.versionBox.addEventListener('click', this.handleVersionBoxClick.bind(this));
        window.electronAPI.receive('update-status', (payload) => {
            console.log('UpdateManager: IPC "update-status" empfangen:', payload);
            this.updateInfo = payload;
            if (payload.status === 'available') {
                this.showUpdatePrompt(payload);
            } else if (payload.status === 'downloaded') {
                this.showRestartPrompt(payload);
            }
            this.updateVersionBoxUI(payload.status, payload);
        });
    },

    async updateVersionBoxUI(status, data = null) {
        if (!this.ui.versionBox) return;
        this.ui.versionBox.className = 'info-box';
        this.ui.versionBox.style.setProperty('--download-progress', '0%');

        switch (status) {
            case 'init':
            case 'idle':
            case 'not-available':
                try {
                    const appVersion = await window.electronAPI.getAppVersion();
                    this.ui.versionBoxTitle.textContent = `Version ${appVersion}`;
                } catch (error) {
                    this.ui.versionBoxTitle.textContent = 'Unknown version';
                }
                this.ui.versionBoxSubtitle.textContent = 'Click to view the patchnotes';
                break;
            case 'checking':
                this.ui.versionBoxTitle.textContent = "Searching for updates...";
                this.ui.versionBoxSubtitle.textContent = 'Please hold on for a moment...';
                this.ui.versionBox.classList.add('update-checking');
                break;
            case 'available':
                this.ui.versionBoxTitle.textContent = `Update to Version ${data.version}`;
                this.ui.versionBoxSubtitle.textContent = 'Click to view the update details';
                this.ui.versionBox.classList.add('update-available');
                break;
            case 'downloading':
                this.ui.versionBoxTitle.textContent = "Downloading...";
                this.ui.versionBoxSubtitle.textContent = `${data.percent ? data.percent + '%' : ''} ${data.speed || ''}`;
                this.ui.versionBox.classList.add('update-downloading');
                if (data.percent) {
                    this.ui.versionBox.style.setProperty('--download-progress', `${data.percent}%`);
                }
                break;
            case 'downloaded':
                this.ui.versionBoxTitle.textContent = "Download complete";
                this.ui.versionBoxSubtitle.textContent = 'Click to install and restart';
                this.ui.versionBox.classList.add('update-available');
                break;
            case 'error':
                 try {
                    const appVersion = await window.electronAPI.getAppVersion();
                    this.ui.versionBoxTitle.textContent = `Version ${appVersion} (Update-Error)`;
                } catch (error) {
                    this.ui.versionBoxTitle.textContent = 'Unknown version (Update-Error)';
                }
                this.ui.versionBoxSubtitle.textContent = "An error occurred during update";
                this.ui.versionBox.classList.add('update-error');
                break;
        }
    },

    handleVersionBoxClick() {
        if (this.updateInfo) {
            // Wenn ein echtes Update verfügbar ist, zeige die Details an
            switch (this.updateInfo.status) {
                case 'available':
                    this.showUpdatePrompt(this.updateInfo);
                    break;
                case 'downloaded':
                    this.showRestartPrompt(this.updateInfo);
                    break;
            }
        } else {
            // Standardverhalten: Wenn kein Update-Status bekannt ist, passiert nichts
            // (oder hier könnte man die Patchnotes der aktuellen Version laden)
            console.log("Klick auf versionBox, aber kein aktiver Update-Status bekannt.");
        }
    },

    showUpdatePrompt(details) {
        const actionButtons = [];
        if (!details.force) {
            actionButtons.push({ text: 'Later', class: 'modal-action-button button-secondary', onClick: ({ close }) => close() });
        }
        actionButtons.push({
            text: 'Download',
            class: 'modal-action-button button-primary',
            onClick: ({ close }) => {
                window.electronAPI.send('update-download', details);
                if (!details.force) close();
            }
        });
        this._showUpdateModal({
            title: `Update to version ${details.version} available`,
            notes: details.notes,
            buttons: actionButtons,
            isForced: details.force || false
        });
    },

    showRestartPrompt(details) {
        const actionButtons = [];
        if (!details.force) {
            actionButtons.push({ text: 'Later', class: 'modal-action-button button-secondary', onClick: ({ close }) => close() });
        }
        actionButtons.push({
            text: 'Restart & Install',
            class: 'modal-action-button button-primary',
            onClick: () => window.electronAPI.send('restart-and-install')
        });
        this._showUpdateModal({
            title: `Update to version ${details.version} installed`,
            notes: details.notes,
            buttons: actionButtons,
            isForced: details.force || false
        });
    },

    _showUpdateModal({ title, notes, buttons, isForced }) {
        const headerButtons = [];
        if (!isForced) {
            headerButtons.push({ class: 'modal-header-button close-button', tooltip: 'Close', svg: ICON_CROSS, onClick: ({ close }) => close() });
        }

        ModalManager.show({
            title: title,
            size: 'large', // Behält die 'large'-Einstellung bei
            headerButtons: headerButtons,
            contentTree: {
                tag: 'div',
                props: {
                    className: 'patch-notes-content',
                    innerHTML: notes || 'No details available.'
                }
            },
            actionButtons: buttons
        });
    }
};

export default UpdateManager;
