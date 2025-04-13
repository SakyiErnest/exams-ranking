'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getDocumentsByField } from '@/lib/db';
import { GradeLevel, Subject } from '@/types';

export default function ReportsList() {
    const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
    const [subjects, setSubjects] = useState<Record<string, Subject[]>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [debugInfo, setDebugInfo] = useState<string>('');

    const { user } = useAuth();

    useEffect(() => {
        const fetchData = async () => {
            if (!user) {
                setError('User not authenticated. Please log in again.');
                setIsLoading(false);
                return;
            }

            setDebugInfo(`User ID: ${user.uid}`);

            try {
                // Get all grade levels for this teacher
                const levels = await getDocumentsByField<GradeLevel>('gradeLevels', 'teacherId', user.uid);
                setGradeLevels(levels);
                setDebugInfo(prev => `${prev}\nFetched ${levels.length} grade levels`);

                // Get subjects for each grade level
                const subjectsByGrade: Record<string, Subject[]> = {};

                for (const level of levels) {
                    if (level.id) {
                        try {
                            const gradeSubjects = await getDocumentsByField<Subject>('subjects', 'gradeLevelId', level.id);
                            // Only include subjects for this teacher
                            const filteredSubjects = gradeSubjects.filter(subject => subject.teacherId === user.uid);
                            subjectsByGrade[level.id] = filteredSubjects;
                            setDebugInfo(prev => `${prev}\nGrade ${level.name}: ${filteredSubjects.length} subjects`);
                        } catch (gradeError) {
                            console.error(`Error fetching subjects for grade ${level.id}:`, gradeError);
                            setDebugInfo(prev => `${prev}\nError fetching subjects for grade ${level.id}: ${gradeError}`);
                            // Continue with other grades even if one fails
                        }
                    }
                }

                setSubjects(subjectsByGrade);
            } catch (error: unknown) {
                console.error('Error fetching data for reports:', error);
                let errorMessage = 'An unknown error occurred';
                if (error instanceof Error) {
                    errorMessage = error.message;
                }
                setError(`Failed to load data for reports: ${errorMessage}`);
                setDebugInfo(prev => `${prev}\nError: ${JSON.stringify(error)}`);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [user]);

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="text-center">
                    <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-600"></div>
                    <p>Loading reports data...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <header className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
                    <p className="mt-2 text-lg text-gray-600">
                        Generate and view student performance reports
                    </p>
                </div>
                <Link
                    href="/reports/generate"
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
                >
                    Generate New Report
                </Link>
            </header>

            {error && (
                <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-700">
                    {error}
                    {debugInfo && (
                        <div className="mt-2 border-t border-red-200 pt-2 text-xs font-mono overflow-auto max-h-40">
                            <p className="font-semibold">Debug information:</p>
                            <pre className="whitespace-pre-wrap">{debugInfo}</pre>
                        </div>
                    )}
                </div>
            )}

            {gradeLevels.length === 0 ? (
                <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
                    <h3 className="text-xl font-medium text-gray-900">No Grade Levels Found</h3>
                    <p className="mt-2 text-gray-600">
                        You need to add grade levels before you can generate reports.
                    </p>
                    <div className="mt-6">
                        <Link
                            href="/grade-levels/add"
                            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                        >
                            Add Your First Grade Level
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="space-y-8">
                    {gradeLevels.map((level) => (
                        <div key={level.id} className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                                <h2 className="text-xl font-semibold text-gray-900">
                                    {level.name}
                                </h2>
                            </div>

                            {level.id && subjects[level.id] && subjects[level.id].length > 0 ? (
                                <div className="p-6">
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        {subjects[level.id].map((subject) => (
                                            <div key={subject.id} className="rounded-md border border-gray-200 p-4">
                                                <h3 className="text-lg font-medium text-gray-900">{subject.name}</h3>
                                                <div className="mt-4 flex space-x-2">
                                                    <Link
                                                        href={`/reports/generate?subjectId=${subject.id}&gradeId=${level.id}`}
                                                        className="inline-flex items-center rounded-md bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                                                    >
                                                        Generate Report
                                                    </Link>
                                                    <Link
                                                        href={`/subjects/${subject.id}`}
                                                        className="inline-flex items-center rounded-md bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                                                    >
                                                        View Scores
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-6 text-center text-gray-500">
                                    <p>No subjects found for this grade level.</p>
                                    <Link
                                        href={`/subjects/add?gradeId=${level.id}`}
                                        className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-800"
                                    >
                                        Add a subject
                                    </Link>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
} 