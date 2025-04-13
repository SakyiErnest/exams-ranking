'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getDocumentsByField, getDocument } from '@/lib/db';
import { Subject, GradeLevel, AcademicYear, Trimester } from '@/types';

export default function SubjectsList() {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [metadata, setMetadata] = useState<Record<string, { gradeName: string, yearName: string, trimesterName: string }>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const { user } = useAuth();

    useEffect(() => {
        const fetchSubjects = async () => {
            if (!user) {
                setIsLoading(false);
                return;
            }

            try {
                // Get all subjects for this teacher
                const subjectsList = await getDocumentsByField<Subject>('subjects', 'teacherId', user.uid);
                setSubjects(subjectsList);

                // Get associated metadata for each subject
                const metadataObj: Record<string, { gradeName: string, yearName: string, trimesterName: string }> = {};

                for (const subject of subjectsList) {
                    if (subject.id) {
                        try {
                            // Get grade level name
                            let gradeName = 'Unknown grade';
                            if (subject.gradeLevelId) {
                                const gradeLevel = await getDocument<GradeLevel>('gradeLevels', subject.gradeLevelId);
                                if (gradeLevel) {
                                    gradeName = gradeLevel.name;
                                }
                            }

                            // Get academic year name
                            let yearName = 'Unknown year';
                            if (subject.academicYearId) {
                                const academicYear = await getDocument<AcademicYear>('academicYears', subject.academicYearId);
                                if (academicYear) {
                                    yearName = academicYear.name;
                                }
                            }

                            // Get trimester name
                            let trimesterName = 'Unknown trimester';
                            if (subject.trimesterId) {
                                const trimester = await getDocument<Trimester>('trimesters', subject.trimesterId);
                                if (trimester) {
                                    trimesterName = trimester.name;
                                }
                            }

                            metadataObj[subject.id] = { gradeName, yearName, trimesterName };
                        } catch (error) {
                            console.error(`Error fetching metadata for subject ${subject.id}:`, error);
                        }
                    }
                }

                setMetadata(metadataObj);
            } catch (error) {
                console.error('Error fetching subjects:', error);
                setError('Failed to load subjects');
            } finally {
                setIsLoading(false);
            }
        };

        fetchSubjects();
    }, [user]);

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="text-center">
                    <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-600"></div>
                    <p>Loading subjects...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <header className="mb-8 bg-gradient-to-r from-green-600 to-teal-700 -mx-4 -mt-6 px-4 py-8 sm:px-6 sm:rounded-lg shadow-lg">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Subjects</h1>
                        <p className="mt-2 text-lg text-green-100">
                            Manage your subjects and view student performance
                        </p>
                    </div>
                    <div className="mt-4 md:mt-0">
                        <Link
                            href="/subjects/add"
                            className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-green-700 shadow-sm hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add Subject
                        </Link>
                    </div>
                </div>
            </header>

            {error && (
                <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            {subjects.length === 0 ? (
                <div className="rounded-xl bg-white p-8 text-center shadow-md">
                    <div className="flex flex-col items-center justify-center py-8">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-200 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <h3 className="mb-2 text-xl font-medium text-gray-900">No Subjects Yet</h3>
                        <p className="mb-6 text-gray-600">Get started by adding your first subject to the system</p>
                        <Link
                            href="/subjects/add"
                            className="inline-flex items-center rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-5 py-3 text-sm font-medium text-white shadow-md hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-300"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add Your First Subject
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {subjects.map((subject) => (
                        <Link
                            key={subject.id}
                            href={`/subjects/${subject.id}`}
                            className="group relative block overflow-hidden rounded-xl bg-white p-6 shadow-md transition-all duration-300 hover:shadow-lg hover:translate-y-[-2px]"
                        >
                            <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-green-100 opacity-20 group-hover:bg-green-200 transition-colors duration-300"></div>
                            <div className="relative">
                                <div className="flex items-center mb-3">
                                    <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                        </svg>
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900 group-hover:text-green-700 transition-colors duration-300">{subject.name}</h2>
                                </div>
                                {subject.id && metadata[subject.id] && (
                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                            <p className="text-sm text-gray-600">
                                                <span className="font-medium">Grade:</span> {metadata[subject.id].gradeName}
                                            </p>
                                        </div>
                                        <div className="flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <p className="text-sm text-gray-600">
                                                <span className="font-medium">Year:</span> {metadata[subject.id].yearName}
                                            </p>
                                        </div>
                                        <div className="flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <p className="text-sm text-gray-600">
                                                <span className="font-medium">Trimester:</span> {metadata[subject.id].trimesterName}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                <div className="flex justify-end">
                                    <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 group-hover:bg-green-100 transition-colors duration-300">
                                        View Details
                                        <svg xmlns="http://www.w3.org/2000/svg" className="ml-1.5 h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}