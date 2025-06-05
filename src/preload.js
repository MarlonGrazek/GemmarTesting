// src/preload.js
// Dieses Skript läuft in einem privilegierten Kontext, bevor die Webseite im Renderer geladen wird.
// Es stellt eine Brücke zur Verfügung, um sicher mit dem Main-Prozess zu kommunizieren (IPC).
// Node.js-APIs sind hier verfügbar, aber es teilt kein globales Window-Objekt mit dem Renderer.

const { contextBridge, ipcRenderer } = require('electron');

// Definiert eine Whitelist von Kanälen, die für die IPC-Kommunikation verwendet werden dürfen.
// Dies ist eine Sicherheitsmaßnahme, um zu verhindern, dass beliebige Kanäle verwendet werden.
const validSendChannels = [
    'run-java-test',
    'minimize-window',    // NEU für Fenstersteuerung
    'maximize-window',    // NEU für Fenstersteuerung
    'close-window'        // NEU für Fenstersteuerung
];
const validReceiveChannels = ['java-test-event']; // Nur 'java-test-event' vom Main zum Renderer
const validInvokeChannels = ['open-external-link']; // Für invoke/handle-Muster

// Stellt dem Renderer-Prozess über `window.electronAPI` definierte Funktionen zur Verfügung.
contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Sendet eine Nachricht vom Renderer-Prozess an den Main-Prozess über einen bestimmten Kanal.
   * @param {string} channel Der IPC-Kanal.
   * @param {any} data Die zu sendenden Daten.
   */
  send: (channel, data) => {
    if (validSendChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    } else {
      console.warn(`Preload: Ungültiger Sende-Kanal versucht: ${channel}`);
    }
  },

  /**
   * Registriert eine Callback-Funktion, die aufgerufen wird, wenn eine Nachricht
   * vom Main-Prozess auf einem bestimmten Kanal empfangen wird.
   * @param {string} channel Der IPC-Kanal.
   * @param {Function} func Die Callback-Funktion, die die empfangenen Daten verarbeitet.
   * @returns {Function} Eine Funktion, um den registrierten Listener wieder zu entfernen.
   */
  receive: (channel, func) => {
    if (validReceiveChannels.includes(channel)) {
      // Definiert den Listener und leitet die Argumente sicher weiter.
      const listener = (event, ...args) => func(...args);
      ipcRenderer.on(channel, listener);

      // Gibt eine Funktion zurück, mit der der Listener explizit entfernt werden kann.
      return () => {
        ipcRenderer.removeListener(channel, listener);
      };
    } else {
      console.warn(`Preload: Ungültiger Empfangs-Kanal versucht: ${channel}`);
      return () => {}; // Leere Funktion, um Fehler im aufrufenden Code zu vermeiden.
    }
  },

  /**
   * Entfernt alle Listener für einen bestimmten Kanal.
   * Nützlich, um Speicherlecks zu vermeiden, z.B. bei Komponenten-Unmounts in Frameworks.
   * @param {string} channel Der Kanal, von dem alle Listener entfernt werden sollen.
   */
  removeAllListeners: (channel) => {
    if (validReceiveChannels.includes(channel)) { // Nur für bekannte Empfangskanäle erlauben
        ipcRenderer.removeAllListeners(channel);
    } else {
        console.warn(`Preload: Versuch, Listener von ungültigem/nicht gelisteten Kanal zu entfernen: ${channel}`);
    }
  },

  /**
   * Fordert den Main-Prozess auf, eine URL im externen Standardbrowser zu öffnen.
   * Verwendet das invoke/handle Muster für eine Promise-basierte Antwort.
   * @param {string} url Die zu öffnende URL.
   * @returns {Promise<{success: boolean, error?: string}>} Ein Promise, das den Erfolg der Operation anzeigt.
   */
  openExternalLink: (url) => {
    if (validInvokeChannels.includes('open-external-link')) {
        if (url && (url.startsWith('http:') || url.startsWith('https:'))) {
            return ipcRenderer.invoke('open-external-link', url);
        } else {
            console.error('Preload: Ungültige URL für openExternalLink:', url);
            return Promise.resolve({ success: false, error: 'Ungültige URL' });
        }
    } else {
        console.warn(`Preload: Ungültiger Invoke-Kanal versucht: open-external-link`);
        return Promise.resolve({ success: false, error: 'Ungültiger Invoke-Kanal' });
    }
  },

  // NEUE Funktionen für Fenstersteuerung
  minimizeWindow: () => {
    if (validSendChannels.includes('minimize-window')) {
        ipcRenderer.send('minimize-window');
    }
  },
  maximizeWindow: () => {
    if (validSendChannels.includes('maximize-window')) {
        ipcRenderer.send('maximize-window');
    }
  },
  closeWindow: () => {
    if (validSendChannels.includes('close-window')) {
        ipcRenderer.send('close-window');
    }
  }
});

console.log('Preload-Skript (preload.js) wurde geladen und electronAPI wurde exposed.');
