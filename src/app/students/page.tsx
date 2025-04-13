'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getDocumentsByField, getDocument, deleteDocument } from '@/lib/db';
import { Student, GradeLevel } from '@/types';
import { FiSearch, FiFilter, FiX } from 'react-icons/fi';

export default function StudentsList() {
    const [students, setStudents] = useState<Student[]>([]);
    const [gradeLevels, setGradeLevels] = useState<Record<string, string>>({});
    const [allGradeLevels, setAllGradeLevels] = useState<GradeLevel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

    // Search and filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGradeLevel, setSelectedGradeLevel] = useState<string>('');

    const { user } = useAuth();

    useEffect(() => {
        const fetchStudents = async () => {
            if (!user) {
                setIsLoading(false);
                return;
            }

            try {
                // Get all students for this teacher
                const studentsList = await getDocumentsByField<Student>('students', 'teacherId', user.uid);
                setStudents(studentsList);

                // Get all grade levels for this teacher for the filter dropdown
                const gradeLevelsData = await getDocumentsByField<GradeLevel>('gradeLevels', 'teacherId', user.uid);
                setAllGradeLevels(gradeLevelsData);

                // Get grade level names for each student
                const gradeNames: Record<string, string> = {};

                for (const student of studentsList) {
                    if (student.gradeLevelId && !gradeNames[student.gradeLevelId]) {
                        try {
                            const gradeLevel = await getDocument<GradeLevel>('gradeLevels', student.gradeLevelId);
                            if (gradeLevel) {
                                gradeNames[student.gradeLevelId] = gradeLevel.name;
                            }
                        } catch (error) {
                            console.error(`Error fetching grade level ${student.gradeLevelId}:`, error);
                            gradeNames[student.gradeLevelId] = 'Unknown grade';
                        }
                    }
                }

                setGradeLevels(gradeNames);
            } catch (error) {
                console.error('Error fetching students:', error);
                setError('Failed to load students');
            } finally {
                setIsLoading(false);
            }
        };

        fetchStudents();
    }, [user]);

    const handleDelete = async () => {
        if (!studentToDelete || !user) return;

        try {
            await deleteDocument('students', studentToDelete.id, user.uid);

            // Update the local state to remove the deleted student
            setStudents(students.filter(student => student.id !== studentToDelete.id));

            // Close the modal
            setShowDeleteModal(false);
            setStudentToDelete(null);
        } catch (error) {
            console.error('Error deleting student:', error);
            setError('Failed to delete student');
        }
    };

    const confirmDelete = (student: Student) => {
        setStudentToDelete(student);
        setShowDeleteModal(true);
    };

    // Filter students based on search query and selected grade level
    const filteredStudents = useMemo(() => {
        return students.filter(student => {
            const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesGradeLevel = selectedGradeLevel ? student.gradeLevelId === selectedGradeLevel : true;
            return matchesSearch && matchesGradeLevel;
        });
    }, [students, searchQuery, selectedGradeLevel]);

    // Clear all filters
    const clearFilters = () => {
        setSearchQuery('');
        setSelectedGradeLevel('');
    };

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="text-center">
                    <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-600"></div>
                    <p>Loading students...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <header className="mb-8 bg-gradient-to-r from-blue-600 to-indigo-700 -mx-4 -mt-6 px-4 py-8 sm:px-6 sm:rounded-lg shadow-lg">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Students</h1>
                        <p className="mt-2 text-lg text-blue-100">
                            Manage your students&apos; information
                        </p>
                    </div>
                    <div className="mt-4 md:mt-0">
                        <Link
                            href="/students/add"
                            className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-blue-700 shadow-sm hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add Student
                        </Link>
                    </div>
                </div>
            </header>

            {error && (
                <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            {students.length === 0 ? (
                <div className="rounded-xl bg-white p-8 text-center shadow-md">
                    <div className="flex flex-col items-center justify-center py-8">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-200 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <h3 className="mb-2 text-xl font-medium text-gray-900">No Students Yet</h3>
                        <p className="mb-6 text-gray-600">Get started by adding your first student to the system</p>
                        <Link
                            href="/students/add"
                            className="inline-flex items-center rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-3 text-sm font-medium text-white shadow-md hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add Your First Student
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Search and Filter Controls */}
                    <div className="bg-white rounded-xl p-4 shadow-md mb-4">
                        <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4">
                            {/* Search Input */}
                            <div className="flex-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FiSearch className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search students..."
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            {/* Grade Level Filter */}
                            <div className="md:w-64 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FiFilter className="h-5 w-5 text-gray-400" />
                                </div>
                                <select
                                    value={selectedGradeLevel}
                                    onChange={(e) => setSelectedGradeLevel(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">All Grade Levels</option>
                                    {allGradeLevels.map((grade) => (
                                        <option key={grade.id} value={grade.id}>
                                            {grade.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Clear Filters Button - Only show if filters are applied */}
                            {(searchQuery || selectedGradeLevel) && (
                                <button
                                    onClick={clearFilters}
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <FiX className="h-4 w-4 mr-2" />
                                    Clear Filters
                                </button>
                            )}
                        </div>

                        {/* Results count */}
                        <div className="mt-3 text-sm text-gray-500">
                            {filteredStudents.length === 0 ? (
                                <p>No students found matching your criteria</p>
                            ) : (
                                <p>Showing {filteredStudents.length} of {students.length} students</p>
                            )}
                        </div>
                    </div>

                    {filteredStudents.length === 0 ? (
                        <div className="bg-white rounded-xl p-8 text-center shadow-md">
                            <p className="text-gray-500">No students found matching your search criteria.</p>
                            <button
                                onClick={clearFilters}
                                className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <FiX className="h-4 w-4 mr-2" />
                                Clear Filters
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-xl bg-white shadow-md">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                        <tr>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600"
                                            >
                                                Name
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600"
                                            >
                                                Grade Level
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-600"
                                            >
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {filteredStudents.map((student) => (
                                            <tr key={student.id} className="hover:bg-gray-50 transition-colors duration-150">
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <div className="flex items-center">
                                                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-blue-100 flex items-center justify-center">
                                                            <span className="text-blue-600 font-medium">{student.name.charAt(0)}</span>
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">{student.name}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <span className="inline-flex rounded-full bg-blue-100 px-3 py-0.5 text-sm font-medium text-blue-800">
                                                        {student.gradeLevelId && gradeLevels[student.gradeLevelId]
                                                            ? gradeLevels[student.gradeLevelId]
                                                            : 'Unknown'}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                                    <div className="flex justify-end space-x-2">
                                                        <Link
                                                            href={`/students/${student.id}`}
                                                            className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors duration-150"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                            View
                                                        </Link>
                                                        <Link
                                                            href={`/students/edit/${student.id}`}
                                                            className="inline-flex items-center rounded-md bg-indigo-50 px-2.5 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors duration-150"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                            Edit
                                                        </Link>
                                                        <button
                                                            type="button"
                                                            onClick={() => confirmDelete(student)}
                                                            className="inline-flex items-center rounded-md bg-red-50 px-2.5 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors duration-150"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center px-4 py-6 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>

                        <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">
                            &#8203;
                        </span>

                        <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                        <svg
                                            className="h-6 w-6 text-red-600"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                            />
                                        </svg>
                                    </div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                        <h3 className="text-lg font-medium leading-6 text-gray-900">
                                            Delete Student
                                        </h3>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500">
                                                Are you sure you want to delete {studentToDelete?.name}? This action cannot
                                                be undone.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                                <button
                                    type="button"
                                    className="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={handleDelete}
                                >
                                    Delete
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                                    onClick={() => setShowDeleteModal(false)}
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