'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  getStudentById,
  getDocument,
  getDocumentsByField,
  getStudentScoresByStudentId,
  getAssessmentComponentsBySubject
} from '@/lib/db';
import {
  Student,
  Subject,
  StudentScore,
  GradeLevel,
  Trimester,
  AssessmentComponent
} from '@/types';
import {
  calculateStudentProgress
} from '@/utils/analyticsUtils';
import TrendAnalysis from '@/components/analytics/TrendAnalysis';
import PerformanceChart from '@/components/analytics/PerformanceChart';
import { ArrowLeftIcon, DocumentChartBarIcon } from '@heroicons/react/24/solid';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Define proper typings for jsPDF with autoTable extension
interface JsPDFWithAutoTable extends jsPDF {
  lastAutoTable: {
    finalY: number;
  };
}

export default function StudentAnalytics() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;

  const [student, setStudent] = useState<Student | null>(null);
  const [gradeLevel, setGradeLevel] = useState<GradeLevel | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [scores, setScores] = useState<StudentScore[]>([]);
  const [trimesters, setTrimesters] = useState<Trimester[]>([]);
  const [components, setComponents] = useState<AssessmentComponent[]>([]);

  const [loading, setLoading] = useState(true);

  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        // Fetch the student using the getStudentById function from db.ts
        const studentData = await getStudentById(studentId);
        if (!studentData) {
          console.error('Student not found');
          router.push('/dashboard/analytics');
          return;
        }

        setStudent(studentData);

        // Fetch grade level
        const gradeLevelData = await getDocument<GradeLevel>('gradeLevels', studentData.gradeLevelId);
        if (gradeLevelData) {
          setGradeLevel(gradeLevelData);
        }

        // Fetch all necessary collections
        const trimestersData = await getDocumentsByField<Trimester>('trimesters', 'teacherId', user.uid);
        setTrimesters(trimestersData);

        // Fetch subjects for this grade level
        const subjectsData = await getDocumentsByField<Subject>('subjects', 'gradeLevelId', studentData.gradeLevelId);
        setSubjects(subjectsData);

        // Fetch assessment components
        let componentsData: AssessmentComponent[] = [];
        for (const subject of subjectsData) {
          const subjectComponents = await getAssessmentComponentsBySubject(subject.id, user.uid);
          componentsData = [...componentsData, ...subjectComponents];
        }
        setComponents(componentsData);

        // Fetch student's scores using the getStudentScoresByStudentId function from db.ts
        const scoresData = await getStudentScoresByStudentId(studentId, user.uid);

        // Calculate finalScore for each score if not already present
        const scoresWithFinalScores = scoresData.map(score => {
          if (score.finalScore !== undefined) {
            return score;
          }

          // Find the components for this subject
          const subjectComponents = componentsData.filter(c => c.subjectId === score.subjectId);

          // Calculate assessment score based on component weights
          let assessmentTotal = 0;
          let weightTotal = 0;

          if (score.classAssessmentScores && Object.keys(score.classAssessmentScores).length > 0) {
            subjectComponents.forEach(component => {
              if (score.classAssessmentScores[component.id] !== undefined) {
                assessmentTotal += score.classAssessmentScores[component.id] * (component.weight / 100);
                weightTotal += component.weight;
              }
            });
          }

          // Normalize assessment score if weights don't add up to 100%
          const assessmentScore = weightTotal > 0 ? (assessmentTotal / weightTotal) * 100 : 0;

          // Calculate final score (50% exam, 50% assessment)
          const examScore = score.examScore || 0;
          const finalScore = (examScore * 0.5) + (assessmentScore * 0.5);

          return {
            ...score,
            finalScore: Math.round(finalScore * 10) / 10 // Round to 1 decimal place
          };
        });

        setScores(scoresWithFinalScores);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    if (studentId && user) {
      fetchData();
    }
  }, [studentId, router, user]);

  // Calculate student's progress across trimesters
  const studentProgress = calculateStudentProgress(studentId, scores, subjects);

  // Get trimester names for labels
  const trimesterNames = Object.keys(studentProgress).map(trimesterId => {
    const trimester = trimesters.find(t => t.id === trimesterId);
    return trimester ? trimester.name : 'Unknown';
  });

  // Calculate performance by subject
  const subjectPerformance = subjects.reduce((performance, subject) => {
    const subjectScores = scores.filter(score => score.subjectId === subject.id);
    if (subjectScores.length > 0) {
      const subjectScore = subjectScores[0];
      performance[subject.name] = subjectScore.finalScore || 0;
    }
    return performance;
  }, {} as { [subjectName: string]: number });

  // Calculate performance by component
  const componentPerformance = components.reduce((performance, component) => {
    let totalScore = 0;
    let count = 0;

    scores.forEach(score => {
      if (score.classAssessmentScores[component.id] !== undefined) {
        totalScore += score.classAssessmentScores[component.id];
        count++;
      }
    });

    if (count > 0) {
      performance[component.name] = Math.round((totalScore / count) * 10) / 10;
    }

    return performance;
  }, {} as { [componentName: string]: number });

  // Generate student report
  const generateStudentReport = () => {
    if (!student || !gradeLevel) return;

    const doc = new jsPDF() as JsPDFWithAutoTable;

    // Set header
    doc.setFontSize(20);
    doc.text('Student Performance Report', 105, 15, { align: 'center' });

    // Student information
    doc.setFontSize(14);
    doc.text('Student Information', 15, 30);
    doc.setFontSize(12);
    doc.text(`Name: ${student.name}`, 15, 40);
    doc.text(`Grade: ${gradeLevel.name}`, 15, 48);

    // Subject performance
    doc.setFontSize(14);
    doc.text('Subject Performance', 15, 65);

    const subjectData = Object.entries(subjectPerformance).map(([subject, score]) => [
      subject,
      `${score}%`,
    ]);

    autoTable(doc, {
      head: [['Subject', 'Score']],
      body: subjectData,
      startY: 70,
    });

    // Component performance
    const componentY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.text('Assessment Component Performance', 15, componentY);

    const componentData = Object.entries(componentPerformance).map(([component, score]) => [
      component,
      `${score}%`,
    ]);

    autoTable(doc, {
      head: [['Component', 'Average Score']],
      body: componentData,
      startY: componentY + 5,
    });

    // Progress over time
    const progressY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.text('Progress Over Time', 15, progressY);

    const progressData = Object.entries(studentProgress).map(([trimesterId, score]) => {
      const trimester = trimesters.find(t => t.id === trimesterId);
      return [trimester?.name || 'Unknown', `${score}%`];
    });

    autoTable(doc, {
      head: [['Trimester', 'Average Score']],
      body: progressData,
      startY: progressY + 5,
    });

    // Save the PDF
    doc.save(`${student.name.replace(/\s+/g, '_')}_report.pdf`);
  };

  if (loading || !student) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => router.back()}
            className="mr-4 text-gray-600 hover:text-gray-900"
            aria-label="Go back"
            title="Go back to previous page"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Student Analytics</h1>
        </div>
        <button
          type="button"
          onClick={generateStudentReport}
          className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition"
          aria-label="Generate PDF report"
          title="Generate PDF report for this student"
        >
          <DocumentChartBarIcon className="h-5 w-5 mr-2" />
          Generate Report
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold">{student?.name || 'Student'}</h2>
            <p className="text-gray-600">{gradeLevel?.name || 'Unknown Grade'}</p>
          </div>
          <div className="mt-4 md:mt-0">
            <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-medium">
              Overall Average: {
                scores.length > 0
                  ? `${Math.round(scores.reduce((sum, score) => sum + (score.finalScore || 0), 0) / scores.length)}%`
                  : 'N/A'
              }
            </div>
          </div>
        </div>
        {scores.length > 0 && Object.keys(subjectPerformance).length > 0 && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 p-3 rounded-md">
              <p className="text-sm font-medium text-green-800">Highest Subject Score</p>
              <p className="text-lg font-bold text-green-900">
                {Math.max(...Object.values(subjectPerformance))}%
                <span className="text-sm font-normal ml-2">
                  in {Object.entries(subjectPerformance).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'}
                </span>
              </p>
            </div>
            <div className="bg-red-50 p-3 rounded-md">
              <p className="text-sm font-medium text-red-800">Lowest Subject Score</p>
              <p className="text-lg font-bold text-red-900">
                {Math.min(...Object.values(subjectPerformance))}%
                <span className="text-sm font-normal ml-2">
                  in {Object.entries(subjectPerformance).sort((a, b) => a[1] - b[1])[0]?.[0] || 'N/A'}
                </span>
              </p>
            </div>
            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm font-medium text-blue-800">Total Subjects</p>
              <p className="text-lg font-bold text-blue-900">
                {Object.keys(subjectPerformance).length}
                <span className="text-sm font-normal ml-2">
                  across {new Set(subjects.map(s => s.trimesterId)).size} trimester(s)
                </span>
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Subject Performance */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium mb-4">Performance by Subject</h3>
          {Object.keys(subjectPerformance).length > 0 ? (
            <PerformanceChart
              title="Subject Scores"
              labels={Object.keys(subjectPerformance)}
              datasets={[
                {
                  label: 'Score',
                  data: Object.values(subjectPerformance),
                  backgroundColor: 'rgba(54, 162, 235, 0.6)',
                },
              ]}
            />
          ) : (
            <p className="text-gray-500">No subject data available.</p>
          )}
        </div>

        {/* Component Performance */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium mb-4">Performance by Assessment Component</h3>
          {Object.keys(componentPerformance).length > 0 ? (
            <PerformanceChart
              title="Assessment Component Scores"
              labels={Object.keys(componentPerformance)}
              datasets={[
                {
                  label: 'Score',
                  data: Object.values(componentPerformance),
                  backgroundColor: 'rgba(75, 192, 192, 0.6)',
                },
              ]}
            />
          ) : (
            <p className="text-gray-500">No component data available.</p>
          )}
        </div>
      </div>

      {/* Progress over time */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h3 className="text-lg font-medium mb-4">Progress Over Time</h3>
        {Object.keys(studentProgress).length > 0 ? (
          <TrendAnalysis
            title="Average Score Trend Across Trimesters"
            labels={trimesterNames}
            datasets={[
              {
                label: 'Average Score',
                data: Object.values(studentProgress),
                borderColor: 'rgb(75, 192, 192)',
              },
            ]}
          />
        ) : (
          <p className="text-gray-500">No progress data available across trimesters.</p>
        )}
      </div>

      {/* Individual Scores Table */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-medium mb-4">Individual Scores</h3>
        {scores.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Exam Score
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assessment Scores
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Final Score
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {scores.map((score) => {
                  const subject = subjects.find(s => s.id === score.subjectId);
                  return (
                    <tr key={score.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {subject?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {score.examScore}%
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <ul>
                          {Object.entries(score.classAssessmentScores).map(([componentId, value]) => {
                            const component = components.find(c => c.id === componentId);
                            return (
                              <li key={componentId}>
                                {component?.name || 'Unknown'}: {value}%
                              </li>
                            );
                          })}
                        </ul>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {score.finalScore ? `${score.finalScore}%` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {score.rank || 'N/A'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No scores available for this student.</p>
        )}
      </div>

      {/* Strengths and Weaknesses */}
      <div className="bg-white rounded-lg shadow-md p-6 mt-8">
        <h3 className="text-lg font-medium mb-4">Strengths and Areas for Improvement</h3>

        {scores.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-green-600 mb-2">Strengths</h4>
              <ul className="space-y-2">
                {Object.entries(subjectPerformance)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 3)
                  .map(([subject, score]) => (
                    <li key={subject} className="flex items-center">
                      <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
                      <span>
                        {subject}: <span className="font-medium">{score}%</span>
                      </span>
                    </li>
                  ))}
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-red-600 mb-2">Areas for Improvement</h4>
              <ul className="space-y-2">
                {Object.entries(subjectPerformance)
                  .sort((a, b) => a[1] - b[1])
                  .slice(0, 3)
                  .map(([subject, score]) => (
                    <li key={subject} className="flex items-center">
                      <span className="h-2 w-2 bg-red-500 rounded-full mr-2"></span>
                      <span>
                        {subject}: <span className="font-medium">{score}%</span>
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">Not enough data to determine strengths and areas for improvement.</p>
        )}
      </div>

      {/* Recommendations */}
      <div className="bg-white rounded-lg shadow-md p-6 mt-8">
        <h3 className="text-lg font-medium mb-4">Recommendations</h3>

        {scores.length > 0 ? (
          <div>
            <ul className="space-y-3">
              {/* Subject-specific recommendations */}
              {Object.entries(subjectPerformance)
                .sort((a, b) => a[1] - b[1])
                .slice(0, 2)
                .map(([subject, score]) => {
                  // Tailored recommendations based on score range
                  let recommendation = '';
                  if (score < 50) {
                    recommendation = `Current score is ${score}%. Consider scheduling additional tutoring sessions and focusing on core concepts in ${subject}.`;
                  } else if (score < 70) {
                    recommendation = `Current score is ${score}%. Review past assessments to identify specific areas of difficulty in ${subject} and practice those topics.`;
                  } else {
                    recommendation = `Current score is ${score}%. While this is a decent score, targeted practice on challenging topics could help improve performance in ${subject}.`;
                  }

                  return (
                    <li key={subject} className="bg-blue-50 p-3 rounded-md">
                      <p className="font-medium">Focus on improving {subject}</p>
                      <p className="text-sm text-gray-600 mt-1">{recommendation}</p>
                    </li>
                  );
                })}

              {/* Component-specific recommendations */}
              {Object.entries(componentPerformance)
                .sort((a, b) => a[1] - b[1])
                .slice(0, 1)
                .map(([component, score]) => (
                  <li key={component} className="bg-yellow-50 p-3 rounded-md">
                    <p className="font-medium">Strengthen {component} skills</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Your average score in {component} assessments is {score}%. Focus on improving this specific area as it contributes significantly to your overall grade.
                    </p>
                  </li>
                ))}

              {/* Progress-based recommendations */}
              {Object.keys(studentProgress).length > 1 && (
                <li className="bg-green-50 p-3 rounded-md">
                  <p className="font-medium">Track your progress</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {Object.values(studentProgress).reduce((a, b) => a + b, 0) / Object.values(studentProgress).length >
                     Object.values(studentProgress)[0] ?
                      "You're showing improvement over time. Keep up the good work and continue with your current study strategies." :
                      "Your performance has been fluctuating. Consider establishing a more consistent study routine and seeking help in challenging areas."}
                  </p>
                </li>
              )}

              {/* Personalized recommendation based on overall performance */}
              <li className="bg-purple-50 p-3 rounded-md">
                <p className="font-medium">Personalized learning plan</p>
                <p className="text-sm text-gray-600 mt-1">
                  {scores.reduce((sum, score) => sum + (score.finalScore || 0), 0) / scores.length > 75 ?
                    "Your overall performance is strong. Consider exploring advanced topics or enrichment activities to further enhance your learning." :
                    "Creating a structured study plan with specific goals for each subject could help improve your overall performance. Consider meeting with your teacher to discuss strategies."}
                </p>
              </li>
            </ul>
          </div>
        ) : (
          <p className="text-gray-500">Not enough data to provide recommendations.</p>
        )}
      </div>
    </div>
  );
}
