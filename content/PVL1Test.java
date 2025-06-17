import java.lang.reflect.Method;
import java.lang.reflect.InvocationTargetException;
import java.util.Arrays;
import java.util.Objects;

public class PVL1Test {

    // Hilfsmethode zur Formatierung von Array-Werten für eine klare Ausgabe.
    private static String formatArray(Object array) {
        if (array == null) {
            return "null";
        }
        if (array instanceof String[]) {
            return Arrays.toString((String[]) array);
        }
        return Objects.toString(array);
    }

    // Hilfsmethode für Reflection-Aufrufe von statischen Methoden
    private static Object invokeStaticMethod(Class<?> clazz, String methodName, Class<?>[] parameterTypes, Object[] args)
            throws NoSuchMethodException, IllegalAccessException, InvocationTargetException {
        Method method = clazz.getMethod(methodName, parameterTypes);
        return method.invoke(null, args); // null für statische Methoden
    }

    public static void main(String[] args) {
        if (args.length == 0) {
            System.out.println("{\"event\":\"log\",\"level\":\"error\",\"message\":\"FEHLER: Vollqualifizierter Name der Stringsplitter-Klasse nicht als Argument übergeben!\"}");
            System.out.println("{\"event\":\"run_finish\",\"duration\":\"0.00\"}");
            return;
        }
        String stringsplitterFQN = args[0];
        Class<?> stringsplitterClass = null;

        TestRunner.logInfo("PVL1Test gestartet. Stringsplitter FQN: " + stringsplitterFQN);
        TestRunner.startRun();
        long startTime = System.nanoTime();

        try {
            stringsplitterClass = Class.forName(stringsplitterFQN);

            testSplitString(stringsplitterClass);
            testSortWordsByLength(stringsplitterClass);
            testSwapFirstLastWords(stringsplitterClass);
            testSearchWordWithLength(stringsplitterClass);

        } catch (ClassNotFoundException cnfe) {
            TestRunner.logError("FEHLER: Nutzerklasse '" + stringsplitterFQN + "' nicht gefunden. Überprüfen Sie den Klassennamen und das Packaging. Fehlermeldung: " + TestRunner.escapeJsonString(cnfe.getMessage()));
            cnfe.printStackTrace(System.err);
        } catch (NoSuchMethodException nsme) {
            TestRunner.logError("FEHLER: Eine erwartete Methode wurde in Klasse '" + stringsplitterFQN + "' nicht gefunden: " + TestRunner.escapeJsonString(nsme.getMessage()) + ". Überprüfen Sie die Methodensignaturen.");
            nsme.printStackTrace(System.err);
        } catch (InvocationTargetException ite) {
            Throwable cause = ite.getTargetException();
            TestRunner.logError("Ein Fehler ist in Ihrer Implementierung aufgetreten: " + cause.getClass().getName() + " - " + TestRunner.escapeJsonString(cause.getMessage()) + ". Details siehe Konsole (stderr).");
            cause.printStackTrace(System.err);
        } catch (IllegalAccessException | IllegalArgumentException iae) {
            TestRunner.logError("FEHLER beim Aufrufen einer Methode der Nutzerklasse '" + stringsplitterFQN + "': " + iae.getClass().getName() + " - " + TestRunner.escapeJsonString(iae.getMessage()));
            iae.printStackTrace(System.err);
        } catch (Exception e) { 
            TestRunner.logError("Ein unerwarteter kritischer Testfehler ist aufgetreten: " + e.getClass().getName() + " - " + TestRunner.escapeJsonString(e.toString()));
            e.printStackTrace(System.err);
        } finally {
            TestRunner.finishRun(startTime);
        }
    }

    // --- Testkategorien ---

    public static void testSplitString(Class<?> stringsplitterClass) throws Exception {
        TestRunner.startSuite("Stringsplitter.splitString(String sentence)");
        String[] result;
        String[] expected;

        // Test 1: Beispiel aus PDF - firstSentence
        TestRunner.startSubtest("PDF Beispiel: 'aaaa bbb cc d'");
        String sentence1 = "aaaa bbb cc d";
        expected = new String[]{"aaaa", "bbb", "cc", "d"};
        result = (String[]) invokeStaticMethod(stringsplitterClass, "splitString", new Class<?>[]{String.class}, new Object[]{sentence1});
        TestRunner.check(Arrays.equals(expected, result), 
                        "splitString('" + sentence1 + "') sollte " + formatArray(expected) + " ergeben.",
                        "Fehler bei splitString('" + sentence1 + "'). Erwartet: " + formatArray(expected) + ", Aktuell: " + formatArray(result));

        // Test 2: Beispiel aus PDF - secondSentence
        TestRunner.startSubtest("PDF Beispiel: 'Hallo Welt'");
        String sentence2 = "Hallo Welt";
        expected = new String[]{"Hallo", "Welt"};
        result = (String[]) invokeStaticMethod(stringsplitterClass, "splitString", new Class<?>[]{String.class}, new Object[]{sentence2});
        TestRunner.check(Arrays.equals(expected, result),
                        "splitString('" + sentence2 + "') sollte " + formatArray(expected) + " ergeben.",
                        "Fehler bei splitString('" + sentence2 + "'). Erwartet: " + formatArray(expected) + ", Aktuell: " + formatArray(result));

        // Test 3: Beispiel aus PDF - thirdSentence
        TestRunner.startSubtest("PDF Beispiel: 'Datenstrukturen im Sommersemester 2025'");
        String sentence3 = "Datenstrukturen im Sommersemester 2025";
        expected = new String[]{"Datenstrukturen", "im", "Sommersemester", "2025"};
        result = (String[]) invokeStaticMethod(stringsplitterClass, "splitString", new Class<?>[]{String.class}, new Object[]{sentence3});
        TestRunner.check(Arrays.equals(expected, result),
                        "splitString('" + sentence3 + "') sollte " + formatArray(expected) + " ergeben.",
                        "Fehler bei splitString('" + sentence3 + "'). Erwartet: " + formatArray(expected) + ", Aktuell: " + formatArray(result));
        
        // Test 4: Leerer String
        TestRunner.startSubtest("Leerer String ''");
        String sentenceEmpty = "";
        expected = new String[]{}; 
        result = (String[]) invokeStaticMethod(stringsplitterClass, "splitString", new Class<?>[]{String.class}, new Object[]{sentenceEmpty});
        TestRunner.check(result != null && result.length == 0, 
                        "splitString('') sollte ein leeres Array (Länge 0, nicht null) ergeben.",
                        "Fehler bei splitString(''). Erwartet: leeres Array (Länge 0, nicht null), Aktuell: " + formatArray(result) + (result != null ? " (Länge: " + result.length + ")" : ""));
        
        // Test 5: String mit nur Leerzeichen
        TestRunner.startSubtest("String mit nur Leerzeichen '   '");
        String sentenceSpaces = "   ";
        expected = new String[]{}; 
        result = (String[]) invokeStaticMethod(stringsplitterClass, "splitString", new Class<?>[]{String.class}, new Object[]{sentenceSpaces});
        TestRunner.check(result != null && result.length == 0,
                        "splitString('   ') sollte ein leeres Array (Länge 0, nicht null) ergeben.",
                        "Fehler bei splitString('   '). Erwartet: leeres Array (Länge 0, nicht null), Aktuell: " + formatArray(result) + (result != null ? " (Länge: " + result.length + ")" : ""));

        // Test 6: Ein einzelnes Wort
        TestRunner.startSubtest("Ein einzelnes Wort 'Wort'");
        String sentenceSingle = "Wort";
        expected = new String[]{"Wort"};
        result = (String[]) invokeStaticMethod(stringsplitterClass, "splitString", new Class<?>[]{String.class}, new Object[]{sentenceSingle});
        TestRunner.check(Arrays.equals(expected, result),
                        "splitString('Wort') sollte {'Wort'} ergeben.",
                        "Fehler bei splitString('Wort'). Erwartet: " + formatArray(expected) + ", Aktuell: " + formatArray(result));
        
        // Test 7 (vorher Test 8): Null als Eingabe
        TestRunner.startSubtest("Null als Eingabe für sentence");
        try {
            result = (String[]) invokeStaticMethod(stringsplitterClass, "splitString", new Class<?>[]{String.class}, new Object[]{null});
            // Wenn die Methode null zurückgibt oder ein leeres Array, ist das ok für diesen Fall.
            // Die Aufgabenstellung spezifiziert das Verhalten für null nicht explizit.
            TestRunner.check(result == null || (result != null && result.length == 0),
                            "splitString(null) sollte null oder ein leeres Array zurückgeben.",
                            "Unerwartetes Ergebnis für splitString(null): " + formatArray(result));
        } catch (InvocationTargetException ite) {
            if (ite.getTargetException() instanceof NullPointerException) {
                TestRunner.check(true, "splitString(null) hat korrekterweise eine NullPointerException in Ihrer Methode ausgelöst (oder sollte null/leeres Array zurückgeben).", "");
            } else {
                TestRunner.logError("Unerwarteter Fehler in Ihrer Methode bei splitString(null): " + ite.getTargetException().getClass().getSimpleName());
                throw ite; 
            }
        }
    }

    public static void testSortWordsByLength(Class<?> stringsplitterClass) throws Exception {
        TestRunner.startSuite("Stringsplitter.sortWordsByLength(String[] words)");
        String[] result;
        String[] expected;
        String[] originalInput;

        // Test 1: Beispiel aus PDF - wordsFirstSentence
        TestRunner.startSubtest("PDF Beispiel: {'aaaa', 'bbb', 'cc', 'd'}");
        originalInput = new String[]{"aaaa", "bbb", "cc", "d"};
        expected = new String[]{"d", "cc", "bbb", "aaaa"};
        result = (String[]) invokeStaticMethod(stringsplitterClass, "sortWordsByLength", new Class<?>[]{String[].class}, new Object[]{originalInput});
        TestRunner.check(Arrays.equals(expected, result),
                        "sortWordsByLength auf {'aaaa', 'bbb', 'cc', 'd'} sollte " + formatArray(expected) + " ergeben.",
                        "Fehler bei sortWordsByLength. Erwartet: " + formatArray(expected) + ", Aktuell: " + formatArray(result));
        
        // Test 2: Beispiel aus PDF - wordsSecondSentence
        TestRunner.startSubtest("PDF Beispiel: {'Hallo', 'Welt'}");
        originalInput = new String[]{"Hallo", "Welt"}; 
        expected = new String[]{"Welt", "Hallo"};
        result = (String[]) invokeStaticMethod(stringsplitterClass, "sortWordsByLength", new Class<?>[]{String[].class}, new Object[]{originalInput});
        TestRunner.check(Arrays.equals(expected, result),
                        "sortWordsByLength auf {'Hallo', 'Welt'} sollte " + formatArray(expected) + " ergeben.",
                        "Fehler bei sortWordsByLength. Erwartet: " + formatArray(expected) + ", Aktuell: " + formatArray(result));

        // Test 3: Beispiel aus PDF - wordsThirdSentence
        TestRunner.startSubtest("PDF Beispiel: {'Datenstrukturen', 'im', 'Sommersemester', '2025'}");
        originalInput = new String[]{"Datenstrukturen", "im", "Sommersemester", "2025"};
        expected = new String[]{"im", "2025", "Sommersemester", "Datenstrukturen"};
        result = (String[]) invokeStaticMethod(stringsplitterClass, "sortWordsByLength", new Class<?>[]{String[].class}, new Object[]{originalInput});
        TestRunner.check(Arrays.equals(expected, result),
                        "sortWordsByLength auf PDF Beispiel 3 sollte " + formatArray(expected) + " ergeben.",
                        "Fehler bei sortWordsByLength PDF Bsp 3. Erwartet: " + formatArray(expected) + ", Aktuell: " + formatArray(result));

        // Test 4: Leeres Array
        TestRunner.startSubtest("Leeres Array {}");
        originalInput = new String[]{};
        expected = new String[]{};
        result = (String[]) invokeStaticMethod(stringsplitterClass, "sortWordsByLength", new Class<?>[]{String[].class}, new Object[]{originalInput});
        TestRunner.check(Arrays.equals(expected, result),
                        "sortWordsByLength auf {} sollte {} ergeben.",
                        "Fehler bei sortWordsByLength mit leerem Array. Erwartet: " + formatArray(expected) + ", Aktuell: " + formatArray(result));

        // Test 5: Array mit einem Element
        TestRunner.startSubtest("Array mit einem Element {'single'}");
        originalInput = new String[]{"single"};
        expected = new String[]{"single"};
        result = (String[]) invokeStaticMethod(stringsplitterClass, "sortWordsByLength", new Class<?>[]{String[].class}, new Object[]{originalInput});
        TestRunner.check(Arrays.equals(expected, result),
                        "sortWordsByLength auf {'single'} sollte {'single'} ergeben.",
                        "Fehler bei sortWordsByLength mit einem Element. Erwartet: " + formatArray(expected) + ", Aktuell: " + formatArray(result));

        // Test 6: Bereits sortiertes Array
        TestRunner.startSubtest("Bereits sortiertes Array {'a', 'bb', 'ccc'}");
        originalInput = new String[]{"a", "bb", "ccc"};
        expected = new String[]{"a", "bb", "ccc"};
        result = (String[]) invokeStaticMethod(stringsplitterClass, "sortWordsByLength", new Class<?>[]{String[].class}, new Object[]{originalInput});
        TestRunner.check(Arrays.equals(expected, result),
                        "sortWordsByLength auf bereits sortiertem Array sollte es nicht ändern.",
                        "Fehler bei sortWordsByLength mit bereits sortiertem Array. Erwartet: " + formatArray(expected) + ", Aktuell: " + formatArray(result));
        
        // Test 7: Umgekehrt sortiertes Array
        TestRunner.startSubtest("Umgekehrt sortiertes Array {'ccccc', 'bbbb', 'aaa'}");
        originalInput = new String[]{"ccccc", "bbbb", "aaa"};
        expected = new String[]{"aaa", "bbbb", "ccccc"};
        result = (String[]) invokeStaticMethod(stringsplitterClass, "sortWordsByLength", new Class<?>[]{String[].class}, new Object[]{originalInput});
        TestRunner.check(Arrays.equals(expected, result),
                        "sortWordsByLength auf umgekehrt sortiertem Array.",
                        "Fehler bei sortWordsByLength mit umgekehrt sortiertem Array. Erwartet: " + formatArray(expected) + ", Aktuell: " + formatArray(result));

        // Test 8: Array mit leeren Strings
        TestRunner.startSubtest("Array mit leeren Strings {'a', '', 'bbb'}");
        originalInput = new String[]{"a", "", "bbb"};
        expected = new String[]{"", "a", "bbb"}; // Leerer String hat Länge 0
        result = (String[]) invokeStaticMethod(stringsplitterClass, "sortWordsByLength", new Class<?>[]{String[].class}, new Object[]{originalInput});
        TestRunner.check(Arrays.equals(expected, result),
                        "sortWordsByLength mit leeren Strings.",
                        "Fehler bei sortWordsByLength mit leeren Strings. Erwartet: " + formatArray(expected) + ", Aktuell: " + formatArray(result));
        
        // Test 9: Null als Eingabe für words Array
        TestRunner.startSubtest("Null als Eingabe für words Array");
        try {
            result = (String[]) invokeStaticMethod(stringsplitterClass, "sortWordsByLength", new Class<?>[]{String[].class}, new Object[]{null});
            TestRunner.check(result == null || result.length == 0,
                            "sortWordsByLength(null) sollte null oder ein leeres Array zurückgeben.",
                            "Unerwartetes Ergebnis für sortWordsByLength(null): " + formatArray(result));
        } catch (InvocationTargetException ite) {
            if (ite.getTargetException() instanceof NullPointerException) {
                TestRunner.check(true, "sortWordsByLength(null) hat korrekterweise eine NullPointerException in Ihrer Methode ausgelöst (oder sollte null/leeres Array zurückgeben).", "");
            } else {
                TestRunner.logError("Unerwarteter Fehler in Ihrer Methode bei sortWordsByLength(null): " + ite.getTargetException().getClass().getSimpleName());
                throw ite;
            }
        }
    }

    public static void testSwapFirstLastWords(Class<?> stringsplitterClass) throws Exception {
        TestRunner.startSuite("Stringsplitter.swapFirstLastWords(String[] words)");
        String[] result;
        String[] expected;
        String[] originalInput;

        // Test 1: Beispiel aus PDF - wordsFirstSentence
        TestRunner.startSubtest("PDF Beispiel: {'aaaa', 'bbb', 'cc', 'd'}");
        originalInput = new String[]{"aaaa", "bbb", "cc", "d"};
        expected = new String[]{"d", "bbb", "cc", "aaaa"};
        result = (String[]) invokeStaticMethod(stringsplitterClass, "swapFirstLastWords", new Class<?>[]{String[].class}, new Object[]{Arrays.copyOf(originalInput, originalInput.length)});
        TestRunner.check(Arrays.equals(expected, result),
                        "swapFirstLastWords auf {'aaaa', 'bbb', 'cc', 'd'} sollte " + formatArray(expected) + " ergeben.",
                        "Fehler bei swapFirstLastWords. Erwartet: " + formatArray(expected) + ", Aktuell: " + formatArray(result));

        // Test 2: Beispiel aus PDF - wordsSecondSentence
        TestRunner.startSubtest("PDF Beispiel: {'Hallo', 'Welt'}");
        originalInput = new String[]{"Hallo", "Welt"};
        expected = new String[]{"Welt", "Hallo"};
        result = (String[]) invokeStaticMethod(stringsplitterClass, "swapFirstLastWords", new Class<?>[]{String[].class}, new Object[]{Arrays.copyOf(originalInput, originalInput.length)});
        TestRunner.check(Arrays.equals(expected, result),
                        "swapFirstLastWords auf {'Hallo', 'Welt'} sollte " + formatArray(expected) + " ergeben.",
                        "Fehler bei swapFirstLastWords. Erwartet: " + formatArray(expected) + ", Aktuell: " + formatArray(result));

        // Test 3: Beispiel aus PDF - wordsThirdSentence
        TestRunner.startSubtest("PDF Beispiel: {'Datenstrukturen', 'im', 'Sommersemester', '2025'}");
        originalInput = new String[]{"Datenstrukturen", "im", "Sommersemester", "2025"};
        expected = new String[]{"2025", "im", "Sommersemester", "Datenstrukturen"};
        result = (String[]) invokeStaticMethod(stringsplitterClass, "swapFirstLastWords", new Class<?>[]{String[].class}, new Object[]{Arrays.copyOf(originalInput, originalInput.length)});
        TestRunner.check(Arrays.equals(expected, result),
                        "swapFirstLastWords auf PDF Bsp 3 sollte " + formatArray(expected) + " ergeben.",
                        "Fehler bei swapFirstLastWords PDF Bsp 3. Erwartet: " + formatArray(expected) + ", Aktuell: " + formatArray(result));

        // Test 4: Array mit 0 Elementen
        TestRunner.startSubtest("Array mit 0 Elementen {} -> null");
        originalInput = new String[]{};
        result = (String[]) invokeStaticMethod(stringsplitterClass, "swapFirstLastWords", new Class<?>[]{String[].class}, new Object[]{Arrays.copyOf(originalInput, originalInput.length)});
        TestRunner.check(result == null,
                        "swapFirstLastWords auf {} sollte null ergeben.",
                        "Fehler bei swapFirstLastWords mit 0 Elementen. Erwartet: null, Aktuell: " + formatArray(result));
        
        // Test 5: Array mit 1 Element
        TestRunner.startSubtest("Array mit 1 Element {'one'} -> null");
        originalInput = new String[]{"one"};
        result = (String[]) invokeStaticMethod(stringsplitterClass, "swapFirstLastWords", new Class<?>[]{String[].class}, new Object[]{Arrays.copyOf(originalInput, originalInput.length)});
        TestRunner.check(result == null,
                        "swapFirstLastWords auf {'one'} sollte null ergeben.",
                        "Fehler bei swapFirstLastWords mit 1 Element. Erwartet: null, Aktuell: " + formatArray(result));

        // Test 6: Array mit genau 2 Elementen
        TestRunner.startSubtest("Array mit 2 Elementen {'first', 'last'}");
        originalInput = new String[]{"first", "last"};
        expected = new String[]{"last", "first"};
        result = (String[]) invokeStaticMethod(stringsplitterClass, "swapFirstLastWords", new Class<?>[]{String[].class}, new Object[]{Arrays.copyOf(originalInput, originalInput.length)});
        TestRunner.check(Arrays.equals(expected, result),
                        "swapFirstLastWords auf {'first', 'last'} sollte " + formatArray(expected) + " ergeben.",
                        "Fehler bei swapFirstLastWords mit 2 Elementen. Erwartet: " + formatArray(expected) + ", Aktuell: " + formatArray(result));

        // Test 7: Null als Eingabe für words Array
        TestRunner.startSubtest("Null als Eingabe für words Array -> null");
        try {
            result = (String[]) invokeStaticMethod(stringsplitterClass, "swapFirstLastWords", new Class<?>[]{String[].class}, new Object[]{null});
            TestRunner.check(result == null,
                            "swapFirstLastWords(null) sollte null zurückgeben.",
                            "Unerwartetes Ergebnis für swapFirstLastWords(null): " + formatArray(result));
        } catch (InvocationTargetException ite) {
            if (ite.getTargetException() instanceof NullPointerException) {
                 TestRunner.check(true, "swapFirstLastWords(null) hat korrekterweise eine NullPointerException in Ihrer Methode ausgelöst (oder sollte null zurückgeben).", "");
            } else {
                TestRunner.logError("Unerwarteter Fehler in Ihrer Methode bei swapFirstLastWords(null): " + ite.getTargetException().getClass().getSimpleName());
                throw ite;
            }
        }
    }

    public static void testSearchWordWithLength(Class<?> stringsplitterClass) throws Exception {
        TestRunner.startSuite("Stringsplitter.searchWordWithLength(String[] words, int length)");
        String result;
        String expectedWord;
        String[] inputArray;

        // Test 1: Beispiel aus PDF - wordsFirstSentence, length 2
        TestRunner.startSubtest("PDF Beispiel: {'aaaa', 'bbb', 'cc', 'd'}, length 2 -> 'cc'");
        inputArray = new String[]{"aaaa", "bbb", "cc", "d"};
        expectedWord = "cc";
        result = (String) invokeStaticMethod(stringsplitterClass, "searchWordWithLength", new Class<?>[]{String[].class, int.class}, new Object[]{inputArray, 2});
        TestRunner.check(Objects.equals(expectedWord, result),
                        "searchWordWithLength für Länge 2 sollte '" + expectedWord + "' ergeben.",
                        "Fehler bei searchWordWithLength. Erwartet: '" + expectedWord + "', Aktuell: '" + result + "'");

        // Test 2: Beispiel aus PDF - wordsSecondSentence, length 4
        TestRunner.startSubtest("PDF Beispiel: {'Hallo', 'Welt'}, length 4 -> 'Welt'");
        inputArray = new String[]{"Hallo", "Welt"}; 
        expectedWord = "Welt";
        result = (String) invokeStaticMethod(stringsplitterClass, "searchWordWithLength", new Class<?>[]{String[].class, int.class}, new Object[]{inputArray, 4});
        TestRunner.check(Objects.equals(expectedWord, result),
                        "searchWordWithLength für Länge 4 sollte '" + expectedWord + "' ergeben.",
                        "Fehler bei searchWordWithLength. Erwartet: '" + expectedWord + "', Aktuell: '" + result + "'");

        // Test 3: Beispiel aus PDF - wordsThirdSentence, length 14
        TestRunner.startSubtest("PDF Beispiel: {..., 'Sommersemester', ...}, length 14 -> 'Sommersemester'");
        inputArray = new String[]{"Datenstrukturen", "im", "Sommersemester", "2025"};
        expectedWord = "Sommersemester";
        result = (String) invokeStaticMethod(stringsplitterClass, "searchWordWithLength", new Class<?>[]{String[].class, int.class}, new Object[]{inputArray, 14});
        TestRunner.check(Objects.equals(expectedWord, result),
                        "searchWordWithLength für Länge 14 sollte '" + expectedWord + "' ergeben.",
                        "Fehler bei searchWordWithLength. Erwartet: '" + expectedWord + "', Aktuell: '" + result + "'");
        
        // Test 4: Wort am Anfang des Arrays
        TestRunner.startSubtest("Wort gesuchter Länge am Anfang");
        inputArray = new String[]{"kurz", "laenger", "mittellang"};
        expectedWord = "kurz";
        result = (String) invokeStaticMethod(stringsplitterClass, "searchWordWithLength", new Class<?>[]{String[].class, int.class}, new Object[]{inputArray, 4});
        TestRunner.check(Objects.equals(expectedWord, result),
                        "searchWordWithLength (Länge 4, Wort am Anfang).",
                        "Fehler bei Suche (Wort am Anfang). Erwartet: '" + expectedWord + "', Aktuell: '" + result + "'");

        // Test 5: Wort am Ende des Arrays
        TestRunner.startSubtest("Wort gesuchter Länge am Ende");
        inputArray = new String[]{"laenger", "mittellang", "kurz"};
        expectedWord = "kurz";
        result = (String) invokeStaticMethod(stringsplitterClass, "searchWordWithLength", new Class<?>[]{String[].class, int.class}, new Object[]{inputArray, 4});
        TestRunner.check(Objects.equals(expectedWord, result),
                        "searchWordWithLength (Länge 4, Wort am Ende).",
                        "Fehler bei Suche (Wort am Ende). Erwartet: '" + expectedWord + "', Aktuell: '" + result + "'");

        // Test 6: Leeres Array (Robustheitstest, da Vorbedingung "Wort existiert" verletzt wird)
        TestRunner.startSubtest("Leeres Array {} (Robustheitstest)");
        inputArray = new String[]{};
        try {
             result = (String) invokeStaticMethod(stringsplitterClass, "searchWordWithLength", new Class<?>[]{String[].class, int.class}, new Object[]{inputArray, 5});
             TestRunner.check(result == null, 
                            "searchWordWithLength mit leerem Array sollte null zurückgeben (oder Exception auslösen, da Vorbedingung verletzt).",
                            "Unerwartetes Ergebnis für leeres Array: " + result);
        } catch (InvocationTargetException ite) {
            TestRunner.check(true, "searchWordWithLength mit leerem Array hat Exception in Ihrer Methode ausgelöst (akzeptabel bei verletzter Vorbedingung): " + ite.getTargetException().getClass().getSimpleName(), "");
        }


        // Test 7: Länge 0 (leerer String im Array)
        TestRunner.startSubtest("Suche nach Länge 0 (leerer String)");
        inputArray = new String[]{"a", "", "bbb"};
        expectedWord = "";
        result = (String) invokeStaticMethod(stringsplitterClass, "searchWordWithLength", new Class<?>[]{String[].class, int.class}, new Object[]{inputArray, 0});
        TestRunner.check(Objects.equals(expectedWord, result),
                        "searchWordWithLength für Länge 0 sollte leeren String finden.",
                        "Fehler bei Suche nach Länge 0. Erwartet: '"+expectedWord+"', Aktuell: '" + result + "'");
        
        // Test 8: Null als Eingabe für words Array
        TestRunner.startSubtest("Null als Eingabe für words Array");
        try {
            result = (String) invokeStaticMethod(stringsplitterClass, "searchWordWithLength", new Class<?>[]{String[].class, int.class}, new Object[]{null, 5});
            TestRunner.check(result == null, 
                            "searchWordWithLength(null, 5) sollte null zurückgeben (oder Exception auslösen).",
                            "Unerwartetes Ergebnis für searchWordWithLength(null, 5): " + result);
        } catch (InvocationTargetException ite) {
            if (ite.getTargetException() instanceof NullPointerException) {
                TestRunner.check(true, "searchWordWithLength(null, 5) hat korrekterweise eine NullPointerException in Ihrer Methode ausgelöst.", "");
            } else {
                TestRunner.logError("Unerwarteter Fehler in Ihrer Methode bei searchWordWithLength(null, 5): " + ite.getTargetException().getClass().getSimpleName());
                throw ite;
            }
        }
    }
}