'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getDocument, getStudentScoresByStudentId } from '@/lib/db';
import { Student, GradeLevel, Subject, StudentScore } from '@/types';

// Define interfaces for better type safety
interface EnrichedScore extends StudentScore {
    subject?: Subject | null;
}

export default function StudentDetail({
    params,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    searchParams: _searchParams
}: {
    params: { id: string };
    searchParams: { [key: string]: string | string[] | undefined };
}) {
    const [student, setStudent] = useState<Student | null>(null);
    const [gradeLevel, setGradeLevel] = useState<GradeLevel | null>(null);
    const [scores, setScores] = useState<EnrichedScore[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const { user } = useAuth();
    const router = useRouter();
    const studentId = params.id;

    useEffect(() => {
        const fetchStudentData = async () => {
            if (!user) {
                router.push('/login');
                return;
            }

            try {
                // Fetch student data
                const studentData = await getDocument<Student>('students', studentId);
                if (!studentData) {
                    setError('Student not found');
                    setIsLoading(false);
                    return;
                }

                // Verify ownership
                if (studentData.teacherId !== user.uid) {
                    setError('You do not have permission to view this student');
                    setIsLoading(false);
                    return;
                }

                setStudent(studentData);

                // Fetch grade level
                const gradeLevelData = await getDocument<GradeLevel>('gradeLevels', studentData.gradeLevelId);
                setGradeLevel(gradeLevelData);

                // Fetch scores for this student
                try {
                    const scoresData = await getStudentScoresByStudentId(studentId, user.uid);

                    // Enrich scores with subject info
                    const enrichedScores: EnrichedScore[] = [];
                    for (const score of scoresData) {
                        if (!score || typeof score !== 'object' || !('subjectId' in score)) continue;

                        try {
                            // @ts-expect-error - We know score has subjectId property
                            const subject = await getDocument<Subject>('subjects', score.subjectId);
                            enrichedScores.push({
                                ...score,
                                subject
                            } as EnrichedScore);
                        } catch (err) {
                            console.error('Error fetching subject:', err);
                            enrichedScores.push(score as unknown as EnrichedScore);
                        }
                    }

                    setScores(enrichedScores);
                } catch (error) {
                    console.error('Error fetching student scores:', error);
                    setScores([]);
                }

                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching student data:', error);
                setError('Failed to load student data');
                setIsLoading(false);
            }
        };

        fetchStudentData();
    }, [user, router, studentId]);

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="text-center">
                    <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-600"></div>
                    <p>Loading student details...</p>
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
                    <h1 className="text-3xl font-bold text-gray-900">{student?.name}</h1>
                    <p className="mt-2 text-lg text-gray-600">
                        Student Details • {gradeLevel?.name || 'Unknown Grade Level'}
                    </p>
                </div>
                <div className="flex space-x-4">
                    <Link
                        href={`/students/edit/${studentId}`}
                        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                        Edit Student
                    </Link>
                    <Link
                        href={`/grade-levels/${student?.gradeLevelId}`}
                        className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200"
                    >
                        Back to Grade Level
                    </Link>
                </div>
            </header>

            <div className="mb-8 rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Student Information
                    </h2>
                </div>
                <div className="p-6">
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Name</dt>
                            <dd className="mt-1 text-sm text-gray-900">{student?.name}</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Grade Level</dt>
                            <dd className="mt-1 text-sm text-gray-900">{gradeLevel?.name}</dd>
                        </div>
                    </dl>
                </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Academic Performance
                    </h2>
                </div>
                <div className="p-6">
                    {scores.length === 0 ? (
                        <div className="rounded-md bg-gray-50 p-6 text-center">
                            <p className="text-gray-500">No scores recorded for this student yet.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Subject
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Exam Score
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Assessment Score
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Final Score
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Rank
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {scores.map((score) => {
                                        // Just to be safe, skip scores that don't have basic properties
                                        if (!score || !score.id) return null;

                                        // Calculate assessment score average (if available)
                                        let assessmentScore = 0;
                                        if (score.classAssessmentScores) {
                                            const componentScores = Object.values(score.classAssessmentScores);
                                            if (componentScores.length > 0) {
                                                assessmentScore = componentScores.reduce((sum: number, s: number) => sum + (Number(s) || 0), 0) / componentScores.length;
                                            }
                                        }

                                        // Calculate final score (50% exam, 50% assessment)
                                        const examScore = Number(score.examScore) || 0;
                                        const finalScore = (examScore * 0.5) + (assessmentScore * 0.5);

                                        return (
                                            <tr key={score.id} className="hover:bg-gray-50">
                                                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                                                    {score.subject?.name || 'Unknown Subject'}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-center text-sm text-gray-500">
                                                    {examScore.toFixed(1)}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-center text-sm text-gray-500">
                                                    {assessmentScore.toFixed(1)}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-center text-sm font-medium text-gray-900">
                                                    {finalScore.toFixed(1)}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-center text-sm">
                                                    {score.rank ? (
                                                        <span className="inline-flex rounded-full bg-blue-100 px-2 text-xs font-semibold leading-5 text-blue-800">
                                                            {score.rank === 1 ? '1st' :
                                                                score.rank === 2 ? '2nd' :
                                                                    score.rank === 3 ? '3rd' :
                                                                        `${score.rank}th`}
                                                        </span>
                                                    ) : (
                                                        'Not ranked'
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 