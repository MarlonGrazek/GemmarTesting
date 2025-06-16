// src/renderer/js/managers/test-run-manager.js

// --- SVG Icons for Results ---
const SVG_CHECK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
const SVG_CROSS = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
const SVG_WARNING = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
const SVG_INFO = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
const SPINNER_ICON = `<div class="result-icon-placeholder"></div>`; // A placeholder for the CSS spinner

const SVG_FAIL = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
const SVG_WARN = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
const SVG_PASS = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;

// --- Module-level State & Variables ---
let showModal;
let electronAPI;
let javaTestEventListenerUnsubscribe = null;

// DOM Elements for the results page
let resultsPlaceholder, resultsContent, runningTestNameElem,
    progressBar, progressPercentage, totalTestsCountElem, passedTestsCountElem,
    failedTestsCountElem, warningTestsCountElem, testSuitesContainer,
    resultsFeedback, resultsFeedbackIcon, resultsFeedbackTitle, resultsFeedbackSubtitle;

// State for the current test run
let state = {
    totalTestsInPlan: 0,
    passedTests: 0,
    failedTests: 0,
    warningTests: 0,
    currentSuiteElement: null,
    currentSubtestElement: null,
    currentTestConfig: null,
};

/**
 * Initializes the Test Runner module.
 * @param {object} dependencies - Required external functions and objects.
 */
export function initializeTestRunner(dependencies) {
    showModal = dependencies.showModal;
    electronAPI = dependencies.electronAPI;

    _queryDOMElements();
}

/**
 * The main entry point to start a test run.
 * @param {object} testConfig - The configuration object for the selected test.
 * @param {FileList} files - The list of user-selected files.
 */
export async function startTestRun(testConfig, files) {
    if (!testConfig || !files || files.length === 0) {
        showModal({ title: "Error", content: "Cannot start test run without a selected test and files." });
        return;
    }

    state.currentTestConfig = testConfig;

    _resetResultsState();
    _updateFeedbackDisplay('running');

    // UI-Umschaltung: Platzhalter ausblenden, Ergebnisse einblenden
    if (resultsPlaceholder) resultsPlaceholder.classList.add('hidden-alt');
    if (resultsContent) resultsContent.classList.remove('hidden-alt');
    if (runningTestNameElem) runningTestNameElem.textContent = testConfig.title;

    try {
        const userFileContents = await _readFilesAsText(files);

        if (javaTestEventListenerUnsubscribe) javaTestEventListenerUnsubscribe();

        javaTestEventListenerUnsubscribe = window.electronAPI.receive('java-test-event', _handleJavaTestEvent);
        console.log("Java test event listener registered.");

        window.electronAPI.send('run-java-test', {
            userFiles: userFileContents,
            testConfig: {
                testLogicFileUrl: testConfig.filePath,
                mainTestClassName: testConfig.mainTestClassName,
                userCodeEntryClassFQN: testConfig.userCodeEntryClassFQN,
                expectedInterfaceName: testConfig.expectedInterfaceName
            }
        });

    } catch (error) {
        console.error("Error preparing files for test run:", error);
        _logResult(`Error reading uploaded files: ${error.message}`, 'failed');
        _handleJavaTestEvent({ event: 'run_finish', duration: "Preparation Error" });
    }
}

// --- Private Helper Functions ---

/**
 * Queries and assigns all necessary DOM elements for the results page.
 */
function _queryDOMElements() {
    resultsPlaceholder = document.getElementById('resultsPlaceholder');
    resultsContent = document.getElementById('resultsContent');
    runningTestNameElem = document.getElementById('runningTestName');

    // KORREKTUR: Zielt auf das neue Füllelement
    progressBar = document.getElementById('progressBarFill');

    progressPercentage = document.getElementById('progressPercentage');
    totalTestsCountElem = document.getElementById('totalTestsCount');
    passedTestsCountElem = document.getElementById('passedTestsCount');
    failedTestsCountElem = document.getElementById('failedTestsCount');
    warningTestsCountElem = document.getElementById('warningTestsCount');
    testSuitesContainer = document.getElementById('testSuitesContainer');

    resultsFeedback = document.getElementById('resultsFeedback');
    resultsFeedbackIcon = document.getElementById('resultsFeedbackIcon');
    resultsFeedbackTitle = document.getElementById('resultsFeedbackTitle');
    resultsFeedbackSubtitle = document.getElementById('resultsFeedbackSubtitle');
}


/**
 * Reads a list of files and returns their content as an array of objects.
 * @param {FileList} files - The FileList object from a file input.
 * @returns {Promise<Array<{name: string, content: string}>>}
 */
function _readFilesAsText(files) {
    const filePromises = Array.from(files).map(file => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve({ name: file.name, content: e.target.result });
            reader.onerror = (e) => reject(new Error(`Error reading file ${file.name}: ${e}`));
            reader.readAsText(file);
        });
    });
    return Promise.all(filePromises);
}

/**
 * Resets all statistics and clears the results container for a new run.
 */
function _resetResultsState() {
    state.totalTestsInPlan = 0;
    state.passedTests = 0;
    state.failedTests = 0;
    state.warningTests = 0;
    state.currentSuiteElement = null;
    state.currentSubtestElement = null;
    if (testSuitesContainer) testSuitesContainer.innerHTML = '';

    _updateSummaryDisplay();
    if (progressBar) progressBar.style.width = `0%`;
    if (progressPercentage) progressPercentage.textContent = `0%`;
}

/**
 * Updates the summary display (counters and progress bar).
 */

function _updateFeedbackDisplay(newState) {

    if (!resultsFeedback || !resultsFeedbackIcon || !resultsFeedbackTitle || !resultsFeedbackSubtitle) {
        console.log('A results-feedback element is not available');
        return;
    }

    resultsFeedback.classList.remove('failed');
    resultsFeedback.classList.remove('warning');
    resultsFeedback.classList.remove('passed');
    resultsFeedback.classList.remove('running');

    switch (newState) {
        case "failed":
            resultsFeedback.classList.add('failed');
            resultsFeedbackIcon.innerHTML = SVG_FAIL;
            resultsFeedbackTitle.textContent = 'Some tests failed';
            resultsFeedbackSubtitle.textContent = 'Something went wrong. Time for debugging!';
            break;
        case "warning":
            resultsFeedback.classList.add('warning');
            resultsFeedbackIcon.innerHTML = SVG_WARN;
            resultsFeedbackTitle.textContent = 'Warnings found';
            resultsFeedbackSubtitle.textContent = 'The code works, but you might check a few things';
            break;
        case "passed":
            resultsFeedback.classList.add('passed');
            resultsFeedbackIcon.innerHTML = SVG_PASS;
            resultsFeedbackTitle.textContent = 'Everything passed';
            resultsFeedbackSubtitle.textContent = 'Great work! All tests were successful.';
            break;
        case "running":
            resultsFeedback.classList.add('running');
            resultsFeedbackIcon.innerHTML = SVG_WARN;
            resultsFeedbackTitle.textContent = 'Test running';
            resultsFeedbackSubtitle.textContent = 'Please wait for the test to finish to see your results.';
            break;
        default:
            console.log('There was an error generating the results feedback');
    }
}

function _updateSummaryDisplay() {
    if (totalTestsCountElem) totalTestsCountElem.textContent = state.totalTestsInPlan;
    if (passedTestsCountElem) passedTestsCountElem.textContent = state.passedTests;
    if (failedTestsCountElem) failedTestsCountElem.textContent = state.failedTests;
    if (warningTestsCountElem) warningTestsCountElem.textContent = state.warningTests;

    const executedTests = state.passedTests + state.failedTests + state.warningTests;
    const progress = state.totalTestsInPlan > 0 ? (executedTests / state.totalTestsInPlan) * 100 : 0;

    if (progressBar) progressBar.style.width = `${progress}%`;
    if (progressPercentage) progressPercentage.textContent = `${Math.round(progress)}%`;
}

/**
 * Creates a DOM element for a single result item (e.g., one assertion).
 * @param {string} message - The message to display.
 * @param {string} status - 'passed', 'failed', 'warning', 'info', or 'running'.
 * @returns {HTMLElement}
 */
function _createResultItem(message, status) {
    const item = document.createElement('div');
    item.className = `result-item ${status}`;
    let iconHtml = '';
    switch (status) {
        case 'passed': iconHtml = SVG_CHECK; break;
        case 'failed': iconHtml = SVG_CROSS; break;
        case 'warning': iconHtml = SVG_WARNING; break;
        case 'running': iconHtml = SPINNER_ICON; break;
        case 'info': iconHtml = SVG_INFO; break;
    }
    item.innerHTML = `<span class="result-icon">${iconHtml}</span><span class="result-message flex-grow">${message}</span>`;
    return item;
}

/**
 * Adds a new test suite section to the results container.
 * @param {string} suiteName - The name of the test suite.
 */
function _addSuite(suiteName) {
    const suiteCard = document.createElement('div');
    suiteCard.className = 'result-suite-card';
    suiteCard.innerHTML = `<h2>${suiteName}</h2><div class="subtests-area"></div>`;
    testSuitesContainer.appendChild(suiteCard);
    state.currentSuiteElement = suiteCard;
    state.currentSubtestElement = null;
}

/**
 * Adds a new subtest section within the current suite.
 * @param {string} subtestName - The name of the subtest.
 */
function _addSubtest(subtestName) {
    if (!state.currentSuiteElement) {
        _addSuite("General Tests");
    }
    const subtestDiv = document.createElement('div');
    subtestDiv.className = 'result-subtest';
    subtestDiv.innerHTML = `<h3>${subtestName}</h3><div class="result-items-container"></div>`;

    const subtestsArea = state.currentSuiteElement.querySelector('.subtests-area');
    subtestsArea.appendChild(subtestDiv);
    state.currentSubtestElement = subtestDiv;
}

/**
 * Logs a result message to the appropriate container in the UI.
 * @param {string} message - The message to log.
 * @param {string} status - 'passed', 'failed', 'warning', or 'info'.
 */
function _logResult(message, status = 'info') {
    let targetContainer;
    if (state.currentSubtestElement) {
        targetContainer = state.currentSubtestElement.querySelector('.result-items-container');
    } else if (state.currentSuiteElement) {
        targetContainer = state.currentSuiteElement.querySelector('.subtests-area');
    } else {
        _addSuite("General Logs");
        targetContainer = state.currentSuiteElement.querySelector('.subtests-area');
    }

    if (targetContainer) {
        targetContainer.appendChild(_createResultItem(message, status));
    }

    if (status === 'passed') state.passedTests++;
    else if (status === 'failed') state.failedTests++;
    else if (status === 'warning') state.warningTests++;

    _updateSummaryDisplay();
}

/**
 * Handles incoming test events from the Java backend via IPC.
 * @param {object} eventData - The event data from the backend.
 */
function _handleJavaTestEvent(eventData) {
    console.log("Java Test Event received:", eventData);

    switch (eventData.event) {
        case 'run_start':
            _updateSummaryDisplay();
            break;

        case 'suite_start':
            _addSuite(eventData.name);
            break;

        case 'subtest_start':
            _addSubtest(eventData.name);
            break;

        case 'assert':
            state.totalTestsInPlan++;
            _logResult(eventData.message, eventData.status.toLowerCase());
            break;

        case 'log':
            const level = eventData.level?.toLowerCase() || 'info';
            _logResult(eventData.message, level === 'warn' ? 'warning' : 'info');
            break;

        case 'run_finish':
            if (progressPercentage) {
                progressPercentage.textContent = `Finished in ${eventData.duration} ms`;
            }
            _updateSummaryDisplay();

            if (state.failedTests != 0) _updateFeedbackDisplay('failed');
            else if (state.warningTests != 0) _updateFeedbackDisplay('warning');
            else _updateFeedbackDisplay('passed');

            const summaryMessage = `Test run for "${state.currentTestConfig.title}" completed.<br>
                                  Result: ${state.passedTests} Passed, ${state.failedTests} Failed, ${state.warningTests} Warnings.`;
            showModal({
                title: "Test Run Finished",
                content: summaryMessage,
                size: 'medium',
                actionButtons: [
                    {
                        text: 'Okay',
                        class: 'button-primary',
                        onClick: (modal) => modal.close()
                    }
                ]
            });
            break;

        default:
            console.warn("Unknown Java test event:", eventData);
    }
}
