import { useState } from 'react';
import { Student } from '@/types';
import Link from 'next/link';

// Types for AI insight data
type RiskStudentData = {
  student: Student;
  riskScore: number;
  riskFactors: string[];
  trendDirection: 'improving' | 'declining' | 'stable';
};

type TopPerformerData = {
  student: Student;
  averageScore: number;
  strongestSubjects: string[];
  trendDirection: 'improving' | 'declining' | 'stable';
};

type PerformanceSummary = {
  summary: string;
  classAverage: number;
  topSubjects: string[];
  improvementAreas: string[];
};

type ScoreAnomaly = {
  studentId: string;
  studentName: string;
  subjectId: string;
  subjectName: string;
  anomalyType: 'sudden-drop' | 'sudden-improvement' | 'inconsistent-performance';
  description: string;
  severity: 'low' | 'medium' | 'high';
};

// Helper function for rendering trend indicators
const TrendIndicator = ({ trend }: { trend: 'improving' | 'declining' | 'stable' }) => {
  if (trend === 'improving') {
    return (
      <span className="inline-flex items-center text-green-600">
        <svg xmlns="http://www.w3.org/2000/svg" className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        Improving
      </span>
    );
  } else if (trend === 'declining') {
    return (
      <span className="inline-flex items-center text-red-600">
        <svg xmlns="http://www.w3.org/2000/svg" className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
        </svg>
        Declining
      </span>
    );
  }
  
  return (
    <span className="inline-flex items-center text-gray-500">
      <svg xmlns="http://www.w3.org/2000/svg" className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
      </svg>
      Stable
    </span>
  );
};

// At-risk students component
export function AtRiskStudentsInsight({ students }: { students: RiskStudentData[] }) {
  const [expanded, setExpanded] = useState(false);
  const displayStudents = expanded ? students : students.slice(0, 5);
  
  return (
    <div className="rounded-lg border border-red-100 bg-white p-6 shadow-md">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Students Needing Support</h3>
          <p className="text-sm text-gray-500">
            {students.length} {students.length === 1 ? 'student' : 'students'} identified at risk
          </p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </span>
      </div>

      {students.length === 0 ? (
        <div className="rounded-lg bg-gray-50 py-6 text-center">
          <p className="text-gray-500">No students currently identified as at-risk</p>
        </div>
      ) : (
        <>
          <div className="mb-3 overflow-hidden rounded-lg border border-gray-100">
            {displayStudents.map((item, index) => (
              <div 
                key={item.student.id} 
                className={`flex flex-col border-gray-100 bg-white p-4 sm:flex-row sm:items-center ${
                  index !== displayStudents.length - 1 ? 'border-b' : ''
                }`}
              >
                <div className="mb-2 sm:mb-0 sm:w-1/3">
                  <div className="font-medium">
                    <Link href={`/students/${item.student.id}`} className="text-blue-600 hover:underline">
                      {item.student.name}
                    </Link>
                  </div>
                  <div className="mt-1 text-sm text-gray-500">Risk score: {item.riskScore}/100</div>
                </div>
                <div className="mb-2 sm:mb-0 sm:w-1/3">
                  <div className="text-sm text-gray-700">
                    <ul className="list-disc pl-4">
                      {item.riskFactors.map((factor, i) => (
                        <li key={i}>{factor}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:w-1/3 sm:justify-end">
                  <TrendIndicator trend={item.trendDirection} />
                </div>
              </div>
            ))}
          </div>
          
          {students.length > 5 && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                {expanded ? 'Show less' : `Show ${students.length - 5} more`}
              </button>
            </div>
          )}
          
          <div className="mt-4 text-right">
            <button className="rounded-md bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100">
              Generate Intervention Plan
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// Top performers component
export function TopPerformersInsight({ students }: { students: TopPerformerData[] }) {
  const [expanded, setExpanded] = useState(false);
  const displayStudents = expanded ? students : students.slice(0, 5);
  
  return (
    <div className="rounded-lg border border-green-100 bg-white p-6 shadow-md">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Top Performers</h3>
          <p className="text-sm text-gray-500">
            {students.length} {students.length === 1 ? 'student' : 'students'} showing exceptional performance
          </p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50 text-green-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </span>
      </div>

      {students.length === 0 ? (
        <div className="rounded-lg bg-gray-50 py-6 text-center">
          <p className="text-gray-500">No top performers identified</p>
        </div>
      ) : (
        <>
          <div className="mb-3 overflow-hidden rounded-lg border border-gray-100">
            {displayStudents.map((item, index) => (
              <div 
                key={item.student.id} 
                className={`flex flex-col border-gray-100 bg-white p-4 sm:flex-row sm:items-center ${
                  index !== displayStudents.length - 1 ? 'border-b' : ''
                }`}
              >
                <div className="mb-2 sm:mb-0 sm:w-1/3">
                  <div className="font-medium">
                    <Link href={`/students/${item.student.id}`} className="text-blue-600 hover:underline">
                      {item.student.name}
                    </Link>
                  </div>
                  <div className="mt-1 text-sm text-gray-500">Average: {item.averageScore.toFixed(1)}%</div>
                </div>
                <div className="mb-2 sm:mb-0 sm:w-1/3">
                  <div className="text-sm text-gray-700">
                    {item.strongestSubjects.length > 0 ? (
                      <>
                        <div className="font-medium">Strongest in:</div>
                        <div>{item.strongestSubjects.join(', ')}</div>
                      </>
                    ) : (
                      <div>Strong overall performance</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between sm:w-1/3 sm:justify-end">
                  <TrendIndicator trend={item.trendDirection} />
                </div>
              </div>
            ))}
          </div>
          
          {students.length > 5 && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                {expanded ? 'Show less' : `Show ${students.length - 5} more`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Performance summary component
export function PerformanceSummaryInsight({ data }: { data: PerformanceSummary }) {
  return (
    <div className="rounded-lg border border-blue-100 bg-white p-6 shadow-md">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">AI Performance Summary</h3>
          <p className="text-sm text-gray-500">
            Generated insights based on student performance data
          </p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </span>
      </div>

      <div className="rounded-lg bg-blue-50 p-4 text-blue-700">
        <p>{data.summary}</p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg bg-gray-50 p-4">
          <h4 className="mb-2 font-medium text-gray-700">Class Average</h4>
          <div className="flex items-end">
            <span className="text-3xl font-bold text-gray-900">{data.classAverage.toFixed(1)}%</span>
          </div>
        </div>

        <div className="rounded-lg bg-gray-50 p-4">
          <h4 className="mb-2 font-medium text-gray-700">Top Subjects</h4>
          {data.topSubjects.length > 0 ? (
            <ul className="list-disc pl-4 text-sm">
              {data.topSubjects.slice(0, 3).map((subject, index) => (
                <li key={index} className="mb-1">{subject}</li>
              ))}
              {data.topSubjects.length > 3 && (
                <li className="text-gray-500">+{data.topSubjects.length - 3} more</li>
              )}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No top subjects identified</p>
          )}
        </div>

        <div className="rounded-lg bg-gray-50 p-4">
          <h4 className="mb-2 font-medium text-gray-700">Areas for Improvement</h4>
          {data.improvementAreas.length > 0 ? (
            <ul className="list-disc pl-4 text-sm">
              {data.improvementAreas.slice(0, 3).map((subject, index) => (
                <li key={index} className="mb-1">{subject}</li>
              ))}
              {data.improvementAreas.length > 3 && (
                <li className="text-gray-500">+{data.improvementAreas.length - 3} more</li>
              )}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No improvement areas identified</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Anomaly detection component
export function AnomalyInsight({ anomalies }: { anomalies: ScoreAnomaly[] }) {
  const [expanded, setExpanded] = useState(false);
  const displayAnomalies = expanded ? anomalies : anomalies.slice(0, 5);
  
  // Helper for severity badges
  const getSeverityBadge = (severity: 'low' | 'medium' | 'high') => {
    const colors = {
      low: 'bg-yellow-100 text-yellow-800',
      medium: 'bg-orange-100 text-orange-800',
      high: 'bg-red-100 text-red-800',
    };
    
    return (
      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${colors[severity]}`}>
        {severity.charAt(0).toUpperCase() + severity.slice(1)}
      </span>
    );
  };
  
  // Helper for anomaly type badges
  const getAnomalyTypeBadge = (type: 'sudden-drop' | 'sudden-improvement' | 'inconsistent-performance') => {
    const labels = {
      'sudden-drop': 'Sudden Drop',
      'sudden-improvement': 'Sudden Improvement',
      'inconsistent-performance': 'Inconsistent',
    };
    
    const colors = {
      'sudden-drop': 'bg-red-100 text-red-800',
      'sudden-improvement': 'bg-green-100 text-green-800',
      'inconsistent-performance': 'bg-purple-100 text-purple-800',
    };
    
    return (
      <span className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${colors[type]}`}>
        {labels[type]}
      </span>
    );
  };
  
  return (
    <div className="rounded-lg border border-purple-100 bg-white p-6 shadow-md">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Score Anomalies</h3>
          <p className="text-sm text-gray-500">
            {anomalies.length} unusual patterns detected in student scores
          </p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-50 text-purple-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </span>
      </div>

      {anomalies.length === 0 ? (
        <div className="rounded-lg bg-gray-50 py-6 text-center">
          <p className="text-gray-500">No anomalies detected in student scores</p>
        </div>
      ) : (
        <>
          <div className="mb-3 overflow-hidden rounded-lg border border-gray-100">
            {displayAnomalies.map((anomaly, index) => (
              <div 
                key={`${anomaly.studentId}-${anomaly.subjectId}-${index}`} 
                className={`border-gray-100 bg-white p-4 ${
                  index !== displayAnomalies.length - 1 ? 'border-b' : ''
                }`}
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Link href={`/students/${anomaly.studentId}`} className="font-medium text-blue-600 hover:underline">
                    {anomaly.studentName}
                  </Link>
                  <span className="text-gray-400">•</span>
                  <span className="text-sm text-gray-700">{anomaly.subjectName}</span>
                  <span className="ml-auto flex-shrink-0">{getSeverityBadge(anomaly.severity)}</span>
                </div>
                
                <div className="mb-2 text-sm text-gray-700">
                  {anomaly.description}
                </div>
                
                <div>
                  {getAnomalyTypeBadge(anomaly.anomalyType)}
                </div>
              </div>
            ))}
          </div>
          
          {anomalies.length > 5 && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                {expanded ? 'Show less' : `Show ${anomalies.length - 5} more anomalies`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}