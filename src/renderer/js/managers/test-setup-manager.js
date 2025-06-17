import ModalManager from "./modal-manager.js";
import TestExecutionManager from "./test-execution-manager.js";

// --- Konstanten ---
const SVG_INFO = `<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M10.5,9H13.5V7H10.5Z M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M10.5,17H13.5V11H10.5V17Z" /></svg>`;
const SVG_PIN = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8.5" r="4.5" fill="none" stroke="currentColor" stroke-width="2.5"/><line x1="12" y1="13" x2="12" y2="19.25" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>';
const SVG_CLOSE = `<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;

const MANIFEST_URL = 'https://raw.githubusercontent.com/MarlonGrazek/GemmarTesting/refs/heads/content/content/manifest.json';

/**
 * TestSetupManager
 * Verwaltet die Anzeige der Testauswahl, das Hochladen von Dateien und
 * die Interaktion mit der Test-UI.
 */
const TestSetupManager = {
    // Gekapselter Zustand, UI-Referenzen und Callbacks
    state: {
        manifestData: null,
        pinnedTestId: null,
        selectedTestConfig: null,
        selectedFiles: null,
    },
    ui: {},
    countdownIntervals: new Map(),

    /**
     * Initialisiert den Manager.
     */
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

    // --- Private Methoden zur UI-Verwaltung ---

    _queryDOMElements() {
        this.ui = {
            pinBox: document.getElementById('pinBox'),
            pinBoxIcon: document.getElementById('pinBoxIcon'),
            pinBoxTitle: document.getElementById('pinBoxTitle'),
            pinBoxSubtitle: document.getElementById('pinBoxSubtitle'),
            testListContainer: document.getElementById('testListContainer'),
            codeUploadSection: document.getElementById('codeUploadSection'),
            selectedTestNameElem: document.getElementById('selectedTestName'),
            fileUploadInput: document.getElementById('fileUpload'),
            fileSelectionInfo: document.getElementById('fileSelectionInfo'),
            runTestButton: document.getElementById('runTestButton'),
        };
    },

    _bindEventListeners() {
        if (this.ui.pinBox) this.ui.pinBox.addEventListener('click', this._handlePinBoxClick.bind(this));
        if (this.ui.fileUploadInput) this.ui.fileUploadInput.addEventListener('change', this._handleFileUpload.bind(this));
        if (this.ui.runTestButton) this.ui.runTestButton.addEventListener('click', this._handleRunTestClick.bind(this));
    },

    _renderTestList() {
        if (!this.ui.testListContainer) return;
        this.ui.testListContainer.innerHTML = '';
        const tests = this.state.manifestData?.tests;

        if (!tests || tests.length === 0) {
            this.ui.testListContainer.innerHTML = '<p class="text-secondary text-center">No tests available.</p>';
            return;
        }

        tests.forEach(test => {
            const card = document.createElement('div');
            card.className = 'test-card';
            card.dataset.testId = test.id;

            const title = document.createElement('h3');
            title.textContent = test.title;
            card.appendChild(title);

            const infoButton = document.createElement('button');
            infoButton.className = 'test-card-info-button';
            infoButton.innerHTML = SVG_INFO;
            infoButton.setAttribute('aria-label', `Info for ${test.title}`);
            infoButton.dataset.customTooltip = `Show details for "${test.title}"`;
            infoButton.addEventListener('click', (event) => {
                event.stopPropagation();
                this._openTestInfoModal(test);
            });
            card.appendChild(infoButton);

            card.addEventListener('click', () => this._handleTestSelection(test, card));
            this.ui.testListContainer.appendChild(card);
        });
    },

    _updatePinBoxUI() {
        if (!this.ui.pinBox) return;
        const test = this.state.pinnedTestId ? this.state.manifestData?.tests.find(t => t.id === this.state.pinnedTestId) : null;
        
        if (test) {
            this.ui.pinBoxIcon.innerHTML = SVG_PIN;
            this.ui.pinBoxTitle.textContent = test.title;
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
            this.ui.runTestButton.disabled = !(this.state.selectedTestConfig && this.state.selectedFiles);
        }
    },

    // --- Private Methoden zur Event-Behandlung ---

    _handleTestSelection(test, cardElement) {
        this.state.selectedTestConfig = test;
        document.querySelectorAll('.test-card.selected').forEach(card => card.classList.remove('selected'));
        cardElement.classList.add('selected');

        this.ui.selectedTestNameElem.textContent = test.title;
        this.ui.codeUploadSection.classList.remove('hidden-alt');
        
        this.ui.fileUploadInput.value = '';
        this.ui.fileSelectionInfo.textContent = '';
        this.state.selectedFiles = null;

        this._updateRunTestButtonState();
        this.ui.codeUploadSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    _handleFileUpload(event) {
        const files = event.target.files;
        if (files?.length > 0) {
            this.state.selectedFiles = files;
            this.ui.fileSelectionInfo.textContent = `${files.length} Datei(en) ausgewählt.`;
        } else {
            this.state.selectedFiles = null;
            this.ui.fileSelectionInfo.textContent = '';
        }
        this._updateRunTestButtonState();
    },

    /** Behandelt den Klick auf den "Run Test"-Button. */
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

    // --- Private Methoden für Modals und Timer ---

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
            title: test.title,
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
    
    // --- Reine Hilfsfunktionen (unverändert) ---
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
