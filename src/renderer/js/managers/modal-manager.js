console.log("modal-manager.js wird geladen...");

let modalOverlay, modalContainer, modalTitle, modalHeaderButtons, modalContent, modalActions;


function showModal(options = {}) {
    console.log("Die Funktion 'showModal' wurde aufgerufen mit den Optionen:", options);

    // TITLE
    if (modalTitle) {
        if (options.title) {
            modalTitle.textContent = options.title;
        } else {
            modalTitle.textContent = 'Title';
        }
    }

    // HEADER BUTTONS
    if (modalHeaderButtons) {
        modalHeaderButtons.innerHTML = '';

        if (options.headerButtons && Array.isArray(options.headerButtons)) {

            options.headerButtons.forEach(btnConfig => {

                const button = document.createElement('label');
                button.className = btnConfig.class || 'modal-header-button';
                if (btnConfig.tooltip) {
                    button.dataset.customTooltip = btnConfig.tooltip;
                }
                if (btnConfig.svg) {
                    button.innerHTML = btnConfig.svg;
                }

                if (btnConfig.onClick && typeof btnConfig.onClick === 'function') {
                    button.addEventListener('click', (event) => {
                        if (btnConfig.onClick) {
                            btnConfig.onClick({
                                close: () => modalOverlay.classList.add('hidden-alt')
                            }, event);
                        }
                    });
                }

                modalHeaderButtons.appendChild(button);
            });
        }
    }

    // SIZE
    if (modalContainer) {
        modalContainer.classList.remove('size-small', 'size-medium', 'size-large');

        if (options.size && ['small', 'medium', 'large'].includes(options.size)) {
            modalContainer.classList.add(`size-${options.size}`); // z.B. wird aus 'medium' die Klasse 'size-medium'
        } else {
            // Optional: Füge eine Standard-Größe hinzu, falls keine angegeben wurde.
            modalContainer.classList.add('size-medium');
        }
    }

    // CONTENT
    if (modalContent) {
        
        modalContent.innerHTML = '';

        if(options.contentTree) {
            const newContent = buildElement(options.contentTree);
            modalContent.appendChild(newContent);
        } else if(options.content) {
            modalContent.innerHTML = options.content;
        }
    }

    // ACTION BUTTONS
    if (modalActions) {

        modalActions.innerHTML = '';

        if (options.actionButtons && Array.isArray(options.actionButtons)) {

            options.actionButtons.forEach(btnConfig => {

                const button = document.createElement('label');
                button.textContent = btnConfig.text || '';
                button.className = btnConfig.class || 'button-default';
                if (btnConfig.tooltip) {
                    button.dataset.customTooltip = btnConfig.tooltip;
                }
                if (btnConfig.onClick && typeof btnConfig.onClick === 'function') {
                    button.addEventListener('click', (event) => {
                        btnConfig.onClick({
                            close: () => modalOverlay.classList.add('hidden-alt')
                        }, event);
                    });
                }

                modalActions.appendChild(button);
            });
        }
    }

    if (modalOverlay) {
        modalOverlay.classList.remove('hidden-alt');
    }
}

function buildElement(config) {

    const element = document.createElement(config.tag);

    if (config.props) {
        for (const [key, value] of Object.entries(config.props)) {

            if (key.startsWith('on') && typeof value === 'function') {
                element.addEventListener(key.substring(2).toLocaleLowerCase(), value);
            } else {
                element[key] = value;
            }
        }
    }

    if (config.children) {
        config.children.forEach(childConfig => {

            const childElement = buildElement(childConfig);
            element.appendChild(childElement);
        });
    }

    return element;
}

export function initializeModalSystem() {
    console.log("Initialisiere das Modal-System...");

    // Hole die Referenzen zu allen neuen Modal-Elementen aus dem HTML.
    modalOverlay = document.getElementById('modalOverlay');
    modalContainer = document.getElementById('modalContainer');
    modalTitle = document.getElementById('modalTitle');
    modalHeaderButtons = document.getElementById('modalHeaderButtons');
    modalContent = document.getElementById('modalContent');
    modalActions = document.getElementById('modalActions');

    // Ein kleiner Test, ob alle wichtigen Elemente gefunden wurden.
    if (!modalOverlay || !modalContainer || !modalTitle || !modalContent || !modalActions) {
        console.error("Ein oder mehrere Modal-Elemente konnten im DOM nicht gefunden werden!");
        // Wir geben eine leere Funktion zurück, damit die App nicht abstürzt.
        return { showModal: () => console.error("Modal-System nicht korrekt initialisiert.") };
    }

    console.log("Modal-System erfolgreich initialisiert. Die 'showModal'-Funktion ist jetzt bereit.");

    // Gib die Hauptfunktion zurück, damit andere Teile der App sie verwenden können.
    return { showModal };
}