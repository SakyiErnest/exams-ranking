'use client';

import React, { useState } from 'react';
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
  calculateSubjectAverage,
  calculateGradeDistribution
} from '@/utils/analyticsUtils';

interface ReportGeneratorProps {
  students: Student[];
  subjects: Subject[];
  scores: StudentScore[];
  academicYears: AcademicYear[];
  trimesters: Trimester[];
  gradeLevels: GradeLevel[];
  assessmentComponents: AssessmentComponent[];
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({
  students,
  subjects,
  scores,
  academicYears,
  trimesters,
  gradeLevels,
  assessmentComponents
}) => {
  const [selectedReport, setSelectedReport] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedTrimester, setSelectedTrimester] = useState<string>('');
  const [generating, setGenerating] = useState(false);

  // Function to handle report generation
  const generateReport = () => {
    if (!selectedReport) {
      alert('Please select a report type');
      return;
    }

    setGenerating(true);

    try {
      // Filter subjects based on selections
      const filteredSubjects = subjects.filter(subject => {
        return (
          (!selectedGrade || subject.gradeLevelId === selectedGrade) &&
          (!selectedTrimester || subject.trimesterId === selectedTrimester) &&
          (!selectedYear || subject.academicYearId === selectedYear)
        );
      });

      // Filter scores based on filtered subjects
      const filteredScores = scores.filter(score => {
        return filteredSubjects.some(subject => subject.id === score.subjectId);
      });

      // Filter students based on filtered scores
      const studentList = students.filter(student => {
        return filteredScores.some(score => score.studentId === student.id);
      });

      // Filter assessment components based on filtered subjects
      const filteredComponents = assessmentComponents.filter(component => {
        return filteredSubjects.some(subject => subject.id === component.subjectId);
      });

      console.log(`Generating ${selectedReport} report with:`, {
        students: studentList.length,
        scores: filteredScores.length,
        year: academicYears.find(y => y.id === selectedYear)?.name || 'All',
        trimester: trimesters.find(t => t.id === selectedTrimester)?.name || 'All',
        components: filteredComponents.length
      });

      // Calculate analytics data if needed
      if (filteredScores.length > 0) {
        const averageScore = calculateSubjectAverage(filteredScores);
        const gradeDistribution = calculateGradeDistribution(filteredScores);
        console.log('Analytics:', { averageScore, gradeDistribution });
      }

      // Simulate report generation
      setTimeout(() => {
        setGenerating(false);
        alert('Report generated successfully!');
      }, 1500);
    } catch (error) {
      console.error('Error generating report:', error);
      setGenerating(false);
      alert('An error occurred while generating the report. Please try again.');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Generate Reports</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Report Type
          </label>
          <select
            aria-label="Report Type"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={selectedReport}
            onChange={(e) => setSelectedReport(e.target.value)}
          >
            <option value="">Select Report Type</option>
            <option value="student-performance">Student Performance</option>
            <option value="class-overview">Class Overview</option>
            <option value="assessment-analysis">Assessment Analysis</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Academic Year
          </label>
          <select
            aria-label="Academic Year"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option value="">All Academic Years</option>
            {academicYears.map((year) => (
              <option key={year.id} value={year.id}>
                {year.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Trimester
          </label>
          <select
            aria-label="Trimester"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={selectedTrimester}
            onChange={(e) => setSelectedTrimester(e.target.value)}
          >
            <option value="">All Trimesters</option>
            {trimesters
              .filter(t => !selectedYear || t.academicYearId === selectedYear)
              .map((trimester) => (
                <option key={trimester.id} value={trimester.id}>
                  {trimester.name}
                </option>
              ))}
            {trimesters.filter(t => !selectedYear || t.academicYearId === selectedYear).length === 0 && (
              <option disabled value="">
                No trimesters available for selected year
              </option>
            )}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Grade Level
          </label>
          <select
            aria-label="Grade Level"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
          >
            <option value="">All Grade Levels</option>
            {gradeLevels.map((grade) => (
              <option key={grade.id} value={grade.id}>
                {grade.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4">
        <button
          onClick={generateReport}
          disabled={generating || !selectedReport}
          className={`flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600
            ${generating || !selectedReport ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
        >
          {generating ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </>
          ) : (
            'Generate Report'
          )}
        </button>
      </div>

      <div className="mt-4">
        <p className="text-sm text-gray-500">
          Available data: {students.length} students, {subjects.length} subjects,
          {assessmentComponents.length} assessment components, {scores.length} score records
          {selectedReport && (
            <span className="ml-2 text-blue-600">
              Selected report: {selectedReport.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
          )}
        </p>
      </div>
    </div>
  );
};

export default ReportGenerator;