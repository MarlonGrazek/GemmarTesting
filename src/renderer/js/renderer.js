import { initializeModalSystem } from "./managers/modal-manager.js";
import { initializeUpdateRenderer } from "./managers/update-manager.js";
import { initializeThemeManager, openThemeManager } from "./managers/theme-manager.js";
import { initializeTestUIManager } from "./managers/test-ui-manager.js";
import { initializeTestRunner, startTestRun } from "./managers/test-run-manager.js";
import TooltipManager from "./managers/tooltip-manager.js";

const SVG_CLOSE = `<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
const SVG_MINIMIZE = `<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="17" y1="12" x2="7" y2="12"></line></svg>`;
const SVG_RESTORE = `<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"><g transform="translate(-2, 2)"><path d="M 7 8 A 1 1 0 0 1 8 7 H 16 A 1 1 0 0 1 17 8 V 16 A 1 1 0 0 1 16 17 H 8 A 1 1 0 0 1 7 16 Z" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M 11 4 A 1 1 0 0 1 12 3 H 20 A 1 1 0 0 1 21 4 V 12 A 1 1 0 0 1 20 13 H 17 L 17 7 L 11 7 L 11 4 Z" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="miter"/></g></svg>`;
const SVG_MAXIMIZE = `<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="12" height="12" rx="1"></rect></svg>`;
const SVG_THEME = `<?xml version="1.0" encoding="iso-8859-1"?><!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools --><svg fill="#000000" height="800px" width="800px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 458.178 458.178" xml:space="preserve"><g><path d="M130.415,277.741C95.083,313.074,45.038,324.723,0,312.697c5.918,22.164,17.568,43.116,34.956,60.504c52.721,52.721,138.198,52.721,190.919,0c26.361-26.36,26.36-69.099,0-95.459C199.514,251.38,156.776,251.38,130.415,277.741z"/><path d="M212.771,234.276c12.728,4.827,24.403,12.338,34.317,22.252c10.077,10.077,17.456,21.838,22.19,34.378l53.47-53.47l-56.568-56.569C245.886,201.161,226.908,220.139,212.771,234.276z"/><path d="M446.462,57.153c-15.621-15.621-40.948-15.621-56.568,0c-5.887,5.887-54.496,54.496-102.501,102.501l56.568,56.569l102.501-102.501C462.083,98.101,462.083,72.774,446.462,57.153z"/></g></svg>`
const SVG_LOGO = `<svg id="svg" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="400" height="400" viewBox="0, 0, 400,400"><g id="svgg" fill="#3c4257"><path class="logo-main" id="path0" d="M143.848 143.883 C 116.554 145.633,93.687 165.875,89.169 192.285 C 83.999 222.510,100.502 250.300,129.102 259.530 C 136.728 261.991,141.417 262.495,156.689 262.498 L 167.773 262.500 167.773 248.549 L 167.773 234.597 156.006 234.511 C 146.282 234.440,143.974 234.372,142.714 234.115 C 126.931 230.906,117.491 219.198,117.491 202.832 C 117.491 190.162,123.351 180.243,133.993 174.898 C 140.180 171.791,142.673 171.535,167.188 171.496 L 178.027 171.479 180.957 166.985 C 182.568 164.513,185.207 160.493,186.820 158.052 C 190.578 152.365,193.808 147.407,195.088 145.361 L 196.096 143.750 170.460 143.785 C 156.360 143.805,144.385 143.849,143.848 143.883 M207.876 149.756 C 205.721 153.059,201.661 159.249,198.854 163.511 C 196.047 167.772,193.750 171.310,193.750 171.371 C 193.750 171.433,204.890 171.505,218.506 171.532 L 243.262 171.582 243.311 217.041 L 243.360 262.500 257.813 262.500 L 272.266 262.500 272.266 216.992 L 272.266 171.484 291.895 171.484 L 311.523 171.484 311.523 157.617 L 311.523 143.750 261.659 143.750 L 211.794 143.750 207.876 149.756 M199.183 202.490 C 192.394 208.694,185.868 214.651,184.680 215.727 L 182.520 217.685 182.569 240.093 L 182.619 262.500 197.169 262.500 L 211.719 262.500 211.719 226.855 C 211.719 207.251,211.675 191.211,211.622 191.211 C 211.568 191.211,205.971 196.287,199.183 202.490 " stroke="none" fill-rule="evenodd"></path><path class="logo-accent" id="path2" d="M157.889 193.799 C 149.390 206.224,141.797 217.398,141.797 217.480 C 141.797 217.534,150.963 217.578,162.165 217.578 L 182.533 217.578 195.699 205.548 C 202.941 198.932,209.485 192.956,210.243 192.269 L 211.621 191.020 185.707 191.018 L 159.793 191.016 157.889 193.799 " stroke="none" fill-rule="evenodd"></path></g></svg>`

let htmlElement,
    minimizeButton, maximizeButton, closeButton,
    themeManagerButton,
    appLogo,
    resultsPlaceholderLogo;

let showModal;

function initializeWindowControls() {
    minimizeButton = document.getElementById('minimizeButton');
    maximizeButton = document.getElementById('maximizeButton');
    closeButton = document.getElementById('closeButton');

    appLogo = document.getElementById('appLogo');
    resultsPlaceholderLogo = document.getElementById('resultsPlaceholderLogo');

    if (appLogo) appLogo.innerHTML = SVG_LOGO;
    if (resultsPlaceholderLogo) resultsPlaceholderLogo.innerHTML = SVG_LOGO;

    if (!window.electronAPI || typeof window.electronAPI.minimizeWindow !== 'function') {
        if (minimizeButton) minimizeButton.style.display = 'none';
        if (maximizeButton) maximizeButton.style.display = 'none';
        if (closeButton) closeButton.style.display = 'none';
        return;
    }

    if (minimizeButton) {
        minimizeButton.innerHTML = SVG_MINIMIZE;
        minimizeButton.addEventListener('click', () => window.electronAPI.minimizeWindow());
    }

    if (maximizeButton) {
        maximizeButton.addEventListener('click', () => window.electronAPI.maximizeWindow());
        if (window.electronAPI.onWindowMaximizeStatusChange) {
            window.electronAPI.onWindowMaximizeStatusChange((isMaximized) => {
                maximizeButton.innerHTML = isMaximized ? SVG_RESTORE : SVG_MAXIMIZE;
                maximizeButton.setAttribute('data-custom-tooltip', isMaximized ? 'Restore' : 'Maximize');
            });
        }
        maximizeButton.innerHTML = SVG_MAXIMIZE;
    }

    if (closeButton) {
        closeButton.innerHTML = SVG_CLOSE;
        closeButton.addEventListener('click', () => window.electronAPI.closeWindow());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    htmlElement = document.documentElement;
    const modalAPI = initializeModalSystem();
    showModal = modalAPI.showModal;
    themeManagerButton = document.getElementById('themeManagerButton');

    if (themeManagerButton) {
        themeManagerButton.innerHTML = SVG_THEME;
        themeManagerButton.addEventListener('click', openThemeManager);
    }

    initializeWindowControls();
    initializeUpdateRenderer({ showModal: showModal });
    initializeThemeManager({ showModal: showModal });
    initializeTestUIManager({ showModal: showModal });
    initializeTestRunner({ showModal });
    initializeTestUIManager({
        showModal: showModal,
        onStartTest: (testConfig, files) => startTestRun(testConfig, files)
    });
    
    TooltipManager.init();
});
