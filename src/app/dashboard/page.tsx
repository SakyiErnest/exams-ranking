'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    getGradeLevelsByTeacher,
    getSubjectsByGradeAndTrimester,
    getRecentActivities,
    getStudentById,
    getStudentsByTeacher,
    getSubjectsByTeacher
} from '@/lib/db';
import { GradeLevel, Subject, ActivityLog, Student } from '@/types';

export default function Dashboard() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
    const [recentSubjects, setRecentSubjects] = useState<Subject[]>([]);
    const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
    const [recentActivities, setRecentActivities] = useState<ActivityLog[]>([]);
    const [studentInfo, setStudentInfo] = useState<Record<string, string>>({});
    const [students, setStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Extract student ID from activity details
    const extractStudentId = (details: string): string | null => {
        // Match "student STUDENT_ID" pattern in the details
        const match = details.match(/student\s+([a-zA-Z0-9]{20})/);
        return match ? match[1] : null;
    };

    // Format the details to show student name instead of ID
    const formatDetails = (details: string | undefined): string => {
        if (!details) return '';

        const studentId = extractStudentId(details);
        if (studentId && studentInfo[studentId]) {
            return details.replace(studentId, studentInfo[studentId]);
        }
        return details;
    };

    useEffect(() => {
        // Redirect to login if not authenticated
        if (!loading && !user) {
            router.push('/login');
        }

        // Load dashboard data if authenticated
        if (user) {
            const loadDashboardData = async () => {
                try {
                    setIsLoading(true);
                    // Get all grade levels for this teacher
                    const levels = await getGradeLevelsByTeacher(user.uid);
                    setGradeLevels(levels);

                    // Get all students for this teacher
                    const studentsData = await getStudentsByTeacher(user.uid);
                    setStudents(studentsData || []);

                    // Get ALL subjects for this teacher
                    const allSubjectsData = await getSubjectsByTeacher(user.uid);
                    setAllSubjects(allSubjectsData || []);

                    // Get recent subjects (just getting all for now, can be refined later)
                    if (levels.length > 0) {
                        // This is a simplification - in a real app, you might get recent subjects across all grades
                        const subjects = await getSubjectsByGradeAndTrimester(
                            levels[0].id,
                            '', // You would need to store the current trimester ID somewhere
                            user.uid
                        );
                        setRecentSubjects(subjects);
                    }

                    // Get recent activities
                    const activities = await getRecentActivities(user.uid, 10);
                    // Convert Firestore Timestamps to JavaScript Date objects and ensure details is always a string
                    // Also add organizationId if it's missing (for backward compatibility)
                    const activitiesWithDateObjects = activities.map(activity => ({
                        ...activity,
                        date: activity.date.toDate(), // Convert Timestamp to Date
                        details: activity.details || '', // Ensure details is always a string
                        organizationId: activity.organizationId || 'default-org-id' // Add organizationId if missing
                    }));
                    setRecentActivities(activitiesWithDateObjects);

                    // Extract student IDs and fetch student information
                    const studentIds = activitiesWithDateObjects
                        .map(activity => extractStudentId(activity.details || ''))
                        .filter(id => id !== null) as string[];

                    // Create a Set to remove duplicates
                    const uniqueStudentIds = [...new Set(studentIds)];

                    // Fetch student information for each unique ID
                    const studentData: Record<string, string> = {};
                    for (const id of uniqueStudentIds) {
                        try {
                            const student = await getStudentById(id);
                            if (student) {
                                studentData[id] = student.name;
                            }
                        } catch (error) {
                            console.error(`Error fetching student with ID ${id}:`, error);
                        }
                    }

                    setStudentInfo(studentData);
                } catch (error) {
                    console.error('Error loading dashboard data:', error);
                } finally {
                    setIsLoading(false);
                }
            };

            loadDashboardData();
        }
    }, [user, loading, router]);

    // Helper function to format dates for display
    const formatActivityDate = (date: Date): string => {
        const now = new Date();
        const activityDate = new Date(date);

        // Check if it's today
        if (activityDate.toDateString() === now.toDateString()) {
            return 'Today';
        }

        // Check if it's yesterday
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        if (activityDate.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        }

        // Check if it's within the last week
        const daysAgo = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysAgo < 7) {
            return `${daysAgo} days ago`;
        }

        // Otherwise show the date
        return activityDate.toLocaleDateString();
    };

    if (loading || isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="text-center">
                    <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-600"></div>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <header className="mb-8 bg-gradient-to-r from-blue-600 to-indigo-700 -mx-4 -mt-6 px-4 py-8 sm:px-6 sm:rounded-lg shadow-lg">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                    <p className="mt-2 text-lg text-blue-100">
                        Welcome back, {user?.displayName || 'Teacher'}!
                    </p>
                    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 shadow-sm">
                            <div className="flex items-center">
                                <div className="p-3 rounded-full bg-blue-500 bg-opacity-40 text-white">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <h2 className="text-sm font-medium text-white">Total Students</h2>
                                    <p className="text-2xl font-bold text-white">{Array.isArray(students) ? students.length : 0}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 shadow-sm">
                            <div className="flex items-center">
                                <div className="p-3 rounded-full bg-indigo-500 bg-opacity-40 text-white">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <h2 className="text-sm font-medium text-white">Total Subjects</h2>
                                    <p className="text-2xl font-bold text-white">{Array.isArray(allSubjects) ? allSubjects.length : 0}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 shadow-sm">
                            <div className="flex items-center">
                                <div className="p-3 rounded-full bg-purple-500 bg-opacity-40 text-white">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <h2 className="text-sm font-medium text-white">Grade Levels</h2>
                                    <p className="text-2xl font-bold text-white">{gradeLevels.length}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Quick Actions Card */}
                <div className="rounded-xl bg-white p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
                    <h2 className="mb-4 text-xl font-semibold text-gray-800 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Quick Actions
                    </h2>
                    <div className="grid grid-cols-1 gap-3">
                        <Link
                            href="/students/add"
                            className="group flex items-center rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3 text-white shadow-md hover:from-blue-600 hover:to-blue-700 transition-all duration-300"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                            <span className="font-medium">Add New Student</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-auto opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                        <Link
                            href="/subjects/add"
                            className="group flex items-center rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-4 py-3 text-white shadow-md hover:from-green-600 hover:to-green-700 transition-all duration-300"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            <span className="font-medium">Add New Subject</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-auto opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                        <Link
                            href="/dashboard/analytics"
                            className="group flex items-center rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 px-4 py-3 text-white shadow-md hover:from-purple-600 hover:to-purple-700 transition-all duration-300"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <span className="font-medium">Analytics Dashboard</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-auto opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                        <Link
                            href="/reports/generate"
                            className="group flex items-center rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-3 text-white shadow-md hover:from-indigo-600 hover:to-indigo-700 transition-all duration-300"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="font-medium">Generate Report</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-auto opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                </div>

                {/* Grade Levels Card */}
                <div className="rounded-xl bg-white p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            Grade Levels
                        </h2>
                        <Link
                            href="/grade-levels/add"
                            className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors duration-300"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add New
                        </Link>
                    </div>

                    {gradeLevels.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <p className="text-gray-500 mb-4">No grade levels added yet.</p>
                            <Link
                                href="/grade-levels/add"
                                className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Add your first grade level
                            </Link>
                        </div>
                    ) : (
                        <ul className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                            {gradeLevels.map((level) => (
                                <li key={level.id} className="group rounded-lg bg-gray-50 hover:bg-indigo-50 transition-colors duration-300">
                                    <Link
                                        href={`/grade-levels/${level.id}`}
                                        className="flex items-center justify-between p-3"
                                    >
                                        <span className="font-medium text-gray-700 group-hover:text-indigo-700 transition-colors duration-300">{level.name}</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-hover:text-indigo-500 transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Recent Subjects Card */}
                <div className="rounded-xl bg-white p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            Recent Subjects
                        </h2>
                        <Link
                            href="/subjects"
                            className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors duration-300"
                        >
                            <span>View All</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>

                    {recentSubjects.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            <p className="text-gray-500 mb-4">No subjects added yet.</p>
                            <Link
                                href="/subjects/add"
                                className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Add your first subject
                            </Link>
                        </div>
                    ) : (
                        <ul className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                            {recentSubjects.map((subject) => (
                                <li key={subject.id} className="group rounded-lg bg-gray-50 hover:bg-green-50 transition-colors duration-300">
                                    <Link
                                        href={`/subjects/${subject.id}`}
                                        className="flex items-center justify-between p-3"
                                    >
                                        <span className="font-medium text-gray-700 group-hover:text-green-700 transition-colors duration-300">{subject.name}</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-hover:text-green-500 transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* Recent Activity Card */}
            <div className="mt-8 rounded-xl bg-white p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
                <h2 className="mb-4 text-xl font-semibold text-gray-800 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Recent Activity
                </h2>
                <div className="overflow-hidden rounded-xl border border-gray-100 shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                                    Action
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                                    Details
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {recentActivities.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-8 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <p className="text-gray-500">No recent activity</p>
                                            <p className="text-sm text-gray-400 mt-1">Activities will appear here as you use the system</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                recentActivities.map((activity) => (
                                    <tr key={activity.id} className="hover:bg-gray-50 transition-colors duration-150">
                                        <td className="whitespace-nowrap px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="mr-3 h-2 w-2 rounded-full bg-green-400"></div>
                                                <span className="text-sm text-gray-500">{formatActivityDate(activity.date)}</span>
                                            </div>
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4">
                                            <span className="inline-flex rounded-full bg-blue-100 px-2 text-xs font-semibold leading-5 text-blue-800">
                                                {activity.action} {activity.entityType}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                                            {formatDetails(activity.details)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}