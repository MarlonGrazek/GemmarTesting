import { initializeModalSystem } from "./managers/modal-manager.js";
import { initializeUpdateRenderer } from "./managers/update-manager.js";
import { initializeThemeManager, openThemeManager } from "./managers/theme-manager.js";
import { initializeTestUIManager } from "./managers/test-ui-manager.js";
import { initializeTestRunner, startTestRun } from "./managers/test-run-manager.js";

const SVG_CLOSE = `<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
const SVG_MINIMIZE = `<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="17" y1="12" x2="7" y2="12"></line></svg>`;
const SVG_RESTORE = `<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"><g transform="translate(-2, 2)"><path d="M 7 8 A 1 1 0 0 1 8 7 H 16 A 1 1 0 0 1 17 8 V 16 A 1 1 0 0 1 16 17 H 8 A 1 1 0 0 1 7 16 Z" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M 11 4 A 1 1 0 0 1 12 3 H 20 A 1 1 0 0 1 21 4 V 12 A 1 1 0 0 1 20 13 H 17 L 17 7 L 11 7 L 11 4 Z" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="miter"/></g></svg>`;
const SVG_MAXIMIZE = `<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="12" height="12" rx="1"></rect></svg>`;
const SVG_LOGO = `<svg id="svg" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="400" height="400" viewBox="0, 0, 400,400"><g id="svgg">
  <path class="logo-main" id="path0" d="M143.848 143.883 C 116.554 145.633,93.687 165.875,89.169 192.285 C 83.999 222.510,100.502 250.300,129.102 259.530 C 136.728 261.991,141.417 262.495,156.689 262.498 L 167.773 262.500 167.773 248.549 L 167.773 234.597 156.006 234.511 C 146.282 234.440,143.974 234.372,142.714 234.115 C 126.931 230.906,117.491 219.198,117.491 202.832 C 117.491 190.162,123.351 180.243,133.993 174.898 C 140.180 171.791,142.673 171.535,167.188 171.496 L 178.027 171.479 180.957 166.985 C 182.568 164.513,185.207 160.493,186.820 158.052 C 190.578 152.365,193.808 147.407,195.088 145.361 L 196.096 143.750 170.460 143.785 C 156.360 143.805,144.385 143.849,143.848 143.883 M207.876 149.756 C 205.721 153.059,201.661 159.249,198.854 163.511 C 196.047 167.772,193.750 171.310,193.750 171.371 C 193.750 171.433,204.890 171.505,218.506 171.532 L 243.262 171.582 243.311 217.041 L 243.360 262.500 257.813 262.500 L 272.266 262.500 272.266 216.992 L 272.266 171.484 291.895 171.484 L 311.523 171.484 311.523 157.617 L 311.523 143.750 261.659 143.750 L 211.794 143.750 207.876 149.756 M199.183 202.490 C 192.394 208.694,185.868 214.651,184.680 215.727 L 182.520 217.685 182.569 240.093 L 182.619 262.500 197.169 262.500 L 211.719 262.500 211.719 226.855 C 211.719 207.251,211.675 191.211,211.622 191.211 C 211.568 191.211,205.971 196.287,199.183 202.490 " stroke="none" fill-rule="evenodd"></path>
  <path class="logo-accent" id="path2" d="M157.889 193.799 C 149.390 206.224,141.797 217.398,141.797 217.480 C 141.797 217.534,150.963 217.578,162.165 217.578 L 182.533 217.578 195.699 205.548 C 202.941 198.932,209.485 192.956,210.243 192.269 L 211.621 191.020 185.707 191.018 L 159.793 191.016 157.889 193.799 " stroke="none" fill-rule="evenodd"></path>  
  <path id="path3" d="M107.411 159.131 L 106.738 159.863 107.471 159.190 C 108.152 158.564,108.293 158.398,108.144 158.398 C 108.111 158.398,107.782 158.728,107.411 159.131 M105.268 161.084 L 104.004 162.402 105.322 161.138 C 106.047 160.443,106.641 159.850,106.641 159.820 C 106.641 159.676,106.442 159.859,105.268 161.084 M103.020 163.525 L 102.051 164.551 103.076 163.582 C 103.640 163.048,104.102 162.587,104.102 162.556 C 104.102 162.410,103.921 162.573,103.020 163.525 M126.265 180.518 L 124.512 182.324 126.318 180.570 C 127.996 178.942,128.214 178.711,128.072 178.711 C 128.043 178.711,127.230 179.524,126.265 180.518 M126.367 225.684 C 127.276 226.597,128.063 227.344,128.116 227.344 C 128.170 227.344,127.471 226.597,126.563 225.684 C 125.654 224.771,124.867 224.023,124.813 224.023 C 124.760 224.023,125.459 224.771,126.367 225.684 M103.320 243.262 C 103.904 243.853,104.425 244.336,104.479 244.336 C 104.533 244.336,104.099 243.853,103.516 243.262 C 102.932 242.671,102.411 242.188,102.357 242.188 C 102.303 242.188,102.737 242.671,103.320 243.262 M105.078 245.215 C 105.443 245.591,105.785 245.898,105.838 245.898 C 105.892 245.898,105.638 245.591,105.273 245.215 C 104.909 244.839,104.567 244.531,104.513 244.531 C 104.460 244.531,104.714 244.839,105.078 245.215 M107.031 246.973 C 107.615 247.563,108.136 248.047,108.190 248.047 C 108.243 248.047,107.810 247.563,107.227 246.973 C 106.643 246.382,106.122 245.898,106.068 245.898 C 106.014 245.898,106.448 246.382,107.031 246.973 " stroke="none" fill="#8c8c8c" fill-rule="evenodd"></path>
  <path id="path4" d="M209.755 192.725 L 209.082 193.457 209.814 192.784 C 210.496 192.157,210.637 191.992,210.488 191.992 C 210.455 191.992,210.125 192.322,209.755 192.725 M207.607 194.678 L 206.934 195.410 207.666 194.737 C 208.348 194.111,208.488 193.945,208.339 193.945 C 208.306 193.945,207.977 194.275,207.607 194.678 M205.263 196.826 L 204.590 197.559 205.322 196.886 C 206.004 196.259,206.144 196.094,205.995 196.094 C 205.963 196.094,205.633 196.423,205.263 196.826 M203.114 198.779 L 202.441 199.512 203.174 198.839 C 203.856 198.212,203.996 198.047,203.847 198.047 C 203.814 198.047,203.485 198.376,203.114 198.779 M200.771 200.928 L 200.098 201.660 200.830 200.987 C 201.512 200.361,201.652 200.195,201.503 200.195 C 201.471 200.195,201.141 200.525,200.771 200.928 M198.622 202.881 L 197.949 203.613 198.682 202.940 C 199.363 202.314,199.504 202.148,199.355 202.148 C 199.322 202.148,198.992 202.478,198.622 202.881 M196.279 205.029 L 195.605 205.762 196.338 205.089 C 197.020 204.462,197.160 204.297,197.011 204.297 C 196.978 204.297,196.649 204.626,196.279 205.029 M194.130 206.982 L 193.457 207.715 194.189 207.042 C 194.871 206.415,195.012 206.250,194.863 206.250 C 194.830 206.250,194.500 206.580,194.130 206.982 M191.786 209.131 L 191.113 209.863 191.846 209.190 C 192.527 208.564,192.668 208.398,192.519 208.398 C 192.486 208.398,192.157 208.728,191.786 209.131 M189.443 211.279 L 188.770 212.012 189.502 211.339 C 190.184 210.712,190.324 210.547,190.175 210.547 C 190.142 210.547,189.813 210.876,189.443 211.279 M187.198 213.330 L 186.426 214.160 187.256 213.388 C 188.028 212.670,188.176 212.500,188.028 212.500 C 187.996 212.500,187.622 212.874,187.198 213.330 M184.950 215.381 L 184.277 216.113 185.010 215.440 C 185.691 214.814,185.832 214.648,185.683 214.648 C 185.650 214.648,185.321 214.978,184.950 215.381 " stroke="none" fill="#8994d1" fill-rule="evenodd"></path></g></svg>`

let htmlElement,
    minimizeButton, maximizeButton, closeButton,
    themeManagerButton,
    appLogo,
    customTooltip;

let showModal;

function initializeWindowControls() {
    minimizeButton = document.getElementById('minimizeButton');
    maximizeButton = document.getElementById('maximizeButton');
    closeButton = document.getElementById('closeButton');

    appLogo = document.getElementById('appLogo');

    if(appLogo) {
        appLogo.innerHTML = SVG_LOGO;
    } else console.log('App-Logo not found');

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