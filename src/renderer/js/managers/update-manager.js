console.log("update-renderer.js wird geladen...");

let availableUpdateInfo = null;
let showModal;

const SVG_CLOSE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;

export function initializeUpdateRenderer(dependencies) {
    console.log("Update-Renderer wird jetzt initialisiert.");

    showModal = dependencies.showModal;

    if (versionBox) {
        console.log("Update-UI: 'versionBox' ist erreichbar!");
        updateVersionBox('init');
    } else {
        console.error("Update-UI: 'versionBox' konnte nicht von renderer.js übernommen werden!");
    }

    if (versionBox) {
        // Der Klick-Handler bleibt hier (oder wird in eine eigene Funktion ausgelagert)
        versionBox.addEventListener('click', handleVersionBoxClick);
    }

    window.electronAPI.receive('update-status', (payload) => {
        console.log('Update-Renderer: IPC "update-status" empfangen mit Payload:', payload);

        if (payload.status === 'available') {

            availableUpdateInfo = payload;
            // Rufe dein Pop-up auf (diese Funktion verschieben wir als Nächstes)
            showCustomUpdatePrompt(payload);
        } else if (payload.status == 'downloaded') {
            showCustomRestartPrompt(payload);
        } else if (payload.status === 'not-available' || payload.status === 'error') {
            availableUpdateInfo = null; // Setze zurück, wenn kein Update da ist oder ein Fehler auftritt
        }

        updateVersionBox(payload.status, payload);
    });
}

async function updateVersionBox(status, data = null) {

    if (!versionBox || !versionBoxTitle || !versionBoxSubtitle) {
        console.error("versionBox oder versionBoxLabel DOM-Element nicht initialisiert!");
        return;
    }

    // Reset der spezifischen Zustands-Klassen erstmal
    versionBox.classList.remove(
        'update-available',
        'update-checking',
        'update-downloading',
        'update-error'
    );

    switch (status) {
        case 'init': // Initialer Zustand beim Laden der App
        case 'idle': // Allgemeiner Ruhezustand
        case 'not-available': // Kein Update gefunden
            try {
                const appVersion = await window.electronAPI.getAppVersion();
                versionBoxTitle.textContent = `Version ${appVersion}`;
                if (status === 'not-available') {
                    // Optional: Zusatz, wenn explizit kein Update da war
                    // versionBoxLabel.textContent += " (aktuell)"; 
                }
            } catch (error) {
                console.error('Error while accessing the app-version:', error);
                versionBoxTitle.textContent = 'Unknown version';
            }
            versionBoxSubtitle.textContent = 'Click to view the patchnotes'
            break;

        case 'checking':
            versionBoxTitle.textContent = "Searching for updates...";
            versionBox.classList.add('update-checking'); // Deine CSS-Klasse für die Animation
            versionBoxSubtitle.textContent = 'Please hold on for a moment...'
            break;

        case 'available':
            if (data && data.version) {
                versionBoxTitle.textContent = `Update to Version ${data.version}`;
            } else {
                versionBoxTitle.textContent = "Update available";
            }
            versionBox.classList.add('update-available'); // Deine CSS-Klasse für Akzent-Rand
            versionBoxSubtitle.textContent = 'Click to view the update details'
            break;

        case 'downloading':
            versionBoxTitle.textContent = "Downloading...";
            if (data && data.version) {
                // Das `data.percent` musst du noch übergeben, wenn das 'downloading'-Event kommt
                versionBoxSubtitle.textContent = `${data.percent !== undefined ? data.percent + '%' : ' ' + `${data.speed}`}`
            } else {
                versionBoxSubtitle.textContent = "Download is running";
            }
            versionBox.classList.add('update-downloading'); // Deine CSS-Klasse für Download-Animation/Rand

            if (data && data.percent) {
                versionBox.style.setProperty('--download-progress', `${data.percent}%`);
            }
            break;

        case 'downloaded':
            versionBoxTitle.textContent = "Download complete";
            versionBox.classList.add('update-available'); // Kann dieselbe Hervorhebung wie 'available' haben
            versionBoxSubtitle.textContent = 'Click to install the update and restart the app';
            break;

        case 'error':
            try { // Versuche, trotzdem die aktuelle Version anzuzeigen
                const appVersionOnError = await window.electronAPI.getAppVersion();
                versionBoxTitle.textContent = `Version ${appVersionOnError} (Update-Error)`;
            } catch (error) {
                versionBoxTitle.textContent = 'Unknown version (Update-Error)';
            }
            versionBox.classList.add('update-error'); // Deine CSS-Klasse für Fehler-Rand
            versionBoxSubtitle.textContent = "There was an error while updating";
            break;

        default: // Fallback, sollte eigentlich nicht passieren
            try {
                const appVersionDefault = await window.electronAPI.getAppVersion();
                versionBoxTitle.textContent = `Version ${appVersionDefault}`;
            } catch (error) {
                versionBoxTitle.textContent = 'Unknown version';
            }
            versionBoxSubtitle.textContent = "Click to view the patchnotes";
    }
}

function handleVersionBoxClick() {

    if (availableUpdateInfo) {
        console.log(`Klick auf versionBox. Aktueller Status ist: "${availableUpdateInfo.status}"`);

        switch (availableUpdateInfo.status) {
            case 'available':
                showCustomUpdatePrompt(availableUpdateInfo);
                break;

            case 'downloaded':
                showRestartPrompt(availableUpdateInfo);
                break;

            default:
                console.log(`Klick auf versionBox im Status '${availableUpdateInfo.status}' - keine explizite Aktion definiert.`);
                break;
        }
    } else {
        console.log("Klick auf versionBox, aber kein Update verfügbar. (Hier könnten Patchnotes angezeigt werden)");
    }
}

function showCustomRestartPrompt(updateDetails) {

    if (!messageBox || !messageBoxContent) {
        console.error("MessageBox-Elemente sind nicht verfügbar.");
        return;
    }

    console.log('Zeige Restart-Prompt für Version:', updateDetails.version);

    showModal({
        title: `Update to version ${updateDetails.version} installed`,
        size: 'medium',
        headerButtons: [
            {
                class: 'modal-header-button close-button',
                tooltip: 'Close',
                svg: SVG_CLOSE,
                onClick: (modal) => modal.close()
            }
        ],
        contentTree: {
            tag: 'div',
            props: {
                className: 'patch-notes-content',
                innerHTML: (updateDetails.notes || 'No patchnotes available').replace(/\n/g, '<br>')
            }
        },
        actionButtons: [
            {
                text: 'Later',
                class: 'modal-action-button button-secondary',
                onClick: (modal) => {
                    console.log("Neustart auf 'Später' verschoben.");
                    modal.close();
                }
            },
            {
                text: 'Restart & Install',
                class: 'modal-action-button button-primary',
                onClick: () => {
                    console.log("Sende 'restart-and-install' an den Hauptprozess.");
                    window.electronAPI.send('restart-and-install');
                }
            }
        ]
    });
}

function showCustomUpdatePrompt(updateDetails) {
    if (!showModal) {
        console.error("showModal-Funktion ist nicht verfügbar, kann Prompt nicht anzeigen.");
        return;
    }

    console.log('Zeige "Herunterladen?"-Prompt für Version:', updateDetails.version);

    // Definiere die "Blaupause" für dein Modal
    showModal({
        title: `Update to version ${updateDetails.version} available`,
        size: 'medium',
        
        headerButtons: [
            {
                class: 'modal-header-button close-button',
                tooltip: 'Close',
                svg: SVG_CLOSE,
                onClick: (modal) => modal.close()
            }
        ],

        contentTree: {
            tag: 'div',
            props: {
                className: 'patch-notes-content',
                innerHTML: (updateDetails.notes || 'No patchnotes available').replace(/\n/g, '<br>')
            }
        },

        actionButtons: [
            {
                text: 'Later',
                class: 'modal-action-button button-secondary', // Deine sekundäre Button-Klasse
                onClick: (modal) => modal.close()
            },
            {
                text: 'Download',
                class: 'modal-action-button button-primary',    // Deine primäre Akzent-Button-Klasse
                onClick: (modal) => {
                    // Sende das Signal zum Download an den Hauptprozess
                    window.electronAPI.send('update-download', updateDetails);
                    modal.close();
                }
            }
        ]
    });
}
