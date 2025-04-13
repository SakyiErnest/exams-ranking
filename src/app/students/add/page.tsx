'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createDocument, getGradeLevelsByTeacher } from '@/lib/db';
import { GradeLevel } from '@/types';

export default function AddStudent() {
    const [name, setName] = useState('');
    const [gradeLevelId, setGradeLevelId] = useState('');
    const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingGradeLevels, setIsLoadingGradeLevels] = useState(true);
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        const loadGradeLevels = async () => {
            if (!user) return;

            try {
                const levels = await getGradeLevelsByTeacher(user.uid);
                setGradeLevels(levels);

                // Auto-select the first grade level if available
                if (levels.length > 0) {
                    setGradeLevelId(levels[0].id);
                }
            } catch (error) {
                console.error('Error loading grade levels:', error);
                setError('Failed to load grade levels');
            } finally {
                setIsLoadingGradeLevels(false);
            }
        };

        loadGradeLevels();
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            setError('Student name is required');
            return;
        }

        if (!gradeLevelId) {
            setError('Please select a grade level');
            return;
        }

        if (!user) {
            setError('You must be logged in');
            return;
        }

        setIsLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            await createDocument('students', {
                name: name.trim(),
                gradeLevelId,
                teacherId: user.uid,
            });

            // Immediately show success message and reset loading
            setSuccessMessage('Student added successfully!');
            setIsLoading(false);

            // Use window.location for more reliable navigation
            window.location.href = '/students';
        } catch (error: unknown) {
            console.error('Error creating student:', error);
            setError('Failed to create student');
            setIsLoading(false);
        }
    };

    return (
        <div>
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Add Student</h1>
                <p className="mt-2 text-lg text-gray-600">
                    Add a new student to your class
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

            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                {isLoadingGradeLevels ? (
                    <div className="flex h-40 items-center justify-center">
                        <div className="text-center">
                            <div className="mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-blue-600"></div>
                            <p>Loading grade levels...</p>
                        </div>
                    </div>
                ) : gradeLevels.length === 0 ? (
                    <div className="py-4 text-center">
                        <p className="mb-4 text-lg text-gray-700">You need to create a grade level first</p>
                        <button
                            onClick={() => router.push('/grade-levels/add')}
                            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
                        >
                            Create Grade Level
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                Student Name
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., John Doe"
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

                        <div className="flex items-center justify-end space-x-4">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-75"
                            >
                                {isLoading ? 'Adding...' : 'Add Student'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
} 