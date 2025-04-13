'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function AssessmentCalculation() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user: _user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Understanding Assessment Calculations</h1>
        <p className="mt-2 text-lg text-gray-600">
          A comprehensive guide to how student scores and rankings are calculated in the system
        </p>
      </div>

      <div className="mb-8 flex space-x-1 rounded-lg bg-gray-100 p-1">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`flex-1 rounded-md py-2 text-sm font-medium ${
            activeTab === 'overview'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-gray-700 hover:bg-gray-200'
          }`}
        >
          Overview
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('components')}
          className={`flex-1 rounded-md py-2 text-sm font-medium ${
            activeTab === 'components'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-gray-700 hover:bg-gray-200'
          }`}
        >
          Assessment Components
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('formula')}
          className={`flex-1 rounded-md py-2 text-sm font-medium ${
            activeTab === 'formula'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-gray-700 hover:bg-gray-200'
          }`}
        >
          Calculation Formula
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('example')}
          className={`flex-1 rounded-md py-2 text-sm font-medium ${
            activeTab === 'example'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-gray-700 hover:bg-gray-200'
          }`}
        >
          Example
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('ranking')}
          className={`flex-1 rounded-md py-2 text-sm font-medium ${
            activeTab === 'ranking'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-gray-700 hover:bg-gray-200'
          }`}
        >
          Ranking System
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900">Assessment System Overview</h2>
              <p className="text-gray-700">
                EduGrade Pro uses a balanced approach to evaluate student performance, considering both
                formal examinations and ongoing classroom assessments.
              </p>

              <div className="mt-6 flex flex-col md:flex-row md:space-x-6">
                <div className="mb-4 flex-1 rounded-lg bg-blue-50 p-5 md:mb-0">
                  <h3 className="mb-3 text-lg font-medium text-blue-800">Exam Score (50%)</h3>
                  <p className="text-blue-700">
                    Formal examinations account for 50% of a student&apos;s total score. These are typically end-of-term
                    or standardized tests that assess comprehensive understanding.
                  </p>
                </div>
                <div className="flex-1 rounded-lg bg-green-50 p-5">
                  <h3 className="mb-3 text-lg font-medium text-green-800">Assessment Score (50%)</h3>
                  <p className="text-green-700">
                    Classroom assessments account for the other 50%. This includes quizzes, assignments, projects,
                    class participation, and other customizable components you define.
                  </p>
                </div>
              </div>

              <div className="mt-8 rounded-lg bg-yellow-50 p-6">
                <h3 className="mb-3 text-lg font-medium text-yellow-800">Why this approach?</h3>
                <p className="text-yellow-700">
                  This balanced approach ensures that students are evaluated not just on their ability to perform
                  during exams, but also on their consistent effort, participation, and progress throughout the
                  learning period.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'components' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900">Assessment Components</h2>

              <p className="text-gray-700">
                You can define custom assessment components for each subject. These components are weighted
                and combined to form the classroom assessment portion of the student&apos;s score.
              </p>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Example Component
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Example Weight
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    <tr>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">Quizzes</td>
                      <td className="px-6 py-4 text-sm text-gray-500">Regular short assessments</td>
                      <td className="px-6 py-4 text-sm text-gray-500">20%</td>
                    </tr>
                    <tr>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">Homework</td>
                      <td className="px-6 py-4 text-sm text-gray-500">Take-home assignments</td>
                      <td className="px-6 py-4 text-sm text-gray-500">15%</td>
                    </tr>
                    <tr>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">Projects</td>
                      <td className="px-6 py-4 text-sm text-gray-500">Larger assignments, presentations</td>
                      <td className="px-6 py-4 text-sm text-gray-500">40%</td>
                    </tr>
                    <tr>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">Participation</td>
                      <td className="px-6 py-4 text-sm text-gray-500">Classroom engagement</td>
                      <td className="px-6 py-4 text-sm text-gray-500">15%</td>
                    </tr>
                    <tr>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">Attendance</td>
                      <td className="px-6 py-4 text-sm text-gray-500">Presence and punctuality</td>
                      <td className="px-6 py-4 text-sm text-gray-500">10%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-4 bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800">Customization</h4>
                <p className="text-blue-700 mt-1">
                  You can create your own components with custom weights to match your teaching methodology.
                  The weights determine how much each component contributes to the final assessment score.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'formula' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900">Calculation Formula</h2>

              <div className="rounded-lg bg-gray-50 p-6">
                <h3 className="mb-4 text-xl font-medium text-gray-800">Total Score Calculation</h3>

                <div className="mb-6 rounded border border-gray-300 bg-white p-4">
                  <p className="text-lg font-mono text-gray-800">
                    Total Score = (Exam Score × 0.5) + (Assessment Score × 0.5)
                  </p>
                </div>

                <p className="mb-6 text-gray-700">
                  The total score is a balanced combination of the exam score and the assessment score,
                  each contributing 50% to the final result.
                </p>

                <h3 className="mb-4 text-xl font-medium text-gray-800">Assessment Score Calculation</h3>

                <div className="mb-6 rounded border border-gray-300 bg-white p-4">
                  <p className="text-lg font-mono text-gray-800">
                    Assessment Score = Σ(Component Score × Component Weight) / Σ(Component Weights)
                  </p>
                </div>

                <p className="text-gray-700">
                  The assessment score is calculated as a weighted average of all component scores.
                  Each component&apos;s score is multiplied by its weight, and the sum is divided by the
                  total of all weights.
                </p>
              </div>

              <div className="mt-6 bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-medium text-yellow-800">Note on Weights</h4>
                <p className="text-yellow-700 mt-1">
                  If no custom weights are specified, all components are weighted equally. The system
                  automatically handles the normalization of weights.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'example' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900">Calculation Example</h2>

              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-medium text-gray-800 mb-4">Sample Student Calculation</h3>

                <div className="mb-6">
                  <h4 className="font-medium text-gray-700 mb-2">Given Information:</h4>
                  <ul className="list-disc pl-5 space-y-1 text-gray-600">
                    <li>Exam Score: 78%</li>
                    <li>Assessment Components:
                      <ul className="list-circle pl-5 space-y-1 mt-1">
                        <li>Quizzes (Weight: 20%): 82%</li>
                        <li>Homework (Weight: 15%): 75%</li>
                        <li>Projects (Weight: 40%): 88%</li>
                        <li>Participation (Weight: 15%): 90%</li>
                        <li>Attendance (Weight: 10%): 95%</li>
                      </ul>
                    </li>
                  </ul>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Step 1: Calculate the Assessment Score</h4>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <p className="font-mono text-sm">
                        Assessment Score = (82 × 0.2) + (75 × 0.15) + (88 × 0.4) + (90 × 0.15) + (95 × 0.1) / (0.2 + 0.15 + 0.4 + 0.15 + 0.1)
                      </p>
                      <p className="font-mono text-sm mt-2">
                        = (16.4 + 11.25 + 35.2 + 13.5 + 9.5) / 1
                      </p>
                      <p className="font-mono text-sm mt-2">
                        = 85.85%
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Step 2: Calculate the Total Score</h4>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <p className="font-mono text-sm">
                        Total Score = (78 × 0.5) + (85.85 × 0.5)
                      </p>
                      <p className="font-mono text-sm mt-2">
                        = 39 + 42.925
                      </p>
                      <p className="font-mono text-sm mt-2">
                        = 81.93%
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Step 3: Determine Performance Category</h4>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <p className="font-mono text-sm">
                        Total Score: 81.93%
                      </p>
                      <p className="font-mono text-sm mt-2 text-green-600 font-bold">
                        Performance Category: Excellent (80% and above)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ranking' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900">Ranking System</h2>

              <p className="text-gray-700">
                After calculating total scores for all students, the system ranks them from highest to lowest and assigns
                performance categories.
              </p>

              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-medium text-gray-800">Performance Categories</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-lg bg-green-50 p-4 border-l-4 border-green-400">
                    <h4 className="font-medium text-green-800">Excellent</h4>
                    <p className="text-green-700 mt-1">80% and above</p>
                  </div>

                  <div className="rounded-lg bg-blue-50 p-4 border-l-4 border-blue-400">
                    <h4 className="font-medium text-blue-800">Good</h4>
                    <p className="text-blue-700 mt-1">65% to 79%</p>
                  </div>

                  <div className="rounded-lg bg-yellow-50 p-4 border-l-4 border-yellow-400">
                    <h4 className="font-medium text-yellow-800">Average</h4>
                    <p className="text-yellow-700 mt-1">50% to 64%</p>
                  </div>

                  <div className="rounded-lg bg-red-50 p-4 border-l-4 border-red-400">
                    <h4 className="font-medium text-red-800">Poor</h4>
                    <p className="text-red-700 mt-1">Below 50%</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-lg bg-gray-50 p-6">
                <h3 className="mb-4 text-lg font-medium text-gray-800">Ranking Methodology</h3>

                <ol className="list-decimal pl-5 space-y-3 text-gray-700">
                  <li>
                    <strong>Sorting:</strong> Students are sorted by their total scores in descending order.
                  </li>
                  <li>
                    <strong>Rank Assignment:</strong> Each student is assigned a numerical rank based on their position (1st, 2nd, 3rd, etc.).
                  </li>
                  <li>
                    <strong>Tie Handling:</strong> In case of ties (students with identical scores), they receive the same rank.
                  </li>
                  <li>
                    <strong>Performance Categorization:</strong> Students are assigned performance categories based on their total scores.
                  </li>
                </ol>
              </div>

              <div className="mt-6 bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800">Why Ranking Matters</h4>
                <p className="text-blue-700 mt-1">
                  Ranking provides a clear comparative view of student performance within a class or grade level.
                  It helps identify top performers, those who may need additional support, and the overall
                  distribution of achievement across the student body.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <Link
          href="/dashboard"
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}