// --- Imports & Constants ---
const SVG_INFO = `<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M10.5,9H13.5V7H10.5Z M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M10.5,17H13.5V11H10.5V17Z" /></svg>`;
const SVG_PIN = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8.5" r="4.5" fill="none" stroke="currentColor" stroke-width="2.5"/><line x1="12" y1="13" x2="12" y2="19.25" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>';
const SVG_CLOSE = `<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
const MANIFEST_URL = 'https://gist.github.com/MarlonGrazek/6bffda46a3510f9556b9843aba7d6484/raw';

// --- Module-level State & Variables ---
let showModal;
let onStartTest;

// DOM Elements
let pinBox, pinBoxTitle, pinBoxSubtitle, testListContainer, codeUploadSection,
    selectedTestNameElem, fileUploadInput, fileSelectionInfo, runTestButton;

// State
let latestManifestData = null;
let pinnedTestId = localStorage.getItem('pinnedTestId');
let selectedTestConfig = null;
let selectedFiles = null;
const countdownIntervals = new Map();

/**
 * Initializes the Test UI Manager.
 * @param {object} dependencies - Required external functions and objects.
 */
export async function initializeTestUIManager(dependencies) {
    showModal = dependencies.showModal;
    onStartTest = dependencies.onStartTest;

    // Query all DOM elements this module controls
    pinBox = document.getElementById('pinBox');
    pinBoxTitle = document.getElementById('pinBoxTitle');
    pinBoxSubtitle = document.getElementById('pinBoxSubtitle');
    testListContainer = document.getElementById('testListContainer');
    codeUploadSection = document.getElementById('codeUploadSection');
    selectedTestNameElem = document.getElementById('selectedTestName');
    fileUploadInput = document.getElementById('fileUpload');
    fileSelectionInfo = document.getElementById('fileSelectionInfo');
    runTestButton = document.getElementById('runTestButton');

    // Bind all event listeners
    if (pinBox) pinBox.addEventListener('click', _handlePinBoxClick);
    if (fileUploadInput) fileUploadInput.addEventListener('change', _handleFileUpload);
    if (runTestButton) runTestButton.addEventListener('click', _handleRunTestClick);
    
    // Load initial data and render the UI
    try {
        const data = await _fetchManifest();
        latestManifestData = data;
        updatePinBox();
        _renderTestList(); 
    } catch (error) {
        console.error("Could not initialize tests:", error);
        if(testListContainer) testListContainer.innerHTML = '<p class="text-secondary text-center">Could not load tests.</p>';
    }
}

/**
 * Fetches the test manifest from the server.
 * @private
 */
async function _fetchManifest() {
    try {
        const response = await fetch(MANIFEST_URL, { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`Failed to fetch manifest: ${response.status} ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching manifest:", error);
        throw error;
    }
}

/**
 * Updates the Pin Box UI based on the currently pinned test.
 */
function updatePinBox() {
    if (!pinBox || !pinBoxTitle || !pinBoxSubtitle) return;

    const testToDisplay = (pinnedTestId && latestManifestData?.tests) 
        ? latestManifestData.tests.find(t => t.id === pinnedTestId) 
        : null;

    if (testToDisplay) {
        pinBoxTitle.textContent = testToDisplay.title;
        if (testToDisplay.dueDate) {
            pinBoxSubtitle.style.display = 'block';
            _startCountdownTimer(testToDisplay.dueDate, pinBoxSubtitle, 'pinBox');
        } else {
            if (countdownIntervals.has('pinBox')) clearInterval(countdownIntervals.get('pinBox'));
            pinBoxSubtitle.textContent = "No due date";
            pinBoxSubtitle.removeAttribute('data-custom-tooltip');
        }
        pinBox.classList.remove('hidden-alt');
    } else {
        if (countdownIntervals.has('pinBox')) clearInterval(countdownIntervals.get('pinBox'));
        pinBox.classList.add('hidden-alt');
    }
}

/**
 * Renders the list of available tests.
 * @private
 */
function _renderTestList() {
    if (!testListContainer) return;
    testListContainer.innerHTML = '';

    if (!latestManifestData?.tests || latestManifestData.tests.length === 0) {
        testListContainer.innerHTML = '<p class="text-secondary text-center">No tests available.</p>';
        return;
    }

    latestManifestData.tests.forEach(test => {
        const card = document.createElement('div');
        card.className = 'test-card';
        card.dataset.testId = test.id;
        card.innerHTML = `<h3>${test.title}</h3>`;

        const infoButton = document.createElement('button');
        infoButton.className = 'test-card-info-button';
        infoButton.innerHTML = SVG_INFO;
        infoButton.setAttribute('aria-label', `Info for ${test.title}`);
        infoButton.dataset.customTooltip = `Show details for "${test.title}"`;
        
        infoButton.addEventListener('click', (event) => {
            event.stopPropagation();
            _openTestInfoModal(test);
        });
        
        card.appendChild(infoButton);
        card.addEventListener('click', () => _handleTestSelection(test, card));
        testListContainer.appendChild(card);
    });
}

/**
 * Handles the click on a test card to select it.
 * @private
 */
function _handleTestSelection(test, selectedCardElement) {
    selectedTestConfig = test;
    document.querySelectorAll('.test-card.selected').forEach(card => card.classList.remove('selected'));
    selectedCardElement.classList.add('selected');
    
    if (selectedTestNameElem) selectedTestNameElem.textContent = test.title;
    if (codeUploadSection) codeUploadSection.classList.remove('hidden-alt');
    
    if (fileUploadInput) fileUploadInput.value = '';
    if (fileSelectionInfo) fileSelectionInfo.textContent = '';
    selectedFiles = null;
    
    _updateRunTestButtonState(); 
    codeUploadSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Handles the file input change event.
 * @private
 */
function _handleFileUpload(event) {
    if (event.target.files?.length > 0) {
        selectedFiles = event.target.files;
        if(fileSelectionInfo) fileSelectionInfo.textContent = `${selectedFiles.length} Datei(en) ausgewählt.`;
    } else {
        selectedFiles = null;
        if(fileSelectionInfo) fileSelectionInfo.textContent = '';
    }
    _updateRunTestButtonState();
}

/**
 * Enables or disables the 'Run Test' button based on current state.
 * @private
 */
function _updateRunTestButtonState() {
    if (runTestButton) {
        runTestButton.disabled = !(selectedTestConfig && selectedFiles);
    }
}

/**
 * Handles the click on the 'Run Test' button, firing the onStartTest callback.
 * @private
 */
function _handleRunTestClick() {
    if (!onStartTest) {
        console.error("onStartTest callback is not defined!");
        return;
    }
    if (selectedTestConfig && selectedFiles) {
        onStartTest(selectedTestConfig, selectedFiles);
    }
}

/**
 * Handles clicks on the main Pin Box to open the info modal for the pinned test.
 * @private
 */
function _handlePinBoxClick() {
    if (!pinnedTestId || !latestManifestData?.tests) return;
    const pinnedTest = latestManifestData.tests.find(t => t.id === pinnedTestId);
    if (pinnedTest) {
        _openTestInfoModal(pinnedTest);
    }
}

/**
 * The central function to prepare and display a detailed modal for a given test.
 * @private
 */
function _openTestInfoModal(test) {
    let contentHtml = '';
    const flagsContainer = document.createElement('div');
    flagsContainer.className = 'modal-flags-container';
    let hasFlagsContent = false;
    
    let countdownElementId = null;
    if (test.dueDate) {
        countdownElementId = `modal-countdown-${test.id}`;
        const countdownEl = document.createElement('span');
        countdownEl.id = countdownElementId;
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

    if(hasFlagsContent) {
        contentHtml += flagsContainer.outerHTML;
    }
    contentHtml += _parseMarkup(test.description || "No description available.");

    const headerButtons = [];
    const isPinned = pinnedTestId === test.id;
    
    headerButtons.push({
        class: isPinned ? 'modal-header-button pin-button active' : 'modal-header-button pin-button',
        svg: SVG_PIN,
        tooltip: isPinned ? 'Unpin this test' : 'Pin this test',
        onClick: (_, event) => {
            pinnedTestId = (pinnedTestId === test.id) ? null : test.id;
            localStorage.setItem('pinnedTestId', pinnedTestId || '');
            if (!pinnedTestId) localStorage.removeItem('pinnedTestId');
            
            const buttonEl = event.currentTarget;
            buttonEl.classList.toggle('active', !!pinnedTestId);
            buttonEl.innerHTML = SVG_PIN;
            buttonEl.dataset.customTooltip = pinnedTestId ? 'Unpin this test' : 'Pin this test';
            updatePinBox();
        }
    });

    headerButtons.push({
        class: 'modal-header-button close-button',
        tooltip: 'Close',
        svg: SVG_CLOSE,
        onClick: (modal) => modal.close()
    });

    const actionButtons = [];
    if (test.submissionPage) {
        actionButtons.push({
            text: 'Submit Solution',
            class: 'button-primary',
            tooltip: 'Go to the submission page',
            onClick: () => {
                if (window.electronAPI?.openExternalLink) {
                    window.electronAPI.openExternalLink(test.submissionPage);
                } else {
                    console.error('window.electronAPI.openExternalLink is not available!');
                }
            }
        });
    }
    
    showModal({
        title: test.title,
        size: 'large',
        content: contentHtml,
        headerButtons: headerButtons,
        actionButtons: actionButtons,
    });

    if (countdownElementId) {
        const el = document.getElementById(countdownElementId);
        if(el) _startCountdownTimer(test.dueDate, el, `modal_${test.id}`);
    }
}

/**
 * Starts a countdown timer for a given element, managed by a unique key.
 * Also sets a detailed tooltip with the full date.
 * @private
 */
function _startCountdownTimer(targetDateString, element, key) {
    if (countdownIntervals.has(key)) clearInterval(countdownIntervals.get(key));
    
    const targetDate = new Date(targetDateString);
    if (!element || isNaN(targetDate.getTime())) {
        if(element) element.textContent = "Invalid date";
        return;
    }

    const fullDateTime = new Intl.DateTimeFormat('en-US', { dateStyle: 'full', timeStyle: 'short' }).format(targetDate);
    element.dataset.customTooltip = `Due by: ${fullDateTime}`;
    
    const updateTimer = () => {
        const timeLeft = targetDate.getTime() - Date.now();
        element.textContent = _formatCountdown(timeLeft);
        if (timeLeft <= 0) {
            clearInterval(countdownIntervals.get(key));
            countdownIntervals.delete(key);
        }
    };
    updateTimer();
    countdownIntervals.set(key, setInterval(updateTimer, 1000));
}

/**
 * Formats milliseconds into a human-readable countdown string.
 * @private
 */
function _formatCountdown(milliseconds) {
    if (milliseconds <= 0) return "Expired";
    const d = Math.floor(milliseconds / 86400000);
    const h = Math.floor((milliseconds % 86400000) / 3600000);
    const m = Math.floor((milliseconds % 3600000) / 60000);
    const s = Math.floor((milliseconds % 60000) / 1000);
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

/**
 * Parses simple markup into safe HTML.
 * @private
 */
function _parseMarkup(text) {
    if (typeof text !== 'string') return '';
    let safeText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    safeText = safeText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    safeText = safeText.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    safeText = safeText.replace(/\n/g, '<br>');
    return `<div class="modal-description-text">${safeText}</div>`;
}
