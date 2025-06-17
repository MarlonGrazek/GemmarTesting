import java.lang.reflect.Constructor;
import java.lang.reflect.Method;
import java.lang.reflect.InvocationTargetException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * Testklasse für PVL5 (FamilyTree), die der Struktur von PVL4Test folgt.
 * Sie verwendet Reflection, um die Implementierung des Nutzers zu testen,
 * und gibt die Ergebnisse in einem strukturierten JSON-Format aus.
 * Diese Klasse ist kompatibel mit der bereitgestellten TestRunner.java.
 */
public class PVL5Test {

    // FQN der Nutzerklassen, werden in main initialisiert
    private static String familyTreeFQN;
    private static String personFQN;

    // Klassenobjekte für Reflection
    private static Class<?> familyTreeClass;
    private static Class<?> personClass;
    
    // ===================================================================================
    // MAIN METHODE & TEST-ORCHESTRIERUNG
    // ===================================================================================

    public static void main(String[] args) {
        if (args.length < 1) {
            System.out.println("{\"event\":\"log\",\"level\":\"error\",\"message\":\"FEHLER: Vollqualifizierter Name für FamilyTree nicht als Argument übergeben!\"}");
            System.out.println("{\"event\":\"run_finish\",\"duration\":\"0.00\"}");
            return;
        }
        familyTreeFQN = args[0];
        
        // Annahme: Die Person-Klasse liegt im selben Paket wie die FamilyTree-Klasse.
        int lastDot = familyTreeFQN.lastIndexOf('.');
        if (lastDot == -1) { // Default-Package
            personFQN = "Person";
        } else {
            personFQN = familyTreeFQN.substring(0, lastDot + 1) + "Person";
        }

        TestRunner.logInfo("PVL5Test gestartet. FamilyTree FQN: " + familyTreeFQN + ", Person FQN: " + personFQN);
        TestRunner.startRun();
        long startTime = System.nanoTime();

        try {
            // Lade die Klassen einmalig, um frühzeitig Fehler abzufangen
            familyTreeClass = Class.forName(familyTreeFQN);
            personClass = Class.forName(personFQN);
            
            // Führe alle Test-Suiten aus
            testInitializationAndBasicInsertion();
            testPdfExampleReconstruction();
            testRootNodeEdgeCases();
            testLeafNodeEdgeCases();
            testOnlyChildEdgeCases();
            testInvalidInputEdgeCases();
            testComplexStructures();

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
    // TEST SUITES (übersetzt von FamilyTreeTester)
    // ===================================================================================

    public static void testInitializationAndBasicInsertion() throws Exception {
        TestRunner.startSuite("Initialisierung & Basis-Funktionen");

        TestRunner.startSubtest("Konstruktor und getPersonById");
        Object rootPerson = createPersonInstance("Adam");
        Object tree = createFamilyTreeInstance(rootPerson);
        Object fetchedPerson = invokeMethod(tree, "getPersonById", new Class<?>[]{Integer.class}, new Object[]{0});
        TestRunner.check(Objects.equals(rootPerson, fetchedPerson), "getPersonById(0) gibt die korrekte Wurzel-Person zurück.", "getPersonById(0) hat nicht die korrekte Wurzel-Person zurückgegeben.");
        
        String fetchedName = (String) invokeMethod(fetchedPerson, "getName");
        TestRunner.check("Adam".equals(fetchedName), "Der Name der Wurzel-Person ist korrekt.", "Der Name der Wurzel-Person ist falsch. Erwartet: Adam, Erhalten: " + fetchedName);

        TestRunner.startSubtest("Erstes Kind einfügen (insertAsChildForId)");
        Object child1 = createPersonInstance("Kain");
        Integer child1Id = (Integer) invokeMethod(tree, "insertAsChildForId", new Class<?>[]{personClass, Integer.class}, new Object[]{child1, 0});
        TestRunner.check(Objects.equals(1, child1Id), "insertAsChildForId gibt korrekte neue ID (1) zurück.", "Erwartete ID 1, aber erhalten: " + child1Id);
        Object fetchedChild = invokeMethod(tree, "getPersonById", new Class<?>[]{Integer.class}, new Object[]{1});
        TestRunner.check(Objects.equals(child1, fetchedChild), "getPersonById(1) gibt das neue Kind zurück.", "getPersonById(1) hat nicht das korrekte Kind zurückgegeben.");

        TestRunner.startSubtest("Verknüpfung Elternteil <-> Kind");
        Integer parentId = (Integer) invokeMethod(tree, "getParentOf", new Class<?>[]{Integer.class}, new Object[]{1});
        TestRunner.check(Objects.equals(0, parentId), "getParentOf(1) gibt korrekte Eltern-ID (0) zurück.", "getParentOf(1) sollte 0 sein, war aber: " + parentId);
        
        @SuppressWarnings("unchecked")
        List<Integer> adamsKinder = (List<Integer>) invokeMethod(tree, "getChildrenOf", new Class<?>[]{Integer.class}, new Object[]{0});
        TestRunner.check(Objects.equals(Collections.singletonList(1), adamsKinder), "getChildrenOf(0) enthält das neue Kind.", "getChildrenOf(0) sollte [1] enthalten, war aber: " + formatValue(adamsKinder));
    }

    public static void testPdfExampleReconstruction() throws Exception {
        TestRunner.startSuite("Rekonstruktion des PDF-Beispiels");
        Object buddenbrooks = createBuddenbrooksTree();

        TestRunner.startSubtest("getParentOf(3) -> 0");
        Integer parentOf3 = (Integer) invokeMethod(buddenbrooks, "getParentOf", new Class<?>[]{Integer.class}, new Object[]{3});
        TestRunner.check(Objects.equals(0, parentOf3), "getParentOf(3) sollte 0 sein.", "getParentOf(3) war nicht 0, sondern: " + parentOf3);

        TestRunner.startSubtest("getSiblingsOf(3) -> [1, 2]");
        @SuppressWarnings("unchecked")
        List<Integer> siblingsOf3 = (List<Integer>) invokeMethod(buddenbrooks, "getSiblingsOf", new Class<?>[]{Integer.class}, new Object[]{3});
        List<Integer> expectedSiblingsOf3 = Arrays.asList(1, 2);
        boolean siblingsMatch = compareListsUnordered(expectedSiblingsOf3, siblingsOf3);
        TestRunner.check(siblingsMatch, "getSiblingsOf(3) liefert korrekte Geschwister.", "Fehler bei getSiblingsOf(3). Erwartet (beliebige Reihenfolge): " + formatValue(expectedSiblingsOf3) + ", Erhalten: " + formatValue(siblingsOf3));
        
        TestRunner.startSubtest("getChildrenOf(3) -> []");
        @SuppressWarnings("unchecked")
        List<Integer> childrenOf3 = (List<Integer>) invokeMethod(buddenbrooks, "getChildrenOf", new Class<?>[]{Integer.class}, new Object[]{3});
        TestRunner.check(childrenOf3 != null && childrenOf3.isEmpty(), "getChildrenOf(3) sollte eine leere Liste sein.", "getChildrenOf(3) sollte leer sein, war aber: " + formatValue(childrenOf3));

        TestRunner.startSubtest("getNiecesNephewsOf(3) -> Nichten/Neffen von Olly");
        @SuppressWarnings("unchecked")
        List<Integer> niecesOf3 = (List<Integer>) invokeMethod(buddenbrooks, "getNiecesNephewsOf", new Class<?>[]{Integer.class}, new Object[]{3});
        List<Integer> expectedNieces = Arrays.asList(4, 5, 6, 7, 8, 9, 10);
        boolean niecesMatch = compareListsUnordered(expectedNieces, niecesOf3);
        TestRunner.check(niecesMatch, "getNiecesNephewsOf(3) liefert korrekte Nichten/Neffen.", "Fehler bei getNiecesNephewsOf(3). Erwartet (beliebige Reihenfolge): " + formatValue(expectedNieces) + ", Erhalten: " + formatValue(niecesOf3));
    }
    
    public static void testRootNodeEdgeCases() throws Exception {
        TestRunner.startSuite("Edge Cases: Wurzel-Knoten (ID 0)");
        Object tree = createBuddenbrooksTree();

        TestRunner.startSubtest("getParentOf(0) sollte null sein");
        Integer parentOfRoot = (Integer) invokeMethod(tree, "getParentOf", new Class<?>[]{Integer.class}, new Object[]{0});
        TestRunner.check(parentOfRoot == null, "getParentOf(0) ist null.", "getParentOf(0) sollte null sein, war aber: " + parentOfRoot);

        TestRunner.startSubtest("getSiblingsOf(0) sollte eine leere Liste sein");
        @SuppressWarnings("unchecked")
        List<Integer> siblingsOfRoot = (List<Integer>) invokeMethod(tree, "getSiblingsOf", new Class<?>[]{Integer.class}, new Object[]{0});
        TestRunner.check(siblingsOfRoot != null && siblingsOfRoot.isEmpty(), "getSiblingsOf(0) ist eine leere Liste.", "getSiblingsOf(0) sollte leer sein, war aber: " + formatValue(siblingsOfRoot));

        TestRunner.startSubtest("getCousinsOf(0) sollte eine leere Liste sein");
        @SuppressWarnings("unchecked")
        List<Integer> cousinsOfRoot = (List<Integer>) invokeMethod(tree, "getCousinsOf", new Class<?>[]{Integer.class}, new Object[]{0});
        TestRunner.check(cousinsOfRoot != null && cousinsOfRoot.isEmpty(), "getCousinsOf(0) ist eine leere Liste.", "getCousinsOf(0) sollte leer sein, war aber: " + formatValue(cousinsOfRoot));

        TestRunner.startSubtest("getNiecesNephewsOf(0) sollte eine leere Liste sein");
        @SuppressWarnings("unchecked")
        List<Integer> niecesOfRoot = (List<Integer>) invokeMethod(tree, "getNiecesNephewsOf", new Class<?>[]{Integer.class}, new Object[]{0});
        TestRunner.check(niecesOfRoot != null && niecesOfRoot.isEmpty(), "getNiecesNephewsOf(0) ist eine leere Liste.", "getNiecesNephewsOf(0) sollte leer sein, war aber: " + formatValue(niecesOfRoot));
    }
    
    public static void testLeafNodeEdgeCases() throws Exception {
        TestRunner.startSuite("Edge Cases: Blatt-Knoten (keine Kinder)");
        Object tree = createBuddenbrooksTree(); // ID 10 (Clara) ist ein Blatt

        TestRunner.startSubtest("getChildrenOf(10) für Blatt-Knoten sollte leer sein");
        @SuppressWarnings("unchecked")
        List<Integer> childrenOfLeaf = (List<Integer>) invokeMethod(tree, "getChildrenOf", new Class<?>[]{Integer.class}, new Object[]{10});
        TestRunner.check(childrenOfLeaf != null && childrenOfLeaf.isEmpty(), "getChildrenOf(10) ist leer.", "getChildrenOf(10) sollte leer sein, war aber: " + formatValue(childrenOfLeaf));

        TestRunner.startSubtest("getNiecesNephewsOf(10) sollte leer sein");
        @SuppressWarnings("unchecked")
        List<Integer> niecesOfLeaf = (List<Integer>) invokeMethod(tree, "getNiecesNephewsOf", new Class<?>[]{Integer.class}, new Object[]{10});
        TestRunner.check(niecesOfLeaf != null && niecesOfLeaf.isEmpty(), "getNiecesNephewsOf(10) ist leer.", "getNiecesNephewsOf(10) sollte leer sein, war aber: " + formatValue(niecesOfLeaf));
    }
    
    public static void testOnlyChildEdgeCases() throws Exception {
        TestRunner.startSuite("Edge Cases: Einzelkinder");
        Object singleChildTree = createFamilyTreeInstance(createPersonInstance("A"));
        invokeMethod(singleChildTree, "insertAsChildForId", new Class<?>[]{personClass, Integer.class}, new Object[]{createPersonInstance("B"), 0});

        TestRunner.startSubtest("getSiblingsOf(1) sollte für Einzelkind leer sein");
        @SuppressWarnings("unchecked")
        List<Integer> siblings = (List<Integer>) invokeMethod(singleChildTree, "getSiblingsOf", new Class<?>[]{Integer.class}, new Object[]{1});
        TestRunner.check(siblings != null && siblings.isEmpty(), "getSiblingsOf(1) ist leer.", "getSiblingsOf(1) für Einzelkind sollte leer sein, war aber: " + formatValue(siblings));

        TestRunner.startSubtest("getNiecesNephewsOf(1) sollte für Einzelkind leer sein");
        @SuppressWarnings("unchecked")
        List<Integer> nieces = (List<Integer>) invokeMethod(singleChildTree, "getNiecesNephewsOf", new Class<?>[]{Integer.class}, new Object[]{1});
        TestRunner.check(nieces != null && nieces.isEmpty(), "getNiecesNephewsOf(1) ist leer.", "getNiecesNephewsOf(1) für Einzelkind sollte leer sein, war aber: " + formatValue(nieces));
        
        TestRunner.startSubtest("getCousinsOf(1) sollte für Einzelkind leer sein");
        @SuppressWarnings("unchecked")
        List<Integer> cousins = (List<Integer>) invokeMethod(singleChildTree, "getCousinsOf", new Class<?>[]{Integer.class}, new Object[]{1});
        TestRunner.check(cousins != null && cousins.isEmpty(), "getCousinsOf(1) ist leer.", "getCousinsOf(1) für Einzelkind sollte leer sein, war aber: " + formatValue(cousins));
    }
    
    public static void testInvalidInputEdgeCases() throws Exception {
        TestRunner.startSuite("Edge Cases: Ungültige Eingaben");
        Object tree = createBuddenbrooksTree();
        int invalidId = 99;

        TestRunner.startSubtest("Methodenaufrufe mit nicht existenter ID");
        Object person = invokeMethod(tree, "getPersonById", new Class<?>[]{Integer.class}, new Object[]{invalidId});
        TestRunner.check(person == null, "getPersonById mit ungültiger ID gibt null zurück.", "getPersonById mit ungültiger ID sollte null sein, war aber nicht null.");

        Integer parent = (Integer) invokeMethod(tree, "getParentOf", new Class<?>[]{Integer.class}, new Object[]{invalidId});
        TestRunner.check(parent == null, "getParentOf mit ungültiger ID gibt null zurück.", "getParentOf mit ungültiger ID sollte null sein, war aber nicht null.");
        
        @SuppressWarnings("unchecked")
        List<Integer> children = (List<Integer>) invokeMethod(tree, "getChildrenOf", new Class<?>[]{Integer.class}, new Object[]{invalidId});
        TestRunner.check(children != null && children.isEmpty(), "getChildrenOf mit ungültiger ID gibt eine leere Liste zurück.", "getChildrenOf mit ungültiger ID sollte leer sein, war aber nicht leer.");
        
        @SuppressWarnings("unchecked")
        List<Integer> siblings = (List<Integer>) invokeMethod(tree, "getSiblingsOf", new Class<?>[]{Integer.class}, new Object[]{invalidId});
        TestRunner.check(siblings != null && siblings.isEmpty(), "getSiblingsOf mit ungültiger ID gibt eine leere Liste zurück.", "getSiblingsOf mit ungültiger ID sollte leer sein, war aber nicht leer.");
        
        @SuppressWarnings("unchecked")
        List<Integer> nieces = (List<Integer>) invokeMethod(tree, "getNiecesNephewsOf", new Class<?>[]{Integer.class}, new Object[]{invalidId});
        TestRunner.check(nieces != null && nieces.isEmpty(), "getNiecesNephewsOf mit ungültiger ID gibt eine leere Liste zurück.", "getNiecesNephewsOf mit ungültiger ID sollte leer sein, war aber nicht leer.");

        @SuppressWarnings("unchecked")
        List<Integer> cousins = (List<Integer>) invokeMethod(tree, "getCousinsOf", new Class<?>[]{Integer.class}, new Object[]{invalidId});
        TestRunner.check(cousins != null && cousins.isEmpty(), "getCousinsOf mit ungültiger ID gibt eine leere Liste zurück.", "getCousinsOf mit ungültiger ID sollte leer sein, war aber nicht leer.");
    }
    
    public static void testComplexStructures() throws Exception {
        TestRunner.startSuite("Komplexere Baumstrukturen");

        TestRunner.startSubtest("Tiefer Baum (lange Kette)");
        Object deepTree = createFamilyTreeInstance(createPersonInstance("Ur-Ur-Oma"));
        Integer lastId = 0;
        for (int i = 1; i <= 5; i++) {
            lastId = (Integer) invokeMethod(deepTree, "insertAsChildForId", new Class<?>[]{personClass, Integer.class}, new Object[]{createPersonInstance("Kind " + i), lastId});
        }
        
        Integer parent = (Integer) invokeMethod(deepTree, "getParentOf", new Class<?>[]{Integer.class}, new Object[]{5}); // -> 4
        parent = (Integer) invokeMethod(deepTree, "getParentOf", new Class<?>[]{Integer.class}, new Object[]{parent});   // -> 3
        parent = (Integer) invokeMethod(deepTree, "getParentOf", new Class<?>[]{Integer.class}, new Object[]{parent});   // -> 2
        parent = (Integer) invokeMethod(deepTree, "getParentOf", new Class<?>[]{Integer.class}, new Object[]{parent});   // -> 1
        parent = (Integer) invokeMethod(deepTree, "getParentOf", new Class<?>[]{Integer.class}, new Object[]{parent});   // -> 0
        TestRunner.check(Objects.equals(0, parent), "getParentOf über mehrere Ebenen in tiefem Baum funktioniert.", "getParentOf in tiefem Baum fehlgeschlagen. Erwartet: 0, Erhalten: " + parent);

        TestRunner.startSubtest("Breiter Baum (viele Geschwister)");
        Object wideTree = createFamilyTreeInstance(createPersonInstance("Super-Mama"));
        for (int i = 1; i <= 10; i++) {
            invokeMethod(wideTree, "insertAsChildForId", new Class<?>[]{personClass, Integer.class}, new Object[]{createPersonInstance("Kind " + i), 0});
        }
        
        @SuppressWarnings("unchecked")
        List<Integer> actualSiblings = (List<Integer>) invokeMethod(wideTree, "getSiblingsOf", new Class<?>[]{Integer.class}, new Object[]{1});
        List<Integer> correctExpected = new ArrayList<>();
        for (int i = 2; i <= 10; i++) correctExpected.add(i);
        
        boolean wideSiblingsMatch = compareListsUnordered(correctExpected, actualSiblings);
        TestRunner.check(wideSiblingsMatch, "getSiblingsOf in breitem Baum funktioniert.", "Fehler bei getSiblingsOf. Erwartet (beliebige Reihenfolge): " + formatValue(correctExpected) + ", Erhalten: " + formatValue(actualSiblings));
    }
    
    // ===================================================================================
    // HILFSMETHODEN FÜR REFLECTION UND AUSGABE
    // ===================================================================================

    private static Object createPersonInstance(String name) throws Exception {
        Constructor<?> constructor = personClass.getDeclaredConstructor(String.class);
        return constructor.newInstance(name);
    }

    private static Object createFamilyTreeInstance(Object rootPerson) throws Exception {
        Constructor<?> constructor = familyTreeClass.getDeclaredConstructor(personClass);
        return constructor.newInstance(rootPerson);
    }
    
    private static Object invokeMethod(Object obj, String methodName, Class<?>[] parameterTypes, Object[] args) throws Exception {
        Method method = obj.getClass().getMethod(methodName, parameterTypes);
        return method.invoke(obj, args);
    }

    private static Object invokeMethod(Object obj, String methodName) throws Exception {
        Method method = obj.getClass().getMethod(methodName);
        return method.invoke(obj);
    }
    
    /** Erstellt den Buddenbrooks-Baum aus dem Beispiel mit Reflection. */
    private static Object createBuddenbrooksTree() throws Exception {
        Object grandpa = createPersonInstance("Johann");
        Object tree = createFamilyTreeInstance(grandpa);
        invokeMethod(tree, "insertAsChildForId", new Class<?>[]{personClass, Integer.class}, new Object[]{createPersonInstance("Gotthold"), 0});  // 1
        invokeMethod(tree, "insertAsChildForId", new Class<?>[]{personClass, Integer.class}, new Object[]{createPersonInstance("Jean"), 0});      // 2
        invokeMethod(tree, "insertAsChildForId", new Class<?>[]{personClass, Integer.class}, new Object[]{createPersonInstance("Olly"), 0});      // 3
        invokeMethod(tree, "insertAsChildForId", new Class<?>[]{personClass, Integer.class}, new Object[]{createPersonInstance("Friederike"), 1}); // 4
        invokeMethod(tree, "insertAsChildForId", new Class<?>[]{personClass, Integer.class}, new Object[]{createPersonInstance("Henriette"), 1});  // 5
        invokeMethod(tree, "insertAsChildForId", new Class<?>[]{personClass, Integer.class}, new Object[]{createPersonInstance("Pfiffi"), 1});     // 6
        invokeMethod(tree, "insertAsChildForId", new Class<?>[]{personClass, Integer.class}, new Object[]{createPersonInstance("Thomas"), 2});     // 7
        invokeMethod(tree, "insertAsChildForId", new Class<?>[]{personClass, Integer.class}, new Object[]{createPersonInstance("Antonie"), 2});    // 8
        invokeMethod(tree, "insertAsChildForId", new Class<?>[]{personClass, Integer.class}, new Object[]{createPersonInstance("Christian"), 2});  // 9
        invokeMethod(tree, "insertAsChildForId", new Class<?>[]{personClass, Integer.class}, new Object[]{createPersonInstance("Clara"), 2});      // 10
        return tree;
    }

    /**
     * Hilfsmethode zur Formatierung von Werten für eine klare Ausgabe, insbesondere Listen und Person-Objekte.
     */
    private static String formatValue(Object value) {
        if (value == null) return "null";
        if (value instanceof List) {
            return ((List<?>) value).stream()
                    .map(PVL5Test::formatValue)
                    .collect(Collectors.joining(", ", "[", "]"));
        }
        // Prüfe, ob es sich um ein Person-Objekt handelt, ohne eine harte Abhängigkeit zu haben
        if (value.getClass().getName().equals(personFQN)) {
            try {
                String name = (String) invokeMethod(value, "getName");
                return String.format("Person{name='%s'}", name);
            } catch (Exception e) {
                return "Person{<fehler beim namen abrufen>}";
            }
        }
        return Objects.toString(value);
    }
    
    /**
     * Vergleicht zwei Listen ohne Berücksichtigung der Reihenfolge.
     * @return true, wenn die Listen dieselben Elemente enthalten, sonst false.
     */
    private static boolean compareListsUnordered(List<?> list1, List<?> list2) {
        if (list1 == null || list2 == null) {
            return list1 == list2;
        }
        if (list1.size() != list2.size()) {
            return false;
        }
        return new ArrayList<>(list1).containsAll(list2) && new ArrayList<>(list2).containsAll(list1);
    }
}