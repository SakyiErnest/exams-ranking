'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  Student,
  Subject,
  StudentScore,
  GradeLevel,
  AcademicYear,
  Trimester,
  AssessmentComponent
} from '@/types';
import {
  getDocumentsByField,
  getGradeLevelsByTeacher,
  getAcademicYearsByTeacher,
  getTrimestersByAcademicYear,
  getAssessmentComponentsBySubject,
  getStudentScoresBySubject
} from '@/lib/db';
import {
  calculateSubjectAverage,
  calculateGradeDistribution,
  calculateComponentPerformance,
  getTopPerformingStudents
} from '@/utils/analyticsUtils';
import PerformanceChart from '@/components/analytics/PerformanceChart';
import TrendAnalysis from '@/components/analytics/TrendAnalysis';
import GradeDistributionChart from '@/components/analytics/GradeDistributionChart';
import ReportGenerator from '@/components/reports/ReportGenerator';
import StudentList from '@/components/analytics/StudentList';
import Link from 'next/link';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  DocumentChartBarIcon,
  UsersIcon
} from '@heroicons/react/24/solid';

export default function AnalyticsDashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [scores, setScores] = useState<StudentScore[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [trimesters, setTrimesters] = useState<Trimester[]>([]);
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [components, setComponents] = useState<AssessmentComponent[]>([]);

  const [selectedGradeLevel, setSelectedGradeLevel] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedTrimester, setSelectedTrimester] = useState<string>('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReportGenerator, setShowReportGenerator] = useState(false);
  const [showStudentList, setShowStudentList] = useState(false);

  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        setLoading(true);

        // Fetch all necessary data from Firestore
        const gradeLevelsData = await getGradeLevelsByTeacher(user.uid);
        setGradeLevels(gradeLevelsData);

        const academicYearsData = await getAcademicYearsByTeacher(user.uid);
        setAcademicYears(academicYearsData);

        // For trimesters, we need an academic year, so we'll get all if there are any
        let trimestersData: Trimester[] = [];
        if (academicYearsData.length > 0) {
          // Get trimesters for all academic years
          for (const year of academicYearsData) {
            const yearTrimesters = await getTrimestersByAcademicYear(year.id, user.uid);
            trimestersData = [...trimestersData, ...yearTrimesters];
          }
        }
        setTrimesters(trimestersData);

        // Get all subjects for this teacher
        const subjectsData = await getDocumentsByField<Subject>('subjects', 'teacherId', user.uid);
        setSubjects(subjectsData);

        // Get all students for this teacher
        const studentsData = await getDocumentsByField<Student>('students', 'teacherId', user.uid);
        setStudents(studentsData);

        // Get assessment components
        // This is a bit tricky as components are tied to subjects
        let componentsData: AssessmentComponent[] = [];
        if (subjectsData.length > 0) {
          // For simplicity, get components for all subjects
          for (const subject of subjectsData) {
            const subjectComponents = await getAssessmentComponentsBySubject(subject.id, user.uid);
            componentsData = [...componentsData, ...subjectComponents];
          }
        }
        setComponents(componentsData);

        // Get scores
        // Again, we need to fetch scores for each subject
        let scoresData: StudentScore[] = [];
        if (subjectsData.length > 0) {
          for (const subject of subjectsData) {
            const subjectScores = await getStudentScoresBySubject(subject.id, user.uid);
            scoresData = [...scoresData, ...subjectScores];
          }
        }
        setScores(scoresData);

        // Log data for debugging
        console.log('Data loaded:', {
          students: studentsData.length,
          subjects: subjectsData.length,
          scores: scoresData.length,
          components: componentsData.length
        });

      } catch (error) {
        console.error("Failed to fetch data:", error);
        setError("Failed to load data. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user, router]);

  // Calculate finalScore for each score record
  console.log('Calculating final scores for', scores.length, 'score records');
  const scoresWithFinalScores = scores.map(score => {
    // Find the components for this subject
    const subjectComponents = components.filter(c => c.subjectId === score.subjectId);

    // Calculate assessment score based on component weights
    let assessmentTotal = 0;
    let weightTotal = 0;

    if (score.classAssessmentScores && Object.keys(score.classAssessmentScores).length > 0 && subjectComponents.length > 0) {
      subjectComponents.forEach(component => {
        if (score.classAssessmentScores[component.id] !== undefined) {
          assessmentTotal += score.classAssessmentScores[component.id] * (component.weight / 100);
          weightTotal += component.weight;
        }
      });
    } else if (score.classAssessmentScores && Object.keys(score.classAssessmentScores).length > 0) {
      // If we have assessment scores but no components, use a simple average
      const scores = Object.values(score.classAssessmentScores).filter(v => typeof v === 'number');
      if (scores.length > 0) {
        assessmentTotal = scores.reduce((sum, val) => sum + val, 0) / scores.length;
        weightTotal = 100; // Assume 100% weight for the average
      }
    }

    // Normalize assessment score if weights don't add up to 100%
    const assessmentScore = weightTotal > 0 ? (assessmentTotal / weightTotal) * 100 : 0;

    // Calculate final score (50% exam, 50% assessment)
    const examScore = score.examScore || 0;
    const finalScore = (examScore * 0.5) + (assessmentScore * 0.5);

    // For debugging
    if (score.id === scores[0]?.id) {
      console.log('Sample score calculation:', {
        examScore,
        assessmentScore,
        finalScore: Math.round(finalScore * 10) / 10,
        components: subjectComponents.length,
        assessmentScores: score.classAssessmentScores ? Object.keys(score.classAssessmentScores).length : 0
      });
    }

    return {
      ...score,
      finalScore: Math.round(finalScore * 10) / 10 // Round to 1 decimal place
    };
  });

  // Log some sample scores with final scores for debugging
  if (scoresWithFinalScores.length > 0) {
    console.log('Sample scores with final scores:', scoresWithFinalScores.slice(0, 3));
  }

  // Filter data based on selections
  const filteredScores = scoresWithFinalScores.filter(score => {
    const subject = subjects.find(s => s.id === score.subjectId);
    return (
      (!selectedSubject || score.subjectId === selectedSubject) &&
      (!selectedGradeLevel || subject?.gradeLevelId === selectedGradeLevel) &&
      (!selectedTrimester || subject?.trimesterId === selectedTrimester) &&
      (!selectedAcademicYear || subject?.academicYearId === selectedAcademicYear)
    );
  });

  // Filter subject options based on selections
  const filteredSubjects = subjects.filter(subject => {
    return (
      (!selectedGradeLevel || subject.gradeLevelId === selectedGradeLevel) &&
      (!selectedTrimester || subject.trimesterId === selectedTrimester) &&
      (!selectedAcademicYear || subject.academicYearId === selectedAcademicYear)
    );
  });

  // Calculate analytics data
  const averageScore = calculateSubjectAverage(filteredScores);
  const gradeDistribution = calculateGradeDistribution(filteredScores);
  const componentPerformance = calculateComponentPerformance(filteredScores, components);
  const topStudents = getTopPerformingStudents(filteredScores, students);

  // Check if we have previous data for comparison (e.g., from previous trimester)
  const getPreviousTrimesterData = () => {
    if (!selectedTrimester || trimesters.length <= 1) return null;

    const currentTrimesterIndex = trimesters.findIndex(t => t.id === selectedTrimester);
    if (currentTrimesterIndex <= 0) return null;

    const previousTrimester = trimesters[currentTrimesterIndex - 1];

    const previousScores = scoresWithFinalScores.filter(score => {
      const subject = subjects.find(s => s.id === score.subjectId);
      return (
        (!selectedSubject || score.subjectId === selectedSubject) &&
        (!selectedGradeLevel || subject?.gradeLevelId === selectedGradeLevel) &&
        (subject?.trimesterId === previousTrimester.id) &&
        (!selectedAcademicYear || subject?.academicYearId === selectedAcademicYear)
      );
    });

    return {
      averageScore: calculateSubjectAverage(previousScores),
      distribution: calculateGradeDistribution(previousScores)
    };
  };

  const previousData = getPreviousTrimesterData();

  // Calculate score trend over time (across trimesters)
  const calculateScoreTrend = () => {
    const trendData: { trimesterName: string; averageScore: number }[] = [];

    trimesters.forEach(trimester => {
      const trimesterScores = scoresWithFinalScores.filter(score => {
        const subject = subjects.find(s => s.id === score.subjectId);
        return (
          (!selectedSubject || score.subjectId === selectedSubject) &&
          (!selectedGradeLevel || subject?.gradeLevelId === selectedGradeLevel) &&
          (subject?.trimesterId === trimester.id) &&
          (subject?.academicYearId === trimester.academicYearId)
        );
      });

      if (trimesterScores.length > 0) {
        trendData.push({
          trimesterName: trimester.name,
          averageScore: calculateSubjectAverage(trimesterScores)
        });
      }
    });

    return trendData;
  };

  const scoreTrend = calculateScoreTrend();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-800">Analytics Dashboard</h1>
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => setShowStudentList(!showStudentList)}
              className="flex items-center bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow transition"
            >
              <UsersIcon className="h-5 w-5 mr-2" />
              {showStudentList ? 'Hide Student List' : 'View Students'}
            </button>
            <button
              type="button"
              onClick={() => setShowReportGenerator(!showReportGenerator)}
              className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition"
            >
              <DocumentChartBarIcon className="h-5 w-5 mr-2" />
              {showReportGenerator ? 'Hide Report Generator' : 'Generate Reports'}
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <h2 className="text-lg font-medium mb-3">Filter Analytics Data</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="academic-year" className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
              <select
                id="academic-year"
                aria-label="Academic Year"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={selectedAcademicYear}
                onChange={(e) => setSelectedAcademicYear(e.target.value)}
              >
                <option value="">All Academic Years</option>
                {academicYears.map((year) => (
                  <option key={year.id} value={year.id}>{year.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="trimester" className="block text-sm font-medium text-gray-700 mb-1">Trimester</label>
              <select
                id="trimester"
                aria-label="Trimester"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={selectedTrimester}
                onChange={(e) => setSelectedTrimester(e.target.value)}
              >
                <option value="">All Trimesters</option>
                {trimesters
                  .filter(t => !selectedAcademicYear || t.academicYearId === selectedAcademicYear)
                  .map((trimester) => (
                    <option key={trimester.id} value={trimester.id}>{trimester.name}</option>
                  ))}
              </select>
            </div>

            <div>
              <label htmlFor="grade-level" className="block text-sm font-medium text-gray-700 mb-1">Grade Level</label>
              <select
                id="grade-level"
                aria-label="Grade Level"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={selectedGradeLevel}
                onChange={(e) => setSelectedGradeLevel(e.target.value)}
              >
                <option value="">All Grade Levels</option>
                {gradeLevels.map((grade) => (
                  <option key={grade.id} value={grade.id}>{grade.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <select
                id="subject"
                aria-label="Subject"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                <option value="">All Subjects</option>
                {filteredSubjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-3 text-sm text-gray-600">
            Showing data for {filteredScores.length} score records from {new Set(filteredScores.map(s => s.studentId)).size} students
          </div>
        </div>
      </div>

      {showReportGenerator && (
        <div className="mb-8">
          <ReportGenerator
            students={students}
            subjects={subjects}
            scores={scores}
            academicYears={academicYears}
            trimesters={trimesters}
            gradeLevels={gradeLevels}
            assessmentComponents={components}
          />
        </div>
      )}

      {showStudentList && (
        <div className="mb-8">
          <StudentList
            students={students}
            gradeLevel={selectedGradeLevel}
          />
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-500">Average Score</h3>
          <div className="flex items-end mt-2">
            <span className="text-3xl font-bold">{averageScore}%</span>
            {previousData && (
              <div className="flex items-center ml-4">
                {averageScore > previousData.averageScore ? (
                  <span className="flex items-center text-green-600">
                    <ArrowUpIcon className="h-4 w-4 mr-1" />
                    {(averageScore - previousData.averageScore).toFixed(1)}%
                  </span>
                ) : (
                  <span className="flex items-center text-red-600">
                    <ArrowDownIcon className="h-4 w-4 mr-1" />
                    {(previousData.averageScore - averageScore).toFixed(1)}%
                  </span>
                )}
              </div>
            )}
          </div>
          <p className="mt-2 text-sm text-gray-500">
            {previousData
              ? `Compared to previous trimester (${previousData.averageScore}%)`
              : 'Based on current selection'}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-500">Total Students</h3>
          <div className="mt-2">
            <span className="text-3xl font-bold">
              {new Set(filteredScores.map(score => score.studentId)).size}
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-500">Students with recorded scores</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-500">Pass Rate</h3>
          <div className="mt-2">
            <span className="text-3xl font-bold">
              {filteredScores.length === 0
                ? '0%'
                : `${Math.round((filteredScores.filter(score => (score.finalScore || 0) >= 60).length / filteredScores.length) * 100)}%`}
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-500">Students with 60% or higher</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-500">Excellence Rate</h3>
          <div className="mt-2">
            <span className="text-3xl font-bold">
              {filteredScores.length === 0
                ? '0%'
                : `${Math.round((filteredScores.filter(score => (score.finalScore || 0) >= 80).length / filteredScores.length) * 100)}%`}
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-500">Students with 80% or higher</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium mb-4">Grade Distribution</h3>
          <GradeDistributionChart distribution={gradeDistribution} />
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium mb-4">Performance by Component</h3>
          <PerformanceChart
            title="Average Score by Assessment Component"
            labels={Object.keys(componentPerformance)}
            datasets={[
              {
                label: 'Average Score',
                data: Object.values(componentPerformance),
              },
            ]}
          />
        </div>
      </div>

      {/* Performance Trend */}
      {scoreTrend.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-medium mb-4">Performance Trend Over Time</h3>
          <TrendAnalysis
            title="Average Score Trend Across Trimesters"
            labels={scoreTrend.map(item => item.trimesterName)}
            datasets={[
              {
                label: 'Average Score',
                data: scoreTrend.map(item => item.averageScore),
              },
            ]}
          />
        </div>
      )}

      {/* Top Students section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Top Performing Students</h3>
          <Link
            href="/dashboard/analytics/students"
            className="text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium"
          >
            <UsersIcon className="h-4 w-4 mr-1" />
            View All Students
          </Link>
        </div>

        {topStudents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Average Score
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topStudents.map((student, index) => (
                  <tr key={student.student.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {student.student.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.averageScore}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/dashboard/analytics/student/${student.student.id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        View Analytics
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No student data available for the selected filters.</p>
        )}
      </div>
    </div>
  );
}
