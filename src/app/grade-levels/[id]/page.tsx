'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getDocument, getStudentsByGradeLevel, deleteDocument } from '@/lib/db';
import { GradeLevel, Student } from '@/types';

export default function GradeLevelDetail({
    params,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    searchParams: _searchParams
}: {
    params: { id: string };
    searchParams: { [key: string]: string | string[] | undefined };
}) {
    const [gradeLevel, setGradeLevel] = useState<GradeLevel | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [studentToDelete, setStudentToDelete] = useState<string | null>(null);

    const { user } = useAuth();
    const router = useRouter();
    const gradeId = params.id;

    useEffect(() => {
        const fetchGradeLevel = async () => {
            if (!user) {
                router.push('/login');
                return;
            }

            try {
                const gradeLevelData = await getDocument<GradeLevel>('gradeLevels', gradeId);
                if (!gradeLevelData) {
                    setError('Grade level not found');
                    setIsLoading(false);
                    return;
                }

                // Verify ownership
                if (gradeLevelData.teacherId !== user.uid) {
                    setError('You do not have permission to view this grade level');
                    setIsLoading(false);
                    return;
                }

                setGradeLevel(gradeLevelData);

                // Fetch students in this grade level
                const studentsData = await getStudentsByGradeLevel(gradeId, user.uid);
                setStudents(studentsData);

                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching grade level:', error);
                setError('Failed to load grade level details');
                setIsLoading(false);
            }
        };

        fetchGradeLevel();
    }, [user, router, gradeId]);

    const handleDeleteStudent = async (studentId: string) => {
        if (!user) {
            router.push('/login');
            return;
        }

        setIsDeleting(true);

        try {
            // Delete the student document
            await deleteDocument('students', studentId, user.uid);

            // Update local state to remove the deleted student
            setStudents(students.filter(student => student.id !== studentId));

            // Close the modal
            setShowDeleteModal(false);
            setStudentToDelete(null);
        } catch (error) {
            console.error('Error deleting student:', error);
            setError('Failed to delete student');
        } finally {
            setIsDeleting(false);
        }
    };

    const confirmDeleteStudent = (studentId: string) => {
        setStudentToDelete(studentId);
        setShowDeleteModal(true);
    };

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="text-center">
                    <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-600"></div>
                    <p>Loading grade level details...</p>
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
                    <h1 className="text-3xl font-bold text-gray-900">{gradeLevel?.name}</h1>
                    <p className="mt-2 text-lg text-gray-600">
                        Grade Level Details
                    </p>
                </div>
                <div className="flex space-x-4">
                    <Link
                        href={`/grade-levels/edit/${gradeId}`}
                        className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200"
                    >
                        Edit Grade Level
                    </Link>
                    <Link
                        href="/students/add"
                        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                        Add Student
                    </Link>
                </div>
            </header>

            <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Students ({students.length})
                    </h2>
                </div>

                <div className="p-6">
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
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Student Name
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {students.map((student) => (
                                        <tr key={student.id} className="hover:bg-gray-50">
                                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                                                {student.name}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-center text-sm">
                                                <div className="flex justify-center space-x-2">
                                                    <Link
                                                        href={`/students/${student.id}`}
                                                        className="text-blue-600 hover:text-blue-900"
                                                    >
                                                        View
                                                    </Link>
                                                    <Link
                                                        href={`/students/edit/${student.id}`}
                                                        className="text-green-600 hover:text-green-900"
                                                    >
                                                        Edit
                                                    </Link>
                                                    <button
                                                        onClick={() => confirmDeleteStudent(student.id)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
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
                                        <h3 className="text-lg font-medium leading-6 text-gray-900">Delete Student</h3>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500">
                                                Are you sure you want to delete this student? This action cannot be undone, and all associated scores and records will be permanently removed.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                                <button
                                    type="button"
                                    onClick={() => studentToDelete && handleDeleteStudent(studentToDelete)}
                                    disabled={isDeleting}
                                    className="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                                >
                                    {isDeleting ? 'Deleting...' : 'Delete'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setStudentToDelete(null);
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