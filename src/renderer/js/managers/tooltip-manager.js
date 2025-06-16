/**
 * Dieses Objekt verwaltet den Zustand und die Logik des Tooltips
 * mit einer robusten Architektur, die auf einer präzisen Analyse
 * von Maus-Events basiert, um Konflikte in komplexen Layouts zu vermeiden,
 * insbesondere in Electron-Titelleisten.
 */
const TooltipManager = {
    activeTooltip: null,
    activeTarget: null,
    hideTimeout: null,

    /**
     * Initialisiert den Manager.
     */
    init() {
        // Dieser Listener ist primär für das Anzeigen von Tooltips zuständig.
        document.body.addEventListener('mouseover', this.handleBodyMouseOver.bind(this));
        
        // Dieser Listener sorgt für das zuverlässige Verstecken des Tooltips,
        // wenn die Maus ein "heißes" Element (Ziel oder Tooltip) verlässt.
        document.body.addEventListener('mouseout', this.handleBodyMouseOut.bind(this));

        console.log("Definitive TooltipManager with advanced event logic initialized.");

        // Beobachtet, ob das Ziel-Element aus dem DOM entfernt wird.
        const observer = new MutationObserver(() => {
            if (this.activeTarget && !document.body.contains(this.activeTarget)) {
                this.hide(true);
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    },

    /**
     * Verarbeitet das Betreten eines Elements mit der Maus.
     * Hauptsächlich verantwortlich für das Anzeigen und Aktualisieren des Tooltips.
     * @param {MouseEvent} event 
     */
    handleBodyMouseOver(event) {
        const currentTarget = event.target;
        const newTarget = currentTarget.closest('[data-custom-tooltip]');
        const isOverTooltip = currentTarget.closest('.custom-tooltip');

        if (newTarget) {
            if (newTarget !== this.activeTarget) {
                this.show(newTarget);
            } else {
                this.clearHideTimeout();
            }
            return;
        }

        if (isOverTooltip) {
            this.clearHideTimeout();
        }
    },
    
    /**
     * Verarbeitet das Verlassen eines Elements mit der Maus.
     * Hauptsächlich verantwortlich für das zuverlässige Verstecken des Tooltips.
     * @param {MouseEvent} event 
     */
    handleBodyMouseOut(event) {
        if (!this.activeTarget) {
            return;
        }

        const newTarget = event.relatedTarget;

        if (!newTarget) {
            this.startHideTimeout();
            return;
        }

        const isStillOverTarget = this.activeTarget.contains(newTarget);
        const isStillOverTooltip = this.activeTooltip && this.activeTooltip.contains(newTarget);
        
        if (!isStillOverTarget && !isStillOverTooltip) {
            this.startHideTimeout();
        }
    },

    /**
     * Erstellt, positioniert und zeigt einen neuen Tooltip an.
     * @param {HTMLElement} target 
     */
    show(target) {
        this.clearHideTimeout();
        
        if (this.activeTooltip) {
            this.hide(true);
        }
        
        this.activeTarget = target;
        const text = target.dataset.customTooltip;

        const tooltip = document.createElement('div');
        tooltip.className = 'custom-tooltip';
        tooltip.innerHTML = text;
        
        document.body.appendChild(tooltip);
        this.activeTooltip = tooltip;

        // Wichtig: Positionierung aufrufen, *nachdem* der Tooltip im DOM ist.
        this.position(target, tooltip);

        requestAnimationFrame(() => {
            tooltip.classList.add('visible');
        });
    },

    startHideTimeout() {
        this.clearHideTimeout();
        this.hideTimeout = setTimeout(() => this.hide(false), 50);
    },
    
    clearHideTimeout() {
        clearTimeout(this.hideTimeout);
    },
    
    hide(immediately = false) {
        if (!this.activeTooltip) return;
        
        const tooltipToRemove = this.activeTooltip;
        
        this.activeTooltip = null;
        this.activeTarget = null;
        
        if (immediately) {
            if (tooltipToRemove.parentElement) tooltipToRemove.remove();
        } else {
            tooltipToRemove.classList.remove('visible');
            setTimeout(() => {
                if (tooltipToRemove.parentElement) tooltipToRemove.remove();
            }, 150);
        }
    },

    /**
     * Positioniert den Tooltip relativ zum Ziel-Element.
     * @param {HTMLElement} target 
     * @param {HTMLElement} tooltip 
     */
    position(target, tooltip) {
        const targetRect = target.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        const offset = 12;

        let top = targetRect.bottom + offset;
        tooltip.dataset.direction = 'bottom';

        if (top + tooltipRect.height > window.innerHeight - 10) {
            top = targetRect.top - tooltipRect.height - offset;
            tooltip.dataset.direction = 'top';
        }

        let left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
        
        if (left < 10) left = 10;
        else if (left + tooltipRect.width > window.innerWidth - 10) left = window.innerWidth - tooltipRect.width - 10;

        const finalLeft = Math.round(left);
        const finalTop = Math.round(top);

        tooltip.style.left = `${finalLeft}px`;
        tooltip.style.top = `${finalTop}px`;
        
        // --- PRÄZISE PFEIL-ZENTRIERUNG (NEUER ANSATZ) ---
        // Berechne die exakte Mitte des Ziels auf der X-Achse.
        const targetCenterX = targetRect.left + (targetRect.width / 2);
        
        // Die Position des Pfeil-Mittelpunkts (relativ zum Tooltip) ist die Differenz
        // zwischen der Ziel-Mitte und dem linken Rand des Tooltips.
        const arrowCenterInTooltip = targetCenterX - finalLeft;

        // Der Pfeil ist 12px breit. Um ihn zu zentrieren, setzen wir seine linke Kante
        // auf die berechnete Mitte minus die halbe Pfeilbreite (6px).
        tooltip.style.setProperty('--arrow-left', `${Math.round(arrowCenterInTooltip - 6)}px`);
    }
};

export default TooltipManager;
