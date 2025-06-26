// main.js
const { app, BrowserWindow, ipcMain, shell, Menu, globalShortcut } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
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

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 850,
        title: 'GemmarTesting',
        icon: path.join(__dirname, '../assets/icon.png'),
        frame: false,
        titleBarStyle: 'hidden',
        webPreferences: {
            preload: path.join(__dirname, '../preload/preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            devTools: true
        },
        show: false
    });

    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    Menu.setApplicationMenu(null);

    mainWindow.once('ready-to-show', () => {
        mainWindow.maximize();
        mainWindow.show();
    });

    mainWindow.on('closed', () => { mainWindow = null; });
    mainWindow.on('maximize', () => mainWindow?.webContents.send('window-is-maximized', true));
    mainWindow.on('unmaximize', () => mainWindow?.webContents.send('window-is-maximized', false));
    mainWindow.webContents.on('did-finish-load', () => mainWindow?.webContents.send('window-is-maximized', mainWindow.isMaximized()));
}

// --- IPC-Handler ---
ipcMain.on('minimize-window', () => mainWindow?.minimize());
ipcMain.on('maximize-window', () => { if (mainWindow?.isMaximized()) mainWindow.unmaximize(); else mainWindow?.maximize(); });
ipcMain.on('close-window', () => mainWindow?.close());
ipcMain.on('restart-and-install', () => autoUpdater.quitAndInstall(true, true));

let currentUpdateVersionInfo = null;
ipcMain.on('update-download', (event, updateInfoFromRenderer) => {
    if (updateInfoFromRenderer?.version) {
        currentUpdateVersionInfo = updateInfoFromRenderer;
        log.info(`Main: User chose to download version ${updateInfoFromRenderer.version}. Starting download...`);
        autoUpdater.downloadUpdate();
        sendStatusToWindow({ status: 'downloading', percent: 0, version: updateInfoFromRenderer.version });
    } else {
        log.error("Main: 'update-download' received without valid updateInfo.");
    }
});


// --- App Lifecycle Events ---
app.whenReady().then(() => {
    ipcMain.handle('open-external-link', async (event, url) => {
        try {
            await shell.openExternal(url);
            return { success: true };
        } catch (error) {
            console.error(`Fehler beim Öffnen des externen Links ${url}:`, error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('get-app-version', () => app.getVersion());

    ipcMain.handle('get-admin-status', () => { return isAdminMode });

    createWindow();

    autoUpdater.allowPrerelease = true;
    autoUpdater.autoDownload = false;
    autoUpdater.on('checking-for-update', () => sendStatusToWindow({ status: 'checking' }));
    autoUpdater.on('update-available', (info) => sendStatusToWindow({ status: 'available', version: info.version, notes: info.releaseNotes || 'No details available.' }));
    autoUpdater.on('update-not-available', () => sendStatusToWindow({ status: 'not-available' }));
    autoUpdater.on('error', (err) => sendStatusToWindow({ status: 'error', message: err.message }));
    autoUpdater.on('download-progress', (p) => sendStatusToWindow({ status: 'downloading', percent: Math.round(p.percent), speed: p.bytesPerSecond, version: currentUpdateVersionInfo?.version || '?.?.?' }));
    autoUpdater.on('update-downloaded', (info) => sendStatusToWindow({ status: 'downloaded', version: info.version, notes: info.releaseNotes || 'No details available.' }));

    try { autoUpdater.checkForUpdates(); } catch (error) { log.error('Error calling checkForUpdates:', error); }

    globalShortcut.register('Control+Shift+I', () => mainWindow?.webContents.toggleDevTools());

    app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('will-quit', () => globalShortcut.unregisterAll());


// =================================================================================
// --- TESTAUSFÜHRUNG ---
// =================================================================================

ipcMain.on('run-java-test', async (event, { userFiles, testFiles, testConfig }) => {
    let tempDir = null;

    const sendTestEvent = (detail) => {
        // KORREKTUR: Die Funktion heißt isDestroyed()
        if (mainWindow && mainWindow.webContents && !mainWindow.webContents.isDestroyed()) {
            mainWindow.webContents.send('java-test-event', detail);
        }
    };

    try {
        sendTestEvent({ event: 'run_start' });
        sendTestEvent({ event: 'log', level: 'info', message: 'Testlauf gestartet (Main-Prozess)...' });

        tempDir = await createTempDirectory();
        sendTestEvent({ event: 'log', level: 'info', message: `Temporärer Ordner erstellt: ${tempDir}` });

        const allFilesToWrite = [...userFiles, ...testFiles];
        await writeFilesToDirectoryWithPackageStructure(tempDir, allFilesToWrite, sendTestEvent);
        sendTestEvent({ event: 'log', level: 'info', message: 'Alle Java-Dateien in temporären Ordner geschrieben.' });

        const userClassFQN = findClassFQNBySimpleName(userFiles, testConfig.userCodeEntryClassFQN);
        if (!userClassFQN) {
            throw new Error(`Konnte die Klasse '${testConfig.userCodeEntryClassFQN}' nicht in den hochgeladenen Dateien finden.`);
        }
        sendTestEvent({ event: 'log', level: 'info', message: `Benutzerklasse für Test gefunden: ${userClassFQN}` });

        await compileJavaCode(tempDir, sendTestEvent);
        await executeJavaTest(tempDir, testConfig.mainTestClassName, userClassFQN, sendTestEvent);

    } catch (error) {
        console.error('Fehler im Testlauf (main.js):', error);
        sendTestEvent({ event: 'log', level: 'error', message: `Schwerwiegender Fehler im Testlauf: ${error.message}` });
        sendTestEvent({ event: 'run_finish', duration: "Error" });
    } finally {
        if (tempDir) {
            fs.rm(tempDir, { recursive: true, force: true }, (err) => {
                if (err) console.warn(`Temporärer Ordner ${tempDir} konnte nicht gelöscht werden: ${err.message}`);
                else console.log(`Temporärer Ordner ${tempDir} gelöscht.`);
            });
        }
    }
});


// --- HILFSFUNKTIONEN FÜR DIE TESTAUSFÜHRUNG ---

function createTempDirectory() {
    return new Promise((resolve, reject) => {
        const tempDirPrefix = path.join(os.tmpdir(), 'gemmartesting-');
        fs.mkdtemp(tempDirPrefix, (err, folder) => {
            if (err) return reject(err);
            resolve(folder);
        });
    });
}

function getPackagePathFromFileContent(fileContent) {
    const packageMatch = fileContent.match(/^package\s+([a-zA-Z0-9_.]+)\s*;/m);
    return packageMatch?.[1].trim().replace(/\./g, path.sep) || '';
}

async function writeFilesToDirectoryWithPackageStructure(baseDir, files, sendTestEvent) {
    for (const file of files) {
        const packagePath = getPackagePathFromFileContent(file.content);
        const targetDir = path.join(baseDir, packagePath);
        const filePath = path.join(targetDir, file.name);

        try {
            await fs.promises.mkdir(targetDir, { recursive: true });
            await fs.promises.writeFile(filePath, file.content, 'utf8');
            sendTestEvent({ event: 'log', level: 'info', message: `Datei geschrieben: ${path.join(packagePath, file.name)}` });
        } catch (err) {
            throw new Error(`Fehler beim Schreiben von ${file.name}: ${err.message}`);
        }
    }
}

function findClassFQNBySimpleName(userJavaFiles, simpleClassNameToFind) {
    for (const file of userJavaFiles) {
        if (file.name.endsWith('.java')) {
            const classRegex = new RegExp(`(?:public\\s+)?(?:abstract\\s+)?(?:final\\s+)?class\\s+\\b${simpleClassNameToFind}\\b`);
            if (classRegex.test(file.content)) {
                const packageName = file.content.match(/^package\s+([a-zA-Z0-9_.]+)\s*;/m)?.[1].trim() || '';
                return packageName ? `${packageName}.${simpleClassNameToFind}` : simpleClassNameToFind;
            }
        }
    }
    return null;
}

function compileJavaCode(directory, sendTestEvent) {
    return new Promise((resolve, reject) => {
        sendTestEvent({ event: 'log', level: 'info', message: `Starte Kompilierung...` });

        const javaFilesToCompile = [];
        function findJavaFilesRecursive(dir) {
            fs.readdirSync(dir, { withFileTypes: true }).forEach(item => {
                const fullPath = path.join(dir, item.name);
                if (item.isFile() && item.name.endsWith('.java')) {
                    javaFilesToCompile.push(path.relative(directory, fullPath));
                } else if (item.isDirectory()) {
                    findJavaFilesRecursive(fullPath);
                }
            });
        }
        findJavaFilesRecursive(directory);

        if (javaFilesToCompile.length === 0) {
            return reject(new Error("Keine Java-Dateien zum Kompilieren gefunden."));
        }

        const javac = spawn('javac', ['-d', '.', '-Xlint:all', '-encoding', 'UTF-8', ...javaFilesToCompile], { cwd: directory, shell: true });
        let compileOutput = '';

        const handleOutput = (data, level) => {
            const msg = data.toString().trim();
            if (msg) {
                compileOutput += msg + '\n';
                sendTestEvent({ event: 'log', level: level, message: `javac: ${msg}` });
            }
        };

        javac.stdout.on('data', (data) => handleOutput(data, 'info'));
        javac.stderr.on('data', (data) => handleOutput(data, 'warn'));

        javac.on('close', (code) => {
            if (code === 0) {
                sendTestEvent({ event: 'log', level: 'info', message: 'Kompilierung erfolgreich.' });
                resolve();
            } else {
                reject(new Error(`Kompilierungsfehler (Exit-Code: ${code}):\n${compileOutput}`));
            }
        });
        javac.on('error', (err) => reject(new Error(`Fehler beim Starten von javac: ${err.message}`)));
    });
}

function executeJavaTest(directory, mainClassName, userClassFQN, sendTestEvent) {
    return new Promise((resolve, reject) => {
        sendTestEvent({ event: 'log', level: 'info', message: `Starte Java-Ausführung...` });
        const java = spawn('java', ['-cp', '.', mainClassName, userClassFQN], { cwd: directory, shell: true });

        java.stdout.on('data', (data) => {
            data.toString().split('\n').forEach(line => {
                if (line.trim()) {
                    try {
                        sendTestEvent(JSON.parse(line.trim()));
                    } catch (e) {
                        sendTestEvent({ event: 'log', level: 'warn', message: `Java stdout (ungültiges JSON): ${line.trim()}` });
                    }
                }
            });
        });

        let stdErrOutput = "";
        java.stderr.on('data', (data) => {
            const errorMsg = data.toString().trim();
            if (errorMsg) {
                stdErrOutput += errorMsg + "\n";
                sendTestEvent({ event: 'log', level: 'error', message: `Java stderr: ${errorMsg}` });
            }
        });

        java.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Java-Ausführung fehlgeschlagen (Code: ${code}).\n${stdErrOutput}`));
            }
        });
        java.on('error', (err) => reject(new Error(`Fehler beim Starten von Java: ${err.message}`)));
    });
}

// ================================================================================
// --- Admin Mode ---
// ================================================================================
let isAdminMode = false;
try {
    // Der Pfad zur admin.json im Root-Verzeichnis deines Projekts
    const adminConfigPath = path.join(app.getAppPath(), 'admin.json');
    if (fs.existsSync(adminConfigPath)) {
        const adminConfig = JSON.parse(fs.readFileSync(adminConfigPath, 'utf-8'));
        if (adminConfig.enabled === true) {
            isAdminMode = true;
            log.info('###########################');
            log.info('### ADMIN MODE ENABLED  ###');
            log.info('###########################');
        }
    }
} catch (error) {
    log.warn('Could not read admin.json config file.', error);
}