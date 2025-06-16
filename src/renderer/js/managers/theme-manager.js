console.log("theme-renderer.js wird geladen...");

import ModalManager from "./modal-manager.js";

const predefinedThemes = [
    {
        name: 'Light',
        isEditable: false,
        settings: {
            brightness: 100,
            accentColor: '#3B82F6',
            tintIntensity: 0
        }
    },
    {
        name: 'Dark',
        isEditable: false,
        settings: {
            brightness: 5.0,
            accentColor: '#3B82F6',
            tintIntensity: 20
        }
    },
];

let activeThemeName = 'Light';

export function initializeThemeManager() {

    console.log("Theme Manager wird initialisiert (Version mit Kompatibilitäts-Brücke)...");

    // 1. Alle verfügbaren Themes zusammenstellen (wie bisher)
    let allThemes = [...predefinedThemes];
    try {
        const customThemes = JSON.parse(localStorage.getItem('customThemes')) || [];
        allThemes.push(...customThemes);
    } catch (e) {
        console.error("Fehler beim Laden der benutzerdefinierten Themes aus dem localStorage.", e);
        localStorage.removeItem('customThemes');
    }

    // 2. Namen des aktiven Themes ermitteln (wie bisher)
    const storedThemeName = localStorage.getItem('activeThemeName');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const defaultThemeName = systemPrefersDark ? 'Dark' : 'Light';
    const targetThemeName = storedThemeName || defaultThemeName;

    // 3. Das vollständige Theme-Objekt anhand des Namens finden (wie bisher)
    let themeToApply = allThemes.find(t => t.name === targetThemeName);

    // Fallback (wie bisher)
    if (!themeToApply) {
        console.warn(`Gespeichertes Theme "${targetThemeName}" wurde nicht gefunden. Fallback.`);
        themeToApply = allThemes.find(t => t.name === defaultThemeName) || allThemes[0];
    }

    // 4. Theme anwenden - JETZT MIT DER KORREKTUR
    if (themeToApply) {
        // --- DAS IST DER KERN DER LÖSUNG ---
        // Wir erstellen ein neues, sauberes "settings"-Objekt für unsere Palette.
        // Es kombiniert die neuen und alten Datenstrukturen.
        const settingsForPalette = { ...themeToApply.settings };

        // Wir prüfen, ob es sich um ein Custom Theme handelt, das nach dem ALTEN Muster gespeichert wurde
        // (d.h. die Farbe steckt in einem separaten .colors Objekt).
        if (themeToApply.type === 'custom' && themeToApply.colors && themeToApply.colors['--accent-blue']) {
            console.log(`Altes Custom-Theme-Format erkannt für "${themeToApply.name}". Lese Akzentfarbe aus .colors['--accent-blue'].`);
            // Wir fügen die Akzentfarbe dem settings-Objekt hinzu, damit generateColorPalette sie findet.
            settingsForPalette.accentColor = themeToApply.colors['--accent-blue'];
        }
        // Für vordefinierte Themes ist settingsForPalette.accentColor bereits korrekt gesetzt.

        // Ab hier läuft alles wie geplant.
        activeThemeName = themeToApply.name;
        console.log(`Wende initiales Theme an: "${activeThemeName}"`);

        // Wir übergeben das NORMALISIERTE settings-Objekt an die Palette.
        const generatedPalette = generateColorPalette(settingsForPalette);

        applyColors(generatedPalette);
        localStorage.setItem('activeThemeName', activeThemeName);

    } else {
        console.error("Konnte kein valides Theme zum Anwenden finden.");
        return;
    }

    console.log("Theme Manager erfolgreich initialisiert.");
}

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
        r = "0x" + hex[1] + hex[1];
        g = "0x" + hex[2] + hex[2];
        b = "0x" + hex[3] + hex[3];
    } else if (hex.length === 7) {
        r = "0x" + hex[1] + hex[2];
        g = "0x" + hex[3] + hex[4];
        b = "0x" + hex[5] + hex[6];
    } else {
        return { h: 0, s: 0, l: 0 };
    }
    r /= 255;
    g /= 255;
    b /= 255;
    let cmin = Math.min(r, g, b),
        cmax = Math.max(r, g, b),
        delta = cmax - cmin,
        h = 0, s = 0, l = 0;

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

function generateColorPalette(settings) {
    const { brightness, accentColor, tintIntensity } = settings;
    const colors = {};

    const isLight = brightness > 50;
    const clamp = (val) => Math.max(0, Math.min(100, val));

    // --- 1. Survaces + Hover ---
    const SURFACE_STEP = 4;
    const surfacePage_L = brightness;
    const surfacePrimary_L = clamp(surfacePage_L + (isLight ? -SURFACE_STEP : SURFACE_STEP));
    const surfaceSecondary_L = clamp(surfacePrimary_L + (isLight ? -SURFACE_STEP : SURFACE_STEP));
    const surfaceInset_L = clamp(surfacePage_L + (isLight ? -SURFACE_STEP * 1.5 : SURFACE_STEP / 2));
    const surfaceSecondaryHover_L = clamp(surfaceSecondary_L + (isLight ? -5 : 5));

    colors['--surface-page'] = hslToHex(0, 0, surfacePage_L);
    colors['--surface-primary'] = hslToHex(0, 0, surfacePrimary_L);
    colors['--surface-secondary'] = hslToHex(0, 0, surfaceSecondary_L);
    colors['--surface-inset'] = hslToHex(0, 0, surfaceInset_L);
    colors['--surface-secondary-hover'] = hslToHex(0, 0, surfaceSecondaryHover_L);

    // --- 2. Text Colors ---
    const TEXT_PRIMARY_CONTRAST = 75;
    const TEXT_SECONDARY_CONTRAST = 45;
    const TEXT_SUBTLE_CONTRAST = 25;
    const textPrimary_L = clamp(surfacePrimary_L + (isLight ? -TEXT_PRIMARY_CONTRAST : TEXT_PRIMARY_CONTRAST));
    const textSecondary_L = clamp(surfacePrimary_L + (isLight ? -TEXT_SECONDARY_CONTRAST : TEXT_SECONDARY_CONTRAST));
    const textSubtle_L = clamp(surfacePrimary_L + (isLight ? -TEXT_SUBTLE_CONTRAST : TEXT_SUBTLE_CONTRAST));

    colors['--text-primary'] = hslToHex(0, 0, textPrimary_L);
    colors['--text-secondary'] = hslToHex(0, 0, textSecondary_L);
    colors['--text-subtle'] = hslToHex(0, 0, textSubtle_L);
    colors['--text-on-accent'] = '#FFFFFF';

    // --- 3. Borders + Hover ---
    const BORDER_CONTRAST = 5;
    const borderSubtle_L = clamp(surfaceSecondary_L + (isLight ? -BORDER_CONTRAST : BORDER_CONTRAST));
    const borderDivider_L = clamp(surfacePrimary_L + (isLight ? -BORDER_CONTRAST : BORDER_CONTRAST));
    const borderInteractive_L = clamp(borderSubtle_L + (isLight ? -BORDER_CONTRAST : BORDER_CONTRAST));

    colors['--border-subtle'] = hslToHex(0, 0, borderSubtle_L);
    colors['--border-divider'] = hslToHex(0, 0, borderDivider_L);
    colors['--border-interactive'] = hslToHex(0, 0, borderInteractive_L);

    // --- 4. Accent Color + Hover ---
    const accentHSL = hexToHSL(accentColor);
    colors['--interactive-accent-primary'] = accentColor;

    const accentHover_L = clamp(accentHSL.l - 8); // Mache es 8% dunkler
    colors['--interactive-accent-hover'] = hslToHex(accentHSL.h, accentHSL.s, accentHover_L);

    const accentText_L = isLight ? clamp(accentHSL.l - 15) : clamp(accentHSL.l + 15);
    colors['--interactive-accent-text'] = accentColor;

    // --- 5. Tinting ---
    const varsToTint = [
        '--surface-page',
        '--surface-primary',
        '--surface-secondary',
        '--surface-inset',
        '--surface-secondary-hover',
        '--border-subtle',
        '--border-divider',
        '--border-interactive'
    ];

    // Wir gehen durch die Liste der zu tönenden Variablen...
    varsToTint.forEach(variable => {
        const greyscaleHex = colors[variable]; // Hole den bereits berechneten Grauton aus unserer Palette

        if (greyscaleHex) {
            const greyscaleHSL = hexToHSL(greyscaleHex); // Wandle den Grauton in HSL um

            // Erstelle die neue, getönte Farbe:
            // - Farbton (H) von der Akzentfarbe
            // - Sättigung (S) von der tintIntensity-Einstellung
            // - Helligkeit (L) vom ursprünglichen Grauton
            const tintedHex = hslToHex(accentHSL.h, tintIntensity, greyscaleHSL.l);

            // Überschreibe den ursprünglichen Grauton in unserer Palette mit dem neuen, getönten Wert
            colors[variable] = tintedHex;
        }
    });

    const textTintSaturation = Math.min(10, settings.tintIntensity / 2);

    const textVarsToTint = [
        '--text-secondary',
        '--text-subtle'
    ];

    textVarsToTint.forEach(variable => {
        const greyscaleHex = colors[variable];
        if (greyscaleHex) {
            const greyscaleHSL = hexToHSL(greyscaleHex);
            // Wir verwenden hier die reduzierte `textTintSaturation`
            const tintedHex = hslToHex(accentHSL.h, textTintSaturation, greyscaleHSL.l);
            colors[variable] = tintedHex; // Überschreibe den Grauton des Textes
        }
    });

    console.log("Neue symmetrische Farbpalette generiert:", colors);
    return colors;
}

function applyColors(colorPalette) {

    const rootElement = document.documentElement;
    for (const [variable, value] of Object.entries(colorPalette)) {
        rootElement.style.setProperty(variable, value);
    }
}

// SVG-Icons, die wir für die Buttons benötigen
const SVG_PENCIL = `<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M14.06,9L15,9.94L5.92,19H5V18.08L14.06,9M17.66,3C17.41,3 17.15,3.1 16.96,3.29L15.13,5.12L18.88,8.87L20.71,7.05C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18.17,3.09 17.92,3 17.66,3M14.06,6.19L3,17.25V21H6.75L17.81,9.94L14.06,6.19Z"></path></svg>`;
const SVG_CROSS = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;

let allThemes = []; // Wir nutzen eine globale Variable für alle Themes

/**
 * Der Haupteinstiegspunkt, um den Theme-Manager zu öffnen.
 * Ruft die Ansicht zur Auflistung der Themes auf.
 */
export function openThemeManager() {
    // 1. Alle Themes frisch laden
    allThemes = [...predefinedThemes];
    try {
        const customThemes = JSON.parse(localStorage.getItem('customThemes')) || [];
        allThemes.push(...customThemes.map(t => ({ ...t, isEditable: true }))); // Eigene Themes als editierbar markieren
    } catch (e) {
        console.error("Fehler beim Laden der Custom Themes.", e);
    }

    // 2. Die Listenansicht anzeigen
    renderThemeListView();
}

/**
 * Zeigt das Modal mit der Liste aller verfügbaren Themes an.
 */
function renderThemeListView() {
    ModalManager.show({
        title: 'Themes',
        size: 'small',
        headerButtons: [
            {
                class: 'modal-header-button close-button',
                svg: SVG_CROSS,
                tooltip: 'Close',
                onClick: ({ close }) => close()
            }
        ],
        contentTree: {
            tag: 'div',
            props: { className: 'space-y-3 mb-6 max-h-72 overflow-y-auto' },
            children: [
                // Erstelle eine "Karte" für jedes Theme
                ...allThemes.map(theme => ({
                    tag: 'div',
                    props: {
                        className: `theme-manager-list-item-card ${theme.name === activeThemeName ? 'active-theme' : ''}`,
                        onclick: () => {
                            if (theme.name !== activeThemeName) {
                                // Wende das Theme an
                                applyTheme(theme);
                                // Und rendere die Liste neu, um den "active" Status zu aktualisieren
                                renderThemeListView();
                            }
                        }
                    },
                    children: [
                        {
                            tag: 'span',
                            props: { className: 'theme-name-display', textContent: theme.name }
                        },
                        // Füge einen "Bearbeiten"-Button nur für editierbare Themes hinzu
                        ...(theme.isEditable ? [{
                            tag: 'button',
                            props: {
                                className: 'theme-edit-button',
                                innerHTML: SVG_PENCIL,
                                onclick: (e) => {
                                    e.stopPropagation(); // Verhindert, dass das Theme beim Klick auf "Edit" angewendet wird
                                    renderThemeEditorView(theme);
                                }
                            }
                        }] : [])
                    ]
                })),
                // Füge die "Neues Theme erstellen"-Karte hinzu
                {
                    tag: 'div',
                    props: {
                        className: 'theme-create-card',
                        onclick: () => renderThemeEditorView() // Ruft den Editor ohne Theme-Objekt auf -> "Erstellen"-Modus
                    },
                    children: [
                        {
                            tag: 'span',
                            props: { className: 'theme-name-display', textContent: 'Create Theme' }
                        }
                    ]
                }
            ]
        }
    });
}

/**
 * Zeigt das Modal zum Erstellen oder Bearbeiten eines Themes.
 * @param {object | null} themeToEdit - Das zu bearbeitende Theme-Objekt oder null/undefined für ein neues Theme.
 */
/**
 * Displays the modal to create or edit a theme with a clean, consistent structure.
 * @param {object | null} themeToEdit - The theme object to edit, or null/undefined for a new theme.
 */
function renderThemeEditorView(themeToEdit) {
    const isEditMode = !!themeToEdit;
    const baseTheme = themeToEdit || allThemes.find(t => t.name === activeThemeName) || predefinedThemes[0];

    const initialSettings = { ...baseTheme.settings };
    if (baseTheme.type === 'custom' && baseTheme.colors && baseTheme.colors['--accent-blue']) {
        initialSettings.accentColor = baseTheme.colors['--accent-blue'];
    }

    const updateLivePreview = () => {
        const tempSettings = {
            brightness: parseFloat(document.getElementById('themeBrightnessSlider').value),
            accentColor: document.getElementById('themeAccentColorPicker').value,
            tintIntensity: parseFloat(document.getElementById('themeTintIntensitySlider').value)
        };
        const palette = generateColorPalette(tempSettings);
        applyColors(palette);
    };

    ModalManager.show({
        title: isEditMode ? 'Edit Theme' : 'Create Theme',
        size: 'medium',
        headerButtons: [{
            class: 'modal-header-button close-button',
            svg: SVG_CROSS,
            tooltip: 'Back to selection',
            /*onClick: () => {
                const originalActiveTheme = allThemes.find(t => t.name === activeThemeName);
                if (originalActiveTheme) applyTheme(originalActiveTheme);
                renderThemeListView();
            }*/
            onClick: ({close}) => close()
        }],
        contentTree: {
            tag: 'div',
            props: { className: 'theme-editor-content' },
            children: [
                // --- Row 1: Theme Name ---
                {
                    tag: 'div',
                    props: { className: 'theme-editor-row' },
                    children: [
                        { tag: 'label', props: { htmlFor: 'themeNameInput', textContent: 'Name:', className: 'theme-editor-label' } },
                        { tag: 'input', props: { type: 'text', id: 'themeNameInput', value: isEditMode ? themeToEdit.name : '', className: 'modal-input' } }
                    ]
                },
                // --- Row 2: Brightness ---
                {
                    tag: 'div',
                    props: { className: 'theme-editor-row' },
                    children: [
                        {
                            tag: 'div',
                            props: { className: 'slider-label-container' },
                            children: [
                                { tag: 'label', props: { htmlFor: 'themeBrightnessSlider', textContent: 'Brightness:', className: 'theme-editor-label' } },
                                { tag: 'span', props: { id: 'themeBrightnessValue', textContent: `${Math.round(initialSettings.brightness)}%` } }
                            ]
                        },
                        {
                            tag: 'input', props: {
                                type: 'range', id: 'themeBrightnessSlider', min: 0, max: 100, value: initialSettings.brightness, className: 'theme-slider', oninput: (e) => {
                                    document.getElementById('themeBrightnessValue').textContent = `${e.target.value}%`;
                                    updateLivePreview();
                                }
                            }
                        }
                    ]
                },
                // --- Row 3: Accent Color ---
                {
                    tag: 'div',
                    props: { className: 'theme-editor-row' },
                    children: [
                        { tag: 'label', props: { htmlFor: 'themeAccentColorPicker', textContent: 'Accent-Color:', className: 'theme-editor-label' } },
                        { tag: 'input', props: { type: 'color', id: 'themeAccentColorPicker', value: initialSettings.accentColor, className: 'color-picker-input', oninput: updateLivePreview } }
                    ]
                },
                // --- Row 4: Tint Intensity ---
                {
                    tag: 'div',
                    props: { className: 'theme-editor-row' },
                    children: [
                        {
                            tag: 'div',
                            props: { className: 'slider-label-container' },
                            children: [
                                { tag: 'label', props: { htmlFor: 'themeTintIntensitySlider', textContent: 'Tint-Intensity:', className: 'theme-editor-label' } },
                                { tag: 'span', props: { id: 'themeTintIntensityValue', textContent: `${initialSettings.tintIntensity}%` } }
                            ]
                        },
                        {
                            tag: 'input', props: {
                                type: 'range', id: 'themeTintIntensitySlider', min: 0, max: 40, value: initialSettings.tintIntensity, className: 'theme-slider', oninput: (e) => {
                                    document.getElementById('themeTintIntensityValue').textContent = `${e.target.value}%`;
                                    updateLivePreview();
                                }
                            }
                        }
                    ]
                }
            ]
        },
        actionButtons: [
            ...(isEditMode ? [{
                text: 'Delete',
                class: 'button-danger',
                tooltip: 'Delete this theme permanently',
                onClick: (args) => {
                    // confirm() ist hier okay, da es eine einfache Browser-Funktion ist
                    if (confirm(`Are you sure you want to delete "${themeToEdit.name}"?`)) {
                        deleteTheme(themeToEdit.name);
                        args.close();
                        openThemeManager();
                    }
                }
            }] : []),
            {
                text: 'Save',
                class: 'button-primary',
                tooltip: 'Save the changes',
                onClick: () => {
                    saveTheme(isEditMode ? themeToEdit.name : null);
                }
            }
        ]
    });
    updateLivePreview();
}


/**
 * Speichert ein neues oder geändertes Theme.
 * @param {string | null} originalName - Der ursprüngliche Name des Themes, falls es bearbeitet wird.
 */
function saveTheme(originalName) {
    const nameInput = document.getElementById('themeNameInput');
    const newName = nameInput.value.trim();

    if (!newName) {
        alert("Please enter a name");
        return;
    }
    // Prüfen, ob der Name bereits existiert (außer es ist das Theme, das wir gerade bearbeiten)
    if (newName !== originalName && allThemes.some(t => t.name.toLowerCase() === newName.toLowerCase())) {
        alert(`A theme with the name "${newName}" already exists.`);
        return;
    }

    const newTheme = {
        name: newName,
        type: 'custom', // Alle gespeicherten Themes sind 'custom'
        isEditable: true,
        settings: {
            brightness: parseFloat(document.getElementById('themeBrightnessSlider').value),
            accentColor: document.getElementById('themeAccentColorPicker').value,
            tintIntensity: parseFloat(document.getElementById('themeTintIntensitySlider').value)
        }
    };

    let customThemes = allThemes.filter(t => t.isEditable && t.name !== originalName);
    customThemes.push(newTheme);

    localStorage.setItem('customThemes', JSON.stringify(customThemes));

    applyTheme(newTheme);
    openThemeManager(); // Zurück zur aktualisierten Liste
}

/**
 * Löscht ein benutzerdefiniertes Theme.
 * @param {string} themeName - Der Name des zu löschenden Themes.
 */
function deleteTheme(themeName) {
    let customThemes = allThemes.filter(t => t.isEditable && t.name !== themeName);
    localStorage.setItem('customThemes', JSON.stringify(customThemes));

    // Wenn das gelöschte Theme das aktive war, auf ein Standard-Theme zurückfallen
    if (activeThemeName === themeName) {
        applyTheme(predefinedThemes[0]); // Fallback auf das erste vordefinierte Theme (z.B. Light)
    }
}

/**
 * Eine Hilfsfunktion, die jedes Theme korrekt anwendet.
 * @param {object} themeObject - Das anzuwendende Theme.
 */
function applyTheme(themeObject) {
    const settingsForPalette = { ...themeObject.settings };
    if (themeObject.type === 'custom' && themeObject.colors && themeObject.colors['--accent-blue']) {
        settingsForPalette.accentColor = themeObject.colors['--accent-blue'];
    }

    const palette = generateColorPalette(settingsForPalette);
    applyColors(palette);

    activeThemeName = themeObject.name;
    localStorage.setItem('activeThemeName', activeThemeName);
}