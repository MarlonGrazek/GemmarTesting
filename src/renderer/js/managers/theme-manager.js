import ModalManager from "./modal-manager.js";

import { ICON_SLIDERS, ICON_CROSS, ICON_PALETTE, ICON_LOGO } from "../common/svg-icons.js";


const ThemeManager = {
    // ... state und init() bleiben unverändert ...
    state: {
        predefinedThemes: [
            { name: 'Arctic', isEditable: false, settings: { brightness: 100, accentColor: '#3B82F6', tintIntensity: 30 } },
            { name: 'Lunar', isEditable: false, settings: { brightness: 10, accentColor: '#3B82F6', tintIntensity: 30 } },
            { name: 'Eclipse', isEditable: false, settings: { brightness: 5, accentColor: '#3B82F6', tintIntensity: 30 } },
        ],
        customThemes: [],
        activeThemeName: 'Arctic',
    },
    ui: {},

    init() {
        this._queryDOMElements();
        this._bindEventListeners();
        this._loadThemesFromStorage();
        const storedThemeName = localStorage.getItem('activeThemeName');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const defaultThemeName = systemPrefersDark ? 'Dark' : 'Light';
        const themeToApply = this.getAllThemes().find(t => t.name === storedThemeName) || this.state.predefinedThemes.find(t => t.name === defaultThemeName);
        this._applyTheme(themeToApply);
        console.log("ThemeManager erfolgreich initialisiert.");
    },

    _createThemePreview(theme) {
        const palette = this._generateColorPalette(theme.settings);

        const buildTestCard = (isActive = false) => ({
            tag: 'div',
            props: {
                className: `preview-test-card ${isActive ? 'active' : ''}`,
                style: `background-color: ${isActive ? `color-mix(in srgb, ${palette['--interactive-accent-primary']} 20%, ${palette['--surface-secondary']})` : palette['--surface-secondary']};`
            },
            children: [
                { tag: 'div', props: { className: 'preview-test-icon', style: `background-color: ${isActive ? palette['--interactive-accent-primary'] : palette['--text-subtle']};` } },
                { tag: 'div', props: { className: 'preview-test-text', style: `background-color: ${isActive ? palette['--interactive-accent-primary'] : palette['--text-subtle']};` } },
            ]
        });

        return {
            tag: 'div',
            props: { className: 'theme-preview', style: `background-color: ${palette['--surface-page']};` },
            children: [{
                tag: 'div',
                props: { className: 'preview-container', style: `border-color: ${palette['--border-divider']};` },
                children: [
                    // Linkes Panel
                    {
                        tag: 'div',
                        props: { className: 'preview-panel left', style: `background-color: ${palette['--surface-primary']};` },
                        children: [
                            { tag: 'div', props: { className: 'preview-line title', style: `background-color: ${palette['--text-primary']};` } },
                            {
                                tag: 'div',
                                props: { className: 'preview-test-grid' },
                                children: [
                                    buildTestCard(),
                                    buildTestCard(),
                                    buildTestCard(true),
                                    buildTestCard()
                                ]
                            },
                            { tag: 'div', props: { className: 'preview-upload-box', style: `border-color: ${palette['--border-subtle']}; background-color: ${palette['--surface-inset']};` } },
                            { tag: 'div', props: { className: 'preview-run-button', style: `background-color: ${palette['--interactive-accent-primary']};` } },
                        ]
                    },
                    // Rechtes Panel
                    {
                        tag: 'div',
                        props: { className: 'preview-panel right', style: `background-color: ${palette['--surface-primary']};` },
                        children: [
                            { 
                                tag: 'div', 
                                props: { className: 'preview-feedback-box', style: `background-color: ${palette['--surface-secondary']};` },
                                children: [{
                                    tag: 'div',
                                    props: {
                                        className: 'preview-logo-wrapper',
                                        style: `--preview-logo-color: ${palette['--interactive-accent-primary']};`,
                                        innerHTML: ICON_LOGO
                                    }
                                }]
                            },
                            {
                                tag: 'div',
                                props: { className: 'preview-summary-box', style: `background-color: ${palette['--surface-inset']};` },
                                children: [
                                    {
                                        tag: 'div',
                                        props: {className: 'preview-progress-bar-bg', style: `background-color: ${palette['--surface-primary']};`},
                                        children: [{
                                            tag: 'div',
                                            props: {className: 'preview-progress-bar-fill', style: `background-color: ${palette['--interactive-accent-primary']};`}
                                        }]
                                    },
                                    {
                                        tag: 'div',
                                        props: {className: 'preview-stats-container'},
                                        children: [
                                            {tag: 'div', props: {className: 'preview-stat-item', style: `background-color: ${palette['--text-subtle']};`}},
                                            {tag: 'div', props: {className: 'preview-stat-item', style: `background-color: ${palette['--interactive-accent-primary']};`}},
                                            {tag: 'div', props: {className: 'preview-stat-item', style: `background-color: ${palette['--color-danger']};`}},
                                            {tag: 'div', props: {className: 'preview-stat-item', style: `background-color: ${palette['--color-warning']};`}},
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }]
        };
    },
    
    // ... Rest der Datei bleibt unverändert ...
    open() {
        this._renderThemeListView();
    },

    getAllThemes() {
        return [...this.state.predefinedThemes, ...this.state.customThemes];
    },

    _queryDOMElements() {
        this.ui.themeManagerButton = document.getElementById('themeManagerButton');
    },

    _bindEventListeners() {
        if (this.ui.themeManagerButton) {
            this.ui.themeManagerButton.innerHTML = ICON_PALETTE;
            this.ui.themeManagerButton.addEventListener('click', () => this.open());
        }
    },

    _renderThemeListView() {
        ModalManager.show({
            title: 'Themes',
            size: 'large',
            headerButtons: [{ class: 'modal-header-button close-button', svg: ICON_CROSS, tooltip: 'Close', onClick: ({ close }) => close() }],
            contentTree: {
                tag: 'div',
                props: { className: 'theme-manager-grid' },
                // Die "Create Theme"-Karte wurde aus diesem Array entfernt.
                children: [
                    ...this.getAllThemes().map(theme => ({
                        tag: 'div',
                        props: {
                            className: `theme-manager-card ${theme.name === this.state.activeThemeName ? 'active-theme' : ''}`,
                            onclick: (e) => this._handleThemeSelection(theme, e.currentTarget)
                        },
                        children: [
                            this._createThemePreview(theme),
                            {
                                tag: 'div',
                                props: { className: 'theme-card-footer' },
                                children: [
                                    { tag: 'span', props: { className: 'theme-name-display', textContent: theme.name } },
                                    ...(theme.isEditable ? [{
                                        tag: 'button',
                                        props: {
                                            className: 'theme-edit-button',
                                            innerHTML: ICON_SLIDERS,
                                            'data-custom-tooltip': `Edit "${theme.name}"`,
                                            onclick: (e) => {
                                                e.stopPropagation();
                                                this._renderThemeEditorView(theme);
                                            }
                                        }
                                    }] : [])
                                ]
                            }
                        ]
                    })),
                    // Die alte "theme-create-card" war hier und wurde GELÖSCHT.
                ]
            },
            // HINZUGEFÜGT: Ein Action-Button für den Footer des Modals.
            actionButtons: [
                {
                    text: 'Create Theme',
                    class: 'button-primary', // Styling wie gewünscht
                    onClick: () => this._renderThemeEditorView() // Gleiche Funktion wie zuvor
                }
            ]
        });
    },
    
    _handleThemeSelection(theme, element) {
        if (theme.name === this.state.activeThemeName) return;
        this._applyTheme(theme);
        const currentlyActiveCard = document.querySelector('.theme-manager-card.active-theme');
        if (currentlyActiveCard) {
            currentlyActiveCard.classList.remove('active-theme');
        }
        element.classList.add('active-theme');
    },

    _renderThemeEditorView(themeToEdit = null) {
        const isEditMode = !!themeToEdit;
        const baseTheme = themeToEdit || this.getAllThemes().find(t => t.name === this.state.activeThemeName) || this.state.predefinedThemes[0];
        const initialSettings = { ...baseTheme.settings };

        if (baseTheme.type === 'custom' && baseTheme.colors?.['--accent-blue']) {
            initialSettings.accentColor = baseTheme.colors['--accent-blue'];
        }

        const updateLivePreview = () => {
            const tempSettings = {
                brightness: parseFloat(document.getElementById('themeBrightnessSlider').value),
                accentColor: document.getElementById('themeAccentColorPicker').value,
                tintIntensity: parseFloat(document.getElementById('themeTintIntensitySlider').value)
            };
            this._applyColors(this._generateColorPalette(tempSettings));
        };

        const originalActiveTheme = this.getAllThemes().find(t => t.name === this.state.activeThemeName);

        ModalManager.show({
            title: isEditMode ? 'Edit Theme' : 'Create Theme',
            size: 'medium',
            headerButtons: [{
                class: 'modal-header-button close-button', svg: ICON_CROSS, tooltip: 'Back',
                onClick: ({ close }) => {
                    if (originalActiveTheme) this._applyTheme(originalActiveTheme);
                    close();
                }
            }],
            contentTree: {
                tag: 'div',
                props: { className: 'theme-editor-content' },
                children: [
                    { tag: 'div', props: { className: 'theme-editor-row' }, children: [{ tag: 'label', props: { htmlFor: 'themeNameInput', textContent: 'Name:' } }, { tag: 'input', props: { type: 'text', id: 'themeNameInput', value: isEditMode ? themeToEdit.name : '', className: 'modal-input' } }] },
                    { tag: 'div', props: { className: 'theme-editor-row' }, children: [{ tag: 'div', props: { className: 'slider-label-container' }, children: [{ tag: 'label', props: { htmlFor: 'themeBrightnessSlider', textContent: 'Brightness:' } }, { tag: 'span', props: { id: 'themeBrightnessValue', textContent: `${Math.round(initialSettings.brightness)}%` } }] }, { tag: 'input', props: { type: 'range', id: 'themeBrightnessSlider', min: 0, max: 100, value: initialSettings.brightness, className: 'theme-slider', oninput: (e) => { document.getElementById('themeBrightnessValue').textContent = `${e.target.value}%`; updateLivePreview(); } } }] },
                    { tag: 'div', props: { className: 'theme-editor-row' }, children: [{ tag: 'label', props: { htmlFor: 'themeAccentColorPicker', textContent: 'Accent-Color:' } }, { tag: 'input', props: { type: 'color', id: 'themeAccentColorPicker', value: initialSettings.accentColor, className: 'color-picker-input', oninput: updateLivePreview } }] },
                    { tag: 'div', props: { className: 'theme-editor-row' }, children: [{ tag: 'div', props: { className: 'slider-label-container' }, children: [{ tag: 'label', props: { htmlFor: 'themeTintIntensitySlider', textContent: 'Tint-Intensity:' } }, { tag: 'span', props: { id: 'themeTintIntensityValue', textContent: `${initialSettings.tintIntensity}%` } }] }, { tag: 'input', props: { type: 'range', id: 'themeTintIntensitySlider', min: 0, max: 40, value: initialSettings.tintIntensity, className: 'theme-slider', oninput: (e) => { document.getElementById('themeTintIntensityValue').textContent = `${e.target.value}%`; updateLivePreview(); } } }] }
                ]
            },
            actionButtons: [
                ...(isEditMode ? [{
                    text: 'Delete', class: 'button-danger',
                    onClick: () => this._handleDeleteTheme(themeToEdit)
                }] : []),
                {
                    text: 'Save', class: 'button-primary',
                    onClick: () => {
                        const success = this._saveTheme(isEditMode ? themeToEdit.name : null);
                        if (success) {
                            ModalManager.closeTop();
                            ModalManager.closeTop();
                            this.open();
                        }
                    }
                }
            ]
        });
        updateLivePreview();
    },

    async _handleDeleteTheme(theme) {
        const confirmed = await this._showConfirmation(`Are you sure you want to delete "${theme.name}"?`);
        if (confirmed) {
            this.state.customThemes = this.state.customThemes.filter(t => t.name !== theme.name);
            this._saveThemesToStorage();

            if (this.state.activeThemeName === theme.name) {
                this._applyTheme(this.state.predefinedThemes[0]);
            }
            ModalManager.closeTop();
            ModalManager.closeTop();
            ModalManager.closeTop();
            this.open();
        }
    },
    
    _applyTheme(theme) {
        let settings = { ...theme.settings };
        if (theme.type === 'custom' && theme.colors?.['--accent-blue']) {
            settings.accentColor = theme.colors['--accent-blue'];
        }
        const palette = this._generateColorPalette(settings);
        this._applyColors(palette);
        this.state.activeThemeName = theme.name;
        localStorage.setItem('activeThemeName', this.state.activeThemeName);
    },

    _saveTheme(originalName) {
        const nameInput = document.getElementById('themeNameInput');
        const newName = nameInput.value.trim();

        if (!newName) {
            ModalManager.show({
                title: 'Error',
                headerButtons: [{ class: 'modal-header-button close-button', svg: ICON_CROSS, tooltip: 'Close', onClick: ({ close }) => close() }],
                content: 'Please enter a name for the theme.' });
            return false;
        }
        if (newName !== originalName && this.getAllThemes().some(t => t.name.toLowerCase() === newName.toLowerCase())) {
            ModalManager.show({
                title: 'Error',
                headerButtons: [{ class: 'modal-header-button close-button', svg: ICON_CROSS, tooltip: 'Close', onClick: ({ close }) => close() }],
                content: `A theme with the name "${newName}" already exists.` });
            return false;
        }

        const newTheme = {
            name: newName,
            type: 'custom',
            isEditable: true,
            settings: {
                brightness: parseFloat(document.getElementById('themeBrightnessSlider').value),
                accentColor: document.getElementById('themeAccentColorPicker').value,
                tintIntensity: parseFloat(document.getElementById('themeTintIntensitySlider').value)
            }
        };

        const otherCustomThemes = this.state.customThemes.filter(t => t.name !== originalName);
        this.state.customThemes = [...otherCustomThemes, newTheme];
        this._saveThemesToStorage();
        this._applyTheme(newTheme);
        return true;
    },

    _loadThemesFromStorage() {
        try {
            const stored = localStorage.getItem('customThemes');
            this.state.customThemes = stored ? JSON.parse(stored).map(t => ({ ...t, isEditable: true })) : [];
        } catch (e) {
            console.error("Fehler beim Laden der Custom Themes:", e);
            this.state.customThemes = [];
            localStorage.removeItem('customThemes');
        }
    },

    _saveThemesToStorage() {
        localStorage.setItem('customThemes', JSON.stringify(this.state.customThemes));
    },

    async _showConfirmation(message) {
        return new Promise(resolve => {
            ModalManager.show({
                title: 'Confirm',
                content: message,
                size: 'small',
                actionButtons: [
                    { text: 'Cancel', class: 'button-secondary', onClick: ({ close }) => { close(); resolve(false); } },
                    { text: 'Delete', class: 'button-danger', onClick: ({ close }) => { close(); resolve(true); } }
                ]
            });
        });
    },

    _applyColors: (palette) => Object.entries(palette).forEach(([k, v]) => document.documentElement.style.setProperty(k, v)),
    _hexToHSL: (hex) => {
        if (!hex) return { h: 0, s: 0, l: 0 }; let r = 0, g = 0, b = 0; if (hex.length === 4) { r = "0x" + hex[1] + hex[1]; g = "0x" + hex[2] + hex[2]; b = "0x" + hex[3] + hex[3]; } else if (hex.length === 7) { r = "0x" + hex[1] + hex[2]; g = "0x" + hex[3] + hex[4]; b = "0x" + hex[5] + hex[6]; } else { return { h: 0, s: 0, l: 0 }; } r /= 255; g /= 255; b /= 255; let cmin = Math.min(r, g, b), cmax = Math.max(r, g, b), delta = cmax - cmin, h = 0, s = 0, l = 0; if (delta === 0) h = 0; else if (cmax === r) h = ((g - b) / delta) % 6; else if (cmax === g) h = (b - r) / delta + 2; else h = (r - g) / delta + 4; h = Math.round(h * 60); if (h < 0) h += 360; l = (cmax + cmin) / 2; s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1)); s = +(s * 100).toFixed(1); l = +(l * 100).toFixed(1); return { h, s, l };
    },
    _hslToHex: (h, s, l) => {
        l = Math.max(0, Math.min(100, l)); s = Math.max(0, Math.min(100, s)); let l_norm = l / 100; const a = s * Math.min(l_norm, 1 - l_norm) / 100; const f = n => { const k = (n + h / 30) % 12; const color = l_norm - a * Math.max(Math.min(k - 3, 9 - k, 1), -1); return Math.round(255 * color).toString(16).padStart(2, '0'); }; return `#${f(0)}${f(8)}${f(4)}`;
    },
    _generateColorPalette(settings) {
        const { brightness, accentColor, tintIntensity } = settings; const colors = {}; const isLight = brightness > 50; const clamp = (val) => Math.max(0, Math.min(100, val)); const SURFACE_STEP = 4; const surfacePage_L = brightness; const surfacePrimary_L = clamp(surfacePage_L + (isLight ? -SURFACE_STEP : SURFACE_STEP)); const surfaceSecondary_L = clamp(surfacePrimary_L + (isLight ? -SURFACE_STEP : SURFACE_STEP)); const surfaceInset_L = clamp(surfacePage_L + (isLight ? -SURFACE_STEP * 1.5 : SURFACE_STEP / 2)); const surfaceSecondaryHover_L = clamp(surfaceSecondary_L + (isLight ? -5 : 5)); colors['--surface-page'] = this._hslToHex(0, 0, surfacePage_L); colors['--surface-primary'] = this._hslToHex(0, 0, surfacePrimary_L); colors['--surface-secondary'] = this._hslToHex(0, 0, surfaceSecondary_L); colors['--surface-inset'] = this._hslToHex(0, 0, surfaceInset_L); colors['--surface-secondary-hover'] = this._hslToHex(0, 0, surfaceSecondaryHover_L); const TEXT_PRIMARY_CONTRAST = 75; const TEXT_SECONDARY_CONTRAST = 45; const TEXT_SUBTLE_CONTRAST = 25; const textPrimary_L = clamp(surfacePrimary_L + (isLight ? -TEXT_PRIMARY_CONTRAST : TEXT_PRIMARY_CONTRAST)); const textSecondary_L = clamp(surfacePrimary_L + (isLight ? -TEXT_SECONDARY_CONTRAST : TEXT_SECONDARY_CONTRAST)); const textSubtle_L = clamp(surfacePrimary_L + (isLight ? -TEXT_SUBTLE_CONTRAST : TEXT_SUBTLE_CONTRAST)); colors['--text-primary'] = this._hslToHex(0, 0, textPrimary_L); colors['--text-secondary'] = this._hslToHex(0, 0, textSecondary_L); colors['--text-subtle'] = this._hslToHex(0, 0, textSubtle_L); colors['--text-on-accent'] = '#FFFFFF'; const BORDER_CONTRAST = 5; const borderSubtle_L = clamp(surfaceSecondary_L + (isLight ? -BORDER_CONTRAST : BORDER_CONTRAST)); const borderDivider_L = clamp(surfacePrimary_L + (isLight ? -BORDER_CONTRAST : BORDER_CONTRAST)); const borderInteractive_L = clamp(borderSubtle_L + (isLight ? -BORDER_CONTRAST : BORDER_CONTRAST)); colors['--border-subtle'] = this._hslToHex(0, 0, borderSubtle_L); colors['--border-divider'] = this._hslToHex(0, 0, borderDivider_L); colors['--border-interactive'] = this._hslToHex(0, 0, borderInteractive_L); const accentHSL = this._hexToHSL(accentColor); colors['--interactive-accent-primary'] = accentColor; const accentHover_L = clamp(accentHSL.l - 8); colors['--interactive-accent-hover'] = this._hslToHex(accentHSL.h, accentHSL.s, accentHover_L); const accentText_L = isLight ? clamp(accentHSL.l - 15) : clamp(accentHSL.l + 15); colors['--interactive-accent-text'] = accentColor; colors['--color-danger'] = '#ef4444'; colors['--color-warning'] = '#f59e0b'; const varsToTint = ['--surface-page', '--surface-primary', '--surface-secondary', '--surface-inset', '--surface-secondary-hover', '--border-subtle', '--border-divider', '--border-interactive']; varsToTint.forEach(variable => { const greyscaleHex = colors[variable]; if (greyscaleHex) { const greyscaleHSL = this._hexToHSL(greyscaleHex); const tintedHex = this._hslToHex(accentHSL.h, tintIntensity, greyscaleHSL.l); colors[variable] = tintedHex; } }); const textTintSaturation = Math.min(10, settings.tintIntensity / 2); const textVarsToTint = ['--text-secondary', '--text-subtle']; textVarsToTint.forEach(variable => { const greyscaleHex = colors[variable]; if (greyscaleHex) { const greyscaleHSL = this._hexToHSL(greyscaleHex); const tintedHex = this._hslToHex(accentHSL.h, textTintSaturation, greyscaleHSL.l); colors[variable] = tintedHex; } }); return colors;
    }
};

export default ThemeManager;
