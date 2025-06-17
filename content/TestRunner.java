// TestRunner.java
// Liegt im Default-Package, um von der Gist-Testdatei ohne Import gefunden zu werden.

import java.util.Locale;

/**
 * Eine allgemeine Hilfsklasse, die als API für spezifische Testdateien dient.
 * Sie stellt statische Methoden zur Verfügung, um Testereignisse als JSON-Strings
 * an die Standardausgabe zu senden und so mit der Electron-App zu kommunizieren.
 */
public class TestRunner {

    /**
     * Schreibt ein strukturiertes Event als JSON-String auf die Konsole.
     * Dies ist die zentrale Kommunikationsmethode.
     * @param event Typ des Events (z.B. "suite_start", "assert").
     * @param data Ein Array von Schlüssel-Wert-Paaren für die JSON-Daten.
     * Beispiel: "name", "Mein Test", "status", "pass"
     */
    private static void emitEvent(String event, String... data) {
        StringBuilder json = new StringBuilder();
        json.append("{");
        json.append("\"event\":\"").append(escapeJsonString(event)).append("\""); // Event-Name auch escapen
        for (int i = 0; i < data.length; i += 2) {
            // Sicherstellen, dass es immer ein Schlüssel-Wert-Paar gibt
            if (i + 1 < data.length) {
                json.append(",\"").append(escapeJsonString(data[i])).append("\":\"").append(escapeJsonString(data[i + 1])).append("\"");
            } else {
                // Fallback, falls eine ungerade Anzahl von Daten-Strings übergeben wird
                json.append(",\"").append(escapeJsonString(data[i])).append("\":\"\"");
            }
        }
        json.append("}");
        System.out.println(json.toString()); // Wichtig: Ausgabe auf stdout
        System.out.flush(); // Sicherstellen, dass die Ausgabe sofort gesendet wird
    }

    /**
     * Maskiert Sonderzeichen für eine valide JSON-String-Ausgabe.
     * Wichtig für Nachrichten und Namen, die Anführungszeichen etc. enthalten könnten.
     * @param str Der zu maskierende String.
     * @return Der maskierte String.
     */
    public static String escapeJsonString(String str) { // public gemacht für potenzielle Nutzung in PVL3Test
        if (str == null) {
            return "";
        }
        return str.replace("\\", "\\\\") // Backslash zuerst
                  .replace("\"", "\\\"") // Dann Anführungszeichen
                  .replace("\b", "\\b")
                  .replace("\f", "\\f")
                  .replace("\n", "\\n")
                  .replace("\r", "\\r")
                  .replace("\t", "\\t");
    }

    // --- Öffentliche API-Methoden für die Testdateien ---

    /**
     * Signalisiert den Start des gesamten Testlaufs.
     * Sollte einmal ganz am Anfang der main-Methode der Testdatei aufgerufen werden.
     */
    public static void startRun() {
        emitEvent("run_start");
    }

    /**
     * Signalisiert das Ende des gesamten Testlaufs und übermittelt die Dauer.
     * Sollte einmal ganz am Ende der main-Methode der Testdatei aufgerufen werden.
     * @param startTimeNano Die Startzeit des Tests, erfasst mit System.nanoTime().
     */
    public static void finishRun(long startTimeNano) {
        long endTimeNano = System.nanoTime();
        double durationMillis = (endTimeNano - startTimeNano) / 1_000_000.0;
        // Locale.US, um sicherzustellen, dass der Dezimalpunkt ein Punkt ist, kein Komma.
        emitEvent("run_finish", "duration", String.format(Locale.US, "%.2f", durationMillis));
    }

    /**
     * Signalisiert den Start einer Test-Suite (eine Gruppe von zusammengehörigen Tests).
     * @param name Der Name der Test-Suite.
     */
    public static void startSuite(String name) {
        emitEvent("suite_start", "name", name);
    }

    /**
     * Signalisiert den Start eines Subtests innerhalb einer Suite.
     * @param name Der Name des Subtests.
     */
    public static void startSubtest(String name) {
        emitEvent("subtest_start", "name", name);
    }
    
    /**
     * Überprüft eine Bedingung und sendet ein "pass" oder "fail" Event.
     * @param condition Das Ergebnis der Überprüfung (true für bestanden, false für fehlgeschlagen).
     * @param passMessage Die Nachricht, die im Erfolgsfall gesendet wird.
     * @param failMessage Die Nachricht, die im Fehlerfall gesendet wird.
     */
    public static void check(boolean condition, String passMessage, String failMessage) {
        if (condition) {
            emitEvent("assert", "status", "passed", "message", passMessage);
        } else {
            emitEvent("assert", "status", "failed", "message", failMessage);
        }
    }

    /**
     * Sendet eine reine Informationsnachricht.
     * @param message Die Informationsnachricht.
     */
    public static void logInfo(String message) {
        emitEvent("log", "level", "info", "message", message);
    }

    /**
     * Sendet eine Warnmeldung.
     * @param message Die Warnmeldung.
     */
    public static void logWarning(String message) {
        emitEvent("log", "level", "warning", "message", message);
    }

    /**
     * Sendet eine Fehlermeldung.
     * @param message Die Fehlermeldung.
     */
    public static void logError(String message) {
        emitEvent("log", "level", "error", "message", message);
    }
}