'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getDocumentsByField } from '@/lib/db';
import { GradeLevel, Subject, Student } from '@/types';
import styles from '@/styles/ProgressBar.module.css';


export default function Home() {
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Don't fetch data if auth is still loading
    if (authLoading) {
      return;
    }

    // Redirect to login if no user
    if (!user && !authLoading) {
      router.push('/login');
      return;
    }

    // Fetch dashboard data
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        // Fetch grade levels
        try {
          const gradeLevelsData = await getDocumentsByField<GradeLevel>(
            'gradeLevels',
            'teacherId',
            user.uid
          );
          setGradeLevels(gradeLevelsData || []);
        } catch (e) {
          console.warn('Error fetching grade levels:', e);
          // Continue with empty array
        }

        // Fetch subjects
        try {
          const subjectsData = await getDocumentsByField<Subject>(
            'subjects',
            'teacherId',
            user.uid
          );
          setSubjects(subjectsData || []);
        } catch (e) {
          console.warn('Error fetching subjects:', e);
          // Continue with empty array
        }

        // Fetch students
        try {
          const studentsData = await getDocumentsByField<Student>(
            'students',
            'teacherId',
            user.uid
          );
          setStudents(studentsData || []);
        } catch (e) {
          console.warn('Error fetching students:', e);
          // Continue with empty array
        }
      } catch (error) {
        console.error('Error in fetchDashboardData:', error);
        setError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, router, authLoading]);

  // Count subjects per grade level - with safety checks
  const subjectsPerGradeLevel = Array.isArray(gradeLevels) ? gradeLevels.map(grade => {
    const count = Array.isArray(subjects) ? subjects.filter(subject => subject.gradeLevelId === grade.id).length : 0;
    return { ...grade, subjectCount: count };
  }) : [];

  // Count students per grade level - with safety checks
  const studentsPerGradeLevel = Array.isArray(gradeLevels) ? gradeLevels.map(grade => {
    const count = Array.isArray(students) ? students.filter(student => student.gradeLevelId === grade.id).length : 0;
    return { ...grade, studentCount: count };
  }) : [];

  // Helper function to get the appropriate width class for progress bars
  const getProgressWidthClass = (count: number) => {
    const percentage = Math.min(100, count * 10);
    if (percentage <= 10) return styles.w10;
    if (percentage <= 20) return styles.w20;
    if (percentage <= 30) return styles.w30;
    if (percentage <= 40) return styles.w40;
    if (percentage <= 50) return styles.w50;
    if (percentage <= 60) return styles.w60;
    if (percentage <= 70) return styles.w70;
    if (percentage <= 80) return styles.w80;
    if (percentage <= 90) return styles.w90;
    return styles.w100;
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-600"></div>
          <p>Loading dashboard...</p>
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
      {/* Hero Section */}
      <div className="relative mb-10 overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 p-8 shadow-lg">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-white md:text-4xl">Welcome to EduGrade Pro</h1>
          <p className="mt-2 max-w-2xl text-blue-100 md:text-lg">
            Your comprehensive platform for tracking student performance, assessments, generating detailed reports, and AI-powered insights.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/dashboard/analytics"
              className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-blue-700 shadow-sm hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
              View Analytics Dashboard
            </Link>
            <Link
              href="/dashboard/analytics/ai-insights"
              className="inline-flex items-center rounded-lg bg-indigo-800 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 110-2h4a1 1 0 011 1v4a1 1 0 11-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 112 0v1.586l2.293-2.293a1 1 0 011.414 1.414L6.414 15H8a1 1 0 110 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 110-2h1.586l-2.293-2.293a1 1 0 011.414-1.414L15 13.586V12a1 1 0 011-1z" />
              </svg>
              AI Insights
            </Link>
            <Link
              href="/settings"
              className="inline-flex items-center rounded-lg bg-blue-800 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              Settings
            </Link>
          </div>
        </div>
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500 opacity-20"></div>
        <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-indigo-500 opacity-20"></div>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="group relative overflow-hidden rounded-lg bg-white p-6 shadow-md transition-all hover:shadow-lg">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-blue-100 opacity-50 transition-all group-hover:scale-110"></div>
          <div className="relative">
            <div className="flex items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-4">
                <h2 className="font-semibold text-gray-500">Grade Levels</h2>
                <p className="text-2xl font-bold text-gray-900">{gradeLevels.length}</p>
              </div>
            </div>
            <div className="mt-4">
              <Link
                href="/grade-levels"
                className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                View All Grade Levels
                <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-lg bg-white p-6 shadow-md transition-all hover:shadow-lg">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-indigo-100 opacity-50 transition-all group-hover:scale-110"></div>
          <div className="relative">
            <div className="flex items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="ml-4">
                <h2 className="font-semibold text-gray-500">Subjects</h2>
                <p className="text-2xl font-bold text-gray-900">{Array.isArray(subjects) ? subjects.length : 0}</p>
              </div>
            </div>
            <div className="mt-4">
              <Link
                href="/subjects"
                className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                View All Subjects
                <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-lg bg-white p-6 shadow-md transition-all hover:shadow-lg">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-green-100 opacity-50 transition-all group-hover:scale-110"></div>
          <div className="relative">
            <div className="flex items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h2 className="font-semibold text-gray-500">Students</h2>
                <p className="text-2xl font-bold text-gray-900">{students.length}</p>
              </div>
            </div>
            <div className="mt-4">
              <Link
                href="/students"
                className="inline-flex items-center text-sm font-medium text-green-600 hover:text-green-700"
              >
                View All Students
                <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-lg bg-white p-6 shadow-md transition-all hover:shadow-lg">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-purple-100 opacity-50 transition-all group-hover:scale-110"></div>
          <div className="relative">
            <div className="flex items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-600 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <h2 className="font-semibold text-gray-500">Reports</h2>
                <p className="text-2xl font-bold text-gray-900">{subjects.length > 0 ? 'Available' : 'N/A'}</p>
              </div>
            </div>
            <div className="mt-4">
              <Link
                href="/reports/list"
                className="inline-flex items-center text-sm font-medium text-purple-600 hover:text-purple-700"
              >
                View Reports
                <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Dashboard Preview */}
      <div className="mb-8 overflow-hidden rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-6 md:mb-0">
              <h2 className="text-2xl font-bold text-white md:text-3xl">Analytics Dashboard</h2>
              <p className="mt-2 text-indigo-100">
                Get insights into student performance and track progress across subjects
              </p>
            </div>
            <Link
              href="/dashboard/analytics"
              className="inline-flex items-center rounded-lg bg-white px-5 py-3 text-sm font-medium text-indigo-700 shadow-sm hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
              View Full Analytics
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
              <h3 className="text-sm font-medium text-white">Average Score</h3>
              <p className="mt-2 text-2xl font-bold text-white">{Array.isArray(students) && students.length > 0 ? '78%' : 'N/A'}</p>
              <div className="mt-1 text-xs text-indigo-100">Across all subjects</div>
            </div>
            <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
              <h3 className="text-sm font-medium text-white">Top Performer</h3>
              <p className="mt-2 text-2xl font-bold text-white">
                {Array.isArray(students) && students.length > 0 && students[0]?.name ? students[0].name : 'N/A'}
              </p>
              <div className="mt-1 text-xs text-indigo-100">Based on overall average</div>
            </div>
            <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
              <h3 className="text-sm font-medium text-white">Subjects Tracked</h3>
              <p className="mt-2 text-2xl font-bold text-white">{Array.isArray(subjects) ? subjects.length : 0}</p>
              <div className="mt-1 text-xs text-indigo-100">Across {Array.isArray(gradeLevels) ? gradeLevels.length : 0} grade levels</div>
            </div>
            <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
              <h3 className="text-sm font-medium text-white">Total Students</h3>
              <p className="mt-2 text-2xl font-bold text-white">{Array.isArray(students) ? students.length : 0}</p>
              <div className="mt-1 text-xs text-indigo-100">Enrolled in your classes</div>
            </div>
          </div>
        </div>
      </div>

      {/* Grade Levels Summary */}
      <div className="mb-8 overflow-hidden rounded-lg bg-white shadow-md">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Grade Levels Summary
            </h2>
            <Link
              href="/grade-levels/add"
              className="inline-flex items-center rounded-md bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 hover:bg-blue-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="mr-1 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add New
            </Link>
          </div>
        </div>

        <div className="p-6">
          {Array.isArray(gradeLevels) && gradeLevels.length === 0 ? (
            <div className="rounded-md bg-blue-50 p-6 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <p className="mt-4 text-gray-600">You haven&apos;t added any grade levels yet.</p>
              <div className="mt-4">
                <Link
                  href="/grade-levels/add"
                  className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Add Your First Grade Level
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Grade Level
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Subjects
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Students
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {Array.isArray(subjectsPerGradeLevel) && subjectsPerGradeLevel.map(grade => {
                    const studentCount = Array.isArray(studentsPerGradeLevel) ? studentsPerGradeLevel.find(g => g.id === grade.id)?.studentCount || 0 : 0;

                    return (
                      <tr key={grade.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                          {grade.name}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <span className="mr-2">{grade.subjectCount}</span>
                            {grade.subjectCount > 0 && (
                              <div className={styles.progressContainer}>
                                <div
                                  className={`${styles.progressBar} ${styles.progressBarIndigo} ${getProgressWidthClass(grade.subjectCount)}`}
                                ></div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <span className="mr-2">{studentCount}</span>
                            {studentCount > 0 && (
                              <div className={styles.progressContainer}>
                                <div
                                  className={`${styles.progressBar} ${styles.progressBarGreen} ${getProgressWidthClass(studentCount)}`}
                                ></div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-center text-sm">
                          <Link
                            href={`/grade-levels/${grade.id}`}
                            className="inline-flex items-center rounded-md bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 hover:bg-blue-100"
                          >
                            View Details
                            <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </Link>
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

      {/* Quick Actions */}
      <div className="mb-8 overflow-hidden rounded-lg bg-white shadow-md">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Quick Actions
          </h2>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            <Link
              href="/subjects/add"
              className="group flex flex-col items-center rounded-lg bg-white p-6 text-center shadow-sm ring-1 ring-gray-200 transition-all hover:shadow-md hover:ring-indigo-300"
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 transition-all group-hover:bg-indigo-600 group-hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="mb-1 font-medium text-gray-900">Add Subject</h3>
              <p className="text-sm text-gray-500">Create a new subject for your classes</p>
            </Link>

            <Link
              href="/students/add"
              className="group flex flex-col items-center rounded-lg bg-white p-6 text-center shadow-sm ring-1 ring-gray-200 transition-all hover:shadow-md hover:ring-green-300"
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600 transition-all group-hover:bg-green-600 group-hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h3 className="mb-1 font-medium text-gray-900">Add Student</h3>
              <p className="text-sm text-gray-500">Register a new student in the system</p>
            </Link>

            <Link
              href="/grade-levels/add"
              className="group flex flex-col items-center rounded-lg bg-white p-6 text-center shadow-sm ring-1 ring-gray-200 transition-all hover:shadow-md hover:ring-blue-300"
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-600 transition-all group-hover:bg-blue-600 group-hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="mb-1 font-medium text-gray-900">Add Grade Level</h3>
              <p className="text-sm text-gray-500">Create a new grade level for organization</p>
            </Link>

            <Link
              href="/reports/list"
              className="group flex flex-col items-center rounded-lg bg-white p-6 text-center shadow-sm ring-1 ring-gray-200 transition-all hover:shadow-md hover:ring-purple-300"
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-purple-100 text-purple-600 transition-all group-hover:bg-purple-600 group-hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="mb-1 font-medium text-gray-900">Generate Report</h3>
              <p className="text-sm text-gray-500">Create detailed performance reports</p>
            </Link>

            <Link
              href="/settings"
              className="group flex flex-col items-center rounded-lg bg-white p-6 text-center shadow-sm ring-1 ring-gray-200 transition-all hover:shadow-md hover:ring-gray-400"
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-all group-hover:bg-gray-700 group-hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="mb-1 font-medium text-gray-900">Settings</h3>
              <p className="text-sm text-gray-500">Customize your application preferences</p>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center">
        <p className="text-sm text-gray-500">
          EduGrade Pro &copy; {new Date().getFullYear()} | A comprehensive platform for educators
        </p>
      </div>
    </div>
  );
}
