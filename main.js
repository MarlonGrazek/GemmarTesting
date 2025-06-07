// main.js
// Verantwortlich für das Erstellen des Browser-Fensters, die Kommunikation mit dem Renderer-Prozess
// und die Ausführung der Java-Tests unter Berücksichtigung der Paketstruktur des Nutzers.

const { app, BrowserWindow, ipcMain, shell, Menu, globalShortcut, dialog } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const https = require('node:https');
const os = require('node:os');
const { spawn } = require('node:child_process');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

let mainWindow;

function sendStatusToWindow(payload) {
  if (mainWindow && mainWindow.webContents && !mainWindow.isDestroyed()) {
    log.info(`Sende IPC "update-status" an Renderer mit Payload:`, payload);
    mainWindow.webContents.send('update-status', payload);
  } else {
    log.warn('mainWindow nicht verfügbar, IPC "update-status" kann nicht gesendet werden für Payload:', payload);
  }
}

// Erstellt das Hauptfenster der Anwendung.
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280, // Startbreite
    height: 850, // Starthöhe
    title: 'GemmarTesting', // NEU: Setzt den Fenstertitel
    icon: path.join(__dirname, 'assets', 'icon.png'), // NEU: Pfad zum Anwendungsicon (angenommen es liegt in 'assets/icon.png')
                                                      // Für Windows: 'assets/icon.ico' wäre besser.
    frame: false, // ENTFERNT den Standard-Fensterrahmen und die Titelleiste
    titleBarStyle: 'hidden', // Auf macOS für nahtlosere Integration (optional für Windows/Linux)
    webPreferences: {
      // Das Preload-Skript wird vor dem Laden der Webseite im Renderer-Prozess ausgeführt.
      // Es dient als Brücke zwischen dem Renderer und dem Main-Prozess für IPC.
      preload: path.join(__dirname, 'src', 'preload.js'),
      contextIsolation: true, // Wichtig für Sicherheit: Isoliert Preload-Skript und Renderer-Logik
      nodeIntegration: false, // Node.js-APIs sollten nicht direkt im Renderer verfügbar sein
      //devTools: !app.isPackaged // Erlaube DevTools im Renderer, aber öffne sie nicht automatisch hier
      devTools: true
    },
    show: false // Fenster erst anzeigen, wenn es bereit ist, um Flackern zu vermeiden
  });

  // Lädt die index.html-Datei in das Hauptfenster.
  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  // Entferne das Standard-Anwendungsmenü (Datei, Bearbeiten, etc.)
  Menu.setApplicationMenu(null);

  // Maximiere das Fenster, sobald es bereit ist angezeigt zu werden
  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();

    // Öffnet die Entwickler-Tools nur im Entwicklungsmodus, NACHDEM das Fenster angezeigt wird.
    if (!app.isPackaged) {
      // mainWindow.webContents.openDevTools(); // Auskommentiert, um nicht bei jedem Start zu öffnen
    }
  });


  // Wird ausgeführt, wenn das Fenster geschlossen wird.
  mainWindow.on('closed', function () {
    mainWindow = null; // Referenz aufheben, um Speicher freizugeben
  });
}

// IPC-Handler für benutzerdefinierte Fensteraktionen
ipcMain.on('minimize-window', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.on('maximize-window', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('close-window', () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

let currentUpdateVersionInfo = null;
ipcMain.on('update-download', (event, updateInfoFromRenderer) => {

  if(updateInfoFromRenderer && updateInfoFromRenderer.version) {
    currentUpdateVersionInfo = updateInfoFromRenderer;
    log.info(`Main: User chose to download version ${updateInfoFromRenderer.version}. Starting download...`);
    autoUpdater.downloadUpdate();
    // Sende sofort einen initialen "downloading" Status, damit die UI reagiert
    sendStatusToWindow({ status: 'downloading', percent: 0, version: updateInfoFromRenderer.version });
} else {
    log.error("Main: 'update-download' received without valid updateInfo.");
}

  autoUpdater.downloadUpdate();
});

// Diese Methode wird aufgerufen, wenn Electron die Initialisierung abgeschlossen hat
// und bereit ist, Browser-Fenster zu erstellen.
app.whenReady().then(() => {

  // Handler, um externe Links sicher im Standardbrowser des Systems zu öffnen.
  ipcMain.handle('open-external-link', async (event, url) => {
    try {
      await shell.openExternal(url);
      return { success: true };
    } catch (error) {
      console.error(`Fehler beim Öffnen des externen Links ${url}:`, error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-app-version', () => {
    return app.getVersion();
  });

  createWindow();

  autoUpdater.logger = log;
  autoUpdater.logger.transports.file.level = 'info';

  autoUpdater.allowPrerelease = true;
  autoUpdater.autoDownload = false;
  log.info(`autoUpdater.allowPrerelease is set to: ${autoUpdater.allowPrerelease}`);

  autoUpdater.on('checking-for-update', () => {
    log.info('Checking for update...');
    sendStatusToWindow({status: 'checking'});
  });

  autoUpdater.on('update-available', (info) => {
    log.info('Update available.');
    log.info('Version:', info.version);
    log.info('Release Date:', info.releaseDate);

    if(mainWindow) {
      log.info('Sende IPC "update-found" an Renderer...')
      sendStatusToWindow({
        status: 'available',
        version: info.version,
        notes: info.releaseNotes || info.releaseName || 'No details available.'
      });
    } else {
      log.error('mainWindow ist nicht verfügbar, IPC kann nicht gesendet werden!');
    }
  });

  autoUpdater.on('update-not-available', (info) => {
    log.info('Main: Update not available.');
    sendStatusToWindow({ status: 'not-available' });
  });

  autoUpdater.on('error', (err) => {
    log.error('Main: Error in auto-updater.', err);
    sendStatusToWindow({ status: 'error', message: err.message });
  });

  autoUpdater.on('download-progress', (progressObj) => {
    log.info(`Main: Download Progress: ${progressObj.percent}%`);
    sendStatusToWindow({ 
      status: 'downloading', 
      percent: Math.round(progressObj.percent), 
      speed: progressObj.bytesPerSecond,
      // Du brauchst hier die Version, die gerade geladen wird.
      // Die müsstest du dir aus dem 'update-available' info-Objekt merken.
      // Angenommen, du hast sie in einer Variable `currentUpdateVersionInfo` gespeichert:
      version: currentUpdateVersionInfo ? currentUpdateVersionInfo.version : '?.?.?' 
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded.');

    sendStatusToWindow({
      status: 'downloaded',
      versopm: info.version,
      notes: info.releaseNotes || info.releaseName || 'No details available.'
    });
  });

  autoUpdater.on('error', () => {
    log.info('Error.');
  });

  try {
    autoUpdater.checkForUpdates();
    log.info('checkForUpdates() called.');
  } catch(error) {
    log.error('Error calling checkForUpdates:', error);
  }

  // Registriere einen globalen Shortcut, um die Entwickler-Tools zu öffnen/schließen.
  // Dies funktioniert auch, wenn das Anwendungsmenü entfernt wurde.
  globalShortcut.register('Control+Shift+I', () => {
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.toggleDevTools();
    }
  });

  // Listener für macOS: Erstellt ein neues Fenster, wenn auf das Dock-Icon geklickt wird
  // und keine anderen Fenster geöffnet sind.
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Listener: Beendet die Anwendung, wenn alle Fenster geschlossen sind (außer auf macOS).
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') { // 'darwin' ist macOS
    app.quit();
  }
});

// Deregistriere den Shortcut, wenn die Anwendung beendet wird.
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});


// --- HILFSFUNKTIONEN FÜR DIE TESTAUSFÜHRUNG ---

/**
 * Lädt eine Datei von einer gegebenen URL herunter.
 * Folgt HTTP-Weiterleitungen.
 * @param {string} url Die URL der herunterzuladenden Datei.
 * @returns {Promise<string>} Ein Promise, das mit dem Inhalt der Datei aufgelöst wird.
 */
function downloadFile(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        console.log(`Folge Umleitung von ${url} zu ${res.headers.location}`);
        return downloadFile(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error(`Fehler beim Download von ${url}: Status ${res.statusCode}`));
      }
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', (err) => {
      reject(new Error(`Netzwerkfehler beim Download von ${url}: ${err.message}`));
    });
  });
}

/**
 * Erstellt ein temporäres Verzeichnis im System-Temp-Ordner.
 * @returns {Promise<string>} Ein Promise, das mit dem Pfad zum erstellten temporären Ordner aufgelöst wird.
 */
function createTempDirectory() {
  return new Promise((resolve, reject) => {
    const tempDirPrefix = path.join(os.tmpdir(), 'codetesthub-');
    fs.mkdtemp(tempDirPrefix, (err, folder) => {
      if (err) return reject(new Error(`Konnte temporären Ordner nicht erstellen: ${err.message}`));
      resolve(folder);
    });
  });
}

/**
 * Extrahiert den Paketpfad aus dem Java-Code-Inhalt.
 * @param {string} fileContent Inhalt der Java-Datei.
 * @returns {string} Der Paketpfad (z.B. "com/example/app") oder eine leere Zeichenkette für Default-Package.
 */
function getPackagePathFromFileContent(fileContent) {
    const packageMatch = fileContent.match(/^package\s+([a-zA-Z0-9_.]+)\s*;/m);
    if (packageMatch && packageMatch[1]) {
        return packageMatch[1].trim().replace(/\./g, path.sep); // Ersetzt Punkte durch Pfadtrenner
    }
    return ''; // Default package
}

/**
 * Schreibt Dateien in ein Basisverzeichnis, berücksichtigt dabei die Paketstruktur aus dem Dateiinhalt.
 * @param {string} baseDir Das Basisverzeichnis.
 * @param {Array<{name: string, content: string}>} files Array von Dateiobjekten.
 * @param {function} sendTestEvent Funktion zum Senden von Log-Events.
 */
async function writeFilesToDirectoryWithPackageStructure(baseDir, files, sendTestEvent) {
  for (const file of files) {
    // file.name ist hier nur der Dateiname (z.B. "MyClass.java")
    // Der Paketpfad wird aus dem Inhalt der Datei extrahiert.
    const packagePath = getPackagePathFromFileContent(file.content);
    const targetDir = path.join(baseDir, packagePath); // z.B. /tmp/codetesthub-xyz/com/example/
    const filePath = path.join(targetDir, file.name);   // z.B. /tmp/codetesthub-xyz/com/example/MyClass.java

    try {
      await fs.promises.mkdir(targetDir, { recursive: true }); // Erstellt Paket-Unterverzeichnisse
      await fs.promises.writeFile(filePath, file.content, 'utf8');
      // Loggt den relativen Pfad innerhalb des tempDir für Klarheit
      sendTestEvent({ event: 'log', level: 'info', message: `Nutzerdatei geschrieben: ${path.join(packagePath, file.name)}` });
    } catch (err) {
      throw new Error(`Fehler beim Schreiben der Datei ${file.name} nach ${filePath}: ${err.message}`);
    }
  }
}

/**
 * Findet den vollqualifizierten Namen (FQN) der Benutzerklasse anhand ihres einfachen Namens.
 * Durchsucht .java-Dateien nach 'class SimpleClassName' und extrahiert Paket + Klassenname.
 * @param {Array<{name: string, content: string}>} userJavaFiles Array der Java-Dateien des Benutzers.
 * @param {string} simpleClassNameToFind Der einfache Name der zu findenden Klasse (z.B. "StudentAdministration").
 * @returns {string|null} Der FQN der Klasse oder null, wenn nicht gefunden.
 */
function findClassFQNBySimpleName(userJavaFiles, simpleClassNameToFind) {
  for (const file of userJavaFiles) {
    if (file.name.endsWith('.java')) {
      // Regex, um den Klassennamen zu finden. Berücksichtigt Modifier.
      // Es sucht nach einer Klassendeklaration und extrahiert den Namen.
      // Wichtig: `\b` stellt sicher, dass es ein ganzes Wort ist.
      const classRegex = new RegExp(`(?:public\\s+)?(?:abstract\\s+)?(?:final\\s+)?class\\s+\\b${simpleClassNameToFind}\\b`);
      
      if (classRegex.test(file.content)) {
        let packageName = '';
        const packageMatch = file.content.match(/^package\s+([a-zA-Z0-9_.]+)\s*;/m);
        if (packageMatch && packageMatch[1]) {
          packageName = packageMatch[1].trim() + '.';
        }
        return `${packageName}${simpleClassNameToFind}`; // Konstruiert den FQN
      }
    }
  }
  return null; // Klasse nicht gefunden
}

/**
 * Kompiliert Java-Dateien in einem gegebenen Verzeichnis.
 * @param {string} directory Das Verzeichnis mit den .java-Dateien (Wurzel des temporären Ordners).
 * @param {function} sendTestEvent Funktion zum Senden von Log-Events an den Renderer.
 * @returns {Promise<void>} Ein Promise, das aufgelöst wird, wenn die Kompilierung erfolgreich war, oder abgelehnt wird bei Fehlern.
 */
function compileJavaCode(directory, sendTestEvent) {
  return new Promise((resolve, reject) => {
    sendTestEvent({ event: 'log', level: 'info', message: `Starte Kompilierung im Verzeichnis: ${directory}` });

    const javaFilesToCompile = [];
    // Rekursive Suche nach allen .java-Dateien im temporären Verzeichnis
    function findJavaFilesRecursive(currentDir) {
        const items = fs.readdirSync(currentDir, { withFileTypes: true });
        for (const item of items) {
            const fullPath = path.join(currentDir, item.name);
            if (item.isFile() && item.name.endsWith('.java')) {
                // Wichtig: Pfad relativ zum 'directory' (Kompilierungs-Root) für javac
                javaFilesToCompile.push(path.relative(directory, fullPath));
            } else if (item.isDirectory()) {
                findJavaFilesRecursive(fullPath);
            }
        }
    }
    findJavaFilesRecursive(directory); // Startet die Suche vom Wurzelverzeichnis des tempDir

    if (javaFilesToCompile.length === 0) {
      return reject(new Error("Keine Java-Dateien zum Kompilieren gefunden."));
    }
    sendTestEvent({ event: 'log', level: 'info', message: `Zu kompilierende Dateien: ${javaFilesToCompile.join(', ')}` });

    // `-d .` legt .class-Dateien in korrekter Paketstruktur relativ zum CWD (directory) ab.
    // `-Xlint:all` für detailliertere Warnungen.
    // `-encoding UTF-8` für korrekte Zeichenkodierung.
    const javacArgs = ['-d', '.', '-Xlint:all', '-encoding', 'UTF-8', ...javaFilesToCompile];
    const javac = spawn('javac', javacArgs, { cwd: directory, shell: true });

    let compileOutput = ''; // Sammelt stdout und stderr

    javac.stdout.on('data', (data) => {
      const msg = data.toString().trim();
      if (msg) {
          compileOutput += msg + '\n';
          sendTestEvent({ event: 'log', level: 'info', message: `javac: ${msg}` });
      }
    });

    javac.stderr.on('data', (data) => {
      const errorMsg = data.toString().trim();
      if (errorMsg) {
          compileOutput += errorMsg + '\n';
          // Stellt sicher, dass Compiler-Warnungen als 'warn' und Fehler als 'error' geloggt werden
          if (errorMsg.toLowerCase().includes("error") || errorMsg.toLowerCase().includes("fehler")) {
            sendTestEvent({ event: 'log', level: 'error', message: `javac: ${errorMsg}` });
          } else if (errorMsg.toLowerCase().includes("warning") || errorMsg.toLowerCase().includes("warnung")) {
            sendTestEvent({ event: 'log', level: 'warn', message: `javac: ${errorMsg}` });
          } else {
            sendTestEvent({ event: 'log', level: 'info', message: `javac: ${errorMsg}` }); // Fallback für unklare Ausgaben
          }
      }
    });

    javac.on('close', (code) => {
      if (code === 0) {
        sendTestEvent({ event: 'log', level: 'info', message: 'Java-Code erfolgreich kompiliert.' });
        resolve();
      } else {
        // Gibt die gesammelte Ausgabe im Fehlerfall zurück.
        reject(new Error(`Kompilierungsfehler (Exit-Code: ${code}):\n${compileOutput || 'Keine detaillierte Fehlermeldung von javac.'}`));
      }
    });

    javac.on('error', (err) => {
      reject(new Error(`Fehler beim Starten von javac: ${err.message}. Ist das JDK korrekt installiert und im System-PATH eingetragen?`));
    });
  });
}

ipcMain.on('restart-and-install', () => {
  log.info('Renderer hat den Befehl zum Neustart und Installieren gegeben.');
  autoUpdater.quitAndInstall(true, true);
});

// IPC-Listener für die Anforderung, einen Java-Test auszuführen.
// Empfängt Dateiinhalte vom Nutzer und die Testkonfiguration vom Renderer.
ipcMain.on('run-java-test', async (event, { userFiles, testConfig }) => {
  let tempDir = null; // Hält den Pfad zum temporären Verzeichnis

  // Hilfsfunktion, um Events an den Renderer-Prozess zu senden.
  const sendTestEvent = (detail) => {
    if (mainWindow && mainWindow.webContents && !mainWindow.webContents.isDestroyed()) {
      mainWindow.webContents.send('java-test-event', detail);
    }
  };

  try {
    sendTestEvent({ event: 'run_start' }); // Signalisiert den Beginn des gesamten Testlaufs
    sendTestEvent({ event: 'log', level: 'info', message: 'Testlauf gestartet (Main-Prozess, Package-Handling)...' });

    // 1. Testlogik-Datei (z.B. PVL3Test.java) herunterladen
    sendTestEvent({ event: 'log', level: 'info', message: `Lade Testlogik von: ${testConfig.testLogicFileUrl}` });
    const testLogicFileContent = await downloadFile(testConfig.testLogicFileUrl);
    sendTestEvent({ event: 'log', level: 'info', message: 'Testlogik-Datei erfolgreich heruntergeladen.' });

    // 2. Temporäres Verzeichnis erstellen
    tempDir = await createTempDirectory();
    sendTestEvent({ event: 'log', level: 'info', message: `Temporärer Ordner erstellt: ${tempDir}` });

    // 3. TestRunner.java Hilfsklasse lesen
    // Annahme: TestRunner.java liegt im Default-Package und wird im Wurzelverzeichnis des Projekts erwartet.
    // Pfad relativ zum Projekt-Root, wo main.js liegt.
    const testRunnerPath = path.join(__dirname, 'src', 'java-helpers', 'TestRunner.java');
    let testRunnerContent;
    try {
      testRunnerContent = await fs.promises.readFile(testRunnerPath, 'utf8');
    } catch (err) {
      throw new Error(`Konnte TestRunner.java nicht lesen von ${testRunnerPath}: ${err.message}`);
    }

    // 4. Nutzerdateien in ihre jeweilige Paketstruktur im temporären Verzeichnis schreiben
    // userFiles ist ein Array von { name: "Dateiname.java", content: "..." }
    await writeFilesToDirectoryWithPackageStructure(tempDir, userFiles, sendTestEvent);

    // TestRunner.java und die heruntergeladene Testlogik-Datei (PVL3Test.java)
    // werden ins Wurzelverzeichnis des temporären Ordners geschrieben (Annahme: Default-Package).
    // Dies ist wichtig, damit die Gist-Datei (PVL3Test.java) nicht geändert werden muss,
    // falls sie TestRunner ohne expliziten Import erwartet.
    const helperFiles = [
      { name: `${testConfig.mainTestClassName}.java`, content: testLogicFileContent }, // z.B. PVL3Test.java
      { name: 'TestRunner.java', content: testRunnerContent }
    ];
    for (const file of helperFiles) {
        const filePath = path.join(tempDir, file.name); // Direkter Pfad im tempDir-Root
        try {
            await fs.promises.writeFile(filePath, file.content, 'utf8');
            sendTestEvent({ event: 'log', level: 'info', message: `Hilfsdatei geschrieben: ${file.name} (in Temp-Root)` });
        } catch (err) {
            throw new Error(`Fehler beim Schreiben der Hilfsdatei ${file.name} nach ${filePath}: ${err.message}`);
        }
    }
    sendTestEvent({ event: 'log', level: 'info', message: 'Alle Java-Dateien in temporären Ordner geschrieben.' });


    // 5. Finde den FQN der Benutzerklasse basierend auf testConfig.userCodeEntryClassFQN (einfacher Klassenname).
    // Das Feld expectedInterfaceName wird hier nicht mehr für die FQN-Ermittlung verwendet.
    const userClassFQN = findClassFQNBySimpleName(userFiles, testConfig.userCodeEntryClassFQN);
    if (!userClassFQN) {
      // Die Fehlermeldung wurde angepasst, um klarzustellen, dass die Klasse anhand des Namens in testConfig.userCodeEntryClassFQN gesucht wird.
      throw new Error(`Konnte die in der Testkonfiguration angegebene Klasse '${testConfig.userCodeEntryClassFQN}' nicht in den hochgeladenen Java-Dateien finden. Stellen Sie sicher, dass die Klasse existiert und der Name korrekt ist.`);
    }
    sendTestEvent({ event: 'log', level: 'info', message: `Benutzerklasse für Test gefunden: ${userClassFQN}` });

    // 6. Java-Code kompilieren (im Wurzelverzeichnis des tempDir)
    await compileJavaCode(tempDir, sendTestEvent);
    sendTestEvent({ event: 'log', level: 'info', message: 'Kompilierung erfolgreich. Starte Java-Ausführung...' });

    // 7. Kompilierten Java-Test ausführen
    const javaExecutionPromise = new Promise((resolve, reject) => {
      // Classpath (-cp .) zeigt auf das Wurzelverzeichnis des tempDir.
      // Die Test-Hauptklasse (z.B. PVL3Test) wird als im Default-Package liegend angenommen.
      // Die Nutzer-Klasse wird mit ihrem FQN übergeben.
      const java = spawn('java', ['-cp', '.', testConfig.mainTestClassName, userClassFQN], { cwd: tempDir, shell: true });
      
      let stdErrOutput = ""; // Sammelt stderr für den Fall eines Fehlers während der Ausführung

      // stdout des Java-Prozesses abfangen (hier kommen die JSON-Events von TestRunner)
      java.stdout.on('data', (data) => {
        const lines = data.toString().split('\n');
        for (const line of lines) {
          if (line.trim()) {
            try {
              const eventDetail = JSON.parse(line.trim());
              sendTestEvent(eventDetail); // Direkte Weiterleitung des geparsten Events
            } catch (e) {
              // Falls eine Zeile kein valides JSON ist, als Log-Info senden
              sendTestEvent({ event: 'log', level: 'warn', message: `Java stdout (ungültiges JSON): ${line.trim()}` });
            }
          }
        }
      });

      // stderr des Java-Prozesses abfangen (Laufzeitfehler etc.)
      java.stderr.on('data', (data) => {
        const errorMsg = data.toString().trim();
        if (errorMsg) {
            stdErrOutput += errorMsg + "\n";
            sendTestEvent({ event: 'log', level: 'error', message: `Java stderr: ${errorMsg}` });
        }
      });

      java.on('close', (code) => {
        if (code === 0) {
          sendTestEvent({ event: 'log', level: 'info', message: 'Java-Ausführung erfolgreich beendet.' });
          resolve();
        } else {
          // Wenn der Java-Prozess mit einem Fehlercode endet.
          sendTestEvent({ event: 'log', level: 'error', message: `Java-Ausführung mit Fehlercode ${code} beendet.` });
          reject(new Error(`Java-Ausführung fehlgeschlagen (Exit-Code: ${code}).\nStderr:\n${stdErrOutput || "Keine detaillierte Fehlermeldung von Java stderr."}`));
        }
      });

      java.on('error', (err) => {
        reject(new Error(`Fehler beim Starten des Java-Prozesses: ${err.message}`));
      });
    });

    await javaExecutionPromise;
    // Das 'run_finish' Event wird idealerweise vom TestRunner.java gesendet.

  } catch (error) {
    console.error('Fehler im Testlauf (main.js):', error);
    sendTestEvent({ event: 'log', level: 'error', message: `Schwerwiegender Fehler im Testlauf: ${error.message}` });
    sendTestEvent({ event: 'run_finish', duration: "Error" });
  } finally {
    // Temporäres Verzeichnis aufräumen
    if (tempDir) {
      fs.rm(tempDir, { recursive: true, force: true }, (err) => {
        const tempDirNameOnly = path.basename(tempDir); // Nur den Namen für die Log-Nachricht
        if (err) {
          console.warn(`Temporärer Ordner ${tempDir} konnte nicht vollständig gelöscht werden: ${err.message}`);
          sendTestEvent({ event: 'log', level: 'warn', message: `Aufräumen: Temp-Ordner '${tempDirNameOnly}' konnte nicht gelöscht werden.` });
        } else {
          console.log(`Temporärer Ordner ${tempDir} gelöscht.`);
          sendTestEvent({ event: 'log', level: 'info', message: `Aufräumen: Temp-Ordner '${tempDirNameOnly}' gelöscht.` });
        }
      });
    }
  }
});
