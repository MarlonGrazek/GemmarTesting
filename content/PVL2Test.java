import java.lang.reflect.Constructor;
import java.lang.reflect.Method;
import java.lang.reflect.InvocationTargetException;
import java.util.Arrays;

// Annahme: TestRunner ist im Default-Package und im Classpath verfügbar.

public class PVL2Test {

    // Hilfsmethode zur tiefen Kopie eines 2D-Integer-Arrays
    private static int[][] deepCopy(int[][] original) {
        if (original == null) {
            return null;
        }
        final int[][] result = new int[original.length][];
        for (int i = 0; i < original.length; i++) {
            if (original[i] != null) {
                result[i] = Arrays.copyOf(original[i], original[i].length);
            } else {
                result[i] = null;
            }
        }
        return result;
    }
    
    // Hilfsmethode für Reflection-Aufrufe von Methoden
    private static Object invokeMethod(Object obj, String methodName, Class<?>[] parameterTypes, Object[] args) throws NoSuchMethodException, IllegalAccessException, InvocationTargetException {
        Method method = obj.getClass().getMethod(methodName, parameterTypes);
        return method.invoke(obj, args);
    }
    
    // Überladene Hilfsmethode für Methoden ohne Parameter
    private static Object invokeMethod(Object obj, String methodName) throws NoSuchMethodException, IllegalAccessException, InvocationTargetException {
        Method method = obj.getClass().getMethod(methodName);
        return method.invoke(obj);
    }


    public static void main(String[] args) {
        if (args.length == 0) {
            System.out.println("{\"event\":\"log\",\"level\":\"error\",\"message\":\"FEHLER: Vollqualifizierter Name der Nutzerklasse wurde nicht als Argument übergeben!\"}");
            System.out.println("{\"event\":\"run_finish\",\"duration\":\"0.00\"}");
            return;
        }
        String userSolutionClassName = args[0];
        TestRunner.logInfo("PVL2Test gestartet. Nutzerklasse FQN (aus main.js): " + userSolutionClassName);

        TestRunner.startRun();
        long startTime = System.nanoTime();

        try {
            // Testfälle für den Konstruktor und die Methoden werden hier aufgerufen
            testDataPreparation(userSolutionClassName);
            testTotalRainfall(userSolutionClassName);
            testTrend(userSolutionClassName);

        } catch (InvocationTargetException ite) {
            // This will catch exceptions thrown by the user's code invoked via reflection
            Throwable cause = ite.getTargetException(); // Get the actual exception
            TestRunner.logError("Ein Fehler ist in Ihrer Implementierung aufgetreten: " + cause.getClass().getName() + " - " + TestRunner.escapeJsonString(cause.getMessage()) + ". Details siehe Konsole (stderr).");
            cause.printStackTrace(System.err); // Print stack trace of the actual exception
        } catch (ClassNotFoundException cnfe) {
            TestRunner.logError("FEHLER: Nutzerklasse '" + userSolutionClassName + "' nicht gefunden. Überprüfen Sie den Klassennamen und das Packaging. " + TestRunner.escapeJsonString(cnfe.getMessage()));
            cnfe.printStackTrace(System.err);
        } catch (NoSuchMethodException nsme) {
            TestRunner.logError("FEHLER: Eine erwartete Methode wurde in Klasse '" + userSolutionClassName + "' nicht gefunden: " + TestRunner.escapeJsonString(nsme.getMessage()) + ". Überprüfen Sie die Methodensignaturen.");
            nsme.printStackTrace(System.err);
        } catch (InstantiationException | IllegalAccessException | IllegalArgumentException e) {
            // These catch issues with creating an instance or invoking methods incorrectly (e.g. wrong parameters, not accessible)
            TestRunner.logError("FEHLER beim Erstellen oder Aufrufen der Nutzerklasse '" + userSolutionClassName + "': " + e.getClass().getName() + " - " + TestRunner.escapeJsonString(e.getMessage()));
            e.printStackTrace(System.err);
        } catch (Exception e) { // Catch-all for other unexpected errors, possibly in test logic itself
            TestRunner.logError("Ein unerwarteter kritischer Testfehler ist aufgetreten: " + e.getClass().getName() + " - " + TestRunner.escapeJsonString(e.toString()));
            e.printStackTrace(System.err);
        } finally {
            TestRunner.finishRun(startTime);
        }
    }

    // Hilfsmethode zum Erstellen einer Instanz der Nutzerklasse Forecast
    private static Object createForecastInstance(String className, int[][] rainfall, String[] descriptors) throws Exception {
        Class<?> userClass = Class.forName(className);
        Constructor<?> constructor = userClass.getDeclaredConstructor(int[][].class, String[].class);
        return constructor.newInstance(rainfall, descriptors);
    }

    // --- TESTKATEGORIEN ---

    public static void testDataPreparation(String userClassName) throws Exception {
        TestRunner.startSuite("Forecast.dataPreparation()");
        Object forecastInstance;

        // Test 1: Beispiel aus der PDF
        TestRunner.startSubtest("Beispieldaten aus PDF");
        int[][] rainfallPDF = {
                {-10, 22, 33, 19, 45, 75, 20},
                {35, -6, 57, 8, 10, -100, 10},
                {15, 20, 29, 39, 30, 75, 20}
        };
        String[] descriptorsPDF = {"sunny", "rainy", "thunderstorm", "sunny", "sunny", "thunderstorm", "sunny"};
        forecastInstance = createForecastInstance(userClassName, deepCopy(rainfallPDF), Arrays.copyOf(descriptorsPDF, descriptorsPDF.length));
        invokeMethod(forecastInstance, "dataPreparation"); 
        int totalAfterPrepPDF = (int) invokeMethod(forecastInstance, "totalRainfall");
        TestRunner.check(totalAfterPrepPDF == 683, 
            "dataPreparation() für PDF Beispiel korrekt ausgeführt (verifiziert via totalRainfall=683).", 
            "PDF Beispiel dataPreparation Fehler. Erwartet totalRainfall=683 nach dataPreparation, war aber " + totalAfterPrepPDF);

        // Test 2: Alle Werte negativ, Descriptor "sunny"
        TestRunner.startSubtest("Alle Werte negativ, Descriptor 'sunny'");
        int[][] rainfallSunnyNeg = {{-5, -10}, {-2, -8}};
        String[] descriptorsSunnyNeg = {"sunny", "sunny"};
        forecastInstance = createForecastInstance(userClassName, deepCopy(rainfallSunnyNeg), Arrays.copyOf(descriptorsSunnyNeg, descriptorsSunnyNeg.length));
        invokeMethod(forecastInstance, "dataPreparation");
        int totalSunnyNeg = (int) invokeMethod(forecastInstance, "totalRainfall");
        TestRunner.check(totalSunnyNeg == 0,
                "Alle negativen Werte mit 'sunny' sollten 0 werden, Gesamtniederschlag ist 0.",
                "Fehler bei 'sunny' und negativen Werten. Erwarteter Gesamtniederschlag: 0, Aktuell: " + totalSunnyNeg);

        // Test 3: Alle Werte negativ, Descriptor "rainy"
        TestRunner.startSubtest("Alle Werte negativ, Descriptor 'rainy'");
        int[][] rainfallRainyNegAll = {{-5, -10}, {-2, -8}};
        String[] descriptorsRainyNegAll = {"rainy", "rainy"};
        forecastInstance = createForecastInstance(userClassName, deepCopy(rainfallRainyNegAll), Arrays.copyOf(descriptorsRainyNegAll, descriptorsRainyNegAll.length));
        invokeMethod(forecastInstance, "dataPreparation");
        int totalRainyNegAll = (int) invokeMethod(forecastInstance, "totalRainfall");
        TestRunner.check(totalRainyNegAll == 0,
                "Alle negativen Werte mit 'rainy' (keine positiven für Durchschnitt) sollten 0 werden, Gesamtniederschlag ist 0.",
                "Fehler bei 'rainy' und nur negativen Werten. Erwarteter Gesamtniederschlag: 0, Aktuell: " + totalRainyNegAll);

        // Test 4: Ein Wert negativ, Descriptor "rainy", andere positiv
        TestRunner.startSubtest("Ein Wert negativ bei 'rainy', andere positiv");
        int[][] rainfallRainyMix = {{10, -5, 20}, {10, 15, 30}}; 
        String[] descriptorsRainyMix = {"sunny", "rainy", "thunderstorm"};
        forecastInstance = createForecastInstance(userClassName, deepCopy(rainfallRainyMix), Arrays.copyOf(descriptorsRainyMix, descriptorsRainyMix.length));
        invokeMethod(forecastInstance, "dataPreparation");
        int totalRainyMix = (int) invokeMethod(forecastInstance, "totalRainfall");
        TestRunner.check(totalRainyMix == 100,
                "Negative Werte bei 'rainy' mit positiven Alternativen korrekt ersetzt. Erwarteter Gesamtniederschlag: 100.",
                "Fehler bei 'rainy' Mix. Erwarteter Gesamtniederschlag: 100, Aktuell: " + totalRainyMix);

        // Test 5: Alle Werte negativ, Descriptor "thunderstorm"
        TestRunner.startSubtest("Alle Werte negativ, Descriptor 'thunderstorm'");
        int[][] rainfallThunderNeg = {{-5, -10}, {-2, -8}};
        String[] descriptorsThunderNeg = {"thunderstorm", "thunderstorm"};
        forecastInstance = createForecastInstance(userClassName, deepCopy(rainfallThunderNeg), Arrays.copyOf(descriptorsThunderNeg, descriptorsThunderNeg.length));
        invokeMethod(forecastInstance, "dataPreparation");
        int totalThunderNeg = (int) invokeMethod(forecastInstance, "totalRainfall");
        TestRunner.check(totalThunderNeg == 25,
                "Negative Werte bei 'thunderstorm' sollten zu Absolutwerten werden. Erwarteter Gesamtniederschlag: 25.",
                "Fehler bei 'thunderstorm' und negativen Werten. Erwarteter Gesamtniederschlag: 25, Aktuell: " + totalThunderNeg);

        // Test 6: Keine negativen Werte
        TestRunner.startSubtest("Keine negativen Werte");
        int[][] rainfallAllPositive = {{5, 10}, {2, 8}};
        String[] descriptorsAllPositive = {"sunny", "rainy"};
        forecastInstance = createForecastInstance(userClassName, deepCopy(rainfallAllPositive), Arrays.copyOf(descriptorsAllPositive, descriptorsAllPositive.length));
        invokeMethod(forecastInstance, "dataPreparation");
        int totalAllPositive = (int) invokeMethod(forecastInstance, "totalRainfall");
        TestRunner.check(totalAllPositive == 25,
                "Keine negativen Werte, dataPreparation sollte nichts ändern. Erwarteter Gesamtniederschlag: 25.",
                "Fehler bei nur positiven Werten. Erwarteter Gesamtniederschlag: 25, Aktuell: " + totalAllPositive);
        
        // Test 7: Leere rainfall Daten (keine Stationen)
        TestRunner.startSubtest("Leere rainfall Daten (keine Stationen)");
        int[][] rainfallEmpty = {};
        String[] descriptorsEmptyRain = {"sunny"}; 
        forecastInstance = createForecastInstance(userClassName, deepCopy(rainfallEmpty), Arrays.copyOf(descriptorsEmptyRain, descriptorsEmptyRain.length));
        invokeMethod(forecastInstance, "dataPreparation"); 
        int totalAfterEmpty = (int) invokeMethod(forecastInstance, "totalRainfall");
        TestRunner.check(totalAfterEmpty == 0, "dataPreparation mit leeren rainfall Daten (keine Stationen) ausgeführt, totalRainfall sollte 0 sein.", "TotalRainfall war " + totalAfterEmpty);

        // Test 8: Leere descriptor Daten
        TestRunner.startSubtest("Leere descriptor Daten");
        int[][] rainfallEmptyDescData = {{1,2}};
        String[] descriptorsEmpty = {};
        forecastInstance = createForecastInstance(userClassName, deepCopy(rainfallEmptyDescData), Arrays.copyOf(descriptorsEmpty, descriptorsEmpty.length));
        invokeMethod(forecastInstance, "dataPreparation"); 
        int totalAfterEmptyDesc = (int) invokeMethod(forecastInstance, "totalRainfall");
        TestRunner.check(totalAfterEmptyDesc == 3, "dataPreparation mit leeren descriptor Daten ausgeführt, totalRainfall sollte Summe der Originaldaten sein (3).", "TotalRainfall war " + totalAfterEmptyDesc);

        // Test 9: Ungleiche Längen von rainfall[station].length und descriptors.length
        TestRunner.startSubtest("Ungleiche Längen (Tage pro Station vs. descriptors)");
        int[][] rainfallDiffLenDaysFixed = {{1, -2}, {10, 20}}; 
        String[] descriptorsDiffLen = {"sunny", "rainy"}; 
        forecastInstance = createForecastInstance(userClassName, deepCopy(rainfallDiffLenDaysFixed), Arrays.copyOf(descriptorsDiffLen, descriptorsDiffLen.length));
        invokeMethod(forecastInstance, "dataPreparation");
        int totalDiffLen = (int) invokeMethod(forecastInstance, "totalRainfall");
         TestRunner.check(totalDiffLen == 51,
            "Ungleiche Längen (Tage vs descriptors) robust gehandhabt. Erwarteter Gesamtniederschlag: 51.",
            "Fehler bei ungleichen Längen. Erwarteter Gesamtniederschlag: 51, Aktuell: " + totalDiffLen);
        
        // Test 10: Null-Zeile in rainfall oder null-String in descriptors
        TestRunner.startSubtest("Null-Zeile in rainfall oder null-String in descriptors");
        int[][] rainfallWithNullRow = {{1,2}, null, {3,4}}; 
        String[] descriptorStandard = {"sunny", "rainy"}; 
        forecastInstance = createForecastInstance(userClassName, deepCopy(rainfallWithNullRow), Arrays.copyOf(descriptorStandard, descriptorStandard.length));
        invokeMethod(forecastInstance, "dataPreparation");
        int totalNullRow = (int) invokeMethod(forecastInstance, "totalRainfall");
         TestRunner.check(totalNullRow == 10, "dataPreparation mit Null-Zeile in rainfall. Erwartet Total: 10. Aktuell: " + totalNullRow, "Fehler bei Null-Zeile in rainfall.");

        int[][] rainfallForNullDesc = {{1,-5},{10,15}};
        String[] descriptorWithNullString = {"sunny", null, "rainy"}; 
        forecastInstance = createForecastInstance(userClassName, deepCopy(rainfallForNullDesc), Arrays.copyOf(descriptorWithNullString, descriptorWithNullString.length));
        invokeMethod(forecastInstance, "dataPreparation");
        int totalNullDesc = (int) invokeMethod(forecastInstance, "totalRainfall");
        TestRunner.check(totalNullDesc == 26, "dataPreparation mit null-String in descriptors (Annahme: wie sunny). Erwartet Total: 26. Aktuell: " + totalNullDesc, "Fehler bei null-String in descriptors.");

        // Test 11: "rainy" mit nur einer Station, Wert negativ
        TestRunner.startSubtest("'rainy' mit nur einer Station, Wert negativ");
        int[][] rainfallRainyOneStationNeg = {{-5}};
        String[] descriptorsRainyOneStationNeg = {"rainy"};
        forecastInstance = createForecastInstance(userClassName, deepCopy(rainfallRainyOneStationNeg), Arrays.copyOf(descriptorsRainyOneStationNeg, descriptorsRainyOneStationNeg.length));
        invokeMethod(forecastInstance, "dataPreparation");
        int totalRainyOneStationNeg = (int) invokeMethod(forecastInstance, "totalRainfall");
        TestRunner.check(totalRainyOneStationNeg == 0,
                "'rainy' mit einer Station, negativer Wert wird zu 0. Erwarteter Gesamtniederschlag: 0.",
                "Fehler bei 'rainy' eine Station neg. Erwarteter Gesamtniederschlag: 0, Aktuell: " + totalRainyOneStationNeg);

        // Test 12: "rainy" mit mehreren Stationen, eine negativ, andere positiv, Durchschnitt der positiven ist 0
        TestRunner.startSubtest("'rainy' Durchschnitt der positiven Werte ergibt 0");
        int[][] rainfallRainyAvgZero = {{10, -7, 5}, {10, 0, 5}, {10, 0, 5}}; 
        String[] descriptorsRainyAvgZero = {"sunny", "rainy", "sunny"};
        forecastInstance = createForecastInstance(userClassName, deepCopy(rainfallRainyAvgZero), Arrays.copyOf(descriptorsRainyAvgZero, descriptorsRainyAvgZero.length));
        invokeMethod(forecastInstance, "dataPreparation");
        int totalRainyAvgZero = (int) invokeMethod(forecastInstance, "totalRainfall");
        TestRunner.check(totalRainyAvgZero == 45,
                "'rainy' Durchschnitt der positiven Werte ist 0. Erwarteter Gesamtniederschlag: 45.",
                "Fehler bei 'rainy' Durchschnitt 0. Erwarteter Gesamtniederschlag: 45, Aktuell: " + totalRainyAvgZero);

         // Test 13: Unbekannter Descriptor mit negativem Wert
        TestRunner.startSubtest("Unbekannter Descriptor mit negativem Wert");
        int[][] rainfallUnknownDescData = {{-10, 20}}; 
        String[] descriptorsUnknownDesc = {"cloudy", "sunny"}; 
        forecastInstance = createForecastInstance(userClassName, deepCopy(rainfallUnknownDescData), Arrays.copyOf(descriptorsUnknownDesc, descriptorsUnknownDesc.length));
        invokeMethod(forecastInstance, "dataPreparation");
        int totalUnknownDesc = (int) invokeMethod(forecastInstance, "totalRainfall");
        TestRunner.check(totalUnknownDesc == 20, 
                "Unbekannter Descriptor, negativer Wert sollte zu 0 werden (wie 'sunny'). Erwarteter Gesamtniederschlag: 20.",
                "Fehler bei unbekanntem Descriptor. Erwarteter Gesamtniederschlag: 20, Aktuell: " + totalUnknownDesc);
    }

    public static void testTotalRainfall(String userClassName) throws Exception {
        TestRunner.startSuite("Forecast.totalRainfall()");
        Object forecastInstance;

        // Test 1: PDF Beispiel (Rohdaten, dataPreparation wird aufgerufen)
        TestRunner.startSubtest("PDF Beispiel (Rohdaten)");
        int[][] rainfallPDF_raw = {
                {-10, 22, 33, 19, 45, 75, 20},
                {35, -6, 57, 8, 10, -100, 10},
                {15, 20, 29, 39, 30, 75, 20}
        };
        String[] descriptorsPDF = {"sunny", "rainy", "thunderstorm", "sunny", "sunny", "thunderstorm", "sunny"};
        forecastInstance = createForecastInstance(userClassName, deepCopy(rainfallPDF_raw), Arrays.copyOf(descriptorsPDF, descriptorsPDF.length));
        invokeMethod(forecastInstance, "dataPreparation"); 
        int totalPDF = (int) invokeMethod(forecastInstance, "totalRainfall");
        TestRunner.check(totalPDF == 683,
                "Gesamtniederschlag für PDF Beispiel ist 683.",
                "Fehler bei PDF Beispiel. Erwartet: 683, Aktuell: " + totalPDF);

        // Test 2: Alle Werte 0
        TestRunner.startSubtest("Alle Werte 0");
        int[][] rainfallAllZero = {{0, 0}, {0, 0}};
        String[] descriptorsAllZero = {"sunny", "sunny"};
        forecastInstance = createForecastInstance(userClassName, deepCopy(rainfallAllZero), Arrays.copyOf(descriptorsAllZero, descriptorsAllZero.length));
        invokeMethod(forecastInstance, "dataPreparation");
        int totalAllZero = (int) invokeMethod(forecastInstance, "totalRainfall");
        TestRunner.check(totalAllZero == 0,
                "Gesamtniederschlag für nur 0-Werte ist 0.",
                "Fehler bei nur 0-Werten. Erwartet: 0, Aktuell: " + totalAllZero);

        // Test 3: Leere rainfall Daten (keine Stationen)
        TestRunner.startSubtest("Leere rainfall Daten (keine Stationen)");
        int[][] rainfallEmpty = {};
        String[] descriptorsEmptyRain = {"sunny"};
        forecastInstance = createForecastInstance(userClassName, deepCopy(rainfallEmpty), Arrays.copyOf(descriptorsEmptyRain, descriptorsEmptyRain.length));
        invokeMethod(forecastInstance, "dataPreparation");
        int totalEmpty = (int) invokeMethod(forecastInstance, "totalRainfall");
        TestRunner.check(totalEmpty == 0,
                "Gesamtniederschlag für leere rainfall Daten (keine Stationen) ist 0.",
                "Fehler bei leeren rainfall Daten. Erwartet: 0, Aktuell: " + totalEmpty);
        
        // Test 4: Rainfall mit leeren Zeilen (Stationen ohne Tagesdaten)
        TestRunner.startSubtest("Rainfall mit leeren Stationszeilen (Station hat keine Tagesdaten)");
        int[][] rainfallEmptyRows = {{1,2}, {}, {3,4}}; 
        String[] descriptorsEmptyRows = {"sunny", "sunny"}; 
        forecastInstance = createForecastInstance(userClassName, deepCopy(rainfallEmptyRows), Arrays.copyOf(descriptorsEmptyRows, descriptorsEmptyRows.length));
        invokeMethod(forecastInstance, "dataPreparation"); 
        int totalEmptyRows = (int) invokeMethod(forecastInstance, "totalRainfall"); 
        TestRunner.check(totalEmptyRows == 10,
                "Gesamtniederschlag bei leeren Stationszeilen. Erwartet: 10.",
                "Fehler bei leeren Stationszeilen. Erwartet: 10, Aktuell: " + totalEmptyRows);

        // Test 5: Nur eine Station, ein Tag
        TestRunner.startSubtest("Nur eine Station, ein Tag");
        int[][] rainfallSingle = {{42}};
        String[] descriptorsSingle = {"sunny"};
        forecastInstance = createForecastInstance(userClassName, deepCopy(rainfallSingle), Arrays.copyOf(descriptorsSingle, descriptorsSingle.length));
        invokeMethod(forecastInstance, "dataPreparation");
        int totalSingle = (int) invokeMethod(forecastInstance, "totalRainfall");
        TestRunner.check(totalSingle == 42,
                "Gesamtniederschlag für eine Station, ein Tag. Erwartet: 42.",
                "Fehler bei einer Station, ein Tag. Erwartet: 42, Aktuell: " + totalSingle);

        // Test 6: Rainfall Daten, aber keine Deskriptoren
        TestRunner.startSubtest("Rainfall Daten, aber keine Deskriptoren");
        int[][] rainfallNoDescData = {{10, -20}, {30, 40}};
        String[] descriptorsNoDesc = {};
        forecastInstance = createForecastInstance(userClassName, deepCopy(rainfallNoDescData), Arrays.copyOf(descriptorsNoDesc, descriptorsNoDesc.length));
        invokeMethod(forecastInstance, "dataPreparation"); 
        int totalNoDesc = (int) invokeMethod(forecastInstance, "totalRainfall");
        TestRunner.check(totalNoDesc == 80,
                "Gesamtniederschlag mit Daten aber ohne Deskriptoren. Erwartet: 80.",
                "Fehler bei keinen Deskriptoren. Erwartet: 80, Aktuell: " + totalNoDesc);
    }

    public static void testTrend(String userClassName) throws Exception {
        TestRunner.startSuite("Forecast.trend(int n)");
        Object forecastInstance;

        int[][] rainfallPDF_raw_trend = {
                {-10, 22, 33, 19, 45, 75, 20},
                {35, -6, 57, 8, 10, -100, 10},
                {15, 20, 29, 39, 30, 75, 20}
        };
        String[] descriptorsPDF_trend = {"sunny", "rainy", "thunderstorm", "sunny", "sunny", "thunderstorm", "sunny"};
        forecastInstance = createForecastInstance(userClassName, deepCopy(rainfallPDF_raw_trend), Arrays.copyOf(descriptorsPDF_trend, descriptorsPDF_trend.length));
        invokeMethod(forecastInstance, "dataPreparation"); 

        // Test 1: PDF Beispiel n=3
        TestRunner.startSubtest("PDF Beispiel n=3 -> sunny");
        String trendN3 = (String) invokeMethod(forecastInstance, "trend", new Class<?>[]{int.class}, new Object[]{3});
        TestRunner.check("sunny".equals(trendN3),
                "Trend für n=3 (PDF Beispiel) ist 'sunny'.",
                "Fehler bei Trend n=3 (PDF). Erwartet: 'sunny', Aktuell: '" + trendN3 + "'");

        // Test 2: PDF Beispiel n=2
        TestRunner.startSubtest("PDF Beispiel n=2 -> rainy");
        String trendN2 = (String) invokeMethod(forecastInstance, "trend", new Class<?>[]{int.class}, new Object[]{2});
        TestRunner.check("rainy".equals(trendN2),
                "Trend für n=2 (PDF Beispiel) ist 'rainy'.",
                "Fehler bei Trend n=2 (PDF). Erwartet: 'rainy', Aktuell: '" + trendN2 + "'");

        // Test 3: n=1, Durchschnitt genau 75
        TestRunner.startSubtest("n=1, Durchschnitt genau 75 -> thunderstorm");
        int[][] rainfallN1_75_raw = {{75}};
        String[] descN1_75 = {"sunny"};
        Object forecastN1_75 = createForecastInstance(userClassName, deepCopy(rainfallN1_75_raw), Arrays.copyOf(descN1_75, descN1_75.length));
        invokeMethod(forecastN1_75, "dataPreparation");
        String trendN1_75_val = (String) invokeMethod(forecastN1_75, "trend", new Class<?>[]{int.class}, new Object[]{1});
        TestRunner.check("thunderstorm".equals(trendN1_75_val),
                "Trend für n=1, Durchschnitt 75 ist 'thunderstorm'.",
                "Fehler bei Trend n=1, Avg 75. Erwartet: 'thunderstorm', Aktuell: '" + trendN1_75_val + "'");
        
        // Test 4: n größer als Anzahl der Tage
        TestRunner.startSubtest("n größer als Anzahl der Tage -> null");
        String trendN10 = (String) invokeMethod(forecastInstance, "trend", new Class<?>[]{int.class}, new Object[]{10}); 
        TestRunner.check(trendN10 == null,
                "Trend für n > Tage ist null.",
                "Fehler bei Trend n > Tage. Erwartet: null, Aktuell: '" + trendN10 + "'");

        // Test 5: n = 0
        TestRunner.startSubtest("n = 0 -> null");
        String trendN0 = (String) invokeMethod(forecastInstance, "trend", new Class<?>[]{int.class}, new Object[]{0});
        TestRunner.check(trendN0 == null,
                "Trend für n=0 ist null.",
                "Fehler bei Trend n=0. Erwartet: null, Aktuell: '" + trendN0 + "'");
        
        // Test 6: n < 0
        TestRunner.startSubtest("n < 0 -> null");
        String trendNNeg = (String) invokeMethod(forecastInstance, "trend", new Class<?>[]{int.class}, new Object[]{-2});
        TestRunner.check(trendNNeg == null,
                "Trend für n < 0 ist null.",
                "Fehler bei Trend n < 0. Erwartet: null, Aktuell: '" + trendNNeg + "'");

        // Test 7: Keine Stationen
        TestRunner.startSubtest("Keine Stationen -> null");
        int[][] rainfallNoStations_raw = {};
        String[] descriptorsNoStations = {"sunny", "rainy"};
        Object forecastNoStations = createForecastInstance(userClassName, deepCopy(rainfallNoStations_raw), Arrays.copyOf(descriptorsNoStations, descriptorsNoStations.length));
        invokeMethod(forecastNoStations, "dataPreparation");
        String trendNoStationsVal = (String) invokeMethod(forecastNoStations, "trend", new Class<?>[]{int.class}, new Object[]{1});
        TestRunner.check(trendNoStationsVal == null,
                "Trend bei keinen Stationen ist null.",
                "Fehler bei Trend keine Stationen. Erwartet: null, Aktuell: '" + trendNoStationsVal + "'");

        // Test 8: Keine Tage in rainfall (Stationen mit leeren Tagesdaten-Arrays)
        TestRunner.startSubtest("Keine Tage (Stationen mit leeren Tagesdaten-Arrays) -> null");
        int[][] rainfallNoDays_raw = {{}, {}}; 
        String[] descriptorsNoDays = {}; 
        Object forecastNoDays = createForecastInstance(userClassName, deepCopy(rainfallNoDays_raw), Arrays.copyOf(descriptorsNoDays, descriptorsNoDays.length));
        invokeMethod(forecastNoDays, "dataPreparation");
        String trendNoDaysVal = (String) invokeMethod(forecastNoDays, "trend", new Class<?>[]{int.class}, new Object[]{1});
        TestRunner.check(trendNoDaysVal == null,
                "Trend bei keinen Tagen (leere Stationsdaten) ist null.",
                "Fehler bei Trend keine Tage. Erwartet: null, Aktuell: '" + trendNoDaysVal + "'");
        
        // Test 9: Durchschnitt knapp unter 50
        TestRunner.startSubtest("Durchschnitt knapp unter 50 (z.B. 49) -> sunny");
        int[][] rainfallAvg49_raw = {{49}};
        String[] descAvg49 = {"sunny"};
        Object forecastAvg49 = createForecastInstance(userClassName, deepCopy(rainfallAvg49_raw), Arrays.copyOf(descAvg49, descAvg49.length));
        invokeMethod(forecastAvg49, "dataPreparation");
        String trendAvg49Val = (String) invokeMethod(forecastAvg49, "trend", new Class<?>[]{int.class}, new Object[]{1});
        TestRunner.check("sunny".equals(trendAvg49Val),
                "Trend für Durchschnitt 49 ist 'sunny'.",
                "Fehler bei Trend Avg 49. Erwartet: 'sunny', Aktuell: '" + trendAvg49Val + "'");

        // Test 10: Durchschnitt durch Ganzzahldivision 49 (z.B. 99/2) -> sunny
        TestRunner.startSubtest("Durchschnitt durch Ganzzahldivision 49 (z.B. 99/2) -> sunny");
        int[][] rainfallAvgIntDiv49_raw = {{99}, {0}}; 
        String[] descAvgIntDiv49 = {"sunny"};
        Object forecastAvgIntDiv49 = createForecastInstance(userClassName, deepCopy(rainfallAvgIntDiv49_raw), Arrays.copyOf(descAvgIntDiv49, descAvgIntDiv49.length));
        invokeMethod(forecastAvgIntDiv49, "dataPreparation");
        String trendAvgIntDiv49Val = (String) invokeMethod(forecastAvgIntDiv49, "trend", new Class<?>[]{int.class}, new Object[]{1});
        TestRunner.check("sunny".equals(trendAvgIntDiv49Val),
                "Trend für Durchschnitt (99/2=49) ist 'sunny'.",
                "Fehler bei Trend Avg (99/2=49). Erwartet: 'sunny', Aktuell: '" + trendAvgIntDiv49Val + "'");

        // Test 11: Durchschnitt knapp über 50 (nicht 75)
        TestRunner.startSubtest("Durchschnitt knapp über 50 (z.B. 51) -> rainy");
        int[][] rainfallAvg51_raw = {{51}};
        String[] descAvg51 = {"sunny"};
        Object forecastAvg51 = createForecastInstance(userClassName, deepCopy(rainfallAvg51_raw), Arrays.copyOf(descAvg51, descAvg51.length));
        invokeMethod(forecastAvg51, "dataPreparation");
        String trendAvg51Val = (String) invokeMethod(forecastAvg51, "trend", new Class<?>[]{int.class}, new Object[]{1});
        TestRunner.check("rainy".equals(trendAvg51Val),
                "Trend für Durchschnitt 51 ist 'rainy'.",
                "Fehler bei Trend Avg 51. Erwartet: 'rainy', Aktuell: '" + trendAvg51Val + "'");
        
        // Test 12: Durchschnitt knapp unter 75 (z.B. 74)
        TestRunner.startSubtest("Durchschnitt knapp unter 75 (z.B. 74) -> rainy");
        int[][] rainfallAvg74_raw = {{74}};
        String[] descAvg74 = {"sunny"};
        Object forecastAvg74 = createForecastInstance(userClassName, deepCopy(rainfallAvg74_raw), Arrays.copyOf(descAvg74, descAvg74.length));
        invokeMethod(forecastAvg74, "dataPreparation");
        String trendAvg74Val = (String) invokeMethod(forecastAvg74, "trend", new Class<?>[]{int.class}, new Object[]{1});
        TestRunner.check("rainy".equals(trendAvg74Val),
                "Trend für Durchschnitt 74 ist 'rainy'.",
                "Fehler bei Trend Avg 74. Erwartet: 'rainy', Aktuell: '" + trendAvg74Val + "'");

        // Test 13: Durchschnitt knapp über 75 (z.B. 76)
        TestRunner.startSubtest("Durchschnitt knapp über 75 (z.B. 76) -> rainy");
        int[][] rainfallAvg76_raw = {{76}};
        String[] descAvg76 = {"sunny"};
        Object forecastAvg76 = createForecastInstance(userClassName, deepCopy(rainfallAvg76_raw), Arrays.copyOf(descAvg76, descAvg76.length));
        invokeMethod(forecastAvg76, "dataPreparation");
        String trendAvg76Val = (String) invokeMethod(forecastAvg76, "trend", new Class<?>[]{int.class}, new Object[]{1});
        TestRunner.check("rainy".equals(trendAvg76Val),
                "Trend für Durchschnitt 76 ist 'rainy'.",
                "Fehler bei Trend Avg 76. Erwartet: 'rainy', Aktuell: '" + trendAvg76Val + "'");
        
        // Test 14: n ist gleich Anzahl der Tage
        TestRunner.startSubtest("n ist gleich Anzahl der Tage -> sunny (PDF Beispiel Avg 32)");
        // forecastInstance wurde bereits am Anfang von testTrend mit PDF-Daten initialisiert
        String trendN7 = (String) invokeMethod(forecastInstance, "trend", new Class<?>[]{int.class}, new Object[]{7});
        TestRunner.check("sunny".equals(trendN7),
                "Trend für n = Anzahl Tage (PDF Beispiel, Avg 32) ist 'sunny'.",
                "Fehler bei Trend n = Tage. Erwartet: 'sunny', Aktuell: '" + trendN7 + "'");
        
        // Test 15: Alle Werte der letzten n Tage sind 0
        TestRunner.startSubtest("Alle Werte der letzten n Tage sind 0 -> sunny");
        int[][] rainfallLastNDaysZero_raw = {{100,100,0,0},{100,100,0,0}}; 
        String[] descLastNDaysZero = {"sunny","sunny","sunny","sunny"};
        Object forecastLastNDaysZero = createForecastInstance(userClassName, deepCopy(rainfallLastNDaysZero_raw), Arrays.copyOf(descLastNDaysZero, descLastNDaysZero.length));
        invokeMethod(forecastLastNDaysZero, "dataPreparation");
        String trendLastNDaysZeroVal = (String) invokeMethod(forecastLastNDaysZero, "trend", new Class<?>[]{int.class}, new Object[]{2}); 
        TestRunner.check("sunny".equals(trendLastNDaysZeroVal),
                "Trend wenn letzte n Tage nur 0-Werte haben, ist 'sunny'.",
                "Fehler bei Trend letzte n Tage 0. Erwartet: 'sunny', Aktuell: '" + trendLastNDaysZeroVal + "'");

        // Test 16: n = 1, letzter Tag hat Durchschnitt 50
        TestRunner.startSubtest("n=1, letzter Tag Durchschnitt 50 -> rainy");
        int[][] rainfallN1_50_raw = {{50}};
        String[] descN1_50 = {"sunny"};
        Object forecastN1_50 = createForecastInstance(userClassName, deepCopy(rainfallN1_50_raw), Arrays.copyOf(descN1_50, descN1_50.length));
        invokeMethod(forecastN1_50, "dataPreparation");
        String trendN1_50_val = (String) invokeMethod(forecastN1_50, "trend", new Class<?>[]{int.class}, new Object[]{1});
        TestRunner.check("rainy".equals(trendN1_50_val),
                "Trend für n=1, Durchschnitt 50 ist 'rainy'.",
                "Fehler bei Trend n=1, Avg 50. Erwartet: 'rainy', Aktuell: '" + trendN1_50_val + "'");

        // Test 17: Ungleiche Anzahl von Tagen pro Station, n ist valide für die kürzeste Station
        TestRunner.startSubtest("Ungleiche Tage pro Station, n valide für kürzeste");
        int[][] rainfallUnevenDays_raw = {
            {10, 20, 30, 40, 50}, 
            {15, 25, 35}          
        };
        String[] descriptorsUneven = {"s", "s", "s", "s", "s"}; 
        Object forecastUneven = createForecastInstance(userClassName, deepCopy(rainfallUnevenDays_raw), Arrays.copyOf(descriptorsUneven, descriptorsUneven.length));
        invokeMethod(forecastUneven, "dataPreparation"); 
        String trendUnevenN3 = (String) invokeMethod(forecastUneven, "trend", new Class<?>[]{int.class}, new Object[]{3});
        TestRunner.check("sunny".equals(trendUnevenN3),
                "Trend bei ungleichen Tagen pro Station (n=3, Avg 32) ist 'sunny'.",
                "Fehler bei Trend ungleiche Tage. Erwartet: 'sunny', Aktuell: '" + trendUnevenN3 + "'");

        // Test 18: n erfordert mehr Tage als die kürzeste Station hat -> null
        TestRunner.startSubtest("n erfordert mehr Tage als kürzeste Station hat -> null");
        // forecastUneven wurde bereits für Test 17 erstellt und vorbereitet
        String trendUnevenN4 = (String) invokeMethod(forecastUneven, "trend", new Class<?>[]{int.class}, new Object[]{4}); 
        TestRunner.check(trendUnevenN4 == null,
                "Trend ist null, wenn n > Tage der kürzesten Station.",
                "Fehler bei Trend n > Tage kürzeste Station. Erwartet: null, Aktuell: '" + trendUnevenN4 + "'");
    }
}