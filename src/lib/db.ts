import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    getDoc,
    query,
    where,
    orderBy,
    limit,
    // writeBatch, // Removed unused import
    serverTimestamp,
    Timestamp,
    DocumentData,
    QueryDocumentSnapshot,
    FirestoreDataConverter,
    WithFieldValue,
    CollectionReference,
    Query,
    QueryConstraint
} from 'firebase/firestore';
import { getFirebase } from './firebase';
import {
    GradeLevel,
    AcademicYear,
    Trimester,
    Subject,
    Student,
    AssessmentComponent,
    StudentScore,
    // ActivityLog // Removed unused import
} from '../types';

// --- Type Definitions (Consider placing in a central types file if not already) ---
// Define a base type for documents that include teacherId for easier filtering/logging
interface TeacherOwnedDocument {
    teacherId: string;
    name?: string; // Add name property
    gradeLevelId?: string;
    academicYearId?: string;
    trimesterId?: string;
    studentId?: string;
    subjectId?: string;
    examScore?: number;
    classAssessmentScores?: Record<string, number>;
    weight?: number;
}

// Explicitly define ActivityLog if not properly defined in types.ts
export interface ActivityLogData {
    date: Timestamp; // Use Firestore Timestamp
    action: string;
    entityType: string;
    entityId: string;
    details?: string; // Made details optional
    teacherId: string;
    organizationId?: string; // Added for multi-tenant support
}

// Full ActivityLog type with ID
export interface ActivityLogWithId extends ActivityLogData {
    id: string;
}

// --- FirestoreDataConverter Helper ---
/**
 * Generic Firestore data converter.
 * Adds the document ID to the data object when reading.
 * Ensures data matches the expected structure when writing (basic pass-through here).
 * @template T The expected type of the document data (extending DocumentData).
 */
const converter = <T extends DocumentData>(): FirestoreDataConverter<T> => ({
    toFirestore: (data: WithFieldValue<T>): DocumentData => {
        // Remove 'id' field before sending to Firestore if it exists
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id: _, ...rest } = data as { id?: string } & Record<string, unknown>;
        return rest;
        // NOTE: You might add more validation/transformation here if needed
    },
    fromFirestore: (snap: QueryDocumentSnapshot): T => {
        // Combine snapshot data with the document ID
        return {
            ...snap.data(),
            id: snap.id,
        } as unknown as T; // Cast through unknown to satisfy TypeScript
    }
});

// --- Centralized Firestore Initialization Check ---
/**
 * Gets the Firestore instance and throws an error if it's not initialized.
 */
export const getDbInstance = () => {
    const { db } = getFirebase();
    if (!db) {
        console.error("Firestore database instance is not available. Check Firebase initialization.");
        throw new Error('Firestore is not initialized');
    }
    return db;
};

// --- Collection Reference Helpers ---
/**
 * Creates a typed CollectionReference with the generic converter.
 * @template T The document type.
 * @param {string} collectionName The name of the Firestore collection.
 * @returns {CollectionReference<T>} Typed collection reference.
 */
function getCollectionRef<T extends DocumentData>(collectionName: string): CollectionReference<T> {
    const db = getDbInstance();
    return collection(db, collectionName).withConverter(converter<T>());
}

// Specific Collection References using the helper
const getGradeLevelsRef = () => getCollectionRef<GradeLevel>('gradeLevels');
const getAcademicYearsRef = () => getCollectionRef<AcademicYear>('academicYears');
const getTrimestersRef = () => getCollectionRef<Trimester>('trimesters');
const getSubjectsRef = () => getCollectionRef<Subject>('subjects');
const getStudentsRef = () => getCollectionRef<Student>('students');
const getAssessmentComponentsRef = () => getCollectionRef<AssessmentComponent>('assessmentComponents');
const getStudentScoresRef = () => getCollectionRef<StudentScore>('studentScores');
const getActivityLogsRef = () => getCollectionRef<ActivityLogWithId>('activityLogs');

// --- Generic Query Helper ---
/**
 * Executes a Firestore query and returns the typed results.
 * @template T Document type.
 * @param {Query<T>} q The Firestore Query object.
 * @returns {Promise<T[]>} Array of document data matching the query.
 */
async function executeQuery<T extends DocumentData>(q: Query<T>): Promise<T[]> {
    try {
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => doc.data());
    } catch (error) {
        console.error('Error executing Firestore query:', error);

        // Improved error handling for index errors
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('requires an index')) {
            console.error(
                'This query requires a Firestore index to be created. Please check the firestore.indexes.json file ' +
                'and deploy the required indexes using the Firebase CLI command: firebase deploy --only firestore:indexes'
            );

            // Extract the index creation URL if available
            const indexUrlMatch = errorMessage.match(/https:\/\/console\.firebase\.google\.com\/[^\s]+/);
            if (indexUrlMatch) {
                console.error('Index creation URL:', indexUrlMatch[0]);
            }
        }

        throw error; // Re-throw for caller handling
    }
}

// --- Activity Logging ---

// Helper function to get singular entity type from collection name
function getSingularEntityType(collectionName: string): string {
    // Simple pluralization, extend as needed
    const singularMap: Record<string, string> = {
        'students': 'Student',
        'subjects': 'Subject',
        'gradeLevels': 'Grade Level',
        'academicYears': 'Academic Year',
        'trimesters': 'Trimester',
        'assessmentComponents': 'Assessment Component',
        'studentScores': 'Student Score',
        'activityLogs': 'Activity Log' // Added for completeness
    };
    return singularMap[collectionName] || collectionName.replace(/s$/, '');
}

// Helper function to get a sensible name/detail for the entity being logged
// Now focuses only on generating the detail string from known data
function getEntityDetails(collectionName: string, data: Record<string, unknown>): string {
    // Prefer 'name' if available, otherwise provide generic description
    if (typeof data.name === 'string' && data.name.trim() !== '') {
        return data.name;
    }
    switch (collectionName) {
        case 'studentScores':
            // Assuming studentId and possibly assessment name/subject name are available
            return `Score for student ${data.studentId || 'Unknown'}`; // Example, adapt based on actual data fields
        // Add other specific cases if 'name' is not the primary identifier
        default:
            // Generic fallback using the singular type
            return `a ${getSingularEntityType(collectionName).toLowerCase()}`;
    }
}

/**
 * Logs an activity directly to the 'activityLogs' collection.
 * Uses serverTimestamp for reliable date/time.
 */
async function logActivity(
    teacherId: string,
    action: 'Added' | 'Updated' | 'Deleted' | string, // More specific actions
    entityType: string,
    entityId: string,
    details?: string // Details are optional
): Promise<string | null> { // Return ID or null on failure
    // Basic validation
    if (!teacherId || !action || !entityType || !entityId) {
        console.warn('Attempted to log activity with missing required fields.');
        return null;
    }

    // Use the specific typed reference for activity logs
    const logsRef = getActivityLogsRef(); // Already includes the converter

    // Prepare data using serverTimestamp
    const activityData: WithFieldValue<ActivityLogData> = {
        date: serverTimestamp(), // Use Firestore server timestamp
        action,
        entityType,
        entityId,
        details: details || '', // Ensure details is at least an empty string
        teacherId
    };

    try {
        // Use addDoc directly on the typed collection reference
        const docRef = await addDoc(logsRef, activityData);
        return docRef.id;
    } catch (error) {
        console.error(`Error logging activity: ${action} ${entityType} (${entityId})`, error);
        return null;
    }
}

// --- Generic CRUD Operations with Activity Logging ---

/**
 * Creates a new document in a specified collection and logs the activity.
 * @template T Document type. Requires 'teacherId' for logging.
 * @param collectionName Firestore collection name.
 * @param data Data to save (must include teacherId). Omit 'id'.
 * @returns {Promise<string>} The ID of the newly created document.
 */
export async function createDocument<T extends TeacherOwnedDocument>(
    collectionName: string,
    data: WithFieldValue<Omit<T, 'id'>> // Use WithFieldValue for serverTimestamp etc.
): Promise<string> {
    try {
        // Use the typed collection reference for writing consistency (though converter isn't used by addDoc)
        const collectionRef = getCollectionRef<T>(collectionName);
        const docRef = await addDoc(collectionRef, data);

        // Log activity (teacherId is guaranteed by TeacherOwnedDocument)
        await logActivity(
            String(data.teacherId),
            'Added',
            getSingularEntityType(collectionName),
            docRef.id,
            getEntityDetails(collectionName, data as Record<string, unknown>)
        );

        return docRef.id;
    } catch (error) {
        console.error(`Error creating document in ${collectionName}:`, error);
        throw error;
    }
}

/**
 * Updates an existing document and logs the activity.
 * @template T Document type.
 * @param collectionName Firestore collection name.
 * @param id Document ID to update.
 * @param data Partial data to update. Must include teacherId if logging is desired.
 * @param teacherId Explicit teacherId for logging (preferred over relying on data).
 */
export async function updateDocument<T extends DocumentData>(
    collectionName: string,
    id: string,
    data: Partial<WithFieldValue<T>>, // Allow serverTimestamp etc.
    teacherId?: string // Optional: Explicitly pass teacherId for logging
): Promise<void> {
    try {
        const db = getDbInstance();
        const docRef = doc(db, collectionName, id); // No converter needed for updateDoc
        await updateDoc(docRef, data as DocumentData); // Cast needed as updateDoc accepts DocumentData

        const loggingTeacherId = teacherId ?? (data as Record<string, unknown>)?.teacherId;

        // Log activity if teacherId is available
        if (loggingTeacherId) {
            // Fetching name for logging can be inefficient. Consider if essential.
            // Alternative: Pass details from the caller if known.
            const entity = await getDocument<T>(collectionName, id); // Fetch updated doc for details
            await logActivity(
                String(loggingTeacherId),
                'Updated',
                getSingularEntityType(collectionName),
                id,
                entity ? getEntityDetails(collectionName, entity as Record<string, unknown>) : `ID: ${id.substring(0, 6)}...`
            );
        }
    } catch (error) {
        console.error(`Error updating document ${id} in ${collectionName}:`, error);
        throw error;
    }
}


/**
 * Deletes a document and logs the activity.
 * @param collectionName Firestore collection name.
 * @param id Document ID to delete.
 * @param teacherId Teacher ID required for logging.
 * @param entityDetails Optional: Pre-fetched details/name to avoid fetching before delete.
 */
export async function deleteDocument(
    collectionName: string,
    id: string,
    teacherId: string, // Made required for logging consistency
    entityDetails?: string // Optional: Pass details if known to avoid pre-fetch
): Promise<void> {
    try {
        const db = getDbInstance();
        const docRef = doc(db, collectionName, id);

        let detailsForLog = entityDetails;

        // Fetch details for logging only if not provided
        if (!detailsForLog) {
            try {
                const entity = await getDocument<DocumentData>(collectionName, id);
                if (entity) {
                    detailsForLog = getEntityDetails(collectionName, entity);
                } else {
                    detailsForLog = `ID: ${id.substring(0, 6)}...`;
                }
            } catch (error) {
                console.warn(`Could not fetch details for deleted ${collectionName} (${id}) for logging:`, error);
                detailsForLog = `ID: ${id.substring(0, 6)}...`;
            }
        }

        await deleteDoc(docRef);

        // Log activity using the (potentially fetched) details
        await logActivity(
            String(teacherId),
            'Deleted',
            getSingularEntityType(collectionName),
            id,
            detailsForLog
        );
    } catch (error) {
        console.error(`Error deleting document ${id} from ${collectionName}:`, error);
        throw error;
    }
}

// --- Generic Read Operations ---

/**
 * Retrieves a single document by its ID.
 * @template T Document type.
 * @param collectionName Firestore collection name.
 * @param id Document ID.
 * @returns {Promise<T | null>} Document data or null if not found.
 */
export async function getDocument<T extends DocumentData>(
    collectionName: string,
    id: string
): Promise<T | null> {
    try {
        const docRef = doc(getCollectionRef<T>(collectionName), id); // Use typed ref
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? docSnap.data() : null;
    } catch (error) {
        console.error(`Error fetching document ${id} from ${collectionName}:`, error);
        throw error;
    }
}

/**
 * Retrieves documents based on a specific field value.
 * @template T Document type.
 * @param collectionName Firestore collection name.
 * @param field Field name to query.
 * @param value Value to match.
 * @returns {Promise<T[]>} Array of matching documents.
 */
export async function getDocumentsByField<T extends DocumentData>(
    collectionName: string,
    field: string,
    value: string | number | boolean
): Promise<T[]> {
    const q = query(getCollectionRef<T>(collectionName), where(field, '==', value));
    return executeQuery(q);
}

// --- Specific Query Functions (using executeQuery) ---

// Example using QueryConstraint type for better readability
export async function getGradeLevelsByTeacher(teacherId: string): Promise<GradeLevel[]> {
    const constraints: QueryConstraint[] = [where('teacherId', '==', teacherId)];
    const q = query(getGradeLevelsRef(), ...constraints);
    return executeQuery(q);
}

export async function getAcademicYearsByTeacher(teacherId: string): Promise<AcademicYear[]> {
    const q = query(getAcademicYearsRef(), where('teacherId', '==', teacherId));
    return executeQuery(q);
}

export async function getTrimestersByAcademicYear(
    academicYearId: string,
    teacherId: string
): Promise<Trimester[]> {
    const q = query(
        getTrimestersRef(),
        where('academicYearId', '==', academicYearId),
        where('teacherId', '==', teacherId)
    );
    return executeQuery(q);
}

export async function getSubjectsByGradeAndTrimester(
    gradeLevelId: string,
    trimesterId: string, // Consider if trimesterId can be optional or handled differently
    teacherId: string
): Promise<Subject[]> {
    // If trimesterId might be empty or optional, adjust the query logic
    const constraints: QueryConstraint[] = [
        where('gradeLevelId', '==', gradeLevelId),
        where('teacherId', '==', teacherId)
    ];
    if (trimesterId) {
        constraints.push(where('trimesterId', '==', trimesterId));
    }
    // Add ordering if needed, e.g., orderBy('name')
    const q = query(getSubjectsRef(), ...constraints);
    return executeQuery(q);
}

/**
 * Gets all subjects for a specific teacher.
 * @param teacherId Teacher ID
 * @returns Array of Subject objects
 */
export async function getSubjectsByTeacher(teacherId: string): Promise<Subject[]> {
    const constraints: QueryConstraint[] = [
        where('teacherId', '==', teacherId)
    ];
    const q = query(getSubjectsRef(), ...constraints);
    return executeQuery(q);
}

export async function getStudentsByGradeLevel(
    gradeLevelId: string,
    teacherId: string
): Promise<Student[]> {
    const q = query(
        getStudentsRef(),
        where('gradeLevelId', '==', gradeLevelId),
        where('teacherId', '==', teacherId),
        orderBy('name', 'asc') // Added default ordering by name
    );
    return executeQuery(q);
}

export async function getAssessmentComponentsBySubject(
    subjectId: string,
    teacherId: string
): Promise<AssessmentComponent[]> {
    const q = query(
        getAssessmentComponentsRef(),
        where('subjectId', '==', subjectId),
        where('teacherId', '==', teacherId),
        orderBy('name', 'asc') // Added default ordering
    );
    return executeQuery(q);
}

// --- Student Score Specific Functions ---

/**
 * Retrieves all student scores for a given subject, likely for ranking/reporting.
 */
export async function getStudentScoresBySubject(
    subjectId: string,
    teacherId: string
): Promise<StudentScore[]> {
    const q = query(
        getStudentScoresRef(),
        where('subjectId', '==', subjectId),
        where('teacherId', '==', teacherId)
        // Ordering might be done later by calculation function
    );
    return executeQuery(q);
}

/**
 * Retrieves all scores for a specific student across different subjects/trimesters.
 */
export async function getStudentScoresByStudentId(
    studentId: string,
    teacherId: string
): Promise<StudentScore[]> {
    // Refactored to use standard helpers
    const q = query(
        getStudentScoresRef(),
        where('studentId', '==', studentId),
        where('teacherId', '==', teacherId)
        // Add ordering if needed, e.g., by subject or date
    );
    return executeQuery(q);
}

/**
 * Retrieves a student by their ID.
 * @param studentId The ID of the student.
 * @returns {Promise<Student | null>} The student data or null if not found.
 */
export async function getStudentById(studentId: string): Promise<Student | null> {
    try {
        const studentDoc = await getDoc(doc(getDbInstance(), 'students', studentId));

        if (studentDoc.exists()) {
            return {
                id: studentDoc.id,
                ...studentDoc.data(),
            } as Student;
        }
        return null;
    } catch (error) {
        console.error('Error fetching student by ID:', error);
        throw error;
    }
}

/**
 * Gets all students for a specific teacher.
 * @param teacherId Teacher ID
 * @returns Array of Student objects
 */
export async function getStudentsByTeacher(teacherId: string): Promise<Student[]> {
    try {
        const studentsQuery = query(
            collection(getDbInstance(), 'students'),
            where('teacherId', '==', teacherId)
        );

        const querySnapshot = await getDocs(studentsQuery);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Student[];
    } catch (error) {
        console.error('Error fetching students by teacher ID:', error);
        return [];
    }
}

// --- Business Logic / Calculations ---

/**
 * Calculates final scores and ranks based on a list of student scores.
 * NOTE: Consider moving this function to a separate utility/service module
 *       (e.g., 'utils/gradingUtils.ts' or 'services/gradingService.ts')
 *       to keep the db layer focused solely on data interaction.
 *
 * @param {StudentScore[]} scores - Array of student scores, expected to have classAssessmentScores and examScore.
 * @returns {StudentScore[]} Scores array with calculated finalScore and rank properties added.
 */
export function calculateFinalScoresAndRanks(scores: StudentScore[]): StudentScore[] {
    if (!scores || scores.length === 0) {
        return [];
    }

    const scoresWithFinals = scores.map(score => {
        let totalClassAssessment = 0;
        let validAssessmentsCount = 0;

        // Safely handle classAssessmentScores
        if (score.classAssessmentScores && typeof score.classAssessmentScores === 'object') {
            // Filter out non-numeric values to avoid NaN issues
            const assessmentValues = Object.values(score.classAssessmentScores)
                .filter(val => typeof val === 'number' && !isNaN(val));

            if (assessmentValues.length > 0) {
                totalClassAssessment = assessmentValues.reduce((sum, val) => sum + val, 0);
                validAssessmentsCount = assessmentValues.length;
            }
        }

        // Safely calculate average and handle exam score
        const averageClassAssessment = validAssessmentsCount > 0 ? totalClassAssessment / validAssessmentsCount : 0;
        const examScoreValue = typeof score.examScore === 'number' && !isNaN(score.examScore) ? score.examScore : 0;

        // Apply weighting (e.g., 50/50). Make weights configurable if necessary.
        const finalScore = (examScoreValue * 0.5) + (averageClassAssessment * 0.5);

        // Rounding might be desired
        const roundedFinalScore = Math.round(finalScore * 10) / 10; // Example: round to 1 decimal place

        return {
            ...score,
            finalScore: roundedFinalScore // Use rounded score
        };
    });

    // Sort by final score (descending). Handle potential null/undefined final scores safely.
    const sortedScores = [...scoresWithFinals].sort((a, b) => {
        const scoreA = typeof a.finalScore === 'number' ? a.finalScore : -Infinity;
        const scoreB = typeof b.finalScore === 'number' ? b.finalScore : -Infinity;
        return scoreB - scoreA;
    });

    // Assign ranks, handling ties correctly
    let currentRank = 0;
    let previousScore: number | null = null;

    return sortedScores.map((score, index) => {
        // For the first student or when scores change
        if (previousScore === null || score.finalScore !== previousScore) {
            currentRank = index + 1; // Rank is the current position
        }

        previousScore = score.finalScore;

        return {
            ...score,
            rank: currentRank // Assign the calculated rank
        };
    });
}


// --- Activity Log Retrieval ---

/**
 * Retrieves the most recent activity logs for a teacher.
 * @param teacherId The teacher's unique ID.
 * @param count The maximum number of log entries to retrieve. Defaults to 10.
 * @returns {Promise<ActivityLogWithId[]>} Array of recent activity logs.
 */
export async function getRecentActivities(
    teacherId: string,
    count: number = 10
): Promise<ActivityLogWithId[]> {
    const q = query(
        getActivityLogsRef(),
        where('teacherId', '==', teacherId),
        orderBy('date', 'desc'), // Ensure 'date' field is indexed in Firestore
        limit(count)
    );
    return executeQuery(q);
}