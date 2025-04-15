'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  AtRiskStudentsInsight, 
  TopPerformersInsight, 
  PerformanceSummaryInsight,
  AnomalyInsight 
} from '@/components/analytics/AiInsights';
import { Student } from '@/types';

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

interface InsightsData {
  atRiskStudents: RiskStudentData[];
  topPerformers: TopPerformerData[];
  summary: PerformanceSummary;
  anomalies: ScoreAnomaly[];
}

export default function AiInsightsDashboard() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [insightsData, setInsightsData] = useState<InsightsData | null>(null);

  useEffect(() => {
    const fetchInsights = async () => {
      if (!user) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/ai-insights?teacherId=${user.uid}&type=all`);
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        setInsightsData(data);
      } catch (error) {
        console.error('Failed to fetch AI insights:', error);
        setError('Failed to load AI insights. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInsights();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-600"></div>
        <h2 className="text-lg font-medium text-gray-700">Analyzing student data...</h2>
        <p className="mt-2 text-gray-500">Our AI is processing performance patterns and generating insights</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6">
        <div className="w-full max-w-3xl rounded-lg bg-red-50 p-6 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-4 h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-lg font-medium text-red-700">Something went wrong</h2>
          <p className="mt-2 text-red-600">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 rounded-md bg-red-100 px-4 py-2 text-red-700 hover:bg-red-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!insightsData) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6">
        <div className="w-full max-w-3xl rounded-lg bg-blue-50 p-6 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-4 h-12 w-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-lg font-medium text-blue-700">No Data Available</h2>
          <p className="mt-2 text-blue-600">
            We need more student performance data to generate AI insights.
            Try adding more students, subjects, and recording scores.
          </p>
        </div>
      </div>
    );
  }

  // Destructure the data we received from the API
  const { atRiskStudents, topPerformers, summary, anomalies } = insightsData;

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">AI Insights Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Machine learning-powered analytics to help you better understand student performance
        </p>
      </div>

      {/* Performance Summary */}
      <div className="mb-8">
        <PerformanceSummaryInsight data={summary} />
      </div>
      
      {/* Grid layout for insights */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* At-Risk Students */}
        <div>
          <AtRiskStudentsInsight students={atRiskStudents} />
        </div>
        
        {/* Top Performers */}
        <div>
          <TopPerformersInsight students={topPerformers} />
        </div>
        
        {/* Anomalies - Full width */}
        <div className="lg:col-span-2">
          <AnomalyInsight anomalies={anomalies} />
        </div>
      </div>
      
      {/* Info Section */}
      <div className="mt-12 rounded-lg bg-blue-50 p-6">
        <h2 className="text-lg font-semibold text-blue-800">About AI Insights</h2>
        <p className="mt-2 text-blue-700">
          These insights are generated using machine learning algorithms that analyze student performance data,
          identify patterns, and predict outcomes. The insights are designed to help teachers identify students who
          may need additional support, recognize exceptional performers, and detect unusual patterns in scores that
          might indicate underlying issues.
        </p>
        <div className="mt-4 rounded-md bg-white p-4 text-sm text-gray-600">
          <p className="font-medium">How insights are calculated:</p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>At-risk students are identified based on average scores, subject-specific performance, and trends over time.</li>
            <li>Top performers are recognized for overall excellence or exceptional performance in specific subjects.</li>
            <li>Anomaly detection identifies significant changes in performance that may warrant attention.</li>
            <li>The performance summary provides a holistic view of class performance with natural language insights.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}