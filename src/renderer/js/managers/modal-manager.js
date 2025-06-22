/**
 * ModalManager
 * Verwaltet das Erstellen, Anzeigen und Schließen von Modals.
 * Jedes Modal ist eine unabhängige Instanz, die dynamisch erstellt
 * und zerstört wird. Dies ermöglicht das Stapeln von mehreren Modals.
 */
const ModalManager = {

    // Ein Stack, um alle aktiven Modals zu verwalten.
    stack: [],

    /**
     * Erstellt und zeigt ein neues Modal basierend auf den übergebenen Optionen.
     * @param {object} options - Konfiguration für das Modal.
     * @param {string} options.title - Der Titel des Modals.
     * @param {string} [options.size='medium'] - Größe des Modals ('small', 'medium', 'large').
     * @param {string|object} options.content - HTML-String oder eine contentTree-Struktur.
     * @param {Array<object>} [options.actionButtons] - Konfiguration für die Action-Buttons.
     * @param {Array<object>} [options.headerButtons] - Konfiguration für die Header-Buttons.
     * @returns {HTMLElement} Das erstellte Modal-Overlay-Element.
     */
    show(options = {}) {
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';

        const modalContainer = document.createElement('div');
        modalContainer.className = 'modal-container';
        const sizeClass = `size-${options.size || 'medium'}`;
        modalContainer.classList.add(sizeClass);

        const modalHeader = document.createElement('div');
        modalHeader.className = 'modal-header';

        const modalTitle = document.createElement('h3');
        modalTitle.className = 'modal-title';
        modalTitle.textContent = options.title || 'Information';
        
        const modalHeaderButtons = document.createElement('div');
        modalHeaderButtons.className = 'modal-header-buttons';

        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';

        const modalActions = document.createElement('div');
        modalActions.className = 'modal-actions';

        if (options.headerButtons) {
            options.headerButtons.forEach(btnConfig => {
                const button = this._buildButton(btnConfig, () => this.close(modalOverlay));
                modalHeaderButtons.appendChild(button);
            });
        }
        
        if (options.contentTree) {
            const contentElement = this._buildElementFromTree(options.contentTree);
            modalContent.appendChild(contentElement);
        } else if (options.content) {
            modalContent.innerHTML = options.content;
        }

        if (options.actionButtons) {
            options.actionButtons.forEach(btnConfig => {
                const button = this._buildButton(btnConfig, () => this.close(modalOverlay));
                modalActions.appendChild(button);
            });
        }

        modalHeader.appendChild(modalTitle);
        modalHeader.appendChild(modalHeaderButtons);
        modalContainer.appendChild(modalHeader);
        modalContainer.appendChild(modalContent);
        modalContainer.appendChild(modalActions);
        modalOverlay.appendChild(modalContainer);

        document.body.appendChild(modalOverlay);

        this.stack.push(modalOverlay);

        requestAnimationFrame(() => {
            modalOverlay.classList.add('visible');
            modalContainer.classList.add('visible');
        });
        
        return modalOverlay;
    },

    /**
     * Schließt ein bestimmtes Modal.
     * @param {HTMLElement} modalOverlay - Das zu schließende Modal-Overlay-Element.
     */
    close(modalOverlay) {
        if (!modalOverlay || !this.stack.includes(modalOverlay)) {
            console.warn("Modal to close not found or not in stack.", modalOverlay);
            return;
        }

        const modalContainer = modalOverlay.querySelector('.modal-container');

        modalOverlay.classList.remove('visible');
        if(modalContainer) modalContainer.classList.remove('visible');

        this.stack = this.stack.filter(m => m !== modalOverlay);

        // KORREKTUR: Dauer auf 200ms reduziert für ein schnelleres Gefühl.
        setTimeout(() => {
            if (modalOverlay.parentElement) {
                modalOverlay.remove();
            }
        }, 0);
    },

    /**
     * Schließt das oberste Modal im Stack.
     */
    closeTop() {
        if (this.stack.length > 0) {
            const topModal = this.stack[this.stack.length - 1];
            this.close(topModal);
        }
    },

    _buildButton(config, closeCallback) {
        const button = document.createElement('label');
        button.textContent = config.text || '';
        if (config.svg) button.innerHTML = config.svg;
        button.className = config.class || 'button-default';
        if (config.tooltip) button.dataset.customTooltip = config.tooltip;

        if (config.onClick && typeof config.onClick === 'function') {
            button.addEventListener('click', (event) => {
                config.onClick({ close: closeCallback }, event);
            });
        }
        return button;
    },

    // ERSETZEN SIE DIESE FUNKTION IN ModalManager.js
_buildElementFromTree(config) {
    const element = document.createElement(config.tag);
    if (config.props) {
        for (const [key, value] of Object.entries(config.props)) {
            if (key.startsWith('on') && typeof value === 'function') {
                element.addEventListener(key.substring(2).toLowerCase(), value);
            }
            else if (key.startsWith('data-')) element.setAttribute(key, value);
            else element[key] = value;
        }
    }
    if (config.children) {
        config.children.forEach(childConfig => {
            const childElement = this._buildElementFromTree(childConfig);
            element.appendChild(childElement);
        });
    }
    return element;
}
};

export default ModalManager;
