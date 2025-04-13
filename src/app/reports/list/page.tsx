'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getDocumentsByField } from '@/lib/db';
import { Subject, GradeLevel, AcademicYear, Trimester } from '@/types';

export default function ReportsList() {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [gradeLevels, setGradeLevels] = useState<Record<string, GradeLevel>>({});
    const [academicYears, setAcademicYears] = useState<Record<string, AcademicYear>>({});
    const [trimesters, setTrimesters] = useState<Record<string, Trimester>>({});

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            if (!user) {
                router.push('/login');
                return;
            }

            try {
                // Fetch subjects
                const subjectsData = await getDocumentsByField<Subject>('subjects', 'teacherId', user.uid);
                setSubjects(subjectsData);

                // Fetch grade levels and create a lookup
                const gradeLevelsData = await getDocumentsByField<GradeLevel>('gradeLevels', 'teacherId', user.uid);
                const gradeLevelsLookup: Record<string, GradeLevel> = {};
                gradeLevelsData.forEach(grade => {
                    gradeLevelsLookup[grade.id] = grade;
                });
                setGradeLevels(gradeLevelsLookup);

                // Fetch academic years
                const academicYearsData = await getDocumentsByField<AcademicYear>('academicYears', 'teacherId', user.uid);
                const academicYearsLookup: Record<string, AcademicYear> = {};
                academicYearsData.forEach(year => {
                    academicYearsLookup[year.id] = year;
                });
                setAcademicYears(academicYearsLookup);

                // Fetch trimesters
                const trimestersData = await getDocumentsByField<Trimester>('trimesters', 'teacherId', user.uid);
                const trimestersLookup: Record<string, Trimester> = {};
                trimestersData.forEach(trimester => {
                    trimestersLookup[trimester.id] = trimester;
                });
                setTrimesters(trimestersLookup);

                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
                setError('Failed to load reports data');
                setIsLoading(false);
            }
        };

        fetchData();
    }, [user, router]);

    // Group subjects by grade level
    const subjectsByGradeLevel = subjects.reduce<Record<string, Subject[]>>((acc, subject) => {
        if (!acc[subject.gradeLevelId]) {
            acc[subject.gradeLevelId] = [];
        }
        acc[subject.gradeLevelId].push(subject);
        return acc;
    }, {});

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
                    <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
                    <p className="mt-2 text-lg text-gray-600">
                        View and generate reports for all your classes
                    </p>
                </div>
            </header>

            {Object.keys(subjectsByGradeLevel).length === 0 ? (
                <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
                    <h3 className="text-xl font-medium text-gray-900">No Subjects Found</h3>
                    <p className="mt-2 text-gray-600">
                        You need to create subjects before you can generate reports.
                    </p>
                    <div className="mt-6">
                        <Link
                            href="/subjects/add"
                            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                        >
                            Add Your First Subject
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="space-y-8">
                    {Object.entries(subjectsByGradeLevel).map(([gradeLevelId, subjects]) => {
                        const gradeLevel = gradeLevels[gradeLevelId];

                        if (!gradeLevel) return null;

                        return (
                            <div
                                key={gradeLevelId}
                                className="rounded-lg border border-gray-200 bg-white shadow-sm"
                            >
                                <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        {gradeLevel.name}
                                    </h2>
                                </div>

                                <div className="divide-y divide-gray-100">
                                    {subjects.map(subject => {
                                        const academicYear = academicYears[subject.academicYearId];
                                        const trimester = trimesters[subject.trimesterId];

                                        return (
                                            <div key={subject.id} className="p-6 hover:bg-gray-50">
                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                                    <div>
                                                        <h3 className="text-lg font-medium text-gray-900">
                                                            {subject.name}
                                                        </h3>
                                                        <p className="mt-1 text-sm text-gray-500">
                                                            {academicYear ? academicYear.name : 'Unknown Year'} •
                                                            {trimester ? trimester.name : 'Unknown Trimester'}
                                                        </p>
                                                    </div>

                                                    <div className="mt-4 flex space-x-4 sm:mt-0">
                                                        <Link
                                                            href={`/reports/generate?subjectId=${subject.id}&gradeId=${subject.gradeLevelId}`}
                                                            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                                                        >
                                                            Generate Report
                                                        </Link>
                                                        <Link
                                                            href={`/subjects/${subject.id}`}
                                                            className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200"
                                                        >
                                                            View Scores
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
} 