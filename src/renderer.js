// src/renderer.js - Version 8.3 (Rainbow Theme hinzugefügt)
console.log("Renderer.js Version 8.3 (Rainbow Theme) loading...");

import { initializeModalSystem } from "./modal-manager.js";
import { initializeUpdateRenderer } from "./update-renderer.js";

// --- SVG Icons ---
const SVG_CHECK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
const SVG_CROSS = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
const SVG_WARNING = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
const SPINNER_ICON = `<div class="result-icon-placeholder"></div>`;
const SVG_PENCIL = `<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M14.06,9L15,9.94L5.92,19H5V18.08L14.06,9M17.66,3C17.41,3 17.15,3.1 16.96,3.29L15.13,5.12L18.88,8.87L20.71,7.05C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18.17,3.09 17.92,3 17.66,3M14.06,6.19L3,17.25V21H6.75L17.81,9.94L14.06,6.19Z"></path></svg>`;
const SVG_TRASH_FOR_EDIT_VIEW = `<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M7,6H17V19H7V6M9,8V17H11V8H9M13,8V17H15V8H13Z"></path></svg>`;
const SVG_UPLOAD = `<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M9,16V10H5L12,3L19,10H15V16H9M5,20V18H19V20H5Z" /></svg>`;
const SVG_INFO = `<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M10.5,9H13.5V7H10.5Z M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M10.5,17H13.5V11H10.5V17Z" /></svg>`;
const SVG_PIN_MODERN_OUTLINE = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8.5" r="4.5" fill="none" stroke="currentColor" stroke-width="2.5"/><line x1="12" y1="13" x2="12" y2="19.25" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>';
const SVG_PIN_MODERN_FILLED = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="8.5" r="5.75"/><path d="M10.75,13.75v5.25a1.25,1.25 0 0,0 2.5,0v-5.25z"/></svg>';

const UPDATE_INFO_URL = 'https://gist.github.com/MarlonGrazek/6bffda46a3510f9556b9843aba7d6484/raw';

let htmlElement, mainContentWrapper, testListContainer,
    codeUploadSection, selectedTestNameElem, fileUploadInput,
    fileSelectionInfo,
    runTestButton, noTestSelectedError, resultsPageWrapper, runningTestNameElem,
    backToSetupButton, progressBar, progressPercentage, totalTestsCountElem,
    passedTestsCountElem, failedTestsCountElem, warningTestsCountElem,
    testSuitesContainer, messageBox, messageBoxTitle, messageBoxText, messageBoxClose,
    messageBoxContent, modalHeaderButtonsContainer, themeManagerHeaderButtonsContainer,
    customTooltipElement,
    taskBox, taskBoxTitle, taskBoxSubtitle,
    versionBox, versionBoxTitle, versionBoxSubtitle,
    openThemeManagerButton, themeManagerModal, themeManagerDialogTitle,
    themeListSectionView, createThemeSectionView,
    themeNameInput, saveCustomThemeButton,
    themeBrightnessSlider, themeBrightnessValue, deleteThemeInEditViewButton,
    themeAccentColorPicker,
    themeTintIntensitySliderContainer, themeTintIntensitySlider, themeTintIntensityValue,
    themeManager_themeListItems;

let selectedTestConfig = null;
let selectedFiles = null;
let currentCountdownIntervalId = null;
let currentTaskBoxCountdownIntervalId = null;
let latestFetchedUpdateInfo = null;
let javaTestEventListenerUnsubscribe = null;
let pinnedTestId = localStorage.getItem('pinnedTestId');

let totalTestsInPlan = 0;
let passedTests = 0;
let failedTests = 0;
let warningTests = 0;
let currentSuiteElement = null;
let currentSubtestElement = null;
let showModal;

const REF_LIGHTNESS = { DARK: { pageBg: 5.1 }, LIGHT: { pageBg: 96.5 } };
let themes = [
    { name: "Light", type: "predefined", settings: { brightness: REF_LIGHTNESS.LIGHT.pageBg, isGreen: false } },
    { name: "Dark", type: "predefined", settings: { brightness: REF_LIGHTNESS.DARK.pageBg, isGreen: false, tintBackground: true, tintIntensity: 5 } },
    { name: "Black", type: "predefined", settings: { brightness: 0, isGreen: false } },
    { name: "Dark Green", type: "predefined", settings: { brightness: REF_LIGHTNESS.DARK.pageBg, isGreen: true } },
    { name: "Rainbow", type: "predefined", settings: { brightness: REF_LIGHTNESS.LIGHT.pageBg, isGreen: false, isRainbow: true, tintBackground: false, tintIntensity: 0 } } // NEU: Rainbow Theme
];
let activeThemeName = "Light";
const PREDEFINED_THEME_NAMES = ["Light", "Dark", "Black", "Dark Green", "Rainbow"]; // NEU: Rainbow hinzugefügt
const ALL_THEME_CSS_VARIABLES = [
    '--page-background', '--content-wrapper-background', '--content-wrapper-shadow',
    '--text-primary', '--text-secondary', '--text-header-main', '--text-section-header', '--text-on-accent', '--text-codeupload-box', '--text-codeupload-hint', '--text-progress-summary-label', '--text-error',
    '--card-test-background', '--card-test-border', '--card-test-shadow', '--card-test-background-hover', '--card-test-border-hover', '--card-test-shadow-hover', '--card-test-background-selected', '--card-test-border-selected', '--card-test-shadow-selected',
    '--card-info-button-color', '--card-info-button-color-hover',
    '--accent-blue', '--accent-blue-hover', '--accent-blue-text', '--accent-green', '--accent-green-hover', '--accent-green-text',
    '--codeupload-box-background', '--codeupload-box-border',
    '--theme-toggle-background', '--theme-toggle-text', '--theme-toggle-background-hover', '--modal-header-icon-button-hover-bg', '--modal-pin-button-active-color',
    '--results-summary-box-background', '--results-summary-box-border', '--results-summary-box-shadow',
    '--progressbar-background', '--progressbar-fill',
    '--summary-label-total-text', '--summary-label-passed-text', '--summary-label-failed-text', '--summary-label-warning-text', '--summary-number-total-text', '--summary-number-passed-text', '--summary-number-failed-text', '--summary-number-warning-text',
    '--results-suite-card-background', '--results-suite-card-border', '--results-suite-card-shadow', '--results-suite-card-h2-border', '--results-subtest-border-left',
    '--results-item-passed-background', '--results-item-passed-border', '--results-item-passed-text', '--results-item-passed-svg-stroke', '--results-item-failed-background', '--results-item-failed-border', '--results-item-failed-text', '--results-item-failed-svg-stroke', '--results-item-warning-background', '--results-item-warning-border', '--results-item-warning-text', '--results-item-warning-svg-stroke', '--results-item-running-background', '--results-item-running-border', '--results-item-running-text', '--results-item-running-spinner-border-top',
    '--modal-content-background',
    '--modal-content-border',
    // Rainbow spezifische Variablen werden nicht hier gelöscht, da sie im :root nicht global gesetzt werden
];
const BACKGROUND_VARS_TO_TINT = [
    '--page-background',
    '--content-wrapper-background',
    '--card-test-background',
    '--card-test-border',
    '--card-test-background-hover',
    '--card-test-border-hover',
    '--codeupload-box-background',
    '--codeupload-box-border',
    '--results-summary-box-background',
    '--results-summary-box-border',
    '--modal-content-background',
    '--modal-content-border',
    '--results-suite-card-background',
    '--results-suite-card-border',
    '--progressbar-background'
];
const TEXT_VARS_TO_SUBTLY_TINT = [
    '--text-secondary',
    '--text-codeupload-hint',
    '--text-progress-summary-label',
];

function hslToHex(h, s, l) {
    l = Math.max(0, Math.min(100, l));
    s = Math.max(0, Math.min(100, s));
    let l_norm = l / 100;
    const a = s * Math.min(l_norm, 1 - l_norm) / 100;
    const f = n => {
        const k = (n + h / 30) % 12;
        const color = l_norm - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}
function hexToHSL(hex) {
    if (!hex) return { h: 0, s: 0, l: 0 };
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
        r = "0x" + hex[1] + hex[1]; g = "0x" + hex[2] + hex[2]; b = "0x" + hex[3] + hex[3];
    } else if (hex.length === 7) {
        r = "0x" + hex[1] + hex[2]; g = "0x" + hex[3] + hex[4]; b = "0x" + hex[5] + hex[6];
    } else { return { h: 0, s: 0, l: 0 }; }
    r /= 255; g /= 255; b /= 255;
    let cmin = Math.min(r, g, b), cmax = Math.max(r, g, b), delta = cmax - cmin, h = 0, s = 0, l = 0;
    if (delta === 0) h = 0;
    else if (cmax === r) h = ((g - b) / delta) % 6;
    else if (cmax === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
    l = (cmax + cmin) / 2;
    s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
    s = +(s * 100).toFixed(1);
    l = +(l * 100).toFixed(1);
    return { h, s, l };
}

function _applyBackgroundTint(accentColorHex, backgroundTintIntensityPercent) {
    if (!htmlElement) return;
    const currentTheme = themes.find(t => t.name === activeThemeName);
    if (currentTheme && currentTheme.settings.isRainbow) return; // Keine Tönung für Rainbow Theme

    const accentHSL = hexToHSL(accentColorHex);
    if (accentHSL.s < 1 || backgroundTintIntensityPercent < 1) return;

    BACKGROUND_VARS_TO_TINT.forEach(cssVar => {
        const greyscaleBgHex = getComputedStyle(htmlElement).getPropertyValue(cssVar).trim();
        if (greyscaleBgHex) {
            const greyscaleBgHSL = hexToHSL(greyscaleBgHex);
            if (greyscaleBgHSL.s < 15) {
                htmlElement.style.setProperty(cssVar, hslToHex(accentHSL.h, parseFloat(backgroundTintIntensityPercent), greyscaleBgHSL.l));
            }
        }
    });
}
function _applyTextTint(accentColorHex, backgroundTintIntensityPercent) {
    if (!htmlElement) return;
    const currentTheme = themes.find(t => t.name === activeThemeName);
    if (currentTheme && currentTheme.settings.isRainbow) return; // Keine Tönung für Rainbow Theme

    const accentHSL = hexToHSL(accentColorHex);
    if (accentHSL.s < 1 || backgroundTintIntensityPercent < 1) return;
    const textTintSaturation = Math.min(7, backgroundTintIntensityPercent / 4);
    TEXT_VARS_TO_SUBTLY_TINT.forEach(cssVar => {
        const currentGreyHex = getComputedStyle(htmlElement).getPropertyValue(cssVar).trim();
        if (currentGreyHex) {
            const currentGreyHSL = hexToHSL(currentGreyHex);
            if (currentGreyHSL.s < 15) {
                htmlElement.style.setProperty(cssVar, hslToHex(accentHSL.h, textTintSaturation, currentGreyHSL.l));
            }
        }
    });
}
function _updateEditorThemePreview() {
    if (!themeBrightnessSlider || !themeAccentColorPicker || !themeTintIntensitySlider) return;
    const brightness = parseFloat(themeBrightnessSlider.value);
    const accentColor = themeAccentColorPicker.value;
    const tintIntensityPercent = parseFloat(themeTintIntensitySlider.value);

    clearAllThemeClassesAndInlineStyles();
    htmlElement.style.setProperty('--accent-blue', accentColor);
    const accentHSL = hexToHSL(accentColor);
    htmlElement.style.setProperty('--accent-blue-hover', hslToHex(accentHSL.h, accentHSL.s, Math.max(0, accentHSL.l - 10)));
    const textAccentL = accentHSL.l > 60 ? Math.max(0, accentHSL.l - 25) : Math.min(100, accentHSL.l + 35);
    htmlElement.style.setProperty('--accent-blue-text', hslToHex(accentHSL.h, accentHSL.s, textAccentL));
    htmlElement.style.setProperty('--progressbar-fill', accentColor);

    generateAndApplyDynamicThemeColors(brightness);

    _applyBackgroundTint(accentColor, tintIntensityPercent);
    _applyTextTint(accentColor, tintIntensityPercent);
}

function generateAndApplyDynamicThemeColors(baseLightnessValue) {
    if (!document.documentElement) { console.error("documentElement not found"); return; }
    const textSwitchThreshold = 45, hierarchySwitchThreshold = 65, darkStep = 4, lightStep = -3, selectionTintStrength = 0.5;
    const exceptionBoxBorderContrastDark = 12, exceptionBoxBorderContrastLight = 15;
    const baseL = parseFloat(baseLightnessValue);
    const isDarkTextPreferred = baseL >= textSwitchThreshold;
    const useLightModeHierarchy = baseL >= hierarchySwitchThreshold;
    const dynamicColors = {};
    let pageBgL, contentWrapperL, cardL, cardBorderL, exceptionBoxL, exceptionBoxBorderL, modalContentL, modalBorderL;
    const clamp = (val) => Math.max(0, Math.min(100, val));

    if (useLightModeHierarchy) {
        pageBgL = (baseL === 100) ? 98 : baseL;
        contentWrapperL = (baseL === 100) ? 100 : clamp(pageBgL - lightStep * 1.5);
        cardL = clamp(contentWrapperL + lightStep); cardBorderL = clamp(cardL + lightStep * 0.5);
        exceptionBoxL = clamp(cardL + lightStep * 1.2); exceptionBoxBorderL = clamp(exceptionBoxL - exceptionBoxBorderContrastLight);
        modalContentL = contentWrapperL; modalBorderL = cardBorderL;
    } else {
        pageBgL = baseL; contentWrapperL = clamp(pageBgL + darkStep); cardL = clamp(contentWrapperL + darkStep);
        cardBorderL = clamp(cardL + darkStep * 0.7); exceptionBoxL = clamp(contentWrapperL - darkStep * 0.7);
        exceptionBoxBorderL = clamp(exceptionBoxL + exceptionBoxBorderContrastDark);
        modalContentL = contentWrapperL; modalBorderL = cardBorderL;
    }
    dynamicColors['--page-background'] = hslToHex(0, 0, pageBgL);
    dynamicColors['--content-wrapper-background'] = hslToHex(0, 0, contentWrapperL);
    dynamicColors['--card-test-background'] = hslToHex(0, 0, cardL); dynamicColors['--card-test-border'] = hslToHex(0, 0, cardBorderL);
    dynamicColors['--card-test-background-hover'] = hslToHex(0, 0, cardBorderL); dynamicColors['--card-test-border-hover'] = hslToHex(0, 0, cardBorderL);
    dynamicColors['--codeupload-box-background'] = hslToHex(0, 0, exceptionBoxL); dynamicColors['--codeupload-box-border'] = hslToHex(0, 0, exceptionBoxBorderL);
    dynamicColors['--results-summary-box-background'] = hslToHex(0, 0, exceptionBoxL); dynamicColors['--results-summary-box-border'] = hslToHex(0, 0, exceptionBoxBorderL);
    dynamicColors['--modal-content-background'] = hslToHex(0, 0, modalContentL); dynamicColors['--modal-content-border'] = hslToHex(0, 0, modalBorderL);
    const textPrimaryL = isDarkTextPreferred ? 15 : 95, textSecondaryL = isDarkTextPreferred ? 40 : 65;
    dynamicColors['--text-primary'] = hslToHex(0, 0, textPrimaryL);
    dynamicColors['--text-secondary'] = hslToHex(0, 0, textSecondaryL);
    dynamicColors['--text-codeupload-hint'] = hslToHex(0, 0, textSecondaryL + (useLightModeHierarchy ? 5 : -5));
    dynamicColors['--text-progress-summary-label'] = hslToHex(0, 0, textSecondaryL + (useLightModeHierarchy ? -5 : 5));
    dynamicColors['--text-header-main'] = dynamicColors['--text-primary']; dynamicColors['--text-section-header'] = dynamicColors['--text-primary'];

    const rootStyle = getComputedStyle(htmlElement || document.documentElement);
    let currentAccentHex = rootStyle.getPropertyValue('--accent-blue').trim();
    const activeThemeObject = themes.find(t => t.name === activeThemeName);
    if (activeThemeObject && activeThemeObject.settings.isRainbow) {
        // Für Rainbow Theme, --card-test-border-selected wird durch CSS-Klasse gesetzt.
        // Hier setzen wir einen Fallback oder eine nicht-gradient Farbe für --card-test-background-selected,
        // da die JS-Logik einen soliden Hex-Wert erwartet.
        currentAccentHex = '#e0e0e0'; // Ein neutrales Grau als Basis für die HSL-Berechnung
    }
    const accentHSL = hexToHSL(currentAccentHex);

    let selectedBgBaseL = useLightModeHierarchy ? clamp(cardL - 3) : clamp(cardL + 3);
    if (!(activeThemeObject && activeThemeObject.settings.isRainbow)) {
        dynamicColors['--card-test-background-selected'] = hslToHex(accentHSL.h, accentHSL.s * selectionTintStrength, selectedBgBaseL);
        dynamicColors['--card-test-border-selected'] = currentAccentHex;
    }
    dynamicColors['--card-test-shadow-selected'] = 'none';


    dynamicColors['--modal-header-icon-button-hover-bg'] = isDarkTextPreferred ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.18)';
    dynamicColors['--results-suite-card-background'] = hslToHex(0, 0, cardL); dynamicColors['--results-suite-card-border'] = hslToHex(0, 0, cardBorderL);
    dynamicColors['--results-suite-card-h2-border'] = hslToHex(0, 0, cardBorderL);
    dynamicColors['--theme-toggle-background'] = hslToHex(0, 0, isDarkTextPreferred ? 90 : 20); dynamicColors['--theme-toggle-text'] = dynamicColors['--text-primary'];
    dynamicColors['--progressbar-background'] = hslToHex(0, 0, clamp(cardL + (useLightModeHierarchy ? lightStep : darkStep)));

    const isCurrentlyLight = baseL >= textSwitchThreshold;

    const accentHue = accentHSL.h;
    const accentSaturation = accentHSL.s;
    if (!(activeThemeObject && activeThemeObject.settings.isRainbow)) { // Nur anwenden, wenn nicht Rainbow
        dynamicColors['--results-item-passed-background'] = isCurrentlyLight ?
            hslToHex(accentHue, Math.min(accentSaturation, 50), 94) :
            hslToHex(accentHue, Math.min(accentSaturation, 60), 20);
    } else { // Für Rainbow, einen festen, hellen Hintergrund für "passed"
        dynamicColors['--results-item-passed-background'] = isCurrentlyLight ?
            hslToHex(120, 60, 94) : // Sehr helles Grün
            hslToHex(120, 60, 22);  // Dunkles Grün
    }


    const failedHue = 0;
    const failedSaturationLight = 70;
    const failedSaturationDark = 60;
    dynamicColors['--results-item-failed-background'] = isCurrentlyLight ?
        hslToHex(failedHue, failedSaturationLight, 95) :
        hslToHex(failedHue, failedSaturationDark, 18);

    const warningHue = 50;
    const warningSaturationLight = 80;
    const warningSaturationDark = 70;
    dynamicColors['--results-item-warning-background'] = isCurrentlyLight ?
        hslToHex(warningHue, warningSaturationLight, 95) :
        hslToHex(warningHue, warningSaturationDark, 22);

    const infoBaseLightness = isCurrentlyLight ? clamp(cardL + lightStep * 0.8) : clamp(cardL + darkStep * 0.5);
    dynamicColors['--results-item-info-background'] = hslToHex(0, 0, infoBaseLightness);
    dynamicColors['--results-item-running-background'] = hslToHex(0, 0, infoBaseLightness);

    for (const [variable, value] of Object.entries(dynamicColors)) {
        (htmlElement || document.documentElement).style.setProperty(variable, value);
    }
}

function clearAllThemeClassesAndInlineStyles() {
    if (!htmlElement) htmlElement = document.documentElement;
    htmlElement.classList.remove('dark', 'black-theme', 'dark-green-theme', 'rainbow-theme'); // NEU: rainbow-theme entfernt
    ALL_THEME_CSS_VARIABLES.forEach(variable => {
        htmlElement.style.removeProperty(variable);
    });
}
function applyPredefinedTheme(themeName) {
    if (!htmlElement) htmlElement = document.documentElement;
    clearAllThemeClassesAndInlineStyles();

    const theme = themes.find(t => t.name === themeName);
    if (theme && theme.type === "predefined") {
        if (theme.settings.isRainbow) {
            htmlElement.classList.add('rainbow-theme');
        } else if (theme.name === "Dark") {
            htmlElement.classList.add('dark');
        } else if (theme.name === "Black") {
            htmlElement.classList.add('dark', 'black-theme');
        } else if (theme.name === "Dark Green") {
            htmlElement.classList.add('dark', 'dark-green-theme');
        }
        // Basis-Helligkeit anwenden (wird von generateAndApplyDynamicThemeColors genutzt)
        if (theme.settings && typeof theme.settings.brightness === 'number') {
            generateAndApplyDynamicThemeColors(theme.settings.brightness);
        }
    }
    activeThemeName = themeName;
    localStorage.setItem('activeThemeName', activeThemeName);
    localStorage.removeItem('activeCustomTheme');
    if (themeManagerModal && !themeManagerModal.classList.contains('hidden-alt')) renderThemeList();
}
function applyCustomTheme(themeObject, makeActive = true) {
    if (!htmlElement) htmlElement = document.documentElement;
    clearAllThemeClassesAndInlineStyles();

    if (makeActive) {
        activeThemeName = themeObject.name;
        const themeIndex = themes.findIndex(t => t.name === themeObject.name);
        if (themeIndex > -1) themes[themeIndex] = themeObject;
        else themes.push(themeObject);
    }

    let accentColorForTheme = '#3B82F6';
    if (themeObject.colors) {
        if (themeObject.colors['--accent-blue']) {
            htmlElement.style.setProperty('--accent-blue', themeObject.colors['--accent-blue']);
            accentColorForTheme = themeObject.colors['--accent-blue'];
        }
        if (themeObject.colors['--accent-blue-hover']) {
            htmlElement.style.setProperty('--accent-blue-hover', themeObject.colors['--accent-blue-hover']);
        }
        if (themeObject.colors['--accent-blue-text']) {
            htmlElement.style.setProperty('--accent-blue-text', themeObject.colors['--accent-blue-text']);
        }
        htmlElement.style.setProperty('--progressbar-fill', accentColorForTheme);
    }

    generateAndApplyDynamicThemeColors(themeObject.settings.brightness);

    if (themeObject.settings && themeObject.settings.tintBackground && typeof themeObject.settings.tintIntensity === 'number') {
        _applyBackgroundTint(accentColorForTheme, themeObject.settings.tintIntensity);
        _applyTextTint(accentColorForTheme, themeObject.settings.tintIntensity);
    }

    if (makeActive) {
        localStorage.setItem('activeThemeName', activeThemeName);
        localStorage.setItem('activeCustomTheme', JSON.stringify(themeObject));
    }
    if (themeManagerModal && !themeManagerModal.classList.contains('hidden-alt')) renderThemeList();
}
function initializeTheme() {
    htmlElement = document.documentElement;
    const storedActiveThemeName = localStorage.getItem('activeThemeName');
    try {
        const storedCustomThemes = JSON.parse(localStorage.getItem('customThemes')) || [];
        storedCustomThemes.forEach(stored => {
            if (!themes.find(t => t.name === stored.name)) themes.push(stored);
        });
    } catch (e) {
        console.error("Could not parse custom themes from localStorage.", e);
        localStorage.removeItem('customThemes');
    }

    let themeToApplyOnLoad = storedActiveThemeName ? themes.find(t => t.name === storedActiveThemeName) : null;

    if (themeToApplyOnLoad && themeToApplyOnLoad.type === "custom") {
        try {
            const fullCustomTheme = JSON.parse(localStorage.getItem('activeCustomTheme'));
            if (fullCustomTheme && fullCustomTheme.name === storedActiveThemeName) {
                themeToApplyOnLoad = fullCustomTheme;
            } else {
                console.warn("Full custom theme object mismatch or not found, attempting to use stored list version.");
            }
        } catch (e) {
            console.error("Could not parse active custom theme object.", e);
            themeToApplyOnLoad = null;
        }
    }

    if (themeToApplyOnLoad) {
        activeThemeName = storedActiveThemeName;
        if (themeToApplyOnLoad.type === "predefined") applyPredefinedTheme(activeThemeName);
        else if (themeToApplyOnLoad.type === "custom") applyCustomTheme(themeToApplyOnLoad, true);
        else { console.warn(`Theme type for '${activeThemeName}' unknown. Defaulting.`); applyPredefinedTheme("Light"); }
    } else {
        console.warn(`Stored active theme name '${storedActiveThemeName}' not found or no theme stored. Defaulting based on system preference.`);
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        applyPredefinedTheme(prefersDark ? "Dark" : "Light");
    }
}
function openThemeManager() {
    if (themeManagerModal && themeManagerHeaderButtonsContainer && themeManagerDialogTitle) {
        themeManagerHeaderButtonsContainer.innerHTML = '';
        const closeBtn = document.createElement('button');
        closeBtn.className = 'modal-header-button close-button';
        closeBtn.innerHTML = SVG_CROSS;
        closeBtn.dataset.customTooltip = "Schließen";
        closeBtn.addEventListener('click', handleModalCloseOrBack);
        themeManagerHeaderButtonsContainer.appendChild(closeBtn);

        themeManagerDialogTitle.textContent = "Themes verwalten";

        renderThemeList();
        showThemeListView();
        themeManagerModal.classList.remove('hidden-alt');
    } else console.error("themeManagerModal, themeManagerHeaderButtonsContainer oder themeManagerDialogTitle Element nicht gefunden.");
}
function closeThemeManager() {
    if (themeManagerModal) {
        themeManagerModal.classList.add('hidden-alt');
        const activeThemeObj = themes.find(t => t.name === activeThemeName);
        if (activeThemeObj) {
            if (activeThemeObj.type === 'predefined') applyPredefinedTheme(activeThemeObj.name);
            else if (activeThemeObj.type === 'custom') {
                const savedCustomTheme = JSON.parse(localStorage.getItem('activeCustomTheme'));
                if (savedCustomTheme && savedCustomTheme.name === activeThemeObj.name) {
                    applyCustomTheme(savedCustomTheme, true);
                } else {
                    applyCustomTheme(activeThemeObj, true);
                }
            }
            else applyPredefinedTheme("Light");
        } else applyPredefinedTheme("Light");
    } else console.error("themeManagerModal element not found.");
}
function handleModalCloseOrBack() {
    if (createThemeSectionView && !createThemeSectionView.classList.contains('hidden-alt')) {
        showThemeListView();
    } else {
        closeThemeManager();
    }
}
function showCreateThemeView(themeToEdit = null) {
    if (!(themeListSectionView && createThemeSectionView && themeNameInput && themeBrightnessSlider && themeAccentColorPicker && themeTintIntensitySliderContainer && themeTintIntensitySlider && themeTintIntensityValue && saveCustomThemeButton && themeManagerHeaderButtonsContainer && themeManagerDialogTitle)) {
        console.error("Essential elements for createThemeView not found."); return;
    }
    themeListSectionView.classList.add('hidden-alt');
    createThemeSectionView.classList.remove('hidden-alt');

    if (themeManagerDialogTitle) {
        themeManagerDialogTitle.textContent = themeToEdit ? "Theme bearbeiten" : "Neuen Theme erstellen";
    }

    themeManagerHeaderButtonsContainer.innerHTML = '';
    const backButton = document.createElement('button');
    backButton.className = 'modal-header-button close-button';
    backButton.innerHTML = SVG_CROSS;
    backButton.dataset.customTooltip = "Zurück zur Theme-Auswahl";
    backButton.addEventListener('click', showThemeListView);
    themeManagerHeaderButtonsContainer.appendChild(backButton);

    let initialBrightness = 50;
    let initialAccentColor = '#3B82F6';
    let initialTintIntensity = 10;

    clearAllThemeClassesAndInlineStyles();

    const baseThemeForPicker = themeToEdit || themes.find(t => t.name === activeThemeName) || themes.find(t => t.name === "Light");
    if (baseThemeForPicker) {
        if (baseThemeForPicker.type === 'predefined') {
            if (baseThemeForPicker.settings.isRainbow) { // Speziell für Rainbow
                htmlElement.classList.add('rainbow-theme');
            } else if (baseThemeForPicker.name === "Dark") {
                htmlElement.classList.add('dark');
            } else if (baseThemeForPicker.name === "Black") {
                htmlElement.classList.add('dark', 'black-theme');
            } else if (baseThemeForPicker.name === "Dark Green") {
                htmlElement.classList.add('dark', 'dark-green-theme');
            }
        }
    }
    const rootStyle = getComputedStyle(htmlElement || document.documentElement);

    if (themeToEdit) {
        themeNameInput.value = themeToEdit.name;
        themeNameInput.disabled = (themeToEdit.type === "predefined");
        initialBrightness = themeToEdit.settings?.brightness ?? 50;

        if (themeToEdit.type === "custom") {
            initialAccentColor = themeToEdit.colors?.['--accent-blue'] || initialAccentColor;
            initialTintIntensity = themeToEdit.settings?.tintIntensity ?? 0;
        } else { // Predefined theme
            if (themeToEdit.settings.isRainbow) {
                initialAccentColor = '#FF00FF'; // Fallback-Akzent für den Picker, da Rainbow nicht darstellbar
                initialTintIntensity = 0; // Rainbow hat keine Tönung
                themeAccentColorPicker.disabled = true; // Picker deaktivieren für Rainbow
                themeTintIntensitySlider.disabled = true; // Tönungsregler deaktivieren
            } else {
                themeAccentColorPicker.disabled = false;
                themeTintIntensitySlider.disabled = false;
                initialAccentColor = rootStyle.getPropertyValue(themeToEdit.settings.isGreen ? '--accent-green' : '--accent-blue').trim() || initialAccentColor;
                initialTintIntensity = (themeToEdit.settings?.tintBackground && typeof themeToEdit.settings?.tintIntensity === 'number') ? themeToEdit.settings.tintIntensity : 0;
            }
        }
        saveCustomThemeButton.dataset.editingThemeName = themeToEdit.name;
        if (deleteThemeInEditViewButton) {
            deleteThemeInEditViewButton.classList.toggle('hidden-alt', themeToEdit.type !== "custom");
            if (themeToEdit.type === "custom") deleteThemeInEditViewButton.dataset.themeNameToDelete = themeToEdit.name;
            else delete deleteThemeInEditViewButton.dataset.themeNameToDelete;
        }
    } else {
        themeAccentColorPicker.disabled = false; // Sicherstellen, dass Picker bei "Neu" aktiv ist
        themeTintIntensitySlider.disabled = false;
        themeNameInput.value = "";
        themeNameInput.disabled = false;
        const currentActiveThemeForNew = themes.find(t => t.name === activeThemeName);
        if (currentActiveThemeForNew) {
            initialBrightness = currentActiveThemeForNew.settings?.brightness ?? 50;
            if (currentActiveThemeForNew.type === 'custom') {
                initialAccentColor = currentActiveThemeForNew.colors?.['--accent-blue'] || initialAccentColor;
                initialTintIntensity = currentActiveThemeForNew.settings?.tintIntensity ?? 0;
            } else {
                if (currentActiveThemeForNew.settings.isRainbow) {
                    initialAccentColor = '#FF00FF'; // Fallback
                    initialTintIntensity = 0;
                    themeAccentColorPicker.disabled = true;
                    themeTintIntensitySlider.disabled = true;
                } else {
                    initialAccentColor = rootStyle.getPropertyValue(currentActiveThemeForNew.settings.isGreen ? '--accent-green' : '--accent-blue').trim() || initialAccentColor;
                    initialTintIntensity = (currentActiveThemeForNew.settings?.tintBackground && typeof currentActiveThemeForNew.settings?.tintIntensity === 'number') ? currentActiveThemeForNew.settings.tintIntensity : 0;
                }
            }
        }
        delete saveCustomThemeButton.dataset.editingThemeName;
        if (deleteThemeInEditViewButton) deleteThemeInEditViewButton.classList.add('hidden-alt');
    }
    clearAllThemeClassesAndInlineStyles();
    // Wenn das Basisthema Rainbow ist, die Klasse wieder hinzufügen, damit der Editor-Hintergrund stimmt
    if (baseThemeForPicker && baseThemeForPicker.settings && baseThemeForPicker.settings.isRainbow) {
        htmlElement.classList.add('rainbow-theme');
    }


    themeBrightnessSlider.value = initialBrightness;
    themeBrightnessValue.textContent = `${Math.round(initialBrightness)}%`;
    themeAccentColorPicker.value = initialAccentColor;
    themeTintIntensitySlider.value = initialTintIntensity;
    themeTintIntensityValue.textContent = `${initialTintIntensity}%`;
    themeTintIntensitySliderContainer.classList.remove('hidden-alt');

    _updateEditorThemePreview();
}
function showThemeListView() {
    if (themeListSectionView && createThemeSectionView && themeManagerHeaderButtonsContainer && themeManagerDialogTitle) {
        createThemeSectionView.classList.add('hidden-alt');
        themeListSectionView.classList.remove('hidden-alt');

        if (themeManagerDialogTitle) themeManagerDialogTitle.textContent = "Themes verwalten";

        themeManagerHeaderButtonsContainer.innerHTML = '';
        const closeBtn = document.createElement('button');
        closeBtn.className = 'modal-header-button close-button';
        closeBtn.innerHTML = SVG_CROSS;
        closeBtn.dataset.customTooltip = "Schließen";
        closeBtn.addEventListener('click', closeThemeManager);
        themeManagerHeaderButtonsContainer.appendChild(closeBtn);

        const activeThemeObj = themes.find(t => t.name === activeThemeName);
        if (activeThemeObj) {
            if (activeThemeObj.type === 'predefined') applyPredefinedTheme(activeThemeObj.name);
            else {
                const savedCustomTheme = JSON.parse(localStorage.getItem('activeCustomTheme'));
                if (savedCustomTheme && savedCustomTheme.name === activeThemeObj.name) {
                    applyCustomTheme(savedCustomTheme, true);
                } else {
                    applyCustomTheme(activeThemeObj, true);
                }
            }
        } else applyPredefinedTheme("Light");

    } else console.error("One or more elements for showThemeListView not found.");
}
function renderThemeList() {
    if (!themeManager_themeListItems) { console.error("Theme list container (#themeManager_themeListItems) not found."); return; }
    themeManager_themeListItems.innerHTML = '';
    themeManager_themeListItems.classList.add('theme-grid-container');

    let displayThemes = themes.filter(t => t);
    displayThemes.sort((a, b) => {
        if (a.type === 'predefined' && b.type !== 'predefined') return -1;
        if (a.type !== 'predefined' && b.type === 'predefined') return 1;
        return a.name.localeCompare(b.name);
    });

    displayThemes.forEach(theme => {
        const themeItemCard = document.createElement('div');
        themeItemCard.className = 'theme-manager-list-item-card';
        if (theme.name === activeThemeName) themeItemCard.classList.add('active-theme');
        themeItemCard.addEventListener('click', () => {
            if (theme.name === activeThemeName) return;
            if (theme.type === "predefined") applyPredefinedTheme(theme.name);
            else applyCustomTheme(theme, true);
            renderThemeList();
        });

        const themeNameSpan = document.createElement('span');
        themeNameSpan.className = 'theme-name-display';
        themeNameSpan.textContent = theme.name;
        themeItemCard.appendChild(themeNameSpan);

        if (theme.type !== "predefined") {
            const controlsDiv = document.createElement('div');
            controlsDiv.className = 'theme-item-controls';
            const editButton = document.createElement('button');
            editButton.className = "theme-edit-button theme-control-button";
            editButton.innerHTML = SVG_PENCIL;
            editButton.onclick = (e) => { e.stopPropagation(); showCreateThemeView(theme); };
            controlsDiv.appendChild(editButton);
            themeItemCard.appendChild(controlsDiv);
        }
        themeManager_themeListItems.appendChild(themeItemCard);
    });

    const createThemeCard = document.createElement('div');
    createThemeCard.className = 'theme-create-card';
    const createThemeNameSpan = document.createElement('span');
    createThemeNameSpan.className = 'theme-name-display';
    createThemeNameSpan.textContent = "Theme erstellen";
    createThemeCard.appendChild(createThemeNameSpan);
    createThemeCard.addEventListener('click', () => showCreateThemeView(null));
    themeManager_themeListItems.appendChild(createThemeCard);

    if (displayThemes.length === 0 && !themeManager_themeListItems.querySelector('.theme-create-card')) {
        themeManager_themeListItems.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">Keine Themes gefunden.</p>';
    }
}
function handleBrightnessSliderChange() {
    if (themeBrightnessValue && themeBrightnessSlider) {
        themeBrightnessValue.textContent = `${Math.round(parseFloat(themeBrightnessSlider.value))}%`;
    }
    _updateEditorThemePreview();
}

function handleTintIntensityChange() {
    if (!themeTintIntensitySlider || !themeTintIntensityValue) return;
    themeTintIntensityValue.textContent = `${themeTintIntensitySlider.value}%`;
    _updateEditorThemePreview();
}
function saveCustomTheme() {
    if (!themeNameInput || !themeBrightnessSlider || !saveCustomThemeButton || !themeAccentColorPicker || !themeTintIntensitySlider) {
        console.error("Required elements for saving theme not found."); return;
    }
    const name = themeNameInput.value.trim();
    if (!name) { showModalMessage("Fehler", "Bitte gib einen Namen für den Theme ein.", null, null, true, null); return; }

    const editingThemeName = saveCustomThemeButton.dataset.editingThemeName;
    if ((!editingThemeName || (editingThemeName && editingThemeName.toLowerCase() !== name.toLowerCase())) &&
        themes.find(t => t.name.toLowerCase() === name.toLowerCase())) {
        showModalMessage("Fehler", `Ein Theme mit dem Namen "${name}" existiert bereits.`, null, null, true, null); return;
    }

    const brightnessSetting = parseFloat(themeBrightnessSlider.value);
    const chosenAccentColor = themeAccentColorPicker.value;
    const tintIntensityPercent = parseFloat(themeTintIntensitySlider.value);

    const themeToSave = {
        name: name, type: "custom",
        settings: {
            brightness: brightnessSetting,
            isGreen: false,
            tintBackground: tintIntensityPercent > 0,
            tintIntensity: tintIntensityPercent
        },
        colors: {}
    };
    themeToSave.colors['--accent-blue'] = chosenAccentColor;
    const chosenAccentHSL = hexToHSL(chosenAccentColor);
    themeToSave.colors['--accent-blue-hover'] = hslToHex(chosenAccentHSL.h, chosenAccentHSL.s, Math.max(0, chosenAccentHSL.l - 10));
    const textAccentL = chosenAccentHSL.l > 60 ? Math.max(0, chosenAccentHSL.l - 25) : Math.min(100, chosenAccentHSL.l + 35);
    themeToSave.colors['--accent-blue-text'] = hslToHex(chosenAccentHSL.h, chosenAccentHSL.s, textAccentL);

    if (editingThemeName && editingThemeName !== name) {
        themes = themes.filter(t => t.name !== editingThemeName);
    }

    const existingThemeIndex = themes.findIndex(t => t.name === name);
    if (existingThemeIndex !== -1) {
        themes[existingThemeIndex] = themeToSave;
    } else {
        themes.push(themeToSave);
    }

    localStorage.setItem('customThemes', JSON.stringify(themes.filter(t => t.type === 'custom')));
    applyCustomTheme(themeToSave, true);
    showThemeListView();
    showModalMessage("Gespeichert", `Theme "${name}" wurde erfolgreich gespeichert und aktiviert.`, null, null, true, null);
}
function deleteCustomTheme(themeName) {
    if (!themeName) { console.warn("deleteCustomTheme called without a themeName."); return false; }
    const themeToDelete = themes.find(t => t.name === themeName && t.type === 'custom');
    if (!themeToDelete) { console.warn(`Versuch, nicht-existierendes oder vordefiniertes Theme "${themeName}" zu löschen.`); return false; }

    themes = themes.filter(t => t.name !== themeName);
    localStorage.setItem('customThemes', JSON.stringify(themes.filter(t => t.type === 'custom')));
    showModalMessage("Gelöscht", `Theme "${themeName}" wurde entfernt.`, null, null, true, null);

    if (activeThemeName === themeName) {
        applyPredefinedTheme("Light");
    }
    renderThemeList();
    return true;
}
function handleDeleteThemeFromEditView() {
    if (!deleteThemeInEditViewButton) { console.warn("deleteThemeInEditViewButton not found in DOM."); return; }
    const themeName = deleteThemeInEditViewButton.dataset.themeNameToDelete;
    if (themeName && deleteCustomTheme(themeName)) {
        showThemeListView();
    } else {
        console.warn("Kein Theme zum Löschen im Edit-View ausgewählt oder Löschen fehlgeschlagen.");
    }
}

function showModalMessage(titleText, descriptionText, actionButtonElement = null, flagsAndPillContainer = null, showOkButton = false, testIdForPinning = null) {
    if (currentCountdownIntervalId) {
        clearInterval(currentCountdownIntervalId);
        currentCountdownIntervalId = null;
    }
    if (!messageBox || !messageBoxTitle || !messageBoxText || !messageBoxClose || !messageBoxContent || !modalHeaderButtonsContainer) {
        alert(`${titleText}\n\n${descriptionText}`);
        return;
    }

    modalHeaderButtonsContainer.innerHTML = '';

    if (testIdForPinning) {
        const pinButton = document.createElement('button');
        pinButton.className = 'modal-header-button pin-button';
        pinButton.innerHTML = pinnedTestId === testIdForPinning ? SVG_PIN_MODERN_FILLED : SVG_PIN_MODERN_OUTLINE;
        pinButton.classList.toggle('active', pinnedTestId === testIdForPinning);
        pinButton.dataset.customTooltip = pinnedTestId === testIdForPinning ? "Gepinnten Test lösen" : "Diesen Test anpinnen";

        pinButton.addEventListener('click', () => {
            const currentlyDisplayedModalTestId = testIdForPinning;
            let newPinnedTestId = null;

            if (pinnedTestId === currentlyDisplayedModalTestId) {
                localStorage.removeItem('pinnedTestId');
                newPinnedTestId = null;
                pinButton.innerHTML = SVG_PIN_MODERN_OUTLINE;
                pinButton.classList.remove('active');
                pinButton.dataset.customTooltip = "Diesen Test anpinnen";
            } else {
                localStorage.setItem('pinnedTestId', currentlyDisplayedModalTestId);
                newPinnedTestId = currentlyDisplayedModalTestId;
                pinButton.innerHTML = SVG_PIN_MODERN_FILLED;
                pinButton.classList.add('active');
                pinButton.dataset.customTooltip = "Gepinnten Test lösen";
            }
            pinnedTestId = newPinnedTestId;

            if (pinnedTestId && latestFetchedUpdateInfo && latestFetchedUpdateInfo.tests) {
                const testToDisplay = latestFetchedUpdateInfo.tests.find(t => t.id === pinnedTestId);
                updateTaskBox(testToDisplay, true);
            } else {
                updateTaskBox(null, false);
            }
        });
        modalHeaderButtonsContainer.appendChild(pinButton);
    }

    const closeButtonElement = document.createElement('button');
    closeButtonElement.className = 'modal-header-button close-button';
    closeButtonElement.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
    closeButtonElement.dataset.customTooltip = "Schließen";
    closeButtonElement.addEventListener('click', hideModalMessage);
    modalHeaderButtonsContainer.appendChild(closeButtonElement);

    const existingActionButton = messageBoxContent.querySelector('.modal-action-button.submit-solution-button');
    if (existingActionButton) existingActionButton.remove();
    const existingFlagsContainer = messageBoxContent.querySelector('.modal-flags-container');
    if (existingFlagsContainer) existingFlagsContainer.remove();

    messageBoxTitle.innerHTML = `<span id="messageBoxMainTitlePart">${titleText}</span>`;

    if (flagsAndPillContainer && messageBoxTitle.nextSibling) {
        messageBoxContent.insertBefore(flagsAndPillContainer, messageBoxTitle.nextSibling);
    } else if (flagsAndPillContainer) {
        messageBoxContent.insertBefore(flagsAndPillContainer, messageBoxText);
    }

    messageBoxText.innerHTML = `<div class="modal-description-text">${descriptionText}</div>`;

    if (actionButtonElement && messageBoxClose) {
        messageBoxContent.insertBefore(actionButtonElement, messageBoxClose);
    }

    if (messageBoxClose) {
        messageBoxClose.style.display = showOkButton ? 'block' : 'none';
    }

    messageBox.classList.remove('hidden-alt');
}
function hideModalMessage() {
    if (currentCountdownIntervalId) {
        clearInterval(currentCountdownIntervalId);
        currentCountdownIntervalId = null;
    }
    if (messageBox) messageBox.classList.add('hidden-alt');
}

function formatFullDateTime(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString('de-DE', options) + ' Uhr';
}

function formatCountdown(milliseconds) {
    if (milliseconds <= 0) {
        return "Abgelaufen";
    }
    const seconds = Math.floor((milliseconds / 1000) % 60);
    const minutes = Math.floor((milliseconds / (1000 * 60)) % 60);
    const hours = Math.floor((milliseconds / (1000 * 60 * 60)) % 24);
    const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));

    if (days > 0) { return `${days} Tag${days > 1 ? 'e' : ''}`; }
    if (hours > 0) { return `${hours} Std. ${minutes} Min.`; }
    if (minutes > 0) { return `${minutes} Min. ${seconds} Sek.`; }
    return `${seconds} Sek.`;
}

function startCountdownTimer(targetDateString, countdownElementId, isMainDisplay = false) {
    const targetDate = new Date(targetDateString);
    const countdownSpan = document.getElementById(countdownElementId);

    if (!countdownSpan || isNaN(targetDate.getTime())) {
        console.error("Ungültiges Zieldatum oder Countdown-Element nicht gefunden.", targetDateString, countdownElementId);
        if (countdownSpan) countdownSpan.textContent = "Fehler";
        return;
    }

    let intervalIdToClear = isMainDisplay ? currentTaskBoxCountdownIntervalId : currentCountdownIntervalId;
    if (intervalIdToClear) {
        clearInterval(intervalIdToClear);
    }

    countdownSpan.dataset.customTooltip = formatFullDateTime(targetDate);

    function updateTimer() {
        const timeLeft = targetDate.getTime() - new Date().getTime();
        countdownSpan.textContent = formatCountdown(timeLeft);
        if (timeLeft <= 0) {
            let idToClearOnExpiry = isMainDisplay ? currentTaskBoxCountdownIntervalId : currentCountdownIntervalId;
            clearInterval(idToClearOnExpiry);
            if (isMainDisplay) currentTaskBoxCountdownIntervalId = null;
            else currentCountdownIntervalId = null;
        }
    }
    updateTimer();
    if (isMainDisplay) {
        currentTaskBoxCountdownIntervalId = setInterval(updateTimer, 1000);
    } else {
        currentCountdownIntervalId = setInterval(updateTimer, 1000);
    }
}

function parseDescriptionMarkup(text) {
    if (typeof text !== 'string') return '';
    const parts = text.split('```');
    let htmlResult = '';

    for (let i = 0; i < parts.length; i++) {
        let segment = parts[i];
        if (i % 2 === 1) {
            let language = '';
            const firstNewlineIndex = segment.indexOf('\n');

            if (firstNewlineIndex !== -1) {
                const potentialLang = segment.substring(0, firstNewlineIndex).trim();
                if (/^[a-z0-9_-]+$/i.test(potentialLang) && potentialLang.length > 0 && potentialLang.length < 20) {
                    language = potentialLang.toLowerCase();
                    segment = segment.substring(firstNewlineIndex + 1);
                }
            }

            const escapedCode = segment
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');

            htmlResult += `<pre><code${language ? ` class="language-${language}"` : ''}>${escapedCode.trim()}</code></pre>`;
        } else {
            let escapedSegment = segment
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');

            escapedSegment = escapedSegment.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
            escapedSegment = escapedSegment.replace(/\n/g, '<br>');
            htmlResult += escapedSegment;
        }
    }
    return htmlResult;
}

function renderTestCards(testsToRender) {
    if (!testListContainer) { console.error("testListContainer not found."); return; }
    testListContainer.innerHTML = '';
    if (!testsToRender || testsToRender.length === 0) {
        testListContainer.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">Keine Tests verfügbar oder konnten nicht geladen werden.</p>';
        return;
    }
    testsToRender.forEach(test => {
        const card = document.createElement('div'); card.className = 'test-card';
        card.dataset.testId = test.id;

        const titleElem = document.createElement('h3');
        titleElem.textContent = test.title;
        card.appendChild(titleElem);

        const infoButton = document.createElement('button');
        infoButton.className = 'test-card-info-button';
        infoButton.innerHTML = SVG_INFO;
        infoButton.setAttribute('aria-label', `Informationen zu ${test.title}`);
        infoButton.dataset.customTooltip = `Details zu "${test.title}" anzeigen`;
        infoButton.addEventListener('click', (event) => {
            event.stopPropagation();

            const modalTitle = test.title || "Testinformationen";
            const parsedDescription = parseDescriptionMarkup(test.description || "Keine Beschreibung verfügbar.");

            let flagsAndPillContainer = document.createElement('div');
            flagsAndPillContainer.className = 'modal-flags-container';
            let hasContentForFlagsContainer = false;

            if (test.dueDate) {
                const modalCountdownId = `testInfoModalCountdown_${test.id}`;
                const countdownPillElement = document.createElement('span');
                countdownPillElement.id = modalCountdownId;
                countdownPillElement.className = "countdown-pill modal-header-countdown-pill modal-flag-item";
                countdownPillElement.textContent = "Lädt...";
                flagsAndPillContainer.appendChild(countdownPillElement);
                hasContentForFlagsContainer = true;
            }

            if (test.flags && Array.isArray(test.flags) && test.flags.length > 0) {
                test.flags.forEach((flag) => {
                    if (flag.details && flag.title) {
                        const flagElement = document.createElement('span');
                        flagElement.className = 'modal-flag-item';
                        flagElement.textContent = flag.title;
                        flagElement.dataset.customTooltip = flag.details;
                        flagsAndPillContainer.appendChild(flagElement);
                        hasContentForFlagsContainer = true;
                    }
                });
            }
            const finalFlagsAndPillContainer = hasContentForFlagsContainer ? flagsAndPillContainer : null;

            let submissionButtonForModal = null;
            if (test.submissionPage) {
                submissionButtonForModal = document.createElement('button');
                submissionButtonForModal.className = "modal-action-button submit-solution-button";
                submissionButtonForModal.innerHTML = `${SVG_UPLOAD} <span>Lösung Abgeben</span>`;
                submissionButtonForModal.dataset.customTooltip = "Zur Abgabeseite wechseln";
                submissionButtonForModal.addEventListener('click', async (e) => {
                    e.preventDefault();
                    if (window.electronAPI && typeof window.electronAPI.openExternalLink === 'function') {
                        try {
                            await window.electronAPI.openExternalLink(test.submissionPage);
                        } catch (err) {
                            console.error("Fehler beim Öffnen des externen Links über electronAPI:", err);
                            showModalMessage("Fehler", "Der Link konnte nicht geöffnet werden.", null, null, true, null);
                        }
                    } else {
                        window.open(test.submissionPage, '_blank', 'noopener,noreferrer');
                    }
                });
            }

            showModalMessage(modalTitle, parsedDescription, submissionButtonForModal, finalFlagsAndPillContainer, false, test.id);

            if (test.dueDate && flagsAndPillContainer.querySelector(`#testInfoModalCountdown_${test.id}`)) {
                startCountdownTimer(test.dueDate, `testInfoModalCountdown_${test.id}`, false);
            }
        });
        card.appendChild(infoButton);

        card.addEventListener('click', () => handleTestSelection(test, card));
        testListContainer.appendChild(card);
    });
}

function handleTestSelection(testFullConfig, selectedCardElement) {
    selectedTestConfig = testFullConfig;
    document.querySelectorAll('.test-card').forEach(card => card.classList.remove('selected'));
    selectedCardElement.classList.add('selected');
    if (selectedTestNameElem) selectedTestNameElem.textContent = testFullConfig.title;
    if (codeUploadSection) codeUploadSection.classList.remove('hidden-alt');
    if (noTestSelectedError) noTestSelectedError.classList.add('hidden-alt');
    if (codeUploadSection) codeUploadSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (fileSelectionInfo) fileSelectionInfo.textContent = '';
    selectedFiles = null; if (fileUploadInput) fileUploadInput.value = '';
    updateRunTestButtonState();
}

function setupFileUploadListener() {
    if (!fileUploadInput) { console.error("fileUploadInput nicht gefunden."); return; }
    fileUploadInput.addEventListener('change', function (event) {
        if (event.target.files && event.target.files.length > 0) {
            const numFiles = event.target.files.length;
            if (fileSelectionInfo) fileSelectionInfo.textContent = `${numFiles} Datei(en) ausgewählt.`;
            selectedFiles = event.target.files;
        } else {
            if (fileSelectionInfo) fileSelectionInfo.textContent = '';
            selectedFiles = null;
        }
        updateRunTestButtonState();
    });
}

function updateRunTestButtonState() {
    if (runTestButton) {
        runTestButton.disabled = !(selectedTestConfig && selectedFiles && selectedFiles.length > 0);
    }
}

function showResultsPageUI() {
    if (mainContentWrapper) mainContentWrapper.classList.add('hidden-alt');
    if (resultsPageWrapper) {
        resultsPageWrapper.classList.remove('hidden-alt'); resultsPageWrapper.style.opacity = "0";
        setTimeout(() => { if (resultsPageWrapper) resultsPageWrapper.style.opacity = "1"; }, 50);
    }
}

function showHomePageUI() {
    if (resultsPageWrapper) resultsPageWrapper.classList.add('hidden-alt');
    if (mainContentWrapper) {
        mainContentWrapper.classList.remove('hidden-alt'); mainContentWrapper.style.opacity = "0";
        setTimeout(() => { if (mainContentWrapper) mainContentWrapper.style.opacity = "1"; }, 50);
    }
    selectedTestConfig = null;
    if (testListContainer) document.querySelectorAll('.test-card.selected').forEach(card => card.classList.remove('selected'));
    if (codeUploadSection) codeUploadSection.classList.add('hidden-alt');
    if (selectedTestNameElem) selectedTestNameElem.textContent = '';
    if (fileSelectionInfo) fileSelectionInfo.textContent = '';
    if (fileUploadInput) fileUploadInput.value = ''; selectedFiles = null;
    updateRunTestButtonState();

    if (javaTestEventListenerUnsubscribe) {
        javaTestEventListenerUnsubscribe();
        javaTestEventListenerUnsubscribe = null;
        console.log("Java test event listener removed.");
    }
}

function resetResultsStats() {
    totalTestsInPlan = 0;
    passedTests = 0;
    failedTests = 0;
    warningTests = 0;
    currentSuiteElement = null;
    currentSubtestElement = null;
    if (testSuitesContainer) testSuitesContainer.innerHTML = '';
    updateSummaryDisplay();
    if (progressBar) progressBar.style.width = `0%`;
    if (progressPercentage) progressPercentage.textContent = `0%`;
}

function updateSummaryDisplay() {
    if (totalTestsCountElem) totalTestsCountElem.textContent = totalTestsInPlan;
    if (passedTestsCountElem) passedTestsCountElem.textContent = passedTests;
    if (failedTestsCountElem) failedTestsCountElem.textContent = failedTests;
    if (warningTestsCountElem) warningTestsCountElem.textContent = warningTests;

    const executedTestsWithOutcome = passedTests + failedTests + warningTests;
    let overallProgress = 0;
    if (totalTestsInPlan > 0) {
        overallProgress = (executedTestsWithOutcome / totalTestsInPlan) * 100;
    } else if (executedTestsWithOutcome > 0) {
        overallProgress = 100;
    }

    if (progressBar) progressBar.style.width = `${overallProgress}%`;
    if (progressPercentage) progressPercentage.textContent = `${Math.round(overallProgress)}%`;
}

function createResultItem(message, status) {
    const resultItem = document.createElement('div');
    resultItem.className = `result-item ${status}`;
    let iconHtml = '';
    switch (status) {
        case 'passed': iconHtml = SVG_CHECK; break;
        case 'failed': iconHtml = SVG_CROSS; break;
        case 'warning': iconHtml = SVG_WARNING; break;
        case 'running': iconHtml = SPINNER_ICON; break;
        case 'info': iconHtml = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`; break;
        default: iconHtml = '';
    }
    resultItem.innerHTML = `<span class="result-icon">${iconHtml}</span><span class="result-message flex-grow">${message}</span>`;
    return resultItem;
}

function addSuite(suiteName) {
    if (!testSuitesContainer) { console.error("testSuitesContainer not found for addSuite."); return null; }
    const suiteCard = document.createElement('div');
    suiteCard.className = 'result-suite-card';
    const title = document.createElement('h2');
    title.textContent = suiteName;
    suiteCard.appendChild(title);
    const subtestsContainer = document.createElement('div');
    subtestsContainer.className = 'subtests-area';
    suiteCard.appendChild(subtestsContainer);
    testSuitesContainer.appendChild(suiteCard);
    currentSuiteElement = suiteCard;
    currentSubtestElement = null;
    return suiteCard;
}

function addSubtest(subtestName) {
    if (!currentSuiteElement) {
        console.warn("Keine aktive Suite, um Subtest hinzuzufügen. Erstelle Fallback-Suite.");
        addSuite("Unkategorisierte Tests");
        if (!currentSuiteElement) {
            console.error("Konnte auch keine Fallback-Suite erstellen."); return null;
        }
    }
    const subtestDiv = document.createElement('div');
    subtestDiv.className = 'result-subtest';
    const title = document.createElement('h3');
    title.textContent = subtestName;
    subtestDiv.appendChild(title);
    const resultsContainer = document.createElement('div');
    resultsContainer.className = 'result-items-container';
    subtestDiv.appendChild(resultsContainer);

    const subtestsArea = currentSuiteElement.querySelector('.subtests-area');
    if (subtestsArea) {
        subtestsArea.appendChild(subtestDiv);
    } else {
        currentSuiteElement.appendChild(subtestDiv);
    }
    currentSubtestElement = subtestDiv;
    return subtestDiv;
}

function logResult(message, status = 'info') {
    let targetContainer;
    if (currentSubtestElement) {
        targetContainer = currentSubtestElement.querySelector('.result-items-container');
    } else if (currentSuiteElement) {
        targetContainer = currentSuiteElement.querySelector('.subtests-area');
    } else {
        addSuite("Allgemeine Protokolle");
        if (currentSuiteElement) {
            targetContainer = currentSuiteElement.querySelector('.subtests-area');
        } else {
            console.error("Kann Ergebnis nicht loggen: Kein aktives Suite/Subtest-Element und Fallback fehlgeschlagen.");
            return;
        }
    }

    if (!targetContainer) {
        console.error("Zielcontainer für Ergebnisse nicht gefunden in logResult.");
        return;
    }
    targetContainer.appendChild(createResultItem(message, status));

    if (status === 'passed') passedTests++;
    else if (status === 'failed') failedTests++;
    else if (status === 'warning') warningTests++;

    updateSummaryDisplay();
}

function handleJavaTestEvent(eventData) {
    console.log("Java Test Event empfangen:", eventData);

    let statusToLog = 'info';

    if (eventData.event === 'assert') {
        statusToLog = eventData.status ? eventData.status.toLowerCase() : 'failed';
        if (statusToLog === 'pass') statusToLog = 'passed';
        else if (statusToLog === 'fail') statusToLog = 'failed';

        if (statusToLog === 'passed' || statusToLog === 'failed' || statusToLog === 'warning') {
            totalTestsInPlan++;
        }
    } else if (eventData.event === 'log') {
        const levelFromEvent = eventData.level ? eventData.level.toLowerCase() : 'info';
        if (levelFromEvent === 'error') statusToLog = 'failed';
        else if (levelFromEvent === 'warn') statusToLog = 'warning';
        else statusToLog = 'info';
    }

    switch (eventData.event) {
        case 'run_start':
            if (runningTestNameElem && selectedTestConfig) {
                runningTestNameElem.textContent = selectedTestConfig.title;
            }
            updateSummaryDisplay();
            break;
        case 'suite_start':
            addSuite(eventData.name);
            break;
        case 'subtest_start':
            addSubtest(eventData.name);
            break;
        case 'assert':
            logResult(eventData.message, statusToLog);
            break;
        case 'log':
            logResult(eventData.message, statusToLog);
            break;
        case 'run_finish':
            if (progressPercentage) {
                if (totalTestsInPlan > 0 && (passedTests + failedTests + warningTests === totalTestsInPlan)) {
                    if (progressBar) progressBar.style.width = `100%`;
                    progressPercentage.textContent = `100% (${eventData.duration} ms)`;
                } else if (totalTestsInPlan === 0 && (passedTests + failedTests + warningTests > 0)) {
                    totalTestsInPlan = passedTests + failedTests + warningTests;
                    if (progressBar) progressBar.style.width = `100%`;
                    progressPercentage.textContent = `100% (${eventData.duration} ms)`;
                    console.warn("run_finish: totalTestsInPlan war 0, wurde aber basierend auf Ergebnissen korrigiert.");
                } else if (totalTestsInPlan === 0) {
                    if (progressBar) progressBar.style.width = `0%`;
                    progressPercentage.textContent = `Abgeschlossen (${eventData.duration} ms)`;
                } else {
                    progressPercentage.textContent = `Abgeschlossen (${eventData.duration} ms)`;
                }
            }
            updateSummaryDisplay();

            const summaryMessage = `Testlauf für "${selectedTestConfig.title}" beendet.<br>
                                    Ergebnis: ${passedTests} Bestanden, ${failedTests} Fehlgeschlagen, ${warningTests} Warnungen.
                                    (Gesamte gezählte Tests: ${totalTestsInPlan})
                                    <br>Dauer: ${eventData.duration} ms`;
            showModalMessage("Testlauf abgeschlossen", summaryMessage, null, null, true, null);
            break;
        default:
            console.warn("Unbekanntes Java-Test-Event:", eventData);
    }
}

async function startActualTestRun() {
    if (!selectedTestConfig) {
        showModalMessage("Fehler", "Kein Test ausgewählt für den Start.", null, null, true, null);
        return;
    }
    if (!selectedFiles || selectedFiles.length === 0) {
        showModalMessage("Fehler", "Keine Java-Dateien ausgewählt.", null, null, true, null);
        return;
    }

    resetResultsStats();
    if (runningTestNameElem) runningTestNameElem.textContent = selectedTestConfig.title;
    showResultsPageUI();

    const userFilesPromises = Array.from(selectedFiles).map(file => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve({
                name: file.name,
                content: e.target.result
            });
            reader.onerror = (e) => reject(new Error(`Fehler beim Lesen der Datei ${file.name}: ${e}`));
            reader.readAsText(file);
        });
    });

    try {
        const userFileContents = await Promise.all(userFilesPromises);

        if (javaTestEventListenerUnsubscribe) {
            javaTestEventListenerUnsubscribe();
        }
        if (window.electronAPI && typeof window.electronAPI.receive === 'function') {
            javaTestEventListenerUnsubscribe = window.electronAPI.receive('java-test-event', handleJavaTestEvent);
            console.log("Java test event listener registered via electronAPI.");
        } else {
            console.error("window.electronAPI.receive ist nicht verfügbar. Preload-Skript überprüfen.");
            showModalMessage("Fehler", "Interne Kommunikationsschnittstelle nicht bereit.", null, null, true, null);
            return;
        }

        // Stelle sicher, dass userCodeEntryClassFQN (als einfacher Klassenname) und nicht expectedInterfaceName übergeben wird.
        // expectedInterfaceName wird in testConfig beibehalten, falls es für andere Zwecke noch benötigt wird,
        // aber für die Identifizierung der auszuführenden Klasse wird userCodeEntryClassFQN verwendet.
        window.electronAPI.send('run-java-test', {
            userFiles: userFileContents,
            testConfig: {
                testLogicFileUrl: selectedTestConfig.filePath,
                mainTestClassName: selectedTestConfig.mainTestClassName,
                userCodeEntryClassFQN: selectedTestConfig.userCodeEntryClassFQN, // Dies ist der einfache Klassenname
                expectedInterfaceName: selectedTestConfig.expectedInterfaceName // Bleibt für ggf. andere Zwecke erhalten
            }
        });

    } catch (error) {
        console.error("Fehler beim Vorbereiten der Dateien für den Testlauf:", error);
        logResult(`Fehler beim Lesen der hochgeladenen Dateien: ${error.message}`, 'failed');

        if (totalTestsInPlan === 0 && failedTests === 1 && passedTests === 0 && warningTests === 0) {
            totalTestsInPlan = 1;
            updateSummaryDisplay();
        }
        handleJavaTestEvent({ event: 'run_finish', duration: "Vorbereitungsfehler" });
    }
}

function updateTaskBox(testInfo, makeVisible = true) {
    if (!taskBox || !taskBoxTitle || !taskBoxSubtitle) return;

    if (testInfo && makeVisible) {
        taskBoxTitle.textContent = testInfo.title;
        taskBox.classList.remove('hidden-alt');

        if (currentTaskBoxCountdownIntervalId) {
            clearInterval(currentTaskBoxCountdownIntervalId);
            currentTaskBoxCountdownIntervalId = null;
        }
        if (testInfo.dueDate) {
            taskBoxSubtitle.style.display = 'block';
            startCountdownTimer(testInfo.dueDate, 'taskBoxSubtitle', true);
        } else {
            taskBoxSubtitle.textContent = "Kein Fälligkeitsdatum";
            taskBoxSubtitle.removeAttribute('data-custom-tooltip');
        }
    } else {
        taskBoxTitle.textContent = "Keine Aufgabe geladen";
        taskBoxSubtitle.textContent = "--:--";
        taskBox.classList.add('hidden-alt');
        if (currentTaskBoxCountdownIntervalId) {
            clearInterval(currentTaskBoxCountdownIntervalId);
            currentTaskBoxCountdownIntervalId = null;
        }
    }
}

async function handleUpdateCheck() {
    if (taskBox) taskBox.style.pointerEvents = 'none';

    if (taskBoxTitle) taskBoxTitle.textContent = "Lade Aufgabeninfo...";
    if (taskBoxSubtitle) taskBoxSubtitle.textContent = "";
    if (testListContainer) testListContainer.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">Lade verfügbare Tests...</p>';

    try {
        const response = await fetch(UPDATE_INFO_URL, { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`Fehler beim Laden der Manifest-Datei: ${response.status} ${response.statusText}`);
        }
        latestFetchedUpdateInfo = await response.json();
        console.log("Update-Info (manifest.json):", latestFetchedUpdateInfo);

        if (latestFetchedUpdateInfo && Array.isArray(latestFetchedUpdateInfo.tests)) {
            renderTestCards(latestFetchedUpdateInfo.tests);
        } else {
            renderTestCards([]);
            console.warn("Kein 'tests'-Array in den abgerufenen Manifest-Daten gefunden oder Daten sind ungültig.");
        }

        let testToDisplayInitially = null;
        if (latestFetchedUpdateInfo && latestFetchedUpdateInfo.tests && latestFetchedUpdateInfo.tests.length > 0) {
            if (pinnedTestId) {
                testToDisplayInitially = latestFetchedUpdateInfo.tests.find(t => t.id === pinnedTestId);
            }
            if (!testToDisplayInitially && pinnedTestId) {
                console.warn(`Gepinnter Test mit ID "${pinnedTestId}" nicht im Manifest gefunden. Pin wird entfernt.`);
                localStorage.removeItem('pinnedTestId');
                pinnedTestId = null;
            }
        }

        if (testToDisplayInitially) {
            updateTaskBox(testToDisplayInitially, true);
        } else {
            updateTaskBox(null, false);
        }

        if (taskBox) {
            const newDisplay = taskBox.cloneNode(true);
            if (taskBox.parentNode) {
                taskBox.parentNode.replaceChild(newDisplay, taskBox);
            }

            taskBox = newDisplay;
            taskBoxTitle = taskBox.querySelector('#taskBoxTitle');
            taskBoxSubtitle = taskBox.querySelector('#taskBoxSubtitle');

            taskBox.addEventListener('click', () => {
                if (!pinnedTestId && latestFetchedUpdateInfo && latestFetchedUpdateInfo.tests && latestFetchedUpdateInfo.tests.length > 0) {
                    const firstTest = latestFetchedUpdateInfo.tests[0];
                    if (firstTest) {
                        const modalTitleText = firstTest.title || "Aufgabeninformation";
                        const parsedDescription = parseDescriptionMarkup(firstTest.description || "Keine Beschreibung verfügbar.");
                        showModalMessage(modalTitleText, parsedDescription, null, null, false, firstTest.id);
                    } else {
                        showModalMessage("Information", "Keine Tests verfügbar.", null, null, true, null);
                    }
                    return;
                }

                const currentPinnedTest = latestFetchedUpdateInfo?.tests?.find(t => t.id === pinnedTestId);
                if (!currentPinnedTest) {
                    showModalMessage("Fehler", "Gepinnte Aufgabe konnte nicht geladen werden.", null, null, true, null);
                    return;
                }

                const modalTitleText = currentPinnedTest.title || "Aufgabeninformation";
                const parsedDescription = parseDescriptionMarkup(currentPinnedTest.description || "Keine Beschreibung verfügbar.");

                let flagsAndPillContainerForModal = document.createElement('div');
                flagsAndPillContainerForModal.className = 'modal-flags-container';
                let hasContentForFlagsContainer = false;

                if (currentPinnedTest.dueDate) {
                    const modalCountdownId = `defaultTaskModalCountdown_${currentPinnedTest.id}`;
                    const countdownPillElement = document.createElement('span');
                    countdownPillElement.id = modalCountdownId;
                    countdownPillElement.className = "countdown-pill modal-header-countdown-pill modal-flag-item";
                    countdownPillElement.textContent = "Lädt...";
                    flagsAndPillContainerForModal.appendChild(countdownPillElement);
                    hasContentForFlagsContainer = true;
                }

                if (currentPinnedTest.flags && Array.isArray(currentPinnedTest.flags) && currentPinnedTest.flags.length > 0) {
                    currentPinnedTest.flags.forEach((flag) => {
                        if (flag.details && flag.title) {
                            const flagElement = document.createElement('span');
                            flagElement.className = 'modal-flag-item';
                            flagElement.textContent = flag.title;
                            flagElement.dataset.customTooltip = flag.details;
                            flagsAndPillContainerForModal.appendChild(flagElement);
                            hasContentForFlagsContainer = true;
                        }
                    });
                }

                const finalFlagsAndPillContainer = hasContentForFlagsContainer ? flagsAndPillContainerForModal : null;

                let submissionButton = null;
                if (currentPinnedTest.submissionPage) {
                    submissionButton = document.createElement('button');
                    submissionButton.className = "modal-action-button submit-solution-button";
                    submissionButton.innerHTML = `${SVG_UPLOAD} <span>Lösung Abgeben</span>`;
                    submissionButton.dataset.customTooltip = "Zur Abgabeseite wechseln";
                    submissionButton.addEventListener('click', async (event) => {
                        event.preventDefault();
                        if (window.electronAPI && typeof window.electronAPI.openExternalLink === 'function') {
                            try {
                                await window.electronAPI.openExternalLink(currentPinnedTest.submissionPage);
                            } catch (e) {
                                console.error("Fehler beim Öffnen des externen Links über electronAPI:", e);
                                showModalMessage("Fehler", "Der Link konnte nicht geöffnet werden.", null, null, true, null);
                            }
                        } else {
                            window.open(currentPinnedTest.submissionPage, '_blank', 'noopener,noreferrer');
                        }
                    });
                }
                showModalMessage(modalTitleText, parsedDescription, submissionButton, finalFlagsAndPillContainer, false, currentPinnedTest.id);

                if (currentPinnedTest.dueDate && finalFlagsAndPillContainer && finalFlagsAndPillContainer.querySelector(`#defaultTaskModalCountdown_${currentPinnedTest.id}`)) {
                    startCountdownTimer(currentPinnedTest.dueDate, `defaultTaskModalCountdown_${currentPinnedTest.id}`, false);
                }
            });
        }

    } catch (err) {
        console.error("Fehler beim Abrufen oder Verarbeiten der Manifest-Daten:", err);
        let userMessage = "Laden der Informationen fehlgeschlagen.";
        if (err.message.includes("Failed to fetch") || err.message.includes("Netzwerkfehler")) userMessage += " Bitte Internetverbindung prüfen.";
        else if (err instanceof SyntaxError) userMessage += " Ungültiges Datenformat (JSON) vom Server.";
        else userMessage += ` Details: ${err.message.substring(0, 100)}`;

        updateTaskBox(null, false);
        renderTestCards([]);
        if (taskBox) {
            taskBox.addEventListener('click', () => {
                showModalMessage("Fehler", userMessage, null, null, true, null);
            });
        }

    } finally {
        if (taskBox) taskBox.style.pointerEvents = 'auto';
    }
}

function positionCustomTooltip(event) {
    if (!customTooltipElement || !customTooltipElement.classList.contains('visible')) return;
    const offsetX = 15, offsetY = 10;
    let x = event.pageX + offsetX, y = event.pageY + offsetY;
    const tooltipRect = customTooltipElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth, viewportHeight = window.innerHeight;

    if (x + tooltipRect.width > viewportWidth - 10) x = event.pageX - tooltipRect.width - offsetX;
    if (y + tooltipRect.height > viewportHeight - 10) y = event.pageY - tooltipRect.height - offsetY;
    if (x < 10) x = 10;
    if (y < 10) y = 10;

    customTooltipElement.style.left = `${x}px`;
    customTooltipElement.style.top = `${y}px`;
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("Renderer.js: DOMContentLoaded event fired.");

    htmlElement = document.documentElement;
    mainContentWrapper = document.getElementById('mainContentWrapper');
    testListContainer = document.getElementById('testListContainer');
    codeUploadSection = document.getElementById('codeUploadSection');
    selectedTestNameElem = document.getElementById('selectedTestName');
    fileUploadInput = document.getElementById('fileUpload');
    fileSelectionInfo = document.getElementById('fileSelectionInfo');
    runTestButton = document.getElementById('runTestButton');
    noTestSelectedError = document.getElementById('noTestSelectedError');
    resultsPageWrapper = document.getElementById('resultsPageWrapper');
    runningTestNameElem = document.getElementById('runningTestName');
    backToSetupButton = document.getElementById('backToSetupButton');
    progressBar = document.getElementById('progressBar');
    progressPercentage = document.getElementById('progressPercentage');
    totalTestsCountElem = document.getElementById('totalTestsCount');
    passedTestsCountElem = document.getElementById('passedTestsCount');
    failedTestsCountElem = document.getElementById('failedTestsCount');
    warningTestsCountElem = document.getElementById('warningTestsCount');
    testSuitesContainer = document.getElementById('testSuitesContainer');
    messageBox = document.getElementById('messageBox');
    messageBoxTitle = document.getElementById('messageBoxTitle');
    messageBoxContent = document.getElementById('messageBoxContent');
    modalHeaderButtonsContainer = document.getElementById('modalHeaderButtonsContainer');
    themeManagerHeaderButtonsContainer = document.getElementById('themeManagerHeaderButtonsContainer');
    messageBoxText = document.getElementById('messageBoxText');
    messageBoxClose = document.getElementById('messageBoxClose');
    customTooltipElement = document.getElementById('customTooltip');
    taskBox = document.getElementById('taskBox');
    taskBoxTitle = document.getElementById('taskBoxTitle');
    taskBoxSubtitle = document.getElementById('taskBoxSubtitle');
    versionBox = document.getElementById('versionBox');
    versionBoxTitle = document.getElementById('versionBoxTitle');
    versionBoxSubtitle = document.getElementById('versionBoxSubtitle');
    openThemeManagerButton = document.getElementById('openThemeManagerButton');
    themeManagerModal = document.getElementById('themeManagerModal');
    themeManagerDialogTitle = document.getElementById('themeManagerDialogTitle');
    themeListSectionView = document.getElementById('themeListSection');
    createThemeSectionView = document.getElementById('createThemeSection');
    // createThemeTitle = document.getElementById('createThemeTitle'); // Removed
    themeNameInput = document.getElementById('themeNameInput');
    saveCustomThemeButton = document.getElementById('saveCustomThemeButton');
    themeBrightnessSlider = document.getElementById('themeBrightnessSlider');
    themeBrightnessValue = document.getElementById('themeBrightnessValue');
    deleteThemeInEditViewButton = document.getElementById('deleteThemeInEditViewButton');
    themeAccentColorPicker = document.getElementById('themeAccentColorPicker');
    themeTintIntensitySliderContainer = document.getElementById('themeTintIntensitySliderContainer');
    themeTintIntensitySlider = document.getElementById('themeTintIntensitySlider');
    themeTintIntensityValue = document.getElementById('themeTintIntensityValue');
    themeManager_themeListItems = document.getElementById('themeManager_themeListItems');

    const minimizeButton = document.getElementById('customMinimizeBtn');
    const maximizeButton = document.getElementById('customMaximizeBtn');
    const closeButton = document.getElementById('customCloseBtn');

    if (minimizeButton && window.electronAPI && typeof window.electronAPI.minimizeWindow === 'function') {
        minimizeButton.addEventListener('click', () => {
            window.electronAPI.minimizeWindow();
        });
    } else if (!minimizeButton) {
        console.warn("Minimieren-Button nicht gefunden.");
    }

    if (maximizeButton && window.electronAPI && typeof window.electronAPI.maximizeWindow === 'function') {
        maximizeButton.addEventListener('click', () => {
            window.electronAPI.maximizeWindow();
        });
    } else if (!maximizeButton) {
        console.warn("Maximieren-Button nicht gefunden.");
    }

    if (closeButton && window.electronAPI && typeof window.electronAPI.closeWindow === 'function') {
        closeButton.addEventListener('click', () => {
            window.electronAPI.closeWindow();
        });
    } else if (!closeButton) {
        console.warn("Schließen-Button (Fenstersteuerung) nicht gefunden.");
    }
    if (!window.electronAPI || typeof window.electronAPI.minimizeWindow !== 'function') {
        console.error("Fenstersteuerungs-API (electronAPI) ist nicht vollständig verfügbar. Preload-Skript überprüfen.");
    }

    const modalAPI = initializeModalSystem();
    showModal = modalAPI.showModal;

    if (customTooltipElement) {
        document.body.addEventListener('mouseover', (event) => {
            const targetWithTooltip = event.target.closest('[data-custom-tooltip]');
            if (targetWithTooltip) {
                const tooltipText = targetWithTooltip.dataset.customTooltip;
                if (tooltipText) {
                    customTooltipElement.innerHTML = tooltipText.replace(/\n/g, '<br>');
                    customTooltipElement.classList.add('visible');
                    positionCustomTooltip(event);
                }
            }
        });
        document.body.addEventListener('mouseout', (event) => {
            const targetWithTooltip = event.target.closest('[data-custom-tooltip]');
            if (targetWithTooltip || event.target === customTooltipElement) {
                if (customTooltipElement.classList.contains('visible')) {
                    customTooltipElement.classList.remove('visible');
                }
            }
        });
        document.body.addEventListener('mousemove', (event) => {
            if (customTooltipElement.classList.contains('visible')) {
                positionCustomTooltip(event);
            }
        });
    }

    if (messageBoxClose) messageBoxClose.addEventListener('click', hideModalMessage);
    if (backToSetupButton) backToSetupButton.addEventListener('click', showHomePageUI);
    if (openThemeManagerButton) openThemeManagerButton.addEventListener('click', openThemeManager);
    if (saveCustomThemeButton) saveCustomThemeButton.addEventListener('click', saveCustomTheme);
    if (themeBrightnessSlider) themeBrightnessSlider.addEventListener('input', handleBrightnessSliderChange);
    if (themeAccentColorPicker) themeAccentColorPicker.addEventListener('input', _updateEditorThemePreview);
    if (themeTintIntensitySlider) themeTintIntensitySlider.addEventListener('input', handleTintIntensityChange);
    if (deleteThemeInEditViewButton) deleteThemeInEditViewButton.addEventListener('click', handleDeleteThemeFromEditView);
    if (runTestButton) runTestButton.addEventListener('click', startActualTestRun);

    initializeTheme();
    handleUpdateCheck();
    setupFileUploadListener();
    updateRunTestButtonState();
    initializeUpdateRenderer({ showModal: showModal });

    console.log("Renderer.js: Initial setup in DOMContentLoaded finished.");
});
