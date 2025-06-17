import ModalManager from "./modal-manager.js";

// --- Konstanten & SVGs ---
const SVG_CHECK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
// ... (restliche SVGs bleiben gleich)
const SVG_CROSS = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
const SVG_WARNING = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
const SVG_INFO = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
const SPINNER_ICON = `<div class="result-icon-placeholder"></div>`;
const SVG_FAIL_FEEDBACK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
const SVG_WARN_FEEDBACK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
const SVG_PASS_FEEDBACK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;

const TestExecutionManager = {
    state: {},
    ui: {},
    unsubscribeListener: null,
    isInitialized: false,

    init() {
        this._queryDOMElements();
        if (!this.ui.resultsContent) {
            console.error("TestExecutionManager: Initialisierung fehlgeschlagen, UI-Elemente nicht gefunden.");
            return;
        }
        this.isInitialized = true;
        console.log("TestExecutionManager erfolgreich initialisiert.");
    },

    /**
     * Startet einen Testlauf. Holt jetzt selbst den Quellcode von GitHub.
     */
    async startTestRun(baseUrl, manifestData, testConfig, files) {
        if (!this.isInitialized) {
            console.error("TestExecutionManager: Nicht korrekt initialisiert.");
            return;
        }
        
        this.state.currentTestConfig = testConfig;
        this._resetStateAndUI();
        this._updateFeedbackUI('running');

        this.ui.resultsPlaceholder.classList.add('hidden-alt');
        this.ui.resultsContent.classList.remove('hidden-alt');
        this.ui.runningTestNameElem.textContent = testConfig.title;

        try {
            // Die URLs werden jetzt korrekt mit der übergebenen Basis-URL zusammengebaut.
            const runnerUrl = `${baseUrl}${manifestData.runnerFile}`;
            const testLogicUrl = `${baseUrl}${testConfig.filePath}`;

            const [runnerCode, testLogicCode, userFileContents] = await Promise.all([
                this._fetchSourceCode(runnerUrl),
                this._fetchSourceCode(testLogicUrl),
                this._readFilesAsText(files)
            ]);

            if (this.unsubscribeListener) this.unsubscribeListener();
            this.unsubscribeListener = window.electronAPI.receive('java-test-event', this._handleJavaTestEvent.bind(this));
            
            window.electronAPI.send('run-java-test', {
                userFiles: userFileContents,
                testFiles: [
                    { name: manifestData.runnerFile, content: runnerCode },
                    { name: testConfig.filePath.split('/').pop(), content: testLogicCode }
                ],
                testConfig: {
                    mainTestClassName: testConfig.mainTestClassName,
                    userCodeEntryClassFQN: testConfig.userCodeEntryClassFQN,
                    expectedInterfaceName: testConfig.expectedInterfaceName
                }
            });
        } catch (error) {
            console.error("Error preparing or fetching files for test run:", error);
            this._logResult(`Error preparing test run: ${error.message}`, 'failed');
            this._handleJavaTestEvent({ event: 'run_finish', duration: "Preparation Error" });
        }
    },

    async _fetchSourceCode(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch source code from ${url}. Status: ${response.status}`);
        }
        return await response.text();
    },

    // ... alle anderen Methoden bleiben unverändert ...
    _queryDOMElements() { this.ui = { resultsPlaceholder: document.getElementById('resultsPlaceholder'), resultsContent: document.getElementById('resultsContent'), runningTestNameElem: document.getElementById('runningTestName'), progressBar: document.getElementById('progressBarFill'), progressPercentage: document.getElementById('progressPercentage'), totalTestsCountElem: document.getElementById('totalTestsCount'), passedTestsCountElem: document.getElementById('passedTestsCount'), failedTestsCountElem: document.getElementById('failedTestsCount'), warningTestsCountElem: document.getElementById('warningTestsCount'), testSuitesContainer: document.getElementById('testSuitesContainer'), resultsFeedback: document.getElementById('resultsFeedback'), resultsFeedbackIcon: document.getElementById('resultsFeedbackIcon'), resultsFeedbackTitle: document.getElementById('resultsFeedbackTitle'), resultsFeedbackSubtitle: document.getElementById('resultsFeedbackSubtitle'), }; },
    _resetStateAndUI() { this.state = { totalTestsInPlan: 0, passedTests: 0, failedTests: 0, warningTests: 0, currentSuiteElement: null, currentSubtestElement: null, currentTestConfig: this.state.currentTestConfig, }; if (this.ui.testSuitesContainer) this.ui.testSuitesContainer.innerHTML = ''; this._updateSummaryUI(); if (this.ui.progressBar) this.ui.progressBar.style.width = `0%`; if (this.ui.progressPercentage) this.ui.progressPercentage.textContent = `0%`; },
    _handleJavaTestEvent(eventData) { switch (eventData.event) { case 'suite_start': this._addSuite(eventData.name); break; case 'subtest_start': this._addSubtest(eventData.name); break; case 'assert': this.state.totalTestsInPlan++; this._logResult(eventData.message, eventData.status.toLowerCase()); break; case 'log': const level = eventData.level?.toLowerCase() || 'info'; this._logResult(eventData.message, level === 'warn' ? 'warning' : 'info'); break; case 'run_finish': if (this.ui.progressPercentage) { this.ui.progressPercentage.textContent = `Finished in ${eventData.duration} ms`; } this._updateSummaryUI(); if (this.state.failedTests > 0) this._updateFeedbackUI('failed'); else if (this.state.warningTests > 0) this._updateFeedbackUI('warning'); else this._updateFeedbackUI('passed'); ModalManager.show({ title: "Test Run Finished", content: `Test run for "${this.state.currentTestConfig.title}" completed.<br>Result: ${this.state.passedTests} Passed, ${this.state.failedTests} Failed, ${this.state.warningTests} Warnings.`, size: 'medium', actionButtons: [{ text: 'Okay', class: 'button-primary', onClick: ({ close }) => close() }] }); break; } },
    _logResult(message, status = 'info') { let targetContainer; if (this.state.currentSubtestElement) { targetContainer = this.state.currentSubtestElement.querySelector('.result-items-container'); } else if (this.state.currentSuiteElement) { targetContainer = this.state.currentSuiteElement.querySelector('.subtests-area'); } else { this._addSuite("General Logs"); targetContainer = this.state.currentSuiteElement.querySelector('.subtests-area'); } if (targetContainer) { targetContainer.appendChild(this._createResultItem(message, status)); } if (status === 'passed') this.state.passedTests++; else if (status === 'failed') this.state.failedTests++; else if (status === 'warning') this.state.warningTests++; this._updateSummaryUI(); },
    _updateSummaryUI() { if (!this.ui.totalTestsCountElem) return; this.ui.totalTestsCountElem.textContent = this.state.totalTestsInPlan; this.ui.passedTestsCountElem.textContent = this.state.passedTests; this.ui.failedTestsCountElem.textContent = this.state.failedTests; this.ui.warningTestsCountElem.textContent = this.state.warningTests; const executedTests = this.state.passedTests + this.state.failedTests + this.state.warningTests; const progress = this.state.totalTestsInPlan > 0 ? (executedTests / this.state.totalTestsInPlan) * 100 : 0; if (this.ui.progressBar) this.ui.progressBar.style.width = `${progress}%`; if (this.ui.progressPercentage) this.ui.progressPercentage.textContent = `${Math.round(progress)}%`; },
    _updateFeedbackUI(newState) { if (!this.ui.resultsFeedback) return; this.ui.resultsFeedback.className = 'results-feedback'; this.ui.resultsFeedback.classList.add(newState); switch (newState) { case "failed": this.ui.resultsFeedbackIcon.innerHTML = SVG_FAIL_FEEDBACK; this.ui.resultsFeedbackTitle.textContent = 'Some tests failed'; this.ui.resultsFeedbackSubtitle.textContent = 'Something went wrong. Time for debugging!'; break; case "warning": this.ui.resultsFeedbackIcon.innerHTML = SVG_WARN_FEEDBACK; this.ui.resultsFeedbackTitle.textContent = 'Warnings found'; this.ui.resultsFeedbackSubtitle.textContent = 'The code works, but you might check a few things'; break; case "passed": this.ui.resultsFeedbackIcon.innerHTML = SVG_PASS_FEEDBACK; this.ui.resultsFeedbackTitle.textContent = 'Everything passed'; this.ui.resultsFeedbackSubtitle.textContent = 'Great work! All tests were successful.'; break; case "running": this.ui.resultsFeedbackIcon.innerHTML = SVG_WARN_FEEDBACK; this.ui.resultsFeedbackTitle.textContent = 'Test running'; this.ui.resultsFeedbackSubtitle.textContent = 'Please wait for the test to finish to see your results.'; break; } },
    _addSuite(suiteName) { const suiteCard = document.createElement('div'); suiteCard.className = 'result-suite-card'; const title = document.createElement('h2'); title.textContent = suiteName; const subtestsArea = document.createElement('div'); subtestsArea.className = 'subtests-area'; suiteCard.appendChild(title); suiteCard.appendChild(subtestsArea); this.ui.testSuitesContainer.appendChild(suiteCard); this.state.currentSuiteElement = suiteCard; this.state.currentSubtestElement = null; },
    _addSubtest(subtestName) { if (!this.state.currentSuiteElement) this._addSuite("General Tests"); const subtestDiv = document.createElement('div'); subtestDiv.className = 'result-subtest'; const title = document.createElement('h3'); title.textContent = subtestName; const itemsContainer = document.createElement('div'); itemsContainer.className = 'result-items-container'; subtestDiv.appendChild(title); subtestDiv.appendChild(itemsContainer); const subtestsArea = this.state.currentSuiteElement.querySelector('.subtests-area'); subtestsArea.appendChild(subtestDiv); this.state.currentSubtestElement = subtestDiv; },
    _createResultItem(message, status) { const item = document.createElement('div'); item.className = `result-item ${status}`; const iconSpan = document.createElement('span'); iconSpan.className = 'result-icon'; let iconHtml = ''; switch (status) { case 'passed': iconHtml = SVG_CHECK; break; case 'failed': iconHtml = SVG_CROSS; break; case 'warning': iconHtml = SVG_WARNING; break; case 'running': iconHtml = SPINNER_ICON; break; case 'info': iconHtml = SVG_INFO; break; } iconSpan.innerHTML = iconHtml; const messageSpan = document.createElement('span'); messageSpan.className = 'result-message flex-grow'; messageSpan.textContent = message; item.appendChild(iconSpan); item.appendChild(messageSpan); return item; },
    _readFilesAsText(files) { const filePromises = Array.from(files).map(file => { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = (e) => resolve({ name: file.name, content: e.target.result }); reader.onerror = (e) => reject(new Error(`Error reading file ${file.name}: ${e.target.error}`)); reader.readAsText(file); }); }); return Promise.all(filePromises); }
};

export default TestExecutionManager;
