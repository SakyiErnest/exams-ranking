'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getDocument, getStudentScoresBySubject, getAssessmentComponentsBySubject, getStudentsByGradeLevel } from '@/lib/db';
import { Subject, GradeLevel, Student, StudentScore, AssessmentComponent } from '@/types';
import type { jsPDF as JsPDFType } from 'jspdf';

// Define type for jsPDF with autotable extension
type JsPDFWithAutoTable = JsPDFType & {
    lastAutoTable: {
        finalY: number;
    };
};

type RankedStudent = {
    id: string;
    name: string;
    totalScore: number;
    examScore: number;
    assessmentScore: number;
    rank: number;
    rankLabel: string;
    performance: 'excellent' | 'good' | 'average' | 'poor';
};

function ReportContent() {
    const [subject, setSubject] = useState<Subject | null>(null);
    const [gradeLevel, setGradeLevel] = useState<GradeLevel | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [scores, setScores] = useState<StudentScore[]>([]);
    const [components, setComponents] = useState<AssessmentComponent[]>([]);
    const [rankedStudents, setRankedStudents] = useState<RankedStudent[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState('');
    const [reportGenerated, setReportGenerated] = useState(false);

    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const subjectId = searchParams?.get('subjectId');
    const gradeId = searchParams?.get('gradeId');

    useEffect(() => {
        const fetchData = async () => {
            if (!user) {
                router.push('/login');
                return;
            }

            if (!subjectId || !gradeId) {
                setError('Missing required parameters. Please select a subject and grade level.');
                setIsLoading(false);
                return;
            }

            try {
                // Fetch the subject
                const subjectData = await getDocument<Subject>('subjects', subjectId);
                if (!subjectData) {
                    setError('Subject not found');
                    setIsLoading(false);
                    return;
                }
                setSubject(subjectData);

                // Fetch the grade level
                const gradeLevelData = await getDocument<GradeLevel>('gradeLevels', gradeId);
                if (!gradeLevelData) {
                    setError('Grade level not found');
                    setIsLoading(false);
                    return;
                }
                setGradeLevel(gradeLevelData);

                // Fetch students for this grade level
                const studentsData = await getStudentsByGradeLevel(gradeId, user.uid);
                setStudents(studentsData);

                // Fetch assessment components for this subject
                const componentsData = await getAssessmentComponentsBySubject(subjectId, user.uid);
                setComponents(componentsData);

                // Fetch scores for this subject
                const scoresData = await getStudentScoresBySubject(subjectId, user.uid);
                setScores(scoresData);

                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
                setError('Failed to load required data');
                setIsLoading(false);
            }
        };

        fetchData();
    }, [user, router, subjectId, gradeId]);

    const generateReport = () => {
        setIsGenerating(true);

        try {
            // For each student, calculate their total score
            const studentsWithScores: RankedStudent[] = students.map(student => {
                // Find this student's score record
                const scoreRecord = scores.find(score => score.studentId === student.id);

                // Default values if no score record is found
                let examScore = 0;
                let assessmentScore = 0;

                if (scoreRecord) {
                    examScore = scoreRecord.examScore || 0;

                    // Calculate assessment score
                    if (scoreRecord.classAssessmentScores && components.length > 0) {
                        let weightedTotal = 0;
                        let weightSum = 0;

                        for (const component of components) {
                            const score = scoreRecord.classAssessmentScores[component.id] || 0;
                            weightedTotal += (score * (component.weight || 1));
                            weightSum += (component.weight || 1);
                        }

                        // Calculate weighted average if there are weights
                        if (weightSum > 0) {
                            assessmentScore = weightedTotal / weightSum;
                        }
                    }
                }

                // Calculate total score (50% exam, 50% assessment)
                const totalScore = (examScore * 0.5) + (assessmentScore * 0.5);

                // Determine performance category
                let performance: 'excellent' | 'good' | 'average' | 'poor' = 'average';
                if (totalScore >= 80) {
                    performance = 'excellent';
                } else if (totalScore >= 65) {
                    performance = 'good';
                } else if (totalScore >= 50) {
                    performance = 'average';
                } else {
                    performance = 'poor';
                }

                return {
                    id: student.id,
                    name: student.name,
                    totalScore,
                    examScore,
                    assessmentScore,
                    rank: 0, // Will be filled in after sorting
                    rankLabel: '', // Will be filled in after sorting
                    performance
                };
            });

            // Sort students by total score (descending)
            studentsWithScores.sort((a, b) => b.totalScore - a.totalScore);

            // Assign ranks
            studentsWithScores.forEach((student, index) => {
                student.rank = index + 1;

                // Create rank label (1st, 2nd, 3rd, etc.)
                if (student.rank === 1) {
                    student.rankLabel = '1st';
                } else if (student.rank === 2) {
                    student.rankLabel = '2nd';
                } else if (student.rank === 3) {
                    student.rankLabel = '3rd';
                } else {
                    student.rankLabel = `${student.rank}th`;
                }
            });

            setRankedStudents(studentsWithScores);
            setReportGenerated(true);
        } catch (error) {
            console.error('Error generating report:', error);
            setError('Failed to generate report');
        } finally {
            setIsGenerating(false);
        }
    };

    // Helper function to export the report to PDF (simplified implementation)
    const exportToPDF = () => {
        // Import dynamically to avoid SSR issues
        import('jspdf').then(({ default: jsPDF }) => {
            import('jspdf-autotable').then(({ default: autoTable }) => {
                const doc = new jsPDF() as unknown as JsPDFWithAutoTable;

                // Add report title
                doc.setFontSize(18);
                doc.setTextColor(0, 51, 102); // Dark blue color
                doc.text('Student Ranking Report', 14, 20);

                // Add report details
                doc.setFontSize(12);
                doc.setTextColor(0, 0, 0);
                doc.text(`Subject: ${subject?.name || 'N/A'}`, 14, 30);
                doc.text(`Grade Level: ${gradeLevel?.name || 'N/A'}`, 14, 38);
                doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 46);
                doc.text(`Total Students: ${students.length}`, 14, 54);

                // Create table data
                const tableData = rankedStudents.map(student => [
                    student.rankLabel,
                    student.name,
                    student.examScore.toFixed(1),
                    student.assessmentScore.toFixed(1),
                    student.totalScore.toFixed(1),
                    student.performance
                ]);

                // Add table
                autoTable(doc, {
                    startY: 65,
                    head: [['Rank', 'Student Name', 'Exam (50%)', 'Assessment (50%)', 'Total Score', 'Performance']],
                    body: tableData,
                    headStyles: {
                        fillColor: [0, 71, 171],
                        textColor: 255,
                        fontStyle: 'bold'
                    },
                    columnStyles: {
                        0: { cellWidth: 20 },
                        1: { cellWidth: 50 },
                        2: { cellWidth: 25, halign: 'center' },
                        3: { cellWidth: 30, halign: 'center' },
                        4: { cellWidth: 25, halign: 'center' },
                        5: { cellWidth: 30, halign: 'center' }
                    },
                    alternateRowStyles: {
                        fillColor: [240, 240, 240]
                    },
                    didDrawCell: (data) => {
                        // Add colors to performance cells
                        if (data.column.index === 5 && data.cell.section === 'body') {
                            const performance = rankedStudents[data.row.index].performance;
                            let color: [number, number, number];

                            switch(performance) {
                                case 'excellent':
                                    color = [200, 250, 200]; // Light green
                                    break;
                                case 'good':
                                    color = [200, 220, 250]; // Light blue
                                    break;
                                case 'average':
                                    color = [250, 250, 200]; // Light yellow
                                    break;
                                case 'poor':
                                    color = [250, 200, 200]; // Light red
                                    break;
                                default:
                                    color = [255, 255, 255]; // White
                            }

                            // Fill cell with performance color
                            doc.setFillColor(...color);
                            doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');

                            // Re-add the text since we covered it
                            doc.setTextColor(0);
                            doc.text(
                                performance,
                                data.cell.x + data.cell.width / 2,
                                data.cell.y + data.cell.height / 2,
                                { align: 'center', baseline: 'middle' }
                            );
                        }
                    }
                });

                // Add performance legend
                const finalY = doc.lastAutoTable.finalY + 10;
                doc.setFontSize(11);
                doc.text('Performance Categories:', 14, finalY);

                const categories: Array<{ name: string, color: [number, number, number] }> = [
                    { name: 'Excellent: 80% and above', color: [200, 250, 200] },
                    { name: 'Good: 65-79%', color: [200, 220, 250] },
                    { name: 'Average: 50-64%', color: [250, 250, 200] },
                    { name: 'Poor: Below 50%', color: [250, 200, 200] }
                ];

                categories.forEach((category, index) => {
                    const y = finalY + 8 + (index * 8);

                    // Draw colored rectangle
                    doc.setFillColor(...category.color);
                    doc.rect(14, y - 3, 5, 5, 'F');

                    // Add category text
                    doc.setTextColor(0);
                    doc.text(category.name, 24, y);
                });

                // Add footer
                doc.setFontSize(10);
                doc.setTextColor(100);
                doc.text('Generated by EduGrade Pro', 14, doc.internal.pageSize.height - 10);

                // Save PDF
                doc.save(`${subject?.name || 'Subject'}_${gradeLevel?.name || 'Grade'}_Ranking.pdf`);
            });
        });
    };

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="text-center">
                    <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-600"></div>
                    <p>Loading data...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Generate Report</h1>
                <p className="mt-2 text-lg text-gray-600">
                    Generate student ranking report
                </p>
            </header>

            {error && (
                <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">
                                {subject?.name || 'Subject'} - {gradeLevel?.name || 'Grade Level'}
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                {students.length} Students | {components.length} Assessment Components
                            </p>
                        </div>
                        {!reportGenerated && (
                            <button
                                type="button"
                                onClick={generateReport}
                                disabled={isGenerating || students.length === 0}
                                className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:bg-gray-400 sm:mt-0"
                            >
                                {isGenerating ? 'Generating...' : 'Generate Ranking'}
                            </button>
                        )}
                        {reportGenerated && (
                            <button
                                type="button"
                                onClick={exportToPDF}
                                className="mt-4 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 sm:mt-0"
                            >
                                Export to PDF
                            </button>
                        )}
                    </div>
                </div>

                {/* Render the report if it's been generated */}
                {reportGenerated && (
                    <div className="p-6">
                        <div className="mb-6">
                            <h3 className="mb-2 text-lg font-semibold text-gray-900">Student Rankings</h3>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                Rank
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                Student Name
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                                                Exam (50%)
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                                                Assessment (50%)
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                                                Total Score
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                                                Performance
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {rankedStudents.map(student => (
                                            <tr key={student.id} className="hover:bg-gray-50">
                                                <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-gray-900">
                                                    {student.rankLabel}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                                                    {student.name}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-center text-sm text-gray-500">
                                                    {student.examScore.toFixed(1)}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-center text-sm text-gray-500">
                                                    {student.assessmentScore.toFixed(1)}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-center text-sm font-bold text-gray-900">
                                                    {student.totalScore.toFixed(1)}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-center">
                                                    <span
                                                        className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${student.performance === 'excellent'
                                                            ? 'bg-green-100 text-green-800'
                                                            : student.performance === 'good'
                                                                ? 'bg-blue-100 text-blue-800'
                                                                : student.performance === 'average'
                                                                    ? 'bg-yellow-100 text-yellow-800'
                                                                    : 'bg-red-100 text-red-800'
                                                            }`}
                                                    >
                                                        {student.performance}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="mt-6 rounded-md bg-gray-50 p-4">
                            <h3 className="mb-2 text-sm font-semibold text-gray-700">Performance Categories</h3>
                            <div className="flex flex-wrap gap-3">
                                <div className="flex items-center">
                                    <span className="mr-2 inline-block h-3 w-3 rounded-full bg-green-400"></span>
                                    <span className="text-xs text-gray-600">Excellent: 80% and above</span>
                                </div>
                                <div className="flex items-center">
                                    <span className="mr-2 inline-block h-3 w-3 rounded-full bg-blue-400"></span>
                                    <span className="text-xs text-gray-600">Good: 65-79%</span>
                                </div>
                                <div className="flex items-center">
                                    <span className="mr-2 inline-block h-3 w-3 rounded-full bg-yellow-400"></span>
                                    <span className="text-xs text-gray-600">Average: 50-64%</span>
                                </div>
                                <div className="flex items-center">
                                    <span className="mr-2 inline-block h-3 w-3 rounded-full bg-red-400"></span>
                                    <span className="text-xs text-gray-600">Poor: Below 50%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function GenerateReport() {
    return (
        <Suspense fallback={<div className="flex h-64 items-center justify-center">
            <div className="text-center">
                <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-600"></div>
                <p>Loading report page...</p>
            </div>
        </div>}>
            <ReportContent />
        </Suspense>
    );
}