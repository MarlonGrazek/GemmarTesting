import ModalManager from "./modal-manager.js";

// --- Konstanten ---
const SVG_EDIT = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-settings2-icon lucide-settings-2"><path d="M14 17H5"/><path d="M19 7h-9"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/></svg>`;
const SVG_CROSS = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
const SVG_THEME = `<svg viewBox="0 0 458.178 458.178"><path d="M130.415,277.741C95.083,313.074,45.038,324.723,0,312.697c5.918,22.164,17.568,43.116,34.956,60.504c52.721,52.721,138.198,52.721,190.919,0c26.361-26.36,26.36-69.099,0-95.459C199.514,251.38,156.776,251.38,130.415,277.741z"/><path d="M212.771,234.276c12.728,4.827,24.403,12.338,34.317,22.252c10.077,10.077,17.456,21.838,22.19,34.378l53.47-53.47l-56.568-56.569C245.886,201.161,226.908,220.139,212.771,234.276z"/><path d="M446.462,57.153c-15.621-15.621-40.948-15.621-56.568,0c-5.887,5.887-54.496,54.496-102.501,102.501l56.568,56.569l102.501-102.501C462.083,98.101,462.083,72.774,446.462,57.153z"/></svg>`;
const SVG_LOGO = `<svg id="svg" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0, 0, 400,400"><g id="svgg"><path class="logo-main" id="path0" d="M143.848 143.883 C 116.554 145.633,93.687 165.875,89.169 192.285 C 83.999 222.510,100.502 250.300,129.102 259.530 C 136.728 261.991,141.417 262.495,156.689 262.498 L 167.773 262.500 167.773 248.549 L 167.773 234.597 156.006 234.511 C 146.282 234.440,143.974 234.372,142.714 234.115 C 126.931 230.906,117.491 219.198,117.491 202.832 C 117.491 190.162,123.351 180.243,133.993 174.898 C 140.180 171.791,142.673 171.535,167.188 171.496 L 178.027 171.479 180.957 166.985 C 182.568 164.513,185.207 160.493,186.820 158.052 C 190.578 152.365,193.808 147.407,195.088 145.361 L 196.096 143.750 170.460 143.785 C 156.360 143.805,144.385 143.849,143.848 143.883 M207.876 149.756 C 205.721 153.059,201.661 159.249,198.854 163.511 C 196.047 167.772,193.750 171.310,193.750 171.371 C 193.750 171.433,204.890 171.505,218.506 171.532 L 243.262 171.582 243.311 217.041 L 243.360 262.500 257.813 262.500 L 272.266 262.500 272.266 216.992 L 272.266 171.484 291.895 171.484 L 311.523 171.484 311.523 157.617 L 311.523 143.750 261.659 143.750 L 211.794 143.750 207.876 149.756 M199.183 202.490 C 192.394 208.694,185.868 214.651,184.680 215.727 L 182.520 217.685 182.569 240.093 L 182.619 262.500 197.169 262.500 L 211.719 262.500 211.719 226.855 C 211.719 207.251,211.675 191.211,211.622 191.211 C 211.568 191.211,205.971 196.287,199.183 202.490 " stroke="none" fill-rule="evenodd"></path><path class="logo-accent" id="path2" d="M157.889 193.799 C 149.390 206.224,141.797 217.398,141.797 217.480 C 141.797 217.534,150.963 217.578,162.165 217.578 L 182.533 217.578 195.699 205.548 C 202.941 198.932,209.485 192.956,210.243 192.269 L 211.621 191.020 185.707 191.018 L 159.793 191.016 157.889 193.799 " stroke="none" fill-rule="evenodd"></path></g></svg>`;


const ThemeManager = {
    // ... state und init() bleiben unverändert ...
    state: {
        predefinedThemes: [
            { name: 'Light', isEditable: false, settings: { brightness: 100, accentColor: '#3B82F6', tintIntensity: 0 } },
            { name: 'Dark', isEditable: false, settings: { brightness: 5.0, accentColor: '#3B82F6', tintIntensity: 20 } },
        ],
        customThemes: [],
        activeThemeName: 'Light',
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
                            { tag: 'div', props: { className: 'preview-line title', style: `background-color: ${palette['--text-secondary']};` } },
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
                            { tag: 'div', props: { className: 'preview-upload-box', style: `border-color: ${palette['--border-subtle']};` } },
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
                                        innerHTML: SVG_LOGO
                                    }
                                }]
                            },
                            {
                                tag: 'div',
                                props: { className: 'preview-summary-box', style: `background-color: ${palette['--surface-secondary']};` },
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
            this.ui.themeManagerButton.innerHTML = SVG_THEME;
            this.ui.themeManagerButton.addEventListener('click', () => this.open());
        }
    },

    _renderThemeListView() {
        ModalManager.show({
            title: 'Themes',
            size: 'large',
            headerButtons: [{ class: 'modal-header-button close-button', svg: SVG_CROSS, tooltip: 'Close', onClick: ({ close }) => close() }],
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
                                            innerHTML: SVG_EDIT,
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
                class: 'modal-header-button close-button', svg: SVG_CROSS, tooltip: 'Back',
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
            ModalManager.show({ title: 'Error', content: 'Please enter a name for the theme.' });
            return false;
        }
        if (newName !== originalName && this.getAllThemes().some(t => t.name.toLowerCase() === newName.toLowerCase())) {
            ModalManager.show({ title: 'Error', content: `A theme with the name "${newName}" already exists.` });
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
