// PVL3Test.java (Annahme für Gist)
// Liegt im Default-Package und verwendet TestRunner (auch im Default-Package).
// Nutzt Reflection für den Aufruf der Methoden der Nutzerimplementierung.
// Testnachrichten sind jetzt auf Englisch.

import java.lang.reflect.Method;
import java.lang.reflect.InvocationTargetException;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.ArrayList; // Für den Fall, dass getStudent null zurückgibt

public class PVL3Test {
    
    public interface I_StudentAdministration {
        int enrollStudent(String firstname , String surname);
        boolean disenrollStudent(int number);
        void takeExam(int number , String courseID , float grade);
        List<String> getStudent(int number);
    }
    
    // Hilfsmethode zum Vergleichen von Studentendaten
    private static boolean compareStudentData(List<String> expected, List<String> actual) {
        if (expected == null && actual == null) return true;
        if (expected == null || actual == null) {
             TestRunner.logInfo("Comparison Error: One list is null. Expected: " + (expected == null ? "null" : expected.toString()) + ", Actual: " + (actual == null ? "null" : actual.toString()));
            return false;
        }
        if (expected.isEmpty() && actual.isEmpty()) return true;
        
        if (expected.size() != actual.size()) {
            TestRunner.logInfo("Comparison Error: Different list sizes. Expected: " + expected.size() + " (" + expected.toString() + "), Actual: " + actual.size() + " (" + actual.toString() + ")");
            return false;
        }
        
        int commonPrefixLength = Math.min(3, Math.min(expected.size(), actual.size()));
        for (int i = 0; i < commonPrefixLength; i++) {
            if (!expected.get(i).equals(actual.get(i))) {
                 TestRunner.logInfo("Comparison Error in prefix at index " + i + ". Expected: '" + expected.get(i) + "', Actual: '" + actual.get(i) + "'");
                return false;
            }
        }
        
        if (expected.size() > commonPrefixLength) {
            if (actual.size() <= commonPrefixLength) {
                 TestRunner.logInfo("Comparison Error: 'actual' list too short for course comparison, 'expected' has courses.");
                return false; 
            }
            Set<String> expectedCourses = new HashSet<>(expected.subList(commonPrefixLength, expected.size()));
            Set<String> actualCourses = new HashSet<>(actual.subList(commonPrefixLength, actual.size()));
            if (!expectedCourses.equals(actualCourses)) {
                TestRunner.logInfo("Comparison Error: Course sets do not match. Expected: " + expectedCourses + ", Actual: " + actualCourses);
                return false;
            }
        } else if (actual.size() > commonPrefixLength) {
            TestRunner.logInfo("Comparison Error: Expected no courses, but received: " + actual.subList(commonPrefixLength, actual.size()));
            return false;
        }
        return true;
    }

    // Hilfsmethode für Reflection-Aufrufe
    private static Object invokeMethod(Object obj, String methodName, Class<?>[] parameterTypes, Object[] args) throws NoSuchMethodException, IllegalAccessException, InvocationTargetException {
        Method method = obj.getClass().getMethod(methodName, parameterTypes);
        return method.invoke(obj, args);
    }
    
    @SuppressWarnings("unchecked")
    public static void main(String[] args) {
        if (args.length == 0) {
            System.out.println("{\"event\":\"log\",\"level\":\"error\",\"message\":\"ERROR: Fully qualified name of user solution class not provided as argument!\"}");
            System.out.println("{\"event\":\"run_finish\",\"duration\":\"0.00\"}");
            return;
        }
        String userSolutionClassName = args[0];
        Object adminInstance;

        try {
            Class<?> userClass = Class.forName(userSolutionClassName);
            adminInstance = userClass.getDeclaredConstructor().newInstance();
        } catch (Exception e) {
            String errorMsg = "ERROR loading/instantiating user class '" + userSolutionClassName + "': " + e.toString();
            errorMsg = errorMsg.replace("\\", "\\\\").replace("\"", "\\\"");
            System.out.println("{\"event\":\"log\",\"level\":\"error\",\"message\":\"" + errorMsg + "\"}");
            e.printStackTrace(System.err);
            System.out.println("{\"event\":\"run_finish\",\"duration\":\"0.00\"}");
            return;
        }

        long startTime = System.nanoTime();

        try {
            TestRunner.startSuite("Enroll Student");
            TestRunner.startSubtest("Enroll the first student");
            int student1Id = (int) invokeMethod(adminInstance, "enrollStudent", new Class<?>[]{String.class, String.class}, new Object[]{"Max", "Mustermann"});
            TestRunner.check(student1Id == 1, "Student 1 ID should be 1.", "Expected: 1, Actual: " + student1Id);

            TestRunner.startSubtest("Enroll the second student");
            int student2Id = (int) invokeMethod(adminInstance, "enrollStudent", new Class<?>[]{String.class, String.class}, new Object[]{"Erika", "Musterfrau"});
            TestRunner.check(student2Id == 2, "Student 2 ID should be 2.", "Expected: 2, Actual: " + student2Id);
            
            TestRunner.startSuite("Get Student");
            TestRunner.startSubtest("Retrieve data of student 1");
            List<String> expectedData1 = Arrays.asList("Max", "Mustermann", "1");
            List<String> actualData1 = (List<String>) invokeMethod(adminInstance, "getStudent", new Class<?>[]{int.class}, new Object[]{1});
            TestRunner.check(compareStudentData(expectedData1, actualData1), "Data for student 1 should match.", "Expected: " + expectedData1 + ", Actual: " + (actualData1 == null ? "null" : actualData1.toString()));
            
            TestRunner.startSubtest("Retrieve data of non-existent student");
            List<String> expectedDataEmpty = Collections.emptyList();
            List<String> actualDataEmpty = (List<String>) invokeMethod(adminInstance, "getStudent", new Class<?>[]{int.class}, new Object[]{99});
            if (actualDataEmpty == null) {
                TestRunner.logWarning("getStudent(99) returned null, expected empty list.");
                actualDataEmpty = new ArrayList<>();
            }
            TestRunner.check(compareStudentData(expectedDataEmpty, actualDataEmpty), "Data for non-existent student should be an empty list.", "Expected: Empty List, Actual: " + actualDataEmpty.toString());

            TestRunner.startSuite("Take Exam");
            TestRunner.startSubtest("Student 1 - First exam (Math, Grade 1.3)");
            invokeMethod(adminInstance, "takeExam", new Class<?>[]{int.class, String.class, float.class}, new Object[]{1, "Math", 1.3f});
            List<String> expectedData1Exam1 = Arrays.asList("Max", "Mustermann", "1", "Math 1.3 1");
            actualData1 = (List<String>) invokeMethod(adminInstance, "getStudent", new Class<?>[]{int.class}, new Object[]{1});
            TestRunner.check(compareStudentData(expectedData1Exam1, actualData1), "Exam 'Math' (1.3) should be added.", "Expected (course order irrelevant): " + expectedData1Exam1 + ", Actual: " + (actualData1 == null ? "null" : actualData1.toString()));

            TestRunner.startSubtest("Student 1 - Second exam (Info, Grade 5.0)");
            invokeMethod(adminInstance, "takeExam", new Class<?>[]{int.class, String.class, float.class}, new Object[]{1, "Info", 5.0f});
            List<String> expectedData1Exam2 = Arrays.asList("Max", "Mustermann", "1", "Math 1.3 1", "Info 5.0 1");
            actualData1 = (List<String>) invokeMethod(adminInstance, "getStudent", new Class<?>[]{int.class}, new Object[]{1});
            TestRunner.check(compareStudentData(expectedData1Exam2, actualData1), "Exam 'Info' (5.0) should be added.", "Expected (course order irrelevant): " + expectedData1Exam2 + ", Actual: " + (actualData1 == null ? "null" : actualData1.toString()));
            
            TestRunner.startSubtest("Student 1 - Retake exam 'Info' (Grade 2.0)");
            invokeMethod(adminInstance, "takeExam", new Class<?>[]{int.class, String.class, float.class}, new Object[]{1, "Info", 2.0f});
            List<String> expectedData1Exam3 = Arrays.asList("Max", "Mustermann", "1", "Math 1.3 1", "Info 2.0 2");
            actualData1 = (List<String>) invokeMethod(adminInstance, "getStudent", new Class<?>[]{int.class}, new Object[]{1});
            TestRunner.check(compareStudentData(expectedData1Exam3, actualData1), "Exam 'Info' should be updated to 2.0 (Attempt 2, passed).", "Expected (course order irrelevant): " + expectedData1Exam3 + ", Actual: " + (actualData1 == null ? "null" : actualData1.toString()));

            TestRunner.startSubtest("Student 1 - Attempt exam 'Info' again (Grade 1.0) - already passed");
            invokeMethod(adminInstance, "takeExam", new Class<?>[]{int.class, String.class, float.class}, new Object[]{1, "Info", 1.0f});
            actualData1 = (List<String>) invokeMethod(adminInstance, "getStudent", new Class<?>[]{int.class}, new Object[]{1});
            TestRunner.check(compareStudentData(expectedData1Exam3, actualData1), "No change expected for already passed exam 'Info'.", "Expected (no change): " + expectedData1Exam3 + ", Actual: " + (actualData1 == null ? "null" : actualData1.toString()));
            
            TestRunner.startSubtest("Add exam for non-existing student (ID 99)");
            invokeMethod(adminInstance, "takeExam", new Class<?>[]{int.class, String.class, float.class}, new Object[]{99, "Physics", 1.0f});
            actualDataEmpty = (List<String>) invokeMethod(adminInstance, "getStudent", new Class<?>[]{int.class}, new Object[]{99});
            if (actualDataEmpty == null) {
                TestRunner.logWarning("getStudent(99) after takeExam(99,...) returned null, expected empty list.");
                actualDataEmpty = new ArrayList<>();
            }
            TestRunner.check(compareStudentData(Collections.emptyList(), actualDataEmpty), "No data should exist for non-existent student after exam attempt.", "Expected: Empty List, Actual: " + actualDataEmpty.toString());

            TestRunner.startSubtest("Student 2 disenrolled after 3 failed attempts in 'Databases'");
            invokeMethod(adminInstance, "takeExam", new Class<?>[]{int.class, String.class, float.class}, new Object[]{2, "Databases", 5.0f});
            invokeMethod(adminInstance, "takeExam", new Class<?>[]{int.class, String.class, float.class}, new Object[]{2, "Databases", 5.0f});
            invokeMethod(adminInstance, "takeExam", new Class<?>[]{int.class, String.class, float.class}, new Object[]{2, "Databases", 5.0f});
            List<String> actualData2After3Fails = (List<String>) invokeMethod(adminInstance, "getStudent", new Class<?>[]{int.class}, new Object[]{2});
            if (actualData2After3Fails == null) {
                TestRunner.logWarning("getStudent(2) after 3 failed attempts returned null, expected empty list (disenrolled).");
                actualData2After3Fails = new ArrayList<>();
            }
            TestRunner.check(compareStudentData(Collections.emptyList(), actualData2After3Fails), "Student 2 should be disenrolled after 3rd failed attempt.", "Expected: Empty List (disenrolled), Actual: " + actualData2After3Fails.toString());

            TestRunner.startSuite("Disenroll Student");
            int idForDisenrollTest = 1;
            List<String> currentStudent1Data = (List<String>) invokeMethod(adminInstance, "getStudent", new Class<?>[]{int.class}, new Object[]{idForDisenrollTest});
            if (currentStudent1Data == null) currentStudent1Data = new ArrayList<>();

            if (currentStudent1Data.isEmpty() || !currentStudent1Data.get(0).equals("Max")) {
                TestRunner.logInfo("Student 1 (Max) not found or incorrect, attempting to re-enroll for disenroll test.");
                idForDisenrollTest = (int) invokeMethod(adminInstance, "enrollStudent", new Class<?>[]{String.class, String.class}, new Object[]{"Max", "Mustermann"});
                TestRunner.logInfo("Student 'Max Mustermann' re-enrolled for disenroll tests with ID " + idForDisenrollTest + ".");
            } else {
                TestRunner.logInfo("Using existing student 'Max Mustermann' with ID " + idForDisenrollTest + " for disenroll tests.");
            }
            
            if(idForDisenrollTest == -1) { 
                 TestRunner.logError("Could not (re-)enroll Max Mustermann for disenroll test. Subsequent tests might fail or be misleading.");
            }

            TestRunner.startSubtest("Disenroll student " + idForDisenrollTest);
            boolean disenrollResult1 = false;
            if (idForDisenrollTest != -1) {
                disenrollResult1 = (boolean) invokeMethod(adminInstance, "disenrollStudent", new Class<?>[]{int.class}, new Object[]{idForDisenrollTest});
            }
            TestRunner.check(disenrollResult1 || idForDisenrollTest == -1, "Student " + idForDisenrollTest + " should be disenrolled (returns true if existed).", "Expected: true for ID " + idForDisenrollTest + " (or -1 if never enrolled), Actual: " + disenrollResult1);
            
            TestRunner.logInfo("Verifying student " + idForDisenrollTest + " was removed...");
            List<String> actualDataAfterDisenroll = Collections.emptyList();
            if (idForDisenrollTest != -1) {
                 actualDataAfterDisenroll = (List<String>) invokeMethod(adminInstance, "getStudent", new Class<?>[]{int.class}, new Object[]{idForDisenrollTest});
                 if (actualDataAfterDisenroll == null) actualDataAfterDisenroll = new ArrayList<>();
            }
            TestRunner.check(compareStudentData(Collections.emptyList(), actualDataAfterDisenroll), "Student " + idForDisenrollTest + " should no longer be in administration.", "Expected: Empty List, Actual: " + actualDataAfterDisenroll.toString());

            TestRunner.startSubtest("Try to disenroll already disenrolled student " + idForDisenrollTest + " again");
            boolean disenrollResult2 = false;
            if (idForDisenrollTest != -1) {
                disenrollResult2 = (boolean) invokeMethod(adminInstance, "disenrollStudent", new Class<?>[]{int.class}, new Object[]{idForDisenrollTest});
            }
            TestRunner.check(!disenrollResult2, "Re-disenrolling student " + idForDisenrollTest + " should not be successful (returns false).", "Expected: false, Actual: " + disenrollResult2);

            TestRunner.startSubtest("Try to disenroll student 99 (non-existent)");
            boolean disenrollResult3 = (boolean) invokeMethod(adminInstance, "disenrollStudent", new Class<?>[]{int.class}, new Object[]{99});
            TestRunner.check(!disenrollResult3, "Disenrolling student 99 should not be successful (returns false).", "Expected: false, Actual: " + disenrollResult3);
            
            // --- Test Case 5: Student ID Management ---
            TestRunner.startSuite("Student ID Management");
            TestRunner.startSubtest("Enroll a new student after disenrolling ID " + idForDisenrollTest);
            int student3Id = (int) invokeMethod(adminInstance, "enrollStudent", new Class<?>[]{String.class, String.class}, new Object[]{"New", "Student"});
            boolean idReuseCheck = (idForDisenrollTest != -1 && student3Id == idForDisenrollTest) || (idForDisenrollTest == -1 && student3Id > 0 && student3Id != 2);
            TestRunner.check(idReuseCheck, "Freed ID " + (idForDisenrollTest != -1 ? idForDisenrollTest : "(unknown)") + " should be reused or next free ID assigned.", "Expected ID " + (idForDisenrollTest != -1 ? idForDisenrollTest : "(next free)") + ", Actual: " + student3Id);

            if (student3Id > 0) {
                TestRunner.logInfo("Checking data of new student with ID " + student3Id);
                List<String> expectedData3 = Arrays.asList("New", "Student", String.valueOf(student3Id));
                List<String> actualData3 = (List<String>) invokeMethod(adminInstance, "getStudent", new Class<?>[]{int.class}, new Object[]{student3Id});
                TestRunner.check(compareStudentData(expectedData3, actualData3), "Data for new student with ID " + student3Id + " should be correct.", "Expected: " + expectedData3 + ", Actual: " + (actualData3 == null ? "null" : actualData3.toString()));
            } else {
                TestRunner.logWarning("Could not enroll new student to test ID reuse.");
            }

            TestRunner.startSubtest("Enroll students until administration is (almost) full");
            int currentEnrolledCount = 0;
            for(int i=1; i<=999; ++i) {
                List<String> studentData = (List<String>) invokeMethod(adminInstance, "getStudent", new Class<?>[]{int.class}, new Object[]{i});
                if(studentData != null && !studentData.isEmpty()) currentEnrolledCount++;
            }
            TestRunner.logInfo("Currently " + currentEnrolledCount + " students enrolled before filling test.");
            
            boolean fillError = false;
            int studentsToEnrollToReachAlmostMax = 998 - currentEnrolledCount; // Enroll up to 998 to leave one slot for the next test
            if (studentsToEnrollToReachAlmostMax < 0) studentsToEnrollToReachAlmostMax = 0; // Already full or overfull

            for (int i = 0; i < studentsToEnrollToReachAlmostMax; i++) {
                int enrolledId = (int) invokeMethod(adminInstance, "enrollStudent", new Class<?>[]{String.class, String.class}, new Object[]{"StudentFill", "Nr" + (currentEnrolledCount + i + 1)});
                if (enrolledId == -1) {
                    TestRunner.logError("Error: Could not enroll student (attempt " + (i+1) + " of " + studentsToEnrollToReachAlmostMax + "), but space should be available.");
                    fillError = true;
                    break;
                }
            }
            
            // Recount after attempting to fill
            int countAfterFill = 0;
            for(int i=1; i<=999; ++i) {
                List<String> studentData = (List<String>) invokeMethod(adminInstance, "getStudent", new Class<?>[]{int.class}, new Object[]{i});
                if(studentData != null && !studentData.isEmpty()) countAfterFill++;
            }
            TestRunner.logInfo("Students enrolled after filling attempt: " + countAfterFill);


            TestRunner.startSubtest("Enroll student to fill the 999th slot");
            int student999Id = -1;
            if (countAfterFill < 999) {
                 student999Id = (int) invokeMethod(adminInstance, "enrollStudent", new Class<?>[]{String.class, String.class}, new Object[]{"Last", "Student"});
                 TestRunner.check(student999Id != -1, "Enrolling 999th student should be successful.", "Expected a valid ID, Actual: " + student999Id);
                 if (student999Id != -1) countAfterFill++; // Manually increment if successful
            } else {
                TestRunner.logInfo("Administration already has 999 or more students, skipping enrollment of 999th student.");
            }
             TestRunner.check(countAfterFill == 999 && !fillError, "Administration should now contain 999 students. Count: " + countAfterFill, "Expected: 999 students without fill error. Count: " + countAfterFill + (fillError ? " (Error during filling!)" : ""));


            TestRunner.startSubtest("Attempt to enroll another student when administration is full (at 999)");
            int student1000Id = (int) invokeMethod(adminInstance, "enrollStudent", new Class<?>[]{String.class, String.class}, new Object[]{"Too", "Much"});
            TestRunner.check(student1000Id == -1, "Enrollment should fail (returns -1) when administration is full at 999.", "Expected: -1, Actual: " + student1000Id);

            TestRunner.startSubtest("Disenroll a student (e.g., ID 500) and enroll a new one (when full)");
            boolean disenrollMidSuccess = false;
            List<String> student500DataBeforeDisenroll = (List<String>) invokeMethod(adminInstance, "getStudent", new Class<?>[]{int.class}, new Object[]{500});
            if (student500DataBeforeDisenroll != null && !student500DataBeforeDisenroll.isEmpty()) {
                 disenrollMidSuccess = (boolean) invokeMethod(adminInstance, "disenrollStudent", new Class<?>[]{int.class}, new Object[]{500});
                 TestRunner.logInfo("Attempted to disenroll student 500. Success: " + disenrollMidSuccess);
            } else {
                TestRunner.logWarning("Student 500 did not exist before disenroll attempt for this test part. Creating a placeholder.");
                // Enroll a placeholder to ensure a slot can be freed if the admin wasn't full.
                // This part is tricky if the admin wasn't actually full due to previous test logic.
                // For simplicity, we assume student 500 should exist if the admin was full.
            }

            int studentNew500Id = (int) invokeMethod(adminInstance, "enrollStudent", new Class<?>[]{String.class, String.class}, new Object[]{"Post", "Filler"});
            boolean conditionForNew500;
            if (disenrollMidSuccess) { // If student 500 was successfully disenrolled
                conditionForNew500 = (studentNew500Id == 500); // ID 500 should be reused
                TestRunner.check(conditionForNew500, "ID 500 should be reused after disenrollment. Actual new ID: " + studentNew500Id,
                                 "Expected ID 500 to be reused. Actual new ID: " + studentNew500Id);
            } else { // If student 500 could not be disenrolled (e.g., didn't exist or admin wasn't full as expected)
                // If admin was truly full (999 students) and disenroll failed, new enrollment should also fail (-1)
                // If admin was not full, a new ID (>0) should be assigned.
                int currentCountAfterFailedDisenroll = 0;
                for(int i=1; i<=999; ++i) {
                     List<String> sData = (List<String>) invokeMethod(adminInstance, "getStudent", new Class<?>[]{int.class}, new Object[]{i});
                     if(sData != null && !sData.isEmpty()) currentCountAfterFailedDisenroll++;
                }
                conditionForNew500 = (currentCountAfterFailedDisenroll == 999 && studentNew500Id == -1) || (currentCountAfterFailedDisenroll < 999 && studentNew500Id > 0);
                TestRunner.check(conditionForNew500, "ID assignment after failed/unnecessary disenrollment of ID 500. New ID: " + studentNew500Id,
                                 "Logic for ID assignment after failed/unnecessary disenrollment of ID 500 is incorrect. New ID: " + studentNew500Id +
                                 ". Current count: " + currentCountAfterFailedDisenroll + ". Disenroll success: " + disenrollMidSuccess);
            }

            TestRunner.logInfo("Verifying if administration is full again or has correct count...");
            int studentTooManyAgain = (int) invokeMethod(adminInstance, "enrollStudent", new Class<?>[]{String.class, String.class}, new Object[]{"Still", "Full"});
            int countAfterRefillTest = 0;
            for(int i=1; i<=999; ++i) {
                List<String> sData = (List<String>) invokeMethod(adminInstance, "getStudent", new Class<?>[]{int.class}, new Object[]{i});
                if(sData != null && !sData.isEmpty()) countAfterRefillTest++;
            }
            TestRunner.check(studentTooManyAgain == -1 && countAfterRefillTest == 999,
                             "Enrollment should fail (returns -1), administration should be full (999 students).",
                             "Expected: -1 on enrollment and 999 students. Actual enrollment: " + studentTooManyAgain + ", Counted students: " + countAfterRefillTest);


        } catch (NoSuchMethodException nsme) {
            TestRunner.logError("Test Aborted: A method was not found in the user implementation: " + TestRunner.escapeJsonString(nsme.getMessage()));
            nsme.printStackTrace(System.err);
        } catch (IllegalAccessException iae) {
            TestRunner.logError("Test Aborted: Access to a method in the user implementation was denied: " + TestRunner.escapeJsonString(iae.getMessage()));
            iae.printStackTrace(System.err);
        } catch (InvocationTargetException ite) {
            TestRunner.logError("Test Aborted: Error during execution of a user implementation method: " + TestRunner.escapeJsonString(ite.getTargetException().toString()));
            ite.getTargetException().printStackTrace(System.err);
        } catch (Exception e) {
            TestRunner.logError("Critical error during test execution: " + TestRunner.escapeJsonString(e.toString()));
            e.printStackTrace(System.err);
        } finally {
            TestRunner.finishRun(startTime);
        }
    }
}