'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
    createDocument,
    getGradeLevelsByTeacher,
    getAcademicYearsByTeacher,
    getTrimestersByAcademicYear,
    getStudentsByGradeLevel
} from '@/lib/db';
import { GradeLevel, AcademicYear, Trimester, defaultAssessmentComponents } from '@/types';

export default function AddSubject() {
    const [name, setName] = useState('');
    const [gradeLevelId, setGradeLevelId] = useState('');
    const [academicYearId, setAcademicYearId] = useState('');
    const [trimesterId, setTrimesterId] = useState('');
    const [academicYearName, setAcademicYearName] = useState('');
    const [trimesterName, setTrimesterName] = useState('');

    const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [trimesters, setTrimesters] = useState<Trimester[]>([]);

    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);

    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        const loadInitialData = async () => {
            if (!user) return;

            try {
                setIsLoadingData(true);

                // Load grade levels
                const levels = await getGradeLevelsByTeacher(user.uid);
                setGradeLevels(levels);

                // Auto-select the first grade level if available
                if (levels.length > 0) {
                    setGradeLevelId(levels[0].id);
                }

                // Load academic years
                const years = await getAcademicYearsByTeacher(user.uid);
                setAcademicYears(years);

                // If no academic years, we'll need to create one
                if (years.length === 0) {
                    setIsLoadingData(false);
                    return;
                }

                // Auto-select the first academic year if available
                if (years.length > 0) {
                    setAcademicYearId(years[0].id);

                    // Load trimesters for this academic year
                    const trimestersList = await getTrimestersByAcademicYear(years[0].id, user.uid);
                    setTrimesters(trimestersList);

                    // Auto-select the first trimester if available
                    if (trimestersList.length > 0) {
                        setTrimesterId(trimestersList[0].id);
                    }
                }
            } catch (error) {
                console.error('Error loading initial data:', error);
                setError('Failed to load required data');
            } finally {
                setIsLoadingData(false);
            }
        };

        loadInitialData();
    }, [user]);

    // When academic year changes, load its trimesters
    useEffect(() => {
        const loadTrimesters = async () => {
            if (!user || !academicYearId) return;

            try {
                const trimestersList = await getTrimestersByAcademicYear(academicYearId, user.uid);
                setTrimesters(trimestersList);

                // Auto-select the first trimester if available
                if (trimestersList.length > 0) {
                    setTrimesterId(trimestersList[0].id);
                } else {
                    setTrimesterId('');
                }
            } catch (error) {
                console.error('Error loading trimesters:', error);
            }
        };

        loadTrimesters();
    }, [academicYearId, user]);

    const handleCreateAcademicYear = async () => {
        if (!academicYearName.trim()) {
            setError('Academic year name is required');
            return;
        }

        if (!user) {
            setError('You must be logged in');
            return;
        }

        try {
            setIsLoading(true);

            // Create new academic year
            const yearId = await createDocument('academicYears', {
                name: academicYearName.trim(),
                teacherId: user.uid,
            });

            // Create default trimesters for this academic year
            const defaultTrimesters = ['Trimester 1', 'Trimester 2', 'Trimester 3'];
            const trimesterPromises = defaultTrimesters.map(name =>
                createDocument('trimesters', {
                    name,
                    academicYearId: yearId,
                    teacherId: user.uid,
                })
            );

            await Promise.all(trimesterPromises);

            // Reload data
            const years = await getAcademicYearsByTeacher(user.uid);
            setAcademicYears(years);

            // Select the newly created year
            setAcademicYearId(yearId);
            setAcademicYearName('');

            // Load trimesters for this year
            const trimestersList = await getTrimestersByAcademicYear(yearId, user.uid);
            setTrimesters(trimestersList);

            // Select the first trimester
            if (trimestersList.length > 0) {
                setTrimesterId(trimestersList[0].id);
            }
        } catch (error) {
            console.error('Error creating academic year:', error);
            setError('Failed to create academic year');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateTrimester = async () => {
        if (!trimesterName.trim()) {
            setError('Trimester name is required');
            return;
        }

        if (!academicYearId) {
            setError('Please select an academic year first');
            return;
        }

        if (!user) {
            setError('You must be logged in');
            return;
        }

        try {
            setIsLoading(true);

            // Create new trimester
            const newTrimesterId = await createDocument('trimesters', {
                name: trimesterName.trim(),
                academicYearId,
                teacherId: user.uid,
            });

            // Reload trimesters
            const trimestersList = await getTrimestersByAcademicYear(academicYearId, user.uid);
            setTrimesters(trimestersList);

            // Select the newly created trimester
            setTrimesterId(newTrimesterId);
            setTrimesterName('');
        } catch (error) {
            console.error('Error creating trimester:', error);
            setError('Failed to create trimester');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            setError('Subject name is required');
            return;
        }

        if (!gradeLevelId) {
            setError('Please select a grade level');
            return;
        }

        if (!academicYearId) {
            setError('Please select an academic year');
            return;
        }

        if (!trimesterId) {
            setError('Please select a trimester');
            return;
        }

        if (!user) {
            setError('You must be logged in');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            // Create the subject
            const subjectId = await createDocument('subjects', {
                name: name.trim(),
                gradeLevelId,
                academicYearId,
                trimesterId,
                teacherId: user.uid,
            });

            // Create the default assessment components for this subject
            const componentPromises = defaultAssessmentComponents.map(component =>
                createDocument('assessmentComponents', {
                    name: component.name,
                    weight: component.weight,
                    subjectId,
                    teacherId: user.uid,
                })
            );

            await Promise.all(componentPromises);

            // Get students for this grade level to create score entries
            const students = await getStudentsByGradeLevel(gradeLevelId, user.uid);

            // Create empty score entries for each student
            const scorePromises = students.map(student =>
                createDocument('studentScores', {
                    studentId: student.id,
                    subjectId,
                    examScore: 0,
                    classAssessmentScores: {},
                    teacherId: user.uid,
                })
            );

            await Promise.all(scorePromises);

            setIsLoading(false);
            // Use window.location for more reliable navigation
            window.location.href = `/subjects/${subjectId}`;
        } catch (error) {
            console.error('Error creating subject:', error);
            setError('Failed to create subject');
            setIsLoading(false);
        }
    };

    if (isLoadingData) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="text-center">
                    <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-600"></div>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    // If no grade levels exist, show message to create one first
    if (gradeLevels.length === 0) {
        return (
            <div>
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Add Subject</h1>
                    <p className="mt-2 text-lg text-gray-600">
                        Create a new subject for your students
                    </p>
                </header>

                <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
                    <p className="mb-4 text-lg text-gray-700">You need to create a grade level first</p>
                    <button
                        onClick={() => router.push('/grade-levels/add')}
                        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
                    >
                        Create Grade Level
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div>
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Add Subject</h1>
                <p className="mt-2 text-lg text-gray-600">
                    Create a new subject for your students
                </p>
            </header>

            {error && (
                <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                            Subject Name
                        </label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., French Literature, Grammar, etc."
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="gradeLevel" className="block text-sm font-medium text-gray-700">
                            Grade Level
                        </label>
                        <select
                            id="gradeLevel"
                            name="gradeLevel"
                            value={gradeLevelId}
                            onChange={(e) => setGradeLevelId(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                            required
                        >
                            {gradeLevels.map((level) => (
                                <option key={level.id} value={level.id}>
                                    {level.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-4 rounded-md bg-gray-50 p-4">
                        <h3 className="text-lg font-medium text-gray-900">Academic Year</h3>

                        {academicYears.length > 0 ? (
                            <div>
                                <select
                                    id="academicYear"
                                    name="academicYear"
                                    value={academicYearId}
                                    onChange={(e) => setAcademicYearId(e.target.value)}
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                                    required
                                    title="Select Academic Year"
                                >
                                    {academicYears.map((year) => (
                                        <option key={year.id} value={year.id}>
                                            {year.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-sm text-gray-600">No academic years found. Create one below:</p>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={academicYearName}
                                        onChange={(e) => setAcademicYearName(e.target.value)}
                                        placeholder="e.g., 2023-2024"
                                        className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleCreateAcademicYear}
                                        disabled={isLoading}
                                        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-75"
                                    >
                                        Create
                                    </button>
                                </div>
                            </div>
                        )}

                        {academicYearId && (
                            <div className="space-y-4 pt-2">
                                <h3 className="text-lg font-medium text-gray-900">Trimester</h3>

                                {trimesters.length > 0 ? (
                                    <div>
                                        <select
                                            id="trimester"
                                            name="trimester"
                                            value={trimesterId}
                                            onChange={(e) => setTrimesterId(e.target.value)}
                                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                                            required
                                            title="Select Trimester"
                                        >
                                            {trimesters.map((term) => (
                                                <option key={term.id} value={term.id}>
                                                    {term.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <p className="text-sm text-gray-600">
                                            No trimesters found for this academic year. Create one below:
                                        </p>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={trimesterName}
                                                onChange={(e) => setTrimesterName(e.target.value)}
                                                placeholder="e.g., Trimester 1"
                                                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleCreateTrimester}
                                                disabled={isLoading}
                                                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-75"
                                            >
                                                Create
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="pt-4">
                        <p className="mb-2 text-sm text-gray-600">
                            The subject will be created with default assessment components:
                        </p>
                        <ul className="list-inside list-disc space-y-1 text-sm text-gray-600">
                            {defaultAssessmentComponents.map((component) => (
                                <li key={component.name}>
                                    {component.name} ({component.weight}%)
                                </li>
                            ))}
                        </ul>
                        <p className="mt-2 text-sm text-gray-600">
                            You can customize these after creating the subject.
                        </p>
                    </div>

                    <div className="flex items-center justify-end space-x-4 pt-4">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !academicYearId || !trimesterId}
                            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-75"
                        >
                            {isLoading ? 'Adding...' : 'Add Subject'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}