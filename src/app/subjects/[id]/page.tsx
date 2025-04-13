'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
    getDocument,
    deleteDocument,
    createDocument,
    updateDocument,
    getStudentsByGradeLevel,
    getStudentScoresBySubject,
    getAssessmentComponentsBySubject
} from '@/lib/db';
import { Subject, Student, StudentScore, AssessmentComponent, defaultAssessmentComponents } from '@/types';

export default function SubjectDetail({
    params,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    searchParams: _searchParams
}: {
    params: { id: string };
    searchParams: { [key: string]: string | string[] | undefined };
}) {
    const [subject, setSubject] = useState<Subject | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [scores, setScores] = useState<StudentScore[]>([]);
    const [assessmentComponents, setAssessmentComponents] = useState<AssessmentComponent[]>([]);
    const [gradeLevelName, setGradeLevelName] = useState('');

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [componentToDelete, setComponentToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [newComponentName, setNewComponentName] = useState('');
    const [newComponentWeight, setNewComponentWeight] = useState(25);
    const [isAddingComponent, setIsAddingComponent] = useState(false);

    const [editingScores, setEditingScores] = useState(false);
    const [examScores, setExamScores] = useState<Record<string, number>>({});
    const [assessmentScores, setAssessmentScores] = useState<Record<string, Record<string, number>>>({});
    const [isSaving, setIsSaving] = useState(false);

    const { user } = useAuth();
    const router = useRouter();
    const subjectId = params.id;

    // Create default assessment components
    const createDefaultComponents = useCallback(async (subjectData: Subject) => {
        try {
            const newComponents = [];

            for (const defaultComponent of defaultAssessmentComponents) {
                const component = {
                    name: defaultComponent.name,
                    weight: defaultComponent.weight,
                    subjectId: subjectData.id,
                    teacherId: user?.uid || '',
                };

                const docId = await createDocument('assessmentComponents', component);
                newComponents.push({ ...component, id: docId });
            }

            setAssessmentComponents(newComponents);
        } catch (error) {
            console.error('Error creating default components:', error);
            setError('Failed to create default assessment components');
        }
    }, [user]);

    useEffect(() => {
        const fetchSubjectData = async () => {
            if (!user) {
                router.push('/login');
                return;
            }

            try {
                // Fetch the subject
                const subjectData = await getDocument<Subject>('subjects', subjectId);
                if (!subjectData) {
                    setError('Subject not found');
                    setIsLoading(false);
                    return;
                }

                // Verify ownership
                if (subjectData.teacherId !== user.uid) {
                    setError('You do not have permission to view this subject');
                    setIsLoading(false);
                    return;
                }

                setSubject(subjectData);

                // Fetch grade level name
                const gradeLevelData = await getDocument('gradeLevels', subjectData.gradeLevelId);
                if (gradeLevelData) {
                    setGradeLevelName(gradeLevelData.name);
                }

                // Fetch students in this grade level
                const studentsData = await getStudentsByGradeLevel(subjectData.gradeLevelId, user.uid);
                setStudents(studentsData);

                // Fetch assessment components for this subject
                const componentsData = await getAssessmentComponentsBySubject(subjectId, user.uid);
                setAssessmentComponents(componentsData);

                // If no components, create default ones
                if (componentsData.length === 0 && subjectData) {
                    await createDefaultComponents(subjectData);
                }

                // Fetch scores for this subject
                const scoresData = await getStudentScoresBySubject(subjectId, user.uid);
                setScores(scoresData);

                // Initialize score states for editing
                const initialExamScores: Record<string, number> = {};
                const initialAssessmentScores: Record<string, Record<string, number>> = {};

                studentsData.forEach(student => {
                    const studentScore = scoresData.find(score => score.studentId === student.id);

                    // Initialize exam score
                    initialExamScores[student.id] = studentScore?.examScore || 0;

                    // Initialize assessment scores
                    initialAssessmentScores[student.id] = {};
                    componentsData.forEach(component => {
                        initialAssessmentScores[student.id][component.id] =
                            studentScore?.classAssessmentScores?.[component.id] || 0;
                    });
                });

                setExamScores(initialExamScores);
                setAssessmentScores(initialAssessmentScores);

                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching subject data:', error);
                setError('Failed to load subject details');
                setIsLoading(false);
            }
        };

        fetchSubjectData();
    }, [user, router, subjectId, createDefaultComponents]);

    // Add new assessment component
    const handleAddComponent = async () => {
        if (!user || !subject || !newComponentName || newComponentWeight <= 0) return;

        setIsAddingComponent(true);

        try {
            const newComponent = {
                name: newComponentName,
                weight: newComponentWeight,
                subjectId: subject.id,
                teacherId: user.uid,
            };

            const docId = await createDocument('assessmentComponents', newComponent);

            setAssessmentComponents([...assessmentComponents, { ...newComponent, id: docId }]);
            setNewComponentName('');
            setNewComponentWeight(25);

            // Update assessment scores state for the new component
            const updatedScores = { ...assessmentScores };
            students.forEach(student => {
                if (!updatedScores[student.id]) {
                    updatedScores[student.id] = {};
                }
                updatedScores[student.id][docId] = 0;
            });
            setAssessmentScores(updatedScores);
        } catch (error) {
            console.error('Error adding component:', error);
            setError('Failed to add assessment component');
        } finally {
            setIsAddingComponent(false);
        }
    };

    // Delete assessment component
    const handleDeleteComponent = async (componentId: string) => {
        if (!user) {
            router.push('/login');
            return;
        }

        setIsDeleting(true);

        try {
            // Delete the component document
            await deleteDocument('assessmentComponents', componentId, user.uid);

            // Update local state
            setAssessmentComponents(assessmentComponents.filter(component => component.id !== componentId));

            // Update scores state
            const updatedScores = { ...assessmentScores };
            Object.keys(updatedScores).forEach(studentId => {
                if (updatedScores[studentId][componentId]) {
                    delete updatedScores[studentId][componentId];
                }
            });
            setAssessmentScores(updatedScores);

            // Close modal
            setShowDeleteModal(false);
            setComponentToDelete(null);
        } catch (error) {
            console.error('Error deleting component:', error);
            setError('Failed to delete assessment component');
        } finally {
            setIsDeleting(false);
        }
    };

    // Handle exam score change
    const handleExamScoreChange = (studentId: string, value: number) => {
        setExamScores({
            ...examScores,
            [studentId]: Math.min(100, Math.max(0, value)), // Clamp between 0 and 100
        });
    };

    // Handle assessment score change
    const handleAssessmentScoreChange = (studentId: string, componentId: string, value: number) => {
        setAssessmentScores({
            ...assessmentScores,
            [studentId]: {
                ...assessmentScores[studentId],
                [componentId]: Math.min(100, Math.max(0, value)), // Clamp between 0 and 100
            },
        });
    };

    // Save scores
    const handleSaveScores = async () => {
        if (!user || !subject) return;

        setIsSaving(true);

        try {
            for (const student of students) {
                // Find existing score record for this student-subject pair
                const existingScore = scores.find(score => score.studentId === student.id);

                const scoreData = {
                    studentId: student.id,
                    subjectId: subject.id,
                    examScore: examScores[student.id] || 0,
                    classAssessmentScores: assessmentScores[student.id] || {},
                    teacherId: user.uid,
                };

                if (existingScore) {
                    // Update existing score record
                    await updateDocument('studentScores', existingScore.id, scoreData);
                } else {
                    // Create new score record
                    await createDocument('studentScores', scoreData);
                }
            }

            // Refresh scores data
            const updatedScores = await getStudentScoresBySubject(subjectId, user.uid);
            setScores(updatedScores);

            setEditingScores(false);
        } catch (error) {
            console.error('Error saving scores:', error);
            setError('Failed to save scores');
        } finally {
            setIsSaving(false);
        }
    };

    const confirmDeleteComponent = (componentId: string) => {
        setComponentToDelete(componentId);
        setShowDeleteModal(true);
    };

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="text-center">
                    <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-600"></div>
                    <p>Loading subject details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
                {error}
            </div>
        );
    }

    return (
        <div>
            <header className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{subject?.name}</h1>
                    <p className="mt-2 text-lg text-gray-600">
                        {gradeLevelName}
                    </p>
                </div>
                <div className="flex space-x-4">
                    <Link
                        href={`/subjects/edit/${subjectId}`}
                        className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200"
                    >
                        Edit Subject
                    </Link>
                    <Link
                        href={`/reports/generate?subjectId=${subjectId}&gradeId=${subject?.gradeLevelId}`}
                        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                        Generate Report
                    </Link>
                </div>
            </header>

            {/* Assessment Components Section */}
            <div className="mb-8 rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Assessment Components
                    </h2>
                </div>

                <div className="p-6">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Component Name
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Weight (%)
                                </th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {assessmentComponents.map((component) => (
                                <tr key={component.id} className="hover:bg-gray-50">
                                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                                        {component.name}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                        {component.weight}%
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-center text-sm">
                                        <button
                                            onClick={() => confirmDeleteComponent(component.id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {/* Add new component row */}
                            <tr className="bg-gray-50">
                                <td className="whitespace-nowrap px-6 py-4">
                                    <input
                                        type="text"
                                        value={newComponentName}
                                        onChange={(e) => setNewComponentName(e.target.value)}
                                        placeholder="New component name"
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </td>
                                <td className="whitespace-nowrap px-6 py-4">
                                    <label htmlFor="new-component-weight" className="sr-only">
                                        New Component Weight
                                    </label>
                                    <input
                                        id="new-component-weight"
                                        type="number"
                                        value={newComponentWeight}
                                        onChange={(e) => setNewComponentWeight(Number(e.target.value))}
                                        min="1"
                                        max="100"
                                        className="w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        aria-label="Weight percentage for new assessment component"
                                    />
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-center">
                                    <button
                                        onClick={handleAddComponent}
                                        disabled={isAddingComponent || !newComponentName || newComponentWeight <= 0}
                                        className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:bg-gray-400"
                                    >
                                        {isAddingComponent ? 'Adding...' : 'Add'}
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Student Scores Section */}
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Student Scores
                    </h2>

                    {!editingScores ? (
                        <button
                            onClick={() => setEditingScores(true)}
                            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                        >
                            Edit Scores
                        </button>
                    ) : (
                        <div className="flex space-x-4">
                            <button
                                onClick={() => setEditingScores(false)}
                                className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveScores}
                                disabled={isSaving}
                                className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                            >
                                {isSaving ? 'Saving...' : 'Save Scores'}
                            </button>
                        </div>
                    )}
                </div>

                <div className="overflow-x-auto p-6">
                    {students.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500">No students in this grade level yet.</p>
                            <Link
                                href="/students/add"
                                className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                            >
                                Add Your First Student
                            </Link>
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Student Name
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Exam Score (50%)
                                    </th>
                                    {assessmentComponents.map((component) => (
                                        <th key={component.id} scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                            {component.name} ({component.weight}%)
                                        </th>
                                    ))}
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Overall Score
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {students.map((student) => {
                                    // Find score record for this student
                                    const studentScore = scores.find(score => score.studentId === student.id);

                                    // Calculate overall score
                                    let assessmentTotal = 0;
                                    let weightTotal = 0;

                                    assessmentComponents.forEach(component => {
                                        const componentScore = editingScores
                                            ? assessmentScores[student.id]?.[component.id] || 0
                                            : studentScore?.classAssessmentScores?.[component.id] || 0;

                                        assessmentTotal += componentScore * (component.weight / 100);
                                        weightTotal += component.weight;
                                    });

                                    // Normalize assessment score to be out of 100
                                    const normalizedAssessmentScore = weightTotal > 0
                                        ? (assessmentTotal / weightTotal) * 100
                                        : 0;

                                    // Get exam score
                                    const examScore = editingScores
                                        ? examScores[student.id] || 0
                                        : studentScore?.examScore || 0;

                                    // Calculate overall score (50% exam, 50% assessment)
                                    const overallScore = (examScore * 0.5) + (normalizedAssessmentScore * 0.5);

                                    return (
                                        <tr key={student.id} className="hover:bg-gray-50">
                                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                                                {student.name}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                {editingScores ? (
                                                    <div className="flex flex-col">
                                                        <label htmlFor={`exam-score-${student.id}`} className="sr-only">
                                                            Exam Score for {student.name}
                                                        </label>
                                                        <input
                                                            id={`exam-score-${student.id}`}
                                                            type="number"
                                                            value={examScores[student.id] || 0}
                                                            onChange={(e) => handleExamScoreChange(student.id, Number(e.target.value))}
                                                            min="0"
                                                            max="100"
                                                            className="w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                            aria-label={`Exam score for ${student.name}`}
                                                        />
                                                    </div>
                                                ) : (
                                                    examScore.toFixed(1)
                                                )}
                                            </td>
                                            {assessmentComponents.map((component) => {
                                                const componentScore = editingScores
                                                    ? assessmentScores[student.id]?.[component.id] || 0
                                                    : studentScore?.classAssessmentScores?.[component.id] || 0;

                                                return (
                                                    <td key={component.id} className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                        {editingScores ? (
                                                            <div className="flex flex-col">
                                                                <label htmlFor={`component-${component.id}-student-${student.id}`} className="sr-only">
                                                                    {component.name} score for {student.name}
                                                                </label>
                                                                <input
                                                                    id={`component-${component.id}-student-${student.id}`}
                                                                    type="number"
                                                                    value={componentScore}
                                                                    onChange={(e) => handleAssessmentScoreChange(
                                                                        student.id,
                                                                        component.id,
                                                                        Number(e.target.value)
                                                                    )}
                                                                    min="0"
                                                                    max="100"
                                                                    className="w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                                    aria-label={`${component.name} score for ${student.name}`}
                                                                />
                                                            </div>
                                                        ) : (
                                                            componentScore.toFixed(1)
                                                        )}
                                                    </td>
                                                );
                                            })}
                                            <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900">
                                                {overallScore.toFixed(1)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Delete Component Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>
                        <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>
                        <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                        <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                        <h3 className="text-lg font-medium leading-6 text-gray-900">Delete Assessment Component</h3>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500">
                                                Are you sure you want to delete this assessment component? All associated scores will be lost.
                                                This action cannot be undone.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                                <button
                                    type="button"
                                    onClick={() => componentToDelete && handleDeleteComponent(componentToDelete)}
                                    disabled={isDeleting}
                                    className="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                                >
                                    {isDeleting ? 'Deleting...' : 'Delete'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setComponentToDelete(null);
                                    }}
                                    className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}