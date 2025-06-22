import ModalManager from "./modal-manager.js";
import TestExecutionManager from "./test-execution-manager.js";

// --- Konstanten ---
const SVG_INFO = `<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M10.5,9H13.5V7H10.5Z M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M10.5,17H13.5V11H10.5V17Z" /></svg>`;
const SVG_PIN = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8.5" r="4.5" fill="none" stroke="currentColor" stroke-width="2.5"/><line x1="12" y1="13" x2="12" y2="19.25" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>';
const SVG_CLOSE = `<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
const SVG_CHECK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
const SVG_UPLOAD = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-upload-icon lucide-upload"><path d="M12 3v12"/><path d="m17 8-5-5-5 5"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/></svg>`;
const SVG_DROP = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-download-icon lucide-download"><path d="M12 15V3"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/></svg>`;

const MANIFEST_URL = 'https://raw.githubusercontent.com/MarlonGrazek/GemmarTesting/refs/heads/content/content/manifest.json';

const TestSetupManager = {
    state: {
        manifestData: null,
        pinnedTestId: null,
        selectedTestConfig: null,
        selectedFiles: null,
    },
    ui: {},
    countdownIntervals: new Map(),

    async init() {
        this._queryDOMElements();
        this._bindEventListeners();

        this.state.pinnedTestId = localStorage.getItem('pinnedTestId');

        try {
            this.state.manifestData = await this._fetchManifest();
            this._updatePinBoxUI();
            this._renderTestList();
            console.log("TestSetupManager erfolgreich initialisiert.");
        } catch (error) {
            console.error("TestSetupManager: Initialisierung fehlgeschlagen:", error);
            if (this.ui.testListContainer) this.ui.testListContainer.innerHTML = '<p class="text-secondary text-center">Could not load tests.</p>';
        }
    },

    _queryDOMElements() {
        this.ui = {
            pinBox: document.getElementById('pinBox'),
            pinBoxIcon: document.getElementById('pinBoxIcon'),
            pinBoxTitle: document.getElementById('pinBoxTitle'),
            pinBoxSubtitle: document.getElementById('pinBoxSubtitle'),
            testListContainer: document.getElementById('testListContainer'),
            fileUploadArea: document.getElementById('fileUploadArea'),
            fileUploadInput: document.getElementById('fileUpload'),
            fileUploadIcon: document.getElementById('fileUploadIcon'),
            fileUploadTitle: document.getElementById('fileUploadTitle'),
            fileUploadSubtitle: document.getElementById('fileUploadSubtitle'),
            runTestButton: document.getElementById('runTestButton'),
        };
    },

    _bindEventListeners() {
        if (this.ui.pinBox) this.ui.pinBox.addEventListener('click', this._handlePinBoxClick.bind(this));
        if (this.ui.fileUploadInput) this.ui.fileUploadInput.addEventListener('change', this._handleFileUpload.bind(this));
        if (this.ui.runTestButton) this.ui.runTestButton.addEventListener('click', this._handleRunTestClick.bind(this));
        if (this.ui.fileUploadArea) {
            this.ui.fileUploadArea.addEventListener('click', () => this._handleFileUploadAreaClick());
            this.ui.fileUploadArea.addEventListener('dragover', this._handleDragOver.bind(this));
            this.ui.fileUploadArea.addEventListener('dragleave', this._handleDragLeave.bind(this));
            this.ui.fileUploadArea.addEventListener('drop', this._handleDrop.bind(this));
        }
    },

    _handleFileUploadAreaClick() {
        this.state.selectedFiles = null;
        this.ui.fileUploadInput.value = '';
        this._updateFileUploadUI();
        this.ui.fileUploadInput.click();
    },

    _updateFileUploadUI() {
        const files = this.state.selectedFiles;

        if (files && files.length > 0) {
            // Zustand, wenn Dateien ausgewählt sind
            this.ui.fileUploadIcon.innerHTML = SVG_CHECK;
            this.ui.fileUploadTitle.textContent = `${files.length} files selected`;
            this.ui.fileUploadSubtitle.textContent = 'Click to change your selection';
            this.ui.fileUploadIcon.classList.add('files-selected');
        } else {
            // Zustand, wenn keine Dateien ausgewählt sind
            this.state.selectedFiles = null; // Sicherstellen, dass der State null ist
            this.ui.fileUploadIcon.innerHTML = SVG_UPLOAD;
            this.ui.fileUploadTitle.textContent = 'Click to select files';
            this.ui.fileUploadSubtitle.textContent = 'or drag and drop them here';
            this.ui.fileUploadIcon.classList.remove('files-selected');
        }
        this._updateRunTestButtonState();
    },

    /**
     * Erstellt die Test-Karten basierend auf den Daten aus dem Manifest.
     * Nutzt jetzt das 'icon'-Feld direkt aus dem Test-Objekt.
     */
    _renderTestList() {
        if (!this.ui.testListContainer) return;
        this.ui.testListContainer.innerHTML = '';
        const tests = this.state.manifestData?.tests;

        if (!tests || tests.length === 0) {
            this.ui.testListContainer.innerHTML = '<p class="text-secondary text-center">No tests available.</p>';
            return;
        }

        // *** FINALE, KORRIGIERTE LOGIK ZUM ERSTELLEN DER KARTEN ***
        tests.forEach(test => {
            const card = document.createElement('div');
            card.className = 'test-card';
            card.dataset.testId = test.id;

            // 1. Container für den Hauptinhalt (Icon + Text)
            const contentWrapper = document.createElement('div');
            contentWrapper.className = 'test-card-content';

            // 1a. Icon-Wrapper
            const iconWrapper = document.createElement('div');
            iconWrapper.className = 'test-card-icon-wrapper';
            const fallbackIcon = `<svg class="icon" viewBox="0 0 24 24"><path d="M12.9,2.62a1,1,0,0,0-1.8,0L3.43,18.15a1,1,0,0,0,.9,1.47H19.67a1,1,0,0,0,.9-1.47ZM12,6.5a1,1,0,0,1,1,1v5a1,1,0,0,1-2,0V7.5A1,1,0,0,1,12,6.5Zm0,11a1.25,1.25,0,1,1,1.25-1.25A1.25,1.25,0,0,1,12,17.5Z"/></svg>`;
            iconWrapper.innerHTML = test.icon || fallbackIcon;

            // 1b. Text-Wrapper (für Titel und Subtitel)
            const textWrapper = document.createElement('div');
            textWrapper.className = 'test-card-text-wrapper';

            const title = document.createElement('h3');
            title.className = 'test-card-title';
            title.textContent = test.title;

            const subtitle = document.createElement('p');
            subtitle.className = 'test-card-subtitle';
            subtitle.textContent = test.subtitle || "No subtitle provided";
            subtitle.title = test.subtitle || ""; // Tooltip für vollen Text

            textWrapper.appendChild(title);
            textWrapper.appendChild(subtitle);

            contentWrapper.appendChild(iconWrapper);
            contentWrapper.appendChild(textWrapper);

            // 3. Info-Button als separater Container
            const infoButton = document.createElement('button');
            infoButton.className = 'test-card-info-button'; // Nutzt deine alte Klasse
            infoButton.innerHTML = SVG_INFO;
            infoButton.setAttribute('aria-label', `Info for ${test.title}`);
            infoButton.dataset.customTooltip = `Show details for ${test.title}`;

            // Event-Listener
            infoButton.addEventListener('click', (event) => {
                event.stopPropagation();
                this._openTestInfoModal(test);
            });

            // Klick auf die gesamte Karte zum Auswählen
            card.addEventListener('click', () => this._handleTestSelection(test, card));

            // Elemente zur Karte hinzufügen
            card.appendChild(contentWrapper);
            card.appendChild(infoButton);

            this.ui.testListContainer.appendChild(card);
        });
    },

    _updatePinBoxUI() {
        if (!this.ui.pinBox) return;
        const test = this.state.pinnedTestId ? this.state.manifestData?.tests.find(t => t.id === this.state.pinnedTestId) : null;

        if (test) {
            this.ui.pinBoxIcon.innerHTML = SVG_PIN;
            this.ui.pinBoxTitle.textContent = `${test.title} - ${test.subtitle}`;
            if (test.dueDate) {
                this.ui.pinBoxSubtitle.style.display = 'block';
                this._startCountdownTimer(test.dueDate, this.ui.pinBoxSubtitle, 'pinBox');
            } else {
                this._stopCountdownTimer('pinBox');
                this.ui.pinBoxSubtitle.textContent = "No due date";
            }
            this.ui.pinBox.classList.remove('hidden-alt');
        } else {
            this._stopCountdownTimer('pinBox');
            this.ui.pinBox.classList.add('hidden-alt');
        }
    },

    _updateRunTestButtonState() {
        if (this.ui.runTestButton) {
            if(this.state.selectedTestConfig && this.state.selectedFiles) this.ui.runTestButton.classList.remove('disabled');
            else this.ui.runTestButton.classList.add('disabled');
        }
    },

    _handleTestSelection(test, cardElement) {
        this.state.selectedTestConfig = test;
        document.querySelectorAll('.test-card.selected').forEach(card => card.classList.remove('selected'));
        cardElement.classList.add('selected');

        this._updateRunTestButtonState();
    },

    _handleFileUpload(event) {

        const files = event.target.files;
        if (!files) return;

        const javaFiles = Array.from(files).filter(file => file.name.endsWith('.java'));

        this.state.selectedFiles = javaFiles.length > 0 ? javaFiles : null;

        // Rufe die zentrale UI-Funktion auf
        this._updateFileUploadUI();
        this._updateRunTestButtonState();
    },

    _handleDragOver(event) {
        event.preventDefault();
        this.ui.fileUploadArea.classList.add('drag-over');
        this.ui.fileUploadTitle.textContent = 'Drop files here';
        this.ui.fileUploadSubtitle.textContent = 'to upload them';
        this.ui.fileUploadIcon.innerHTML = SVG_DROP;
    },

    _handleDragLeave(event) {
        event.preventDefault();
        this.ui.fileUploadArea.classList.remove('drag-over');
        this.ui.fileUploadTitle.textContent = 'Click to select files';
        this.ui.fileUploadSubtitle.textContent = 'or drag and drop them here';
        this.ui.fileUploadIcon.innerHTML = SVG_UPLOAD;
    },

    _handleDrop(event) {
        event.preventDefault();
        this.ui.fileUploadArea.classList.remove('drag-over');
    
        const droppedFiles = event.dataTransfer.files;
        if (!droppedFiles || droppedFiles.length === 0) return;
        
        // Nur .java-Dateien aus dem Drop berücksichtigen
        const newJavaFiles = Array.from(droppedFiles).filter(file => file.name.endsWith('.java'));
        if (newJavaFiles.length === 0) return; // Nichts zu tun
    
        // Bestehende Dateien holen oder ein leeres Array starten
        const currentFiles = this.state.selectedFiles || [];
    
        // Neue Dateien hinzufügen und Duplikate ignorieren
        newJavaFiles.forEach(newFile => {
            // Prüfen, ob eine Datei mit gleichem Namen UND gleicher Größe bereits existiert
            const isDuplicate = currentFiles.some(existingFile => 
                existingFile.name === newFile.name && existingFile.size === newFile.size
            );
            
            if (!isDuplicate) {
                currentFiles.push(newFile);
            }
        });
    
        // Den State mit der neuen, kombinierten Liste aktualisieren
        this.state.selectedFiles = currentFiles;
        
        // Die UI mit der neuen Liste aktualisieren
        this._updateFileUploadUI();
    },

    _handleRunTestClick() {
        if (this.state.selectedTestConfig && this.state.selectedFiles) {
            const baseUrl = MANIFEST_URL.substring(0, MANIFEST_URL.lastIndexOf('/') + 1);
            TestExecutionManager.startTestRun(baseUrl, this.state.manifestData, this.state.selectedTestConfig, this.state.selectedFiles);
        }
    },

    _handlePinBoxClick() {
        if (!this.state.pinnedTestId || !this.state.manifestData?.tests) return;
        const test = this.state.manifestData.tests.find(t => t.id === this.state.pinnedTestId);
        if (test) this._openTestInfoModal(test);
    },

    _openTestInfoModal(test) {
        const isPinned = this.state.pinnedTestId === test.id;

        const headerButtons = [
            {
                class: isPinned ? 'modal-header-button pin-button active' : 'modal-header-button pin-button',
                svg: SVG_PIN,
                tooltip: isPinned ? 'Unpin this test' : 'Pin this test',
                onClick: (_, event) => {
                    this.state.pinnedTestId = isPinned ? null : test.id;
                    if (this.state.pinnedTestId) {
                        localStorage.setItem('pinnedTestId', this.state.pinnedTestId);
                    } else {
                        localStorage.removeItem('pinnedTestId');
                    }
                    this._updatePinBoxUI();

                    const buttonEl = event.currentTarget;
                    buttonEl.classList.toggle('active', !isPinned);
                    buttonEl.dataset.customTooltip = !isPinned ? 'Unpin this test' : 'Pin this test';
                }
            },
            {
                class: 'modal-header-button close-button',
                tooltip: 'Close',
                svg: SVG_CLOSE,
                onClick: ({ close }) => close()
            }
        ];

        const actionButtons = [];
        if (test.submissionPage) {
            actionButtons.push({
                text: 'Submit Solution',
                class: 'button-primary',
                onClick: () => window.electronAPI?.openExternalLink(test.submissionPage)
            });
        }

        ModalManager.show({
            title: `${test.title} - ${test.subtitle}`,
            size: 'large',
            content: this._buildModalContent(test),
            headerButtons: headerButtons,
            actionButtons: actionButtons,
        });

        if (test.dueDate) {
            const el = document.getElementById(`modal-countdown-${test.id}`);
            if (el) this._startCountdownTimer(test.dueDate, el, `modal_${test.id}`);
        }
    },

    _buildModalContent(test) {
        const wrapper = document.createElement('div');
        let hasFlagsContent = false;

        const flagsContainer = document.createElement('div');
        flagsContainer.className = 'modal-flags-container';

        if (test.dueDate) {
            const countdownEl = document.createElement('span');
            countdownEl.id = `modal-countdown-${test.id}`;
            countdownEl.className = 'countdown-pill modal-header-countdown-pill modal-flag-item';
            flagsContainer.appendChild(countdownEl);
            hasFlagsContent = true;
        }

        if (test.flags?.length > 0) {
            test.flags.forEach(flag => {
                const flagEl = document.createElement('span');
                flagEl.className = 'modal-flag-item';
                flagEl.textContent = flag.title;
                flagEl.dataset.customTooltip = flag.details;
                flagsContainer.appendChild(flagEl);
                hasFlagsContent = true;
            });
        }

        if (hasFlagsContent) {
            wrapper.appendChild(flagsContainer);
        }

        const descriptionDiv = document.createElement('div');
        descriptionDiv.innerHTML = this._parseMarkup(test.description || "No description available.");
        wrapper.appendChild(descriptionDiv);

        return wrapper.innerHTML;
    },

    _startCountdownTimer(targetDateString, element, key) {
        this._stopCountdownTimer(key);

        const targetDate = new Date(targetDateString);
        if (!element || isNaN(targetDate.getTime())) {
            if (element) element.textContent = "Invalid date";
            return;
        }

        element.dataset.customTooltip = `Due by: ${new Intl.DateTimeFormat('en-US', { dateStyle: 'full', timeStyle: 'short' }).format(targetDate)}`;

        const updateTimer = () => {
            const timeLeft = targetDate.getTime() - Date.now();
            element.textContent = this._formatCountdown(timeLeft);
            if (timeLeft <= 0) this._stopCountdownTimer(key);
        };

        updateTimer();
        this.countdownIntervals.set(key, setInterval(updateTimer, 1000));
    },

    _stopCountdownTimer(key) {
        if (this.countdownIntervals.has(key)) {
            clearInterval(this.countdownIntervals.get(key));
            this.countdownIntervals.delete(key);
        }
    },

    _formatCountdown: (ms) => {
        if (ms <= 0) return "Expired";
        const d = Math.floor(ms / 86400000), h = Math.floor((ms % 86400000) / 3600000), m = Math.floor((ms % 3600000) / 60000), s = Math.floor((ms % 60000) / 1000);
        if (d > 0) return `${d}d ${h}h`;
        if (h > 0) return `${h}h ${m}m`;
        if (m > 0) return `${m}m ${s}s`;
        return `${s}s`;
    },
    _parseMarkup(text) {
        if (typeof text !== 'string') return '';
        let safeText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        safeText = safeText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        safeText = safeText.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
        safeText = safeText.replace(/\n/g, '<br>');
        return `<div class="modal-description-text">${safeText}</div>`;
    },
    async _fetchManifest() {
        const response = await fetch(MANIFEST_URL, { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    }
};

export default TestSetupManager;
