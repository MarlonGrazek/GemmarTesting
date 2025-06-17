import java.lang.reflect.Constructor;
import java.lang.reflect.Method;
import java.lang.reflect.InvocationTargetException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;

public class PVL4Test {

    // Hilfsmethode zur Formatierung von Werten für eine klare Ausgabe, insbesondere Listen.
    private static String formatValue(Object value) {
        if (value instanceof List) {
            // Sicherstellen, dass wir eine List<?> haben, bevor wir casten
            if (value instanceof List<?>) {
                 return listToString((List<?>) value);
            } else {
                // Fallback, sollte nicht passieren, wenn der Typ korrekt ist
                return Objects.toString(value);
            }
        }
        return Objects.toString(value);
    }

    // Benutzerdefinierter Listenformatierer für klarere Ausgabe in Fehlermeldungen.
    private static String listToString(List<?> list) {
        if (list == null) return "null";
        if (list.isEmpty()) return "[]";

        StringBuilder sb = new StringBuilder();
        sb.append("[");
        boolean first = true;
        for (Object item : list) {
            if (!first) {
                sb.append(", ");
            }
            if (item instanceof List) { // Basis-Verschachtelung für Liste von Listen
                 if (item instanceof List<?>) {
                    sb.append(listToString((List<?>) item));
                 } else {
                    sb.append(Objects.toString(item));
                 }
            } else {
                sb.append(Objects.toString(item));
            }
            first = false;
        }
        sb.append("]");
        return sb.toString();
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

    // Hilfsmethode zum Erstellen einer Instanz der Nutzerklasse OperationSystem
    private static Object createOperationSystemInstance(String className, int kernelNumber)
            throws ClassNotFoundException, NoSuchMethodException, InstantiationException, IllegalAccessException, InvocationTargetException {
        Class<?> userClass = Class.forName(className);
        Constructor<?> constructor = userClass.getDeclaredConstructor(int.class);
        return constructor.newInstance(kernelNumber);
    }


    public static void main(String[] args) {
        if (args.length < 1) { // Erwartet jetzt nur noch einen FQN für OperationSystem
            System.out.println("{\"event\":\"log\",\"level\":\"error\",\"message\":\"FEHLER: Vollqualifizierter Name für OperationSystem nicht als Argument übergeben!\"}");
            System.out.println("{\"event\":\"run_finish\",\"duration\":\"0.00\"}");
            return;
        }
        String operationSystemFQN = args[0];
        // String processFQN = args[1]; // Nicht mehr benötigt

        TestRunner.logInfo("PVL4Test gestartet. OperationSystem FQN: " + operationSystemFQN);
        TestRunner.startRun();
        long startTime = System.nanoTime();

        try {
            testProcessGetters(operationSystemFQN); // Übergibt OS FQN, um Process-Instanzen über OS zu erhalten
            testCreateProcess(operationSystemFQN);
            testDeleteProcess(operationSystemFQN);
            testExecute(operationSystemFQN);
        } catch (InvocationTargetException ite) {
            Throwable cause = ite.getTargetException();
            TestRunner.logError("Ein Fehler ist in Ihrer Implementierung aufgetreten: " + cause.getClass().getName() + " - " + TestRunner.escapeJsonString(cause.getMessage()) + ". Details siehe Konsole (stderr).");
            cause.printStackTrace(System.err);
        } catch (ClassNotFoundException cnfe) {
            TestRunner.logError("FEHLER: Nutzerklasse nicht gefunden. Überprüfen Sie Klassennamen und Packaging. Fehlermeldung: " + TestRunner.escapeJsonString(cnfe.getMessage()));
            cnfe.printStackTrace(System.err);
        } catch (NoSuchMethodException nsme) {
            TestRunner.logError("FEHLER: Eine erwartete Methode wurde nicht gefunden: " + TestRunner.escapeJsonString(nsme.getMessage()) + ". Überprüfen Sie die Methodensignaturen.");
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

    // --- TESTKATEGORIEN ---

    public static void testProcessGetters(String osFQN) throws Exception {
        TestRunner.startSuite("Process Class Getters (via OperationSystem.createProcess)");
        
        Object osInstance;
        Object processInstance = null;
        int testPID = 1;
        int testArrivalTime = 5;
        int testExecTime = 10;
        int testPriority = 99;

        try {
            osInstance = createOperationSystemInstance(osFQN, 1); // Erstelle OS-Instanz
            // Erstelle einen Prozess über das OS, um ein Testobjekt zu bekommen
            // Annahme: createProcess gibt die PID zurück. Wir brauchen das Objekt selbst.
            // Die Aufgabe sagt: "public int createProcess(...)" und "Speichern Sie sich den Prozess für den weiteren Verlauf."
            // Das bedeutet, wir können die Getter nicht direkt nach createProcess testen, ohne Annahmen über
            // eine getProcessById-Methode zu machen, die nicht spezifiziert ist.
            // ALTERNATIVE: Wenn die Process-Klasse einen public Konstruktor hat, wie in der Aufgabe beschrieben
            // (public Process(int pid , int arrivalTime , int executionTime , int priority)),
            // und im selben Paket (oder Default) wie OperationSystem ist, könnten wir versuchen, sie direkt zu instanziieren.
            // Da der FQN von Process aber nicht übergeben wird, ist das schwierig.
            //
            // BESTER ANSATZ HIER: Die Aufgabenstellung für PVL4 beschreibt die Methoden von `Process`
            // so, als ob `Process` eine eigenständige Klasse ist, die der Nutzer implementiert.
            // Die Tests sollten also davon ausgehen, dass eine Klasse `Process` (deren FQN wir *nicht* direkt haben)
            // existiert und instanziiert werden kann, wenn sie im Classpath ist (z.B. Default-Package oder gleiches Paket wie OS).
            // Für die Getter-Tests ist es am saubersten, wenn wir die `Process`-Klasse direkt instanziieren.
            // Wir müssen den FQN von Process ableiten oder annehmen, dass er einfach "Process" ist, wenn OS im Default ist.
            // Da wir den FQN von Process nicht haben, ist dieser Testteil schwierig ohne Annahmen.
            //
            // Kompromiss: Wir nehmen an, dass die Process-Klasse des Nutzers "Process" heißt und im selben
            // Paket wie die OperationSystem-Klasse liegt oder im Default-Package, wenn OperationSystem im Default-Package ist.
            String processClassNameToTry;
            int lastDot = osFQN.lastIndexOf('.');
            if (lastDot == -1) { // OperationSystem ist im Default-Package
                processClassNameToTry = "Process";
            } else {
                processClassNameToTry = osFQN.substring(0, lastDot + 1) + "Process";
            }
            TestRunner.logInfo("Versuche Process-Klasse zu laden als: " + processClassNameToTry);

            Class<?> processUserClass = Class.forName(processClassNameToTry);
            Constructor<?> processConstructor = processUserClass.getDeclaredConstructor(int.class, int.class, int.class, int.class);
            processInstance = processConstructor.newInstance(testPID, testArrivalTime, testExecTime, testPriority);
            TestRunner.logInfo("Process-Instanz für Getter-Tests erfolgreich erstellt.");

        } catch (ClassNotFoundException cnfe) {
             TestRunner.check(false, "Process-Klasse konnte nicht geladen werden.", "Fehler beim Laden der Process-Klasse (vermutet als 'Process' im selben Paket/Default wie OperationSystem): " + cnfe.toString());
             return;
        } catch (NoSuchMethodException nsme) {
            TestRunner.check(false, "Process-Konstruktor nicht gefunden.", "Process-Konstruktor (int, int, int, int) nicht gefunden: " + nsme.toString());
            return;
        } catch (Exception e) {
            TestRunner.startSubtest("Process Instantiation for Getters");
            TestRunner.check(false, "Process object should be creatable for getter tests.", "Failed to instantiate Process for getter tests: " + e.getClass().getSimpleName() + " - " + TestRunner.escapeJsonString(e.getMessage()));
            e.printStackTrace(System.err);
            return; 
        }

        TestRunner.startSubtest("getPID() returns correct value");
        int actualPid = (int) invokeMethod(processInstance, "getPID");
        TestRunner.check(Objects.equals(testPID, actualPid), 
                        "getPID() returned correct value.", 
                        "getPID() failed. Expected: " + testPID + ", Actual: " + actualPid);

        TestRunner.startSubtest("getArrivalTime() returns correct value");
        int actualArrivalTime = (int) invokeMethod(processInstance, "getArrivalTime");
        TestRunner.check(Objects.equals(testArrivalTime, actualArrivalTime), 
                        "getArrivalTime() returned correct value.", 
                        "getArrivalTime() failed. Expected: " + testArrivalTime + ", Actual: " + actualArrivalTime);

        TestRunner.startSubtest("getExecutionTime() returns correct value");
        int actualExecutionTime = (int) invokeMethod(processInstance, "getExecutionTime");
        TestRunner.check(Objects.equals(testExecTime, actualExecutionTime), 
                        "getExecutionTime() returned correct value.", 
                        "getExecutionTime() failed. Expected: " + testExecTime + ", Actual: " + actualExecutionTime);

        TestRunner.startSubtest("getPriority() returns correct value");
        int actualPriority = (int) invokeMethod(processInstance, "getPriority");
        TestRunner.check(Objects.equals(testPriority, actualPriority), 
                        "getPriority() returned correct value.", 
                        "getPriority() failed. Expected: " + testPriority + ", Actual: " + actualPriority);
    }

    public static void testCreateProcess(String osFQN) throws Exception {
        TestRunner.startSuite("OperationSystem.createProcess()");
        
        Object osInstance;

        TestRunner.startSubtest("First process PID should be 1");
        osInstance = createOperationSystemInstance(osFQN, 1);
        int pid1 = (int) invokeMethod(osInstance, "createProcess", new Class<?>[]{int.class, int.class, int.class}, new Object[]{0, 5, 10});
        TestRunner.check(pid1 == 1, "First process PID is 1.", "Expected PID 1, Actual: " + pid1);

        TestRunner.startSubtest("Second process PID should be 2");
        int pid2 = (int) invokeMethod(osInstance, "createProcess", new Class<?>[]{int.class, int.class, int.class}, new Object[]{0, 5, 10});
        TestRunner.check(pid2 == 2, "Second process PID is 2.", "Expected PID 2, Actual: " + pid2);
        
        TestRunner.startSubtest("Third process PID should be 3");
        int pid3 = (int) invokeMethod(osInstance, "createProcess", new Class<?>[]{int.class, int.class, int.class}, new Object[]{0, 5, 10});
        TestRunner.check(pid3 == 3, "Third process PID is 3.", "Expected PID 3, Actual: " + pid3);

        TestRunner.startSubtest("Should create 255 processes with PIDs 1-255");
        osInstance = createOperationSystemInstance(osFQN, 1);
        boolean limitTestPass = true;
        String limitTestFailMsg = "Failed to create 255 processes. ";
        for (int i = 1; i <= 255; i++) {
            if ((int) invokeMethod(osInstance, "createProcess", new Class<?>[]{int.class, int.class, int.class}, new Object[]{0, 1, 1}) != i) {
                limitTestPass = false;
                limitTestFailMsg += "Expected PID " + i + " but got something else at iteration " + i + ".";
                break;
            }
        }
        TestRunner.check(limitTestPass, "Successfully created 255 processes with PIDs 1-255.", limitTestFailMsg);

        TestRunner.startSubtest("Creating 256th process should return -1");
        if (!limitTestPass) { 
            osInstance = createOperationSystemInstance(osFQN, 1);
            for (int i = 1; i <= 255; i++) invokeMethod(osInstance, "createProcess", new Class<?>[]{int.class, int.class, int.class}, new Object[]{0,1,1});
            TestRunner.logInfo("PID Limit subtest failed or was skipped, re-filling OS for PID Overflow test.");
        }
        int overflowPid = (int) invokeMethod(osInstance, "createProcess", new Class<?>[]{int.class, int.class, int.class}, new Object[]{0, 1, 1});
        TestRunner.check(overflowPid == -1, "Creating 256th process returns -1.", "Expected -1 for 256th process, Actual: " + overflowPid);
    }

    public static void testDeleteProcess(String osFQN) throws Exception {
        TestRunner.startSuite("OperationSystem.deleteProcess()");
        Object osInstance = createOperationSystemInstance(osFQN, 1);
        invokeMethod(osInstance, "createProcess", new Class<?>[]{int.class, int.class, int.class}, new Object[]{0, 5, 10}); // PID 1
        invokeMethod(osInstance, "createProcess", new Class<?>[]{int.class, int.class, int.class}, new Object[]{0, 5, 10}); // PID 2

        TestRunner.startSubtest("Deleting an existing process (PID 1) should return true");
        boolean delete1Result = (boolean) invokeMethod(osInstance, "deleteProcess", new Class<?>[]{int.class}, new Object[]{1});
        TestRunner.check(delete1Result, "Deleting existing PID 1 returns true.", "Expected true for deleting PID 1, Actual: " + delete1Result);

        TestRunner.startSubtest("Deleting a non-existent process (PID 99) should return false");
        boolean delete99Result = (boolean) invokeMethod(osInstance, "deleteProcess", new Class<?>[]{int.class}, new Object[]{99});
        TestRunner.check(!delete99Result, "Deleting non-existent PID 99 returns false.", "Expected false for deleting PID 99, Actual: " + delete99Result);

        TestRunner.startSubtest("Deleting the same process twice (PID 1) should return false");
        boolean delete1AgainResult = (boolean) invokeMethod(osInstance, "deleteProcess", new Class<?>[]{int.class}, new Object[]{1});
        TestRunner.check(!delete1AgainResult, "Deleting PID 1 again returns false.", "Expected false for deleting PID 1 again, Actual: " + delete1AgainResult);
        
        TestRunner.startSubtest("New process should reuse the lowest freed PID (1)");
        int reusedPid = (int) invokeMethod(osInstance, "createProcess", new Class<?>[]{int.class, int.class, int.class}, new Object[]{0, 5, 10});
        TestRunner.check(reusedPid == 1, "New process reuses freed PID 1.", "Expected PID 1 to be reused, Actual: " + reusedPid);

        Object osFullInstance = createOperationSystemInstance(osFQN, 1);
        for (int i = 1; i <= 255; i++) {
            invokeMethod(osFullInstance, "createProcess", new Class<?>[]{int.class, int.class, int.class}, new Object[]{0, 1, 1});
        }
        invokeMethod(osFullInstance, "deleteProcess", new Class<?>[]{int.class}, new Object[]{42});
        invokeMethod(osFullInstance, "deleteProcess", new Class<?>[]{int.class}, new Object[]{100});

        TestRunner.startSubtest("After filling all PIDs and deleting 42, new PID should be 42");
        int reusedPid42 = (int) invokeMethod(osFullInstance, "createProcess", new Class<?>[]{int.class, int.class, int.class}, new Object[]{0, 1, 1});
        TestRunner.check(reusedPid42 == 42, "New PID is 42 after deleting it.", "Expected PID 42, Actual: " + reusedPid42);

        TestRunner.startSubtest("After re-using 42, next lowest freed PID is 100");
        int reusedPid100 = (int) invokeMethod(osFullInstance, "createProcess", new Class<?>[]{int.class, int.class, int.class}, new Object[]{0, 1, 1});
        TestRunner.check(reusedPid100 == 100, "New PID is 100 after deleting and reusing 42.", "Expected PID 100, Actual: " + reusedPid100);
        
        TestRunner.startSubtest("PID list is full again, creating new process should return -1");
        int fullPid = (int) invokeMethod(osFullInstance, "createProcess", new Class<?>[]{int.class, int.class, int.class}, new Object[]{0, 1, 1});
        TestRunner.check(fullPid == -1, "Creating process when full returns -1.", "Expected -1 when OS is full, Actual: " + fullPid);
    }

    @SuppressWarnings("unchecked")
    public static void testExecute(String osFQN) throws Exception {
        TestRunner.startSuite("OperationSystem.execute()");
        Object osInstance;
        List<List<Integer>> result;
        List<List<Integer>> expected;
        String testName;

        testName = "Scenario from PDF example";
        TestRunner.startSubtest(testName);
        osInstance = createOperationSystemInstance(osFQN, 2);
        invokeMethod(osInstance, "createProcess", new Class<?>[]{int.class, int.class, int.class}, new Object[]{0, 3, 10});  
        invokeMethod(osInstance, "createProcess", new Class<?>[]{int.class, int.class, int.class}, new Object[]{0, 2, 10});  
        invokeMethod(osInstance, "createProcess", new Class<?>[]{int.class, int.class, int.class}, new Object[]{2, 1, 10});  
        invokeMethod(osInstance, "createProcess", new Class<?>[]{int.class, int.class, int.class}, new Object[]{5, 4, 10});  
        invokeMethod(osInstance, "createProcess", new Class<?>[]{int.class, int.class, int.class}, new Object[]{5, 3, 90});  
        invokeMethod(osInstance, "createProcess", new Class<?>[]{int.class, int.class, int.class}, new Object[]{9, 1, 10});  
        invokeMethod(osInstance, "deleteProcess", new Class<?>[]{int.class}, new Object[]{6});         
        invokeMethod(osInstance, "createProcess", new Class<?>[]{int.class, int.class, int.class}, new Object[]{5, 1, 80});  
        
        result = (List<List<Integer>>) invokeMethod(osInstance, "execute");
        expected = Arrays.asList(
                Arrays.asList(1, 2), Arrays.asList(1, 2), Arrays.asList(1, 3), 
                Arrays.asList(0, 0), Arrays.asList(0, 0), Arrays.asList(5, 6), 
                Arrays.asList(5, 4), Arrays.asList(5, 4), Arrays.asList(0, 4), 
                Arrays.asList(0, 4)  
        );
        TestRunner.check(Objects.deepEquals(expected, result), 
                        testName + " - Passed.", 
                        testName + " - Failed. Expected: " + formatValue(expected) + ", Actual: " + formatValue(result));

        testName = "No processes scheduled";
        TestRunner.startSubtest(testName);
        osInstance = createOperationSystemInstance(osFQN, 4);
        result = (List<List<Integer>>) invokeMethod(osInstance, "execute");
        expected = new ArrayList<>();
        TestRunner.check(Objects.deepEquals(expected, result), 
                        testName + " - Passed.", 
                        testName + " - Failed. Expected: " + formatValue(expected) + ", Actual: " + formatValue(result));

        testName = "Non-preemptive behavior with high priority arrival";
        TestRunner.startSubtest(testName);
        osInstance = createOperationSystemInstance(osFQN, 1);
        invokeMethod(osInstance, "createProcess", new Class<?>[]{int.class, int.class, int.class}, new Object[]{0, 4, 5}); 
        invokeMethod(osInstance, "createProcess", new Class<?>[]{int.class, int.class, int.class}, new Object[]{1, 2, 10});
        result = (List<List<Integer>>) invokeMethod(osInstance, "execute");
        expected = Arrays.asList(
                Arrays.asList(1), Arrays.asList(1), Arrays.asList(1), 
                Arrays.asList(1), Arrays.asList(2), Arrays.asList(2)  
        );
        TestRunner.check(Objects.deepEquals(expected, result), 
                        testName + " - Passed.", 
                        testName + " - Failed. Expected: " + formatValue(expected) + ", Actual: " + formatValue(result));

        testName = "System handles idle time before first arrival";
        TestRunner.startSubtest(testName);
        osInstance = createOperationSystemInstance(osFQN, 2);
        invokeMethod(osInstance, "createProcess", new Class<?>[]{int.class, int.class, int.class}, new Object[]{2, 2, 10});
        result = (List<List<Integer>>) invokeMethod(osInstance, "execute");
        expected = Arrays.asList(
                Arrays.asList(0, 0), Arrays.asList(0, 0), 
                Arrays.asList(1, 0), Arrays.asList(1, 0)  
        );
        TestRunner.check(Objects.deepEquals(expected, result), 
                        testName + " - Passed.", 
                        testName + " - Failed. Expected: " + formatValue(expected) + ", Actual: " + formatValue(result));
        
        testName = "Priority tie-breaking favors lower PID";
        TestRunner.startSubtest(testName);
        osInstance = createOperationSystemInstance(osFQN, 1);
        invokeMethod(osInstance, "createProcess", new Class<?>[]{int.class, int.class, int.class}, new Object[]{0, 2, 10}); 
        invokeMethod(osInstance, "createProcess", new Class<?>[]{int.class, int.class, int.class}, new Object[]{0, 2, 10}); 
        result = (List<List<Integer>>) invokeMethod(osInstance, "execute");
        expected = Arrays.asList(
                Arrays.asList(1), Arrays.asList(1),
                Arrays.asList(2), Arrays.asList(2)
        );
        TestRunner.check(Objects.deepEquals(expected, result), 
                        testName + " - Passed.", 
                        testName + " - Failed. Expected: " + formatValue(expected) + ", Actual: " + formatValue(result));

        testName = "Process with zero execution time";
        TestRunner.startSubtest(testName);
        osInstance = createOperationSystemInstance(osFQN, 1);
        invokeMethod(osInstance, "createProcess", new Class<?>[]{int.class, int.class, int.class}, new Object[]{0, 2, 10}); 
        invokeMethod(osInstance, "createProcess", new Class<?>[]{int.class, int.class, int.class}, new Object[]{0, 0, 99}); 
        result = (List<List<Integer>>) invokeMethod(osInstance, "execute");
        expected = Arrays.asList(
                Arrays.asList(1),
                Arrays.asList(1)
        );
        TestRunner.check(Objects.deepEquals(expected, result), 
                        testName + " - Passed.", 
                        testName + " - Failed. Expected: " + formatValue(expected) + ", Actual: " + formatValue(result));
    }
}