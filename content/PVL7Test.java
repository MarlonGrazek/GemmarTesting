import java.lang.reflect.Constructor;
import java.lang.reflect.Method;
import java.lang.reflect.InvocationTargetException;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * Testklasse für PVL7 (DirectedGraph), die der Struktur der vorherigen PVL-Tests folgt.
 * Sie verwendet Reflection, um die Implementierung des Nutzers zu testen,
 * und gibt die Ergebnisse über den TestRunner in einem strukturierten JSON-Format aus.
 */
public class PVL7Test {

    // FQN der Nutzerklasse, wird in main initialisiert
    private static String directedGraphFQN;

    // Klassenobjekt für Reflection
    private static Class<?> directedGraphClass;

    // ===================================================================================
    // MAIN METHODE & TEST-ORCHESTRIERUNG
    // ===================================================================================

    public static void main(String[] args) {
        if (args.length < 1) {
            System.out.println("{\"event\":\"log\",\"level\":\"error\",\"message\":\"FEHLER: Vollqualifizierter Name für DirectedGraph nicht als Argument übergeben!\"}");
            System.out.println("{\"event\":\"run_finish\",\"duration\":\"0.00\"}");
            return;
        }
        directedGraphFQN = args[0];

        TestRunner.logInfo("PVL7Test gestartet. DirectedGraph FQN: " + directedGraphFQN);
        TestRunner.startRun();
        long startTime = System.nanoTime();

        try {
            // Lade die Klasse einmalig, um frühzeitig Fehler abzufangen
            directedGraphClass = Class.forName(directedGraphFQN);

            // Führe alle Test-Suiten aus
            testBasicsAndRobustness();
            testHasNegativeCircle();
            testShortestPath();
            testUniversalSink(); // Bonusaufgabe

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

    public static void testBasicsAndRobustness() throws Exception {
        TestRunner.startSuite("1.0 Basisfunktionen & Robustheit");

        TestRunner.startSubtest("1.1 Leerer Graph");
        Object emptyGraph = createGraphInstance();
        TestRunner.check(Objects.deepEquals(new ArrayList<>(), invokeMethod(emptyGraph, "getEdges")), "1.1.1 Leerer Graph - getEdges() ist leer.", "getEdges() sollte für einen leeren Graphen eine leere Liste sein.");
        TestRunner.check(Objects.equals(false, invokeMethod(emptyGraph, "hasNegativeCircle")), "1.1.2 Leerer Graph - hasNegativeCircle() ist false.", "hasNegativeCircle() sollte für einen leeren Graphen false sein.");
        TestRunner.check(Objects.deepEquals(new ArrayList<>(), invokeMethod(emptyGraph, "shortestPath", new Class<?>[]{int.class, int.class}, 0, 0)), "1.1.3 Leerer Graph - shortestPath(0, 0) ist leer.", "shortestPath(0,0) sollte für einen leeren Graphen eine leere Liste sein.");
        TestRunner.check(Objects.equals(-1, invokeMethod(emptyGraph, "universalSink")), "1.1.4 Leerer Graph - universalSink() ist -1.", "universalSink() sollte für einen leeren Graphen -1 sein.");

        TestRunner.startSubtest("1.2 Knoten ohne Kanten");
        Object nodesOnlyGraph = createGraphInstance();
        invokeMethod(nodesOnlyGraph, "newNode");
        invokeMethod(nodesOnlyGraph, "newNode");
        List<List<List<Integer>>> expectedEdges = new ArrayList<>();
        expectedEdges.add(new ArrayList<>());
        expectedEdges.add(new ArrayList<>());
        TestRunner.check(Objects.deepEquals(expectedEdges, invokeMethod(nodesOnlyGraph, "getEdges")), "1.2.1 getEdges() für Knoten ohne Kanten.", "getEdges() für 2 Knoten ohne Kanten sollte [[], []] sein.");

        TestRunner.startSubtest("1.3 setEdge() Robustheit");
        Object edgeTestGraph = createGraphInstance();
        invokeMethod(edgeTestGraph, "newNode"); // 0
        invokeMethod(edgeTestGraph, "newNode"); // 1
        TestRunner.check(Objects.equals(true, invokeMethod(edgeTestGraph, "setEdge", new Class<?>[]{int.class, int.class, int.class}, 0, 1, 10)), "1.3.1 setEdge(0, 1, 10) - Neue Kante", "setEdge sollte bei Erfolg true zurückgeben.");
        TestRunner.check(Objects.equals(false, invokeMethod(edgeTestGraph, "setEdge", new Class<?>[]{int.class, int.class, int.class}, 0, 1, 20)), "1.3.2 setEdge(0, 1, 20) - Duplikat", "setEdge sollte bei Duplikaten false zurückgeben.");
        TestRunner.check(Objects.equals(false, invokeMethod(edgeTestGraph, "setEdge", new Class<?>[]{int.class, int.class, int.class}, 0, 0, 5)), "1.3.3 setEdge(0, 0, 5) - Self-Loop", "setEdge sollte bei Self-Loops false zurückgeben.");
        TestRunner.check(Objects.equals(false, invokeMethod(edgeTestGraph, "setEdge", new Class<?>[]{int.class, int.class, int.class}, 0, 99, 1)), "1.3.4 setEdge(0, 99, 1) - Ziel existiert nicht", "setEdge sollte false zurückgeben, wenn der Zielknoten nicht existiert.");
        TestRunner.check(Objects.equals(false, invokeMethod(edgeTestGraph, "setEdge", new Class<?>[]{int.class, int.class, int.class}, 99, 0, 1)), "1.3.5 setEdge(99, 0, 1) - Start existiert nicht", "setEdge sollte false zurückgeben, wenn der Startknoten nicht existiert.");
    }

    public static void testHasNegativeCircle() throws Exception {
        TestRunner.startSuite("2.0 hasNegativeCircle()");

        TestRunner.startSubtest("2.1 Graphen ohne negativen Kreis");
        Object dag = createGraphInstance();
        invokeMethod(dag, "newNode"); invokeMethod(dag, "newNode"); invokeMethod(dag, "newNode");
        invokeMethod(dag, "setEdge", new Class<?>[]{int.class, int.class, int.class}, 0, 1, 1);
        invokeMethod(dag, "setEdge", new Class<?>[]{int.class, int.class, int.class}, 1, 2, 1);
        TestRunner.check(Objects.equals(false, invokeMethod(dag, "hasNegativeCircle")), "2.1.1 Graph ohne Kreise (DAG)", "Graph ohne Kreise sollte keinen negativen Kreis haben.");

        Object positiveCircleGraph = createGraphInstance();
        invokeMethod(positiveCircleGraph, "newNode"); invokeMethod(positiveCircleGraph, "newNode"); invokeMethod(positiveCircleGraph, "newNode");
        invokeMethod(positiveCircleGraph, "setEdge", new Class<?>[]{int.class, int.class, int.class}, 0, 1, 5);
        invokeMethod(positiveCircleGraph, "setEdge", new Class<?>[]{int.class, int.class, int.class}, 1, 2, 5);
        invokeMethod(positiveCircleGraph, "setEdge", new Class<?>[]{int.class, int.class, int.class}, 2, 0, 5);
        TestRunner.check(Objects.equals(false, invokeMethod(positiveCircleGraph, "hasNegativeCircle")), "2.1.2 Kreis mit positivem Gewicht", "Kreis mit positivem Gewicht ist kein negativer Kreis.");

        Object zeroCircleGraph = createGraphInstance();
        invokeMethod(zeroCircleGraph, "newNode"); invokeMethod(zeroCircleGraph, "newNode");
        invokeMethod(zeroCircleGraph, "setEdge", new Class<?>[]{int.class, int.class, int.class}, 0, 1, 5);
        invokeMethod(zeroCircleGraph, "setEdge", new Class<?>[]{int.class, int.class, int.class}, 1, 0, -5);
        TestRunner.check(Objects.equals(false, invokeMethod(zeroCircleGraph, "hasNegativeCircle")), "2.1.3 Kreis mit Null-Gewicht", "Kreis mit Null-Gewicht ist kein negativer Kreis.");

        TestRunner.startSubtest("2.2 Graphen mit negativem Kreis");
        Object negativeCircleGraph = createPdfExampleGraphA();
        TestRunner.check(Objects.equals(true, invokeMethod(negativeCircleGraph, "hasNegativeCircle")), "2.2.1 Kreis mit negativem Gewicht (PDF a)", "Negativer Kreis aus PDF (a) wurde nicht erkannt.");

        Object disconnectedGraph = createGraphInstance();
        invokeMethod(disconnectedGraph, "newNode"); invokeMethod(disconnectedGraph, "newNode");
        invokeMethod(disconnectedGraph, "newNode"); invokeMethod(disconnectedGraph, "newNode");
        invokeMethod(disconnectedGraph, "setEdge", new Class<?>[]{int.class, int.class, int.class}, 0, 1, 1);
        invokeMethod(disconnectedGraph, "setEdge", new Class<?>[]{int.class, int.class, int.class}, 2, 3, 5);
        invokeMethod(disconnectedGraph, "setEdge", new Class<?>[]{int.class, int.class, int.class}, 3, 2, -6);
        TestRunner.check(Objects.equals(true, invokeMethod(disconnectedGraph, "hasNegativeCircle")), "2.2.2 Unverbundener Graph mit negativem Kreis", "Negativer Kreis in unverbundenem Graphenteil nicht erkannt.");
    }

    public static void testShortestPath() throws Exception {
        TestRunner.startSuite("3.0 shortestPath()");

        TestRunner.startSubtest("3.1 Gültige Pfade");
        Object simplePathGraph = createGraphInstance();
        invokeMethod(simplePathGraph, "newNode"); invokeMethod(simplePathGraph, "newNode"); invokeMethod(simplePathGraph, "newNode");
        invokeMethod(simplePathGraph, "setEdge", new Class<?>[]{int.class, int.class, int.class}, 0, 1, 10);
        invokeMethod(simplePathGraph, "setEdge", new Class<?>[]{int.class, int.class, int.class}, 1, 2, 20);
        List<List<Integer>> expectedSimplePath = List.of(List.of(1, 10), List.of(2, 20));
        TestRunner.check(Objects.deepEquals(expectedSimplePath, invokeMethod(simplePathGraph, "shortestPath", new Class<?>[]{int.class, int.class}, 0, 2)), "3.1.1 Einfacher Pfad 0->1->2", "Einfacher Pfad wurde nicht korrekt gefunden.");

        Object pdfB = createPdfExampleGraphB();
        List<List<Integer>> expectedPdfBPath = List.of(List.of(2, 1), List.of(4, 1), List.of(3, 1), List.of(5, 1));
        TestRunner.check(Objects.deepEquals(expectedPdfBPath, invokeMethod(pdfB, "shortestPath", new Class<?>[]{int.class, int.class}, 0, 5)), "3.1.2 Kürzester Weg (PDF b)", "Kürzester Weg aus PDF (b) wurde nicht korrekt gefunden.");

        TestRunner.startSubtest("3.2 Ungültige oder nicht existierende Pfade");
        TestRunner.check(Objects.deepEquals(new ArrayList<>(), invokeMethod(pdfB, "shortestPath", new Class<?>[]{int.class, int.class}, 0, 0)), "3.2.1 Pfad von 0 nach 0 ist leer.", "Pfad zu sich selbst sollte eine leere Liste sein.");

        Object unreachableGraph = createGraphInstance();
        invokeMethod(unreachableGraph, "newNode"); invokeMethod(unreachableGraph, "newNode");
        invokeMethod(unreachableGraph, "newNode"); invokeMethod(unreachableGraph, "newNode");
        invokeMethod(unreachableGraph, "setEdge", new Class<?>[]{int.class, int.class, int.class}, 0, 1, 1);
        invokeMethod(unreachableGraph, "setEdge", new Class<?>[]{int.class, int.class, int.class}, 2, 3, 1);
        TestRunner.check(Objects.deepEquals(new ArrayList<>(), invokeMethod(unreachableGraph, "shortestPath", new Class<?>[]{int.class, int.class}, 0, 3)), "3.2.2 Ziel nicht erreichbar", "Pfad zu einem nicht erreichbaren Ziel sollte eine leere Liste sein.");

        Object pathWithNegCircle = createGraphInstance();
        invokeMethod(pathWithNegCircle, "newNode"); invokeMethod(pathWithNegCircle, "newNode"); invokeMethod(pathWithNegCircle, "newNode"); invokeMethod(pathWithNegCircle, "newNode");
        invokeMethod(pathWithNegCircle, "setEdge", new Class<?>[]{int.class, int.class, int.class}, 0, 1, 1);
        invokeMethod(pathWithNegCircle, "setEdge", new Class<?>[]{int.class, int.class, int.class}, 1, 2, 1);
        invokeMethod(pathWithNegCircle, "setEdge", new Class<?>[]{int.class, int.class, int.class}, 2, 1, -3);
        invokeMethod(pathWithNegCircle, "setEdge", new Class<?>[]{int.class, int.class, int.class}, 1, 3, 1);
        TestRunner.check(Objects.deepEquals(new ArrayList<>(), invokeMethod(pathWithNegCircle, "shortestPath", new Class<?>[]{int.class, int.class}, 0, 3)), "3.2.3 Pfad durch negativen Kreis", "Pfad durch einen negativen Kreis sollte eine leere Liste sein.");

        Object pathWithIrrelevantNegCircle = createGraphInstance();
        invokeMethod(pathWithIrrelevantNegCircle, "newNode"); invokeMethod(pathWithIrrelevantNegCircle, "newNode");
        invokeMethod(pathWithIrrelevantNegCircle, "newNode"); invokeMethod(pathWithIrrelevantNegCircle, "newNode");
        invokeMethod(pathWithIrrelevantNegCircle, "setEdge", new Class<?>[]{int.class, int.class, int.class}, 0, 1, 10);
        invokeMethod(pathWithIrrelevantNegCircle, "setEdge", new Class<?>[]{int.class, int.class, int.class}, 2, 3, -5);
        invokeMethod(pathWithIrrelevantNegCircle, "setEdge", new Class<?>[]{int.class, int.class, int.class}, 3, 2, 2);
        List<List<Integer>> expectedIrrelevantPath = List.of(List.of(1, 10));
        TestRunner.check(Objects.deepEquals(expectedIrrelevantPath, invokeMethod(pathWithIrrelevantNegCircle, "shortestPath", new Class<?>[]{int.class, int.class}, 0, 1)), "3.2.4 Pfad mit irrelevantem negativen Kreis", "Ein irrelevanter negativer Kreis sollte den kürzesten Pfad nicht beeinflussen.");
    }

    public static void testUniversalSink() throws Exception {
        TestRunner.startSuite("4.0 universalSink() (Bonus)");

        TestRunner.startSubtest("4.1 PDF Beispiele");
        Object pdfA = createPdfExampleGraphA();
        TestRunner.check(Objects.equals(3, invokeMethod(pdfA, "universalSink")), "4.1.1 PDF Beispiel (a)", "Universelle Senke aus PDF (a) nicht gefunden.");

        Object pdfB = createPdfExampleGraphB();
        TestRunner.check(Objects.equals(5, invokeMethod(pdfB, "universalSink")), "4.1.2 PDF Beispiel (b)", "Universelle Senke aus PDF (b) nicht gefunden.");

        TestRunner.startSubtest("4.2 Graphen ohne universelle Senke");
        Object unreachableSinkGraph = createGraphInstance();
        invokeMethod(unreachableSinkGraph, "newNode"); invokeMethod(unreachableSinkGraph, "newNode"); invokeMethod(unreachableSinkGraph, "newNode");
        invokeMethod(unreachableSinkGraph, "setEdge", new Class<?>[]{int.class, int.class, int.class}, 0, 1, 1);
        TestRunner.check(Objects.equals(-1, invokeMethod(unreachableSinkGraph, "universalSink")), "4.2.1 Nicht erreichbare Senke", "Sollte -1 zurückgeben, wenn eine Senke nicht von allen Knoten erreichbar ist.");

        Object fullyConnectedGraph = createGraphInstance();
        invokeMethod(fullyConnectedGraph, "newNode"); invokeMethod(fullyConnectedGraph, "newNode"); invokeMethod(fullyConnectedGraph, "newNode");
        invokeMethod(fullyConnectedGraph, "setEdge", new Class<?>[]{int.class, int.class, int.class}, 0, 1, 1);
        invokeMethod(fullyConnectedGraph, "setEdge", new Class<?>[]{int.class, int.class, int.class}, 1, 2, 1);
        invokeMethod(fullyConnectedGraph, "setEdge", new Class<?>[]{int.class, int.class, int.class}, 2, 0, 1);
        TestRunner.check(Objects.equals(-1, invokeMethod(fullyConnectedGraph, "universalSink")), "4.2.2 Graph ohne Senke (Kreis)", "Sollte -1 zurückgeben, wenn jeder Knoten ausgehende Kanten hat.");

        TestRunner.startSubtest("4.3 Graph mit mehreren Kandidaten");
        Object multiCandidateGraph = createGraphInstance();
        invokeMethod(multiCandidateGraph, "newNode"); invokeMethod(multiCandidateGraph, "newNode"); invokeMethod(multiCandidateGraph, "newNode");
        invokeMethod(multiCandidateGraph, "setEdge", new Class<?>[]{int.class, int.class, int.class}, 0, 2, 1);
        invokeMethod(multiCandidateGraph, "setEdge", new Class<?>[]{int.class, int.class, int.class}, 1, 2, 1);
        TestRunner.check(Objects.equals(2, invokeMethod(multiCandidateGraph, "universalSink")), "4.3.1 Echte Senke mit mehreren eingehenden Kanten", "Universelle Senke mit mehreren eingehenden Kanten wurde nicht gefunden.");

        Object multiCandidateGraph2 = createGraphInstance();
        invokeMethod(multiCandidateGraph2, "newNode"); invokeMethod(multiCandidateGraph2, "newNode"); invokeMethod(multiCandidateGraph2, "newNode"); invokeMethod(multiCandidateGraph2, "newNode");
        invokeMethod(multiCandidateGraph2, "setEdge", new Class<?>[]{int.class, int.class, int.class}, 0, 2, 1);
        invokeMethod(multiCandidateGraph2, "setEdge", new Class<?>[]{int.class, int.class, int.class}, 1, 3, 1);
        TestRunner.check(Objects.equals(-1, invokeMethod(multiCandidateGraph2, "universalSink")), "4.3.2 Mehrere Senken-Kandidaten, aber keine universell", "Sollte -1 zurückgeben, wenn es mehrere nicht-universelle Senken gibt.");
    }

    // ===================================================================================
    // HILFSMETHODEN
    // ===================================================================================

    private static Object createGraphInstance() throws Exception {
        Constructor<?> constructor = directedGraphClass.getDeclaredConstructor();
        return constructor.newInstance();
    }

    private static Object invokeMethod(Object obj, String methodName, Class<?>[] parameterTypes, Object... args) throws Exception {
        Method method = obj.getClass().getMethod(methodName, parameterTypes);
        return method.invoke(obj, args);
    }
    
    private static Object invokeMethod(Object obj, String methodName) throws Exception {
        Method method = obj.getClass().getMethod(methodName);
        return method.invoke(obj);
    }

    private static Object createPdfExampleGraphA() throws Exception {
        Object graph = createGraphInstance();
        invokeMethod(graph, "newNode"); invokeMethod(graph, "newNode"); invokeMethod(graph, "newNode"); invokeMethod(graph, "newNode");
        invokeMethod(graph, "setEdge", new Class<?>[]{int.class, int.class, int.class}, 0, 1, 1);
        invokeMethod(graph, "setEdge", new Class<?>[]{int.class, int.class, int.class}, 1, 2, 2);
        invokeMethod(graph, "setEdge", new Class<?>[]{int.class, int.class, int.class}, 2, 0, -4);
        invokeMethod(graph, "setEdge", new Class<?>[]{int.class, int.class, int.class}, 2, 3, 6);
        return graph;
    }

    private static Object createPdfExampleGraphB() throws Exception {
        Object graph = createGraphInstance();
        for (int i = 0; i < 6; i++) invokeMethod(graph, "newNode");
        invokeMethod(graph, "setEdge", new Class<?>[]{int.class, int.class, int.class}, 0, 1, 8);
        invokeMethod(graph, "setEdge", new Class<?>[]{int.class, int.class, int.class}, 0, 2, 1);
        invokeMethod(graph, "setEdge", new Class<?>[]{int.class, int.class, int.class}, 1, 2, 1);
        invokeMethod(graph, "setEdge", new Class<?>[]{int.class, int.class, int.class}, 1, 3, 1);
        invokeMethod(graph, "setEdge", new Class<?>[]{int.class, int.class, int.class}, 2, 4, 1);
        invokeMethod(graph, "setEdge", new Class<?>[]{int.class, int.class, int.class}, 3, 1, 1);
        invokeMethod(graph, "setEdge", new Class<?>[]{int.class, int.class, int.class}, 3, 5, 1);
        invokeMethod(graph, "setEdge", new Class<?>[]{int.class, int.class, int.class}, 4, 3, 1);
        invokeMethod(graph, "setEdge", new Class<?>[]{int.class, int.class, int.class}, 4, 5, 8);
        return graph;
    }
}
