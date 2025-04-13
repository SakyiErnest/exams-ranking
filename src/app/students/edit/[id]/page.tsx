'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getDocument, updateDocument, getDocumentsByField } from '@/lib/db';
import { Student, GradeLevel } from '@/types';

export default function EditStudent({
    params,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    searchParams: _searchParams
}: {
    params: { id: string };
    searchParams: { [key: string]: string | string[] | undefined };
}) {
    const [student, setStudent] = useState<Student | null>(null);
    const [name, setName] = useState('');
    const [gradeLevelId, setGradeLevelId] = useState('');
    const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const { user } = useAuth();
    const router = useRouter();
    const studentId = params.id;

    useEffect(() => {
        const fetchData = async () => {
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
                    setError('You do not have permission to edit this student');
                    setIsLoading(false);
                    return;
                }

                setStudent(studentData);
                setName(studentData.name);
                setGradeLevelId(studentData.gradeLevelId);

                // Fetch available grade levels
                const gradeLevelsData = await getDocumentsByField<GradeLevel>('gradeLevels', 'teacherId', user.uid);
                setGradeLevels(gradeLevelsData);

                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching student data:', error);
                setError('Failed to load student data');
                setIsLoading(false);
            }
        };

        fetchData();
    }, [user, router, studentId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError('');
        setSuccessMessage('');

        if (!name.trim()) {
            setError('Student name is required');
            setIsSaving(false);
            return;
        }

        if (!gradeLevelId) {
            setError('Please select a grade level');
            setIsSaving(false);
            return;
        }

        try {
            const updatedStudent = {
                name: name.trim(),
                gradeLevelId,
                teacherId: user?.uid || '',
            };

            await updateDocument<Student>('students', studentId, updatedStudent);
            setSuccessMessage('Student updated successfully');
            setIsSaving(false);

            // Use window.location for more reliable navigation
            window.location.href = `/grade-levels/${gradeLevelId}`;
        } catch (error) {
            console.error('Error updating student:', error);
            setError('Failed to update student');
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="text-center">
                    <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-600"></div>
                    <p>Loading student data...</p>
                </div>
            </div>
        );
    }

    if (error && !student) {
        return (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
                {error}
            </div>
        );
    }

    return (
        <div>
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Edit Student</h1>
                <p className="mt-2 text-lg text-gray-600">
                    Update student information
                </p>
            </header>

            {error && (
                <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            {successMessage && (
                <div className="mb-6 rounded-md bg-green-50 p-4 text-sm text-green-700">
                    {successMessage}
                </div>
            )}

            <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Student Information
                    </h2>
                </div>
                <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                Student Name
                            </label>
                            <div className="mt-1">
                                <input
                                    type="text"
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    placeholder="Enter student name"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="gradeLevel" className="block text-sm font-medium text-gray-700">
                                Grade Level
                            </label>
                            <div className="mt-1">
                                <select
                                    id="gradeLevel"
                                    value={gradeLevelId}
                                    onChange={(e) => setGradeLevelId(e.target.value)}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                >
                                    <option value="">Select a grade level</option>
                                    {gradeLevels.map((gradeLevel) => (
                                        <option key={gradeLevel.id} value={gradeLevel.id}>
                                            {gradeLevel.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4">
                            <Link
                                href={`/students/${studentId}`}
                                className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-400"
                            >
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
} 