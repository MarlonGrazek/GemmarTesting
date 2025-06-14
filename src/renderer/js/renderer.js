import { initializeModalSystem } from "./managers/modal-manager.js";
import { initializeUpdateRenderer } from "./managers/update-manager.js";
import { initializeThemeManager, openThemeManager } from "./managers/theme-manager.js";
import { initializeTestUIManager } from "./managers/test-ui-manager.js";
import { initializeTestRunner, startTestRun } from "./managers/test-run-manager.js";

const SVG_CLOSE = `<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
const SVG_MINIMIZE = `<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="17" y1="12" x2="7" y2="12"></line></svg>`;
const SVG_RESTORE = `<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"><g transform="translate(-2, 2)"><path d="M 7 8 A 1 1 0 0 1 8 7 H 16 A 1 1 0 0 1 17 8 V 16 A 1 1 0 0 1 16 17 H 8 A 1 1 0 0 1 7 16 Z" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M 11 4 A 1 1 0 0 1 12 3 H 20 A 1 1 0 0 1 21 4 V 12 A 1 1 0 0 1 20 13 H 17 L 17 7 L 11 7 L 11 4 Z" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="miter"/></g></svg>`;
const SVG_MAXIMIZE = `<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="12" height="12" rx="1"></rect></svg>`;

let htmlElement,
    minimizeButton, maximizeButton, closeButton,
    themeManagerButton,

    customTooltip;

let showModal;

function initializeWindowControls() {
    minimizeButton = document.getElementById('minimizeButton');
    maximizeButton = document.getElementById('maximizeButton');
    closeButton = document.getElementById('closeButton');

    if (!window.electronAPI || typeof window.electronAPI.minimizeWindow !== 'function') {
        console.error("Fenstersteuerungs-API (electronAPI) ist nicht vollständig verfügbar. Preload-Skript überprüfen.");
        // Optional: Wenn die API nicht verfügbar ist, können Sie die Buttons im UI ausblenden oder deaktivieren.
        if (minimizeButton) minimizeButton.style.display = 'none';
        if (maximizeButton) maximizeButton.style.display = 'none';
        if (closeButton) closeButton.style.display = 'none';
        return; // Funktion beenden, da die API nicht nutzbar ist
    }

    // Event-Listener für den Minimieren-Button
    if (minimizeButton) { // Prüfen, ob der Button im HTML gefunden wurde
        minimizeButton.innerHTML = SVG_MINIMIZE;
        minimizeButton.addEventListener('click', () => {
            window.electronAPI.minimizeWindow(); // Aufruf der Funktion im Main-Prozess
        });
    } else {
        console.warn("Minimize-Button (ID: 'minimizeButton') nicht gefunden. Bitte HTML überprüfen.");
    }

    // Event-Listener für den Maximieren/Wiederherstellen-Button
    if (maximizeButton) {
        maximizeButton.addEventListener('click', () => {
            window.electronAPI.maximizeWindow(); // Aufruf der Funktion im Main-Prozess
        });

        if(window.electronAPI.onWindowMaximizeStatusChange) {
            window.electronAPI.onWindowMaximizeStatusChange((isMaximized) => {
                if(isMaximized) {
                    maximizeButton.innerHTML = SVG_RESTORE;
                    maximizeButton.setAttribute('data-custom-tooltip', 'Restore');
                } else {
                    maximizeButton.innerHTML = SVG_MAXIMIZE;
                    maximizeButton.setAttribute('data-custom-tooltip', 'Maximize');
                }
            })
        }

        maximizeButton.innerHTML = SVG_MAXIMIZE;

    } else {
        console.warn("Maximize-Button (ID: 'maximizeButton') nicht gefunden. Bitte HTML überprüfen.");
    }

    // Event-Listener für den Schließen-Button
    if (closeButton) {
        closeButton.innerHTML = SVG_CLOSE;
        closeButton.addEventListener('click', () => {
            window.electronAPI.closeWindow(); // Aufruf der Funktion im Main-Prozess
        });
    } else {
        console.warn("Close-Button (ID: 'closeButton') nicht gefunden. Bitte HTML überprüfen.");
    }

    console.log("Fenstersteuerungs-Buttons initialisiert.");
}

function initializeCustomTooltip() {

    customTooltip = document.getElementById('customTooltip');

    if (customTooltip) {
        document.body.addEventListener('mouseover', (event) => {
            const targetWithTooltip = event.target.closest('[data-custom-tooltip]');
            if (targetWithTooltip) {
                const tooltipText = targetWithTooltip.dataset.customTooltip;
                if (tooltipText) {
                    customTooltip.innerHTML = tooltipText.replace(/\n/g, '<br>');
                    customTooltip.classList.add('visible');
                    positionCustomTooltip(event);
                }
            }
        });
        document.body.addEventListener('mouseout', (event) => {
            const targetWithTooltip = event.target.closest('[data-custom-tooltip]');
            if (targetWithTooltip || event.target === customTooltip) {
                if (customTooltip.classList.contains('visible')) {
                    customTooltip.classList.remove('visible');
                }
            }
        });
        document.body.addEventListener('mousemove', (event) => {
            if (customTooltip.classList.contains('visible')) {
                positionCustomTooltip(event);
            }
        });
    }

}

function positionCustomTooltip(event) {
    if (!customTooltip || !customTooltip.classList.contains('visible')) return;
    const offsetX = 15, offsetY = 10;
    let x = event.pageX + offsetX, y = event.pageY + offsetY;
    const tooltipRect = customTooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth, viewportHeight = window.innerHeight;

    if (x + tooltipRect.width > viewportWidth - 10) x = event.pageX - tooltipRect.width - offsetX;
    if (y + tooltipRect.height > viewportHeight - 10) y = event.pageY - tooltipRect.height - offsetY;
    if (x < 10) x = 10;
    if (y < 10) y = 10;

    customTooltip.style.left = `${x}px`;
    customTooltip.style.top = `${y}px`;
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("Renderer.js: DOMContentLoaded event fired.");

    htmlElement = document.documentElement;

    const modalAPI = initializeModalSystem();
    showModal = modalAPI.showModal;

    themeManagerButton = document.getElementById('themeManagerButton');

    if (themeManagerButton) themeManagerButton.addEventListener('click', openThemeManager);

    initializeWindowControls();
    initializeUpdateRenderer({ showModal: showModal });
    initializeThemeManager({ showModal: showModal });
    initializeTestUIManager({ showModal: showModal });
    initializeTestRunner({ showModal });
    initializeTestUIManager({
        showModal: showModal,
        onStartTest: (testConfig, files) => startTestRun(testConfig, files)
    });
    initializeCustomTooltip();

    console.log("Renderer.js: Initiales Setup in DOMContentLoaded abgeschlossen.");
});