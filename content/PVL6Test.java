import java.lang.reflect.Constructor;
import java.lang.reflect.Method;
import java.lang.reflect.InvocationTargetException;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Testklasse für PVL6 (Graph), die der Struktur von PVL5Test folgt.
 * Sie verwendet Reflection, um die Implementierung des Nutzers zu testen,
 * und gibt die Ergebnisse in einem strukturierten JSON-Format aus.
 * Diese Klasse ist kompatibel mit der bereitgestellten TestRunner.java.
 */
public class PVL6Test {

    // FQN der Nutzerklasse, wird in main initialisiert
    private static String graphFQN;

    // Klassenobjekt für Reflection
    private static Class<?> graphClass;

    // ===================================================================================
    // MAIN METHODE & TEST-ORCHESTRIERUNG
    // ===================================================================================

    public static void main(String[] args) {
        if (args.length < 1) {
            System.out.println("{\"event\":\"log\",\"level\":\"error\",\"message\":\"FEHLER: Vollqualifizierter Name für Graph nicht als Argument übergeben!\"}");
            System.out.println("{\"event\":\"run_finish\",\"duration\":\"0.00\"}");
            return;
        }
        graphFQN = args[0];

        TestRunner.logInfo("PVL6Test gestartet. Graph FQN: " + graphFQN);
        TestRunner.startRun();
        long startTime = System.nanoTime();

        try {
            // Lade die Klasse einmalig, um frühzeitig Fehler abzufangen
            graphClass = Class.forName(graphFQN);

            // Führe alle Test-Suiten aus
            testInitializationAndBasicEdgeHandling();
            testAdjacencyList();
            testNGonDetection();
            testFullCircle();
            testLongestPath();

        } catch (InvocationTargetException ite) {
            Throwable cause = ite.getTargetException();
            TestRunner.logError("Ein Fehler ist in Ihrer Implementierung aufgetreten: " + cause.getClass().getName() + " - " + TestRunner.escapeJsonString(cause.getMessage()) + ". Details siehe Konsole (stderr).");
            cause.printStackTrace(System.err);
        } catch (ClassNotFoundException cnfe) {
            TestRunner.logError("FEHLER: Nutzerklasse nicht gefunden. Überprüfen Sie Klassennamen und Packaging. Fehlermeldung: " + TestRunner.escapeJsonString(cnfe.getMessage()));
            cnfe.printStackTrace(System.err);
        } catch (NoSuchMethodException nsme) {
            TestRunner.logError("FEHLER: Eine erwartete Methode oder ein Konstruktor wurde nicht gefunden: " + TestRunner.escapeJsonString(nsme.getMessage()) + ". Überprüfen Sie die Signaturen.");
            nsme.printStackTrace(System.err);
        } catch (InstantiationException | IllegalAccessException | IllegalArgumentException eia) {
            TestRunner.logError("FEHLER beim Erstellen oder Aufrufen der Nutzerklasse: " + eia.getClass().getName() + " - " + TestRunner.escapeJsonString(eia.getMessage()));
            eia.printStackTrace(System.err);
        } catch (Exception e) {
            TestRunner.logError("Ein unerwarteter kritischer Testfehler ist aufgetreten: " + e.getClass().getName() + " - " + TestRunner.escapeJsonString(e.toString()));
            e.printStackTrace(System.err);
        } finally {
            TestRunner.finishRun(startTime);
        }
    }

    // ===================================================================================
    // TEST SUITES
    // ===================================================================================

    public static void testInitializationAndBasicEdgeHandling() throws Exception {
        TestRunner.startSuite("Initialisierung & Basis-Kantenlogik");

        TestRunner.startSubtest("newNode() gibt korrekte, sequentielle IDs zurück");
        Object graph = createGraphInstance();
        TestRunner.check(Objects.equals(0, invokeMethod(graph, "newNode")), "Erster Aufruf von newNode() gibt 0 zurück.", "Erster Aufruf von newNode() sollte 0 sein.");
        TestRunner.check(Objects.equals(1, invokeMethod(graph, "newNode")), "Zweiter Aufruf von newNode() gibt 1 zurück.", "Zweiter Aufruf von newNode() sollte 1 sein.");
        TestRunner.check(Objects.equals(2, invokeMethod(graph, "newNode")), "Dritter Aufruf von newNode() gibt 2 zurück.", "Dritter Aufruf von newNode() sollte 2 sein.");

        TestRunner.startSubtest("setEdge() Edge Cases");
        invokeMethod(graph, "newNode"); // ID 3
        boolean success = (boolean) invokeMethod(graph, "setEdge", new Class<?>[]{int.class, int.class}, 0, 1);
        TestRunner.check(success, "setEdge(0, 1) gibt bei Erfolg true zurück.", "setEdge(0, 1) sollte true zurückgeben.");

        boolean fail_duplicate = (boolean) invokeMethod(graph, "setEdge", new Class<?>[]{int.class, int.class}, 0, 1);
        TestRunner.check(!fail_duplicate, "Erneutes setEdge(0, 1) gibt false zurück.", "Erneutes setEdge(0, 1) sollte false zurückgeben.");

        boolean fail_self_loop = (boolean) invokeMethod(graph, "setEdge", new Class<?>[]{int.class, int.class}, 2, 2);
        TestRunner.check(!fail_self_loop, "setEdge(2, 2) für Self-Loop gibt false zurück.", "setEdge(2, 2) für Self-Loop sollte false zurückgeben.");

        boolean fail_non_existent = (boolean) invokeMethod(graph, "setEdge", new Class<?>[]{int.class, int.class}, 0, 99);
        TestRunner.check(!fail_non_existent, "setEdge(0, 99) mit nicht-existentem Knoten gibt false zurück.", "setEdge(0, 99) sollte false zurückgeben.");
    }

    public static void testAdjacencyList() throws Exception {
        TestRunner.startSuite("getEdges() Adjazenzlisten-Verifikation");
        Object graph = createPdfExampleGraph();

        TestRunner.startSubtest("Prüfung der Adjazenzliste des PDF-Beispiels");
        @SuppressWarnings("unchecked")
        List<List<Integer>> adjList = (List<List<Integer>>) invokeMethod(graph, "getEdges");

        List<List<Integer>> expectedAdjList = Arrays.asList(
                Arrays.asList(1, 2, 3), // Nachbarn von 0
                Arrays.asList(0, 3),    // Nachbarn von 1
                Arrays.asList(0, 3),    // Nachbarn von 2
                Arrays.asList(0, 1, 2)  // Nachbarn von 3
        );

        boolean match = compareListsOfListsUnordered(expectedAdjList, adjList);
        TestRunner.check(match, "getEdges() gibt die korrekte Adjazenzliste zurück.", "Adjazenzliste ist falsch. Erwartet: " + formatValue(expectedAdjList) + ", Erhalten: " + formatValue(adjList));
    }

    public static void testNGonDetection() throws Exception {
        TestRunner.startSuite("getNGons() Polygon-Erkennung");
        Object graph = createPdfExampleGraph();

        TestRunner.startSubtest("3-Gons (Dreiecke) im PDF-Beispiel");
        @SuppressWarnings("unchecked")
        List<List<Integer>> threeGons = (List<List<Integer>>) invokeMethod(graph, "getNGons", new Class<?>[]{int.class}, 3);
        List<List<Integer>> expectedThreeGons = Arrays.asList(
                Arrays.asList(0, 1, 3),
                Arrays.asList(0, 2, 3)
        );
        boolean threeGonMatch = compareListsOfListsUnordered(expectedThreeGons, threeGons);
        TestRunner.check(threeGonMatch, "getNGons(3) findet die korrekten zwei Dreiecke.", "Fehler bei getNGons(3). Erwartet: " + formatValue(expectedThreeGons) + ", Erhalten: " + formatValue(threeGons));

        TestRunner.startSubtest("4-Gons (Vierecke) im PDF-Beispiel");
        @SuppressWarnings("unchecked")
        List<List<Integer>> fourGons = (List<List<Integer>>) invokeMethod(graph, "getNGons", new Class<?>[]{int.class}, 4);
        List<List<Integer>> expectedFourGons = Arrays.asList(
                Arrays.asList(0, 1, 3, 2)
        );
        boolean fourGonMatch = compareListsOfListsUnordered(expectedFourGons, fourGons);
        TestRunner.check(fourGonMatch, "getNGons(4) findet das korrekte Viereck.", "Fehler bei getNGons(4). Erwartet: " + formatValue(expectedFourGons) + ", Erhalten: " + formatValue(fourGons));

        TestRunner.startSubtest("5-Gons (sollte leer sein)");
        @SuppressWarnings("unchecked")
        List<List<Integer>> fiveGons = (List<List<Integer>>) invokeMethod(graph, "getNGons", new Class<?>[]{int.class}, 5);
        TestRunner.check(fiveGons.isEmpty(), "getNGons(5) gibt für einen Graphen mit 4 Knoten eine leere Liste zurück.", "getNGons(5) sollte leer sein, war aber: " + formatValue(fiveGons));
    }

    public static void testFullCircle() throws Exception {
        TestRunner.startSuite("hasFullCircle() Hamiltonkreis-Erkennung");

        TestRunner.startSubtest("Graph mit Hamiltonkreis");
        Object graphWithCircle = createPdfExampleGraph();
        boolean hasCircle = (boolean) invokeMethod(graphWithCircle, "hasFullCircle");
        TestRunner.check(hasCircle, "hasFullCircle() gibt true zurück für einen Graphen mit Hamiltonkreis.", "hasFullCircle() sollte true sein, war aber false.");

        TestRunner.startSubtest("Graph ohne Hamiltonkreis (Linie)");
        Object lineGraph = createGraphInstance();
        invokeMethod(lineGraph, "newNode"); invokeMethod(lineGraph, "newNode"); invokeMethod(lineGraph, "newNode"); invokeMethod(lineGraph, "newNode");
        invokeMethod(lineGraph, "setEdge", new Class<?>[]{int.class, int.class}, 0, 1);
        invokeMethod(lineGraph, "setEdge", new Class<?>[]{int.class, int.class}, 1, 2);
        invokeMethod(lineGraph, "setEdge", new Class<?>[]{int.class, int.class}, 2, 3);
        boolean hasCircle_line = (boolean) invokeMethod(lineGraph, "hasFullCircle");
        TestRunner.check(!hasCircle_line, "hasFullCircle() gibt false für einen Linien-Graphen zurück.", "hasFullCircle() sollte für einen Linien-Graphen false sein, war aber true.");
    }

    public static void testLongestPath() throws Exception {
        TestRunner.startSuite("Bonus: getLongestPath()");
        Object graph = createPdfExampleGraph();

        TestRunner.startSubtest("Längster Pfad von 2 nach 1 (PDF-Beispiel)");
        @SuppressWarnings("unchecked")
        List<Integer> path = (List<Integer>) invokeMethod(graph, "getLongestPath", new Class<?>[]{int.class, int.class}, 2, 1);
        
        // Es gibt zwei mögliche längste Pfade: [2, 0, 3, 1] und [2, 3, 0, 1]. Beide sind korrekt.
        List<Integer> expectedPath1 = Arrays.asList(2, 0, 3, 1);
        List<Integer> expectedPath2 = Arrays.asList(2, 3, 0, 1);
        boolean pathMatch = Objects.equals(expectedPath1, path) || Objects.equals(expectedPath2, path);
        TestRunner.check(pathMatch, "getLongestPath(2, 1) findet einen der korrekten längsten Pfade.", "Fehler bei getLongestPath(2, 1). Erwartet: " + formatValue(expectedPath1) + " oder " + formatValue(expectedPath2) + ", Erhalten: " + formatValue(path));
    
        TestRunner.startSubtest("Pfad von/zu demselben Knoten");
        @SuppressWarnings("unchecked")
        List<Integer> selfPath = (List<Integer>) invokeMethod(graph, "getLongestPath", new Class<?>[]{int.class, int.class}, 1, 1);
        TestRunner.check(Objects.equals(Collections.singletonList(1), selfPath), "getLongestPath(1, 1) gibt [1] zurück.", "getLongestPath(1, 1) sollte [1] sein, war aber: " + formatValue(selfPath));

        TestRunner.startSubtest("Pfad in unverbundenem Graphen");
        Object disconnectedGraph = createGraphInstance();
        invokeMethod(disconnectedGraph, "newNode"); // 0
        invokeMethod(disconnectedGraph, "newNode"); // 1
        @SuppressWarnings("unchecked")
        List<Integer> noPath = (List<Integer>) invokeMethod(disconnectedGraph, "getLongestPath", new Class<?>[]{int.class, int.class}, 0, 1);
        TestRunner.check(noPath != null && noPath.isEmpty(), "getLongestPath() gibt für unverbundene Knoten eine leere Liste zurück.", "getLongestPath() sollte für unverbundene Knoten leer sein, war aber: " + formatValue(noPath));
    }

    // ===================================================================================
    // HILFSMETHODEN FÜR REFLECTION, SETUP UND VERGLEICHE
    // ===================================================================================

    private static Object createGraphInstance() throws Exception {
        Constructor<?> constructor = graphClass.getDeclaredConstructor();
        return constructor.newInstance();
    }
    
    private static Object invokeMethod(Object obj, String methodName) throws Exception {
        Method method = obj.getClass().getMethod(methodName);
        return method.invoke(obj);
    }
    
    private static Object invokeMethod(Object obj, String methodName, Class<?>[] parameterTypes, Object... args) throws Exception {
        Method method = obj.getClass().getMethod(methodName, parameterTypes);
        return method.invoke(obj, args);
    }

    private static Object createPdfExampleGraph() throws Exception {
        Object graph = createGraphInstance();
        invokeMethod(graph, "newNode"); // 0
        invokeMethod(graph, "newNode"); // 1
        invokeMethod(graph, "newNode"); // 2
        invokeMethod(graph, "newNode"); // 3

        invokeMethod(graph, "setEdge", new Class<?>[]{int.class, int.class}, 0, 1);
        invokeMethod(graph, "setEdge", new Class<?>[]{int.class, int.class}, 0, 2);
        invokeMethod(graph, "setEdge", new Class<?>[]{int.class, int.class}, 0, 3);
        invokeMethod(graph, "setEdge", new Class<?>[]{int.class, int.class}, 1, 3);
        invokeMethod(graph, "setEdge", new Class<?>[]{int.class, int.class}, 2, 3);
        return graph;
    }
    
    private static String formatValue(Object value) {
        if (value == null) return "null";
        if (value instanceof List) {
            return ((List<?>) value).stream()
                .map(Objects::toString)
                .collect(Collectors.joining(", ", "[", "]"));
        }
        return Objects.toString(value);
    }

    private static boolean compareListsOfListsUnordered(List<List<Integer>> list1, List<List<Integer>> list2) {
        if (list1 == null || list2 == null) return list1 == list2;
        if (list1.size() != list2.size()) return false;

        // Erstelle eine kanonische Repräsentation für jede Liste (sortierte Kopien)
        Set<List<Integer>> set1 = list1.stream()
                .map(list -> list.stream().sorted().collect(Collectors.toList()))
                .collect(Collectors.toSet());

        Set<List<Integer>> set2 = list2.stream()
                .map(list -> list.stream().sorted().collect(Collectors.toList()))
                .collect(Collectors.toSet());
        
        return set1.equals(set2);
    }
}