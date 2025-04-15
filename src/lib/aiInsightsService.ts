import { Student, StudentScore } from '@/types';
import { getStudentScoresByStudentId, getStudentsByTeacher, getSubjectsByTeacher } from './db';

/**
 * AI Insights service - provides ML-based analytics for student performance
 */

// Constants for prediction thresholds
const AT_RISK_THRESHOLD = 60; // Below 60% is considered at risk
const HIGH_PERFORMER_THRESHOLD = 85; // Above 85% is considered high performer

// Define a type for objects that might have a toDate method (like Firestore Timestamp)
interface WithToDate {
  toDate: () => Date;
}

// Helper to convert Firestore Timestamp or date-like value to JS Date
function toJsDate(val: unknown): Date {
  if (val instanceof Date) return val;
  if (val && typeof val === 'object' && 'toDate' in val && typeof (val as WithToDate).toDate === 'function') {
    return (val as WithToDate).toDate();
  }
  if (typeof val === 'number' || typeof val === 'string') return new Date(val);
  return new Date(0);
}

/**
 * Identifies students who may be at risk of underperforming
 * @param teacherId - The ID of the teacher
 * @returns Array of students with risk scores and factors
 */
export async function identifyAtRiskStudents(teacherId: string): Promise<Array<{
  student: Student;
  riskScore: number;
  riskFactors: string[];
  trendDirection: 'improving' | 'declining' | 'stable';
}>> {
  try {
    // Get all students for the teacher
    const students = await getStudentsByTeacher(teacherId);
    const atRiskStudents = [];

    // Process each student
    for (const student of students) {
      // Get all scores for this student
      const scores = await getStudentScoresByStudentId(student.id, teacherId);
      
      if (scores.length === 0) continue;
      
      // Calculate average scores
      const averageScore = calculateAverageScore(scores);
      
      // Calculate trend (improving, declining, or stable)
      const trendDirection = calculateTrend(scores);
      
      // Identify risk factors
      const riskFactors = [];
      
      if (averageScore < AT_RISK_THRESHOLD) {
        riskFactors.push('Low overall average');
      }
      
      // Check for consistently low scores in specific subjects
      const subjectPerformance = analyzeSubjectPerformance(scores);
      for (const [subjectId, avg] of Object.entries(subjectPerformance)) {
        if (avg < AT_RISK_THRESHOLD) {
          riskFactors.push(`Struggling in ${subjectId}`);
        }
      }
      
      // Check for declining trend
      if (trendDirection === 'declining') {
        riskFactors.push('Recent performance declining');
      }
      
      // If risk factors exist, add to at-risk list
      if (riskFactors.length > 0) {
        // Calculate risk score (0-100, higher means more at risk)
        const riskScore = calculateRiskScore(averageScore, trendDirection, riskFactors.length);
        
        atRiskStudents.push({
          student,
          riskScore,
          riskFactors,
          trendDirection
        });
      }
    }
    
    // Sort by risk score (highest risk first)
    return atRiskStudents.sort((a, b) => b.riskScore - a.riskScore);
    
  } catch (error) {
    console.error('Error identifying at-risk students:', error);
    return [];
  }
}

/**
 * Identifies high-performing students
 * @param teacherId - The ID of the teacher
 * @returns Array of students with performance metrics
 */
export async function identifyTopPerformers(teacherId: string): Promise<Array<{
  student: Student;
  averageScore: number;
  strongestSubjects: string[];
  trendDirection: 'improving' | 'declining' | 'stable';
}>> {
  try {
    // Get all students for the teacher
    const students = await getStudentsByTeacher(teacherId);
    const topPerformers = [];

    // Process each student
    for (const student of students) {
      // Get all scores for this student
      const scores = await getStudentScoresByStudentId(student.id, teacherId);
      
      if (scores.length === 0) continue;
      
      // Calculate average score
      const averageScore = calculateAverageScore(scores);
      
      // Calculate trend
      const trendDirection = calculateTrend(scores);
      
      // Identify strongest subjects
      const subjectPerformance = analyzeSubjectPerformance(scores);
      const strongestSubjects = Object.entries(subjectPerformance)
        .filter(([, avg]) => avg >= HIGH_PERFORMER_THRESHOLD)
        .map(([subjectId]) => subjectId);
      
      // Add to top performers if overall average is high or has strong subjects
      if (averageScore >= HIGH_PERFORMER_THRESHOLD || strongestSubjects.length > 0) {
        topPerformers.push({
          student,
          averageScore,
          strongestSubjects,
          trendDirection
        });
      }
    }
    
    // Sort by average score (highest first)
    return topPerformers.sort((a, b) => b.averageScore - a.averageScore);
    
  } catch (error) {
    console.error('Error identifying top performers:', error);
    return [];
  }
}

/**
 * Generates a natural language summary of class performance
 * @param teacherId - The ID of the teacher
 * @returns A detailed natural language summary
 */
export async function generatePerformanceSummary(teacherId: string): Promise<{
  summary: string;
  classAverage: number;
  topSubjects: string[];
  improvementAreas: string[];
}> {
  try {
    // Get all subjects and all students
    const subjects = await getSubjectsByTeacher(teacherId);
    const students = await getStudentsByTeacher(teacherId);
    
    if (subjects.length === 0 || students.length === 0) {
      return {
        summary: "Not enough data to generate a performance summary.",
        classAverage: 0,
        topSubjects: [],
        improvementAreas: []
      };
    }
    
    // Get average scores per subject
    const subjectScores: Record<string, number[]> = {};
    
    // Initialize with empty arrays for each subject
    subjects.forEach(subject => {
      subjectScores[subject.name] = [];
    });
    
    // Collect scores for each subject
    for (const student of students) {
      const scores = await getStudentScoresByStudentId(student.id, teacherId);
      
      // Organize scores by subject
      scores.forEach(score => {
        const subject = subjects.find(s => s.id === score.subjectId);
        if (subject && score.finalScore !== undefined) {
          subjectScores[subject.name] = subjectScores[subject.name] || [];
          subjectScores[subject.name].push(score.finalScore);
        }
      });
    }
    
    // Calculate average for each subject
    const subjectAverages: Record<string, number> = {};
    let overallScores: number[] = [];
    
    Object.entries(subjectScores).forEach(([subjectId, scores]) => {
      if (scores.length > 0) {
        const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        subjectAverages[subjectId] = avg;
        overallScores = overallScores.concat(scores);
      }
    });
    
    // Calculate overall class average
    const classAverage = overallScores.length > 0 
      ? overallScores.reduce((sum, score) => sum + score, 0) / overallScores.length
      : 0;
    
    // Identify top subjects and improvement areas
    const topSubjects = Object.entries(subjectAverages)
      .filter(([, avg]) => avg >= 75)
      .map(([subjectId]) => subjectId)
      .sort((a, b) => subjectAverages[b] - subjectAverages[a]);
    
    const improvementAreas = Object.entries(subjectAverages)
      .filter(([, avg]) => avg < 70)
      .map(([subjectId]) => subjectId)
      .sort((a, b) => subjectAverages[a] - subjectAverages[b]);
    
    // Generate the natural language summary
    let summary = `Class performance analysis based on ${students.length} students across ${subjects.length} subjects. `;
    
    summary += `The overall class average is ${classAverage.toFixed(1)}%. `;
    
    if (topSubjects.length > 0) {
      summary += `The class is performing particularly well in ${topSubjects.join(', ')}. `;
    }
    
    if (improvementAreas.length > 0) {
      summary += `Areas needing attention include ${improvementAreas.join(', ')}. `;
    }
    
    // Add insights about at-risk and top performers
    const atRiskStudents = await identifyAtRiskStudents(teacherId);
    const topPerformers = await identifyTopPerformers(teacherId);
    
    summary += `There are ${atRiskStudents.length} students at risk of underperforming who may need additional support. `;
    summary += `${topPerformers.length} students are demonstrating exceptional performance in one or more subjects.`;
    
    return {
      summary,
      classAverage,
      topSubjects,
      improvementAreas
    };
    
  } catch (error) {
    console.error('Error generating performance summary:', error);
    return {
      summary: "An error occurred while generating the performance summary.",
      classAverage: 0,
      topSubjects: [],
      improvementAreas: []
    };
  }
}

/**
 * Detects anomalies in student scores that might indicate issues
 * @param teacherId - The ID of the teacher
 * @returns Array of detected anomalies
 */
export async function detectScoreAnomalies(teacherId: string): Promise<Array<{
  studentId: string;
  studentName: string;
  subjectId: string;
  subjectName: string;
  anomalyType: 'sudden-drop' | 'sudden-improvement' | 'inconsistent-performance';
  description: string;
  severity: 'low' | 'medium' | 'high';
}>> {
  try {
    const students = await getStudentsByTeacher(teacherId);
    const subjects = await getSubjectsByTeacher(teacherId);
    const anomalies: Array<{
      studentId: string;
      studentName: string;
      subjectId: string;
      subjectName: string;
      anomalyType: 'sudden-drop' | 'sudden-improvement' | 'inconsistent-performance';
      description: string;
      severity: 'low' | 'medium' | 'high';
    }> = [];
    
    for (const student of students) {
      const scores = await getStudentScoresByStudentId(student.id, teacherId);
      
      // Group scores by subject
      const scoresBySubject: Record<string, StudentScore[]> = {};
      
      scores.forEach(score => {
        if (!scoresBySubject[score.subjectId]) {
          scoresBySubject[score.subjectId] = [];
        }
        scoresBySubject[score.subjectId].push(score);
      });
      
      // Analyze each subject for anomalies
      Object.entries(scoresBySubject).forEach(([subjectId, subjectScores]) => {
        // Sort scores by date (handle Timestamp, string, number, or undefined)
        const sortedScores = [...subjectScores].sort((a, b) => {
          const dateA = toJsDate(a.createdAt).getTime();
          const dateB = toJsDate(b.createdAt).getTime();
          return dateA - dateB;
        });
        
        if (sortedScores.length < 2) return; // Need at least 2 scores to detect anomalies
        
        // Check for sudden drops or improvements
        for (let i = 1; i < sortedScores.length; i++) {
          const prevScore = sortedScores[i - 1].finalScore || 0;
          const currScore = sortedScores[i].finalScore || 0;
          const difference = currScore - prevScore;
          
          const subject = subjects.find(s => s.id === subjectId);
          const subjectName = subject ? subject.name : 'Unknown Subject';
          
          // Sudden drop (20% or more)
          if (difference <= -20) {
            anomalies.push({
              studentId: student.id,
              studentName: student.name,
              subjectId,
              subjectName,
              anomalyType: 'sudden-drop',
              description: `${student.name}'s score in ${subjectName} dropped by ${Math.abs(difference).toFixed(1)}% from ${prevScore.toFixed(1)}% to ${currScore.toFixed(1)}%`,
              severity: difference <= -30 ? 'high' : 'medium'
            });
          }
          
          // Sudden improvement (25% or more)
          if (difference >= 25) {
            anomalies.push({
              studentId: student.id,
              studentName: student.name,
              subjectId,
              subjectName,
              anomalyType: 'sudden-improvement',
              description: `${student.name}'s score in ${subjectName} improved by ${difference.toFixed(1)}% from ${prevScore.toFixed(1)}% to ${currScore.toFixed(1)}%`,
              severity: difference >= 40 ? 'high' : 'medium'
            });
          }
        }
        
        // Check for inconsistent performance
        if (sortedScores.length >= 3) {
          const scores = sortedScores.map(s => s.finalScore || 0);
          const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
          
          // Calculate standard deviation
          const squareDiffs = scores.map(score => Math.pow(score - mean, 2));
          const avgSquareDiff = squareDiffs.reduce((sum, diff) => sum + diff, 0) / squareDiffs.length;
          const stdDev = Math.sqrt(avgSquareDiff);
          
          // High standard deviation indicates inconsistent performance
          if (stdDev > 15) {
            const subject = subjects.find(s => s.id === subjectId);
            const subjectName = subject ? subject.name : 'Unknown Subject';
            
            anomalies.push({
              studentId: student.id,
              studentName: student.name,
              subjectId,
              subjectName,
              anomalyType: 'inconsistent-performance',
              description: `${student.name} shows highly variable performance in ${subjectName} (standard deviation: ${stdDev.toFixed(1)}%)`,
              severity: stdDev > 25 ? 'high' : 'medium'
            });
          }
        }
      });
    }
    
    return anomalies;
    
  } catch (error) {
    console.error('Error detecting score anomalies:', error);
    return [];
  }
}

// Utility functions for calculations

/**
 * Calculates average score from array of student scores
 */
function calculateAverageScore(scores: StudentScore[]): number {
  const validScores = scores.filter(score => score.finalScore !== undefined);
  
  if (validScores.length === 0) return 0;
  
  const sum = validScores.reduce((total, score) => total + (score.finalScore || 0), 0);
  return sum / validScores.length;
}

/**
 * Analyzes scores by subject and returns average per subject
 */
function analyzeSubjectPerformance(scores: StudentScore[]): Record<string, number> {
  const subjectScores: Record<string, number[]> = {};
  
  // Group scores by subject
  scores.forEach(score => {
    if (score.finalScore !== undefined) {
      if (!subjectScores[score.subjectId]) {
        subjectScores[score.subjectId] = [];
      }
      subjectScores[score.subjectId].push(score.finalScore);
    }
  });
  
  // Calculate average for each subject
  const subjectAverages: Record<string, number> = {};
  
  Object.entries(subjectScores).forEach(([subjectId, scores]) => {
    if (scores.length > 0) {
      subjectAverages[subjectId] = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    }
  });
  
  return subjectAverages;
}

/**
 * Determines if student performance is improving, declining, or stable
 */
function calculateTrend(scores: StudentScore[]): 'improving' | 'declining' | 'stable' {
  if (scores.length < 3) return 'stable'; // Not enough data
  
  // Sort scores by date (handle Timestamp, string, number, or undefined)
  const sortedScores = [...scores].sort((a, b) => {
    const dateA = toJsDate(a.createdAt).getTime();
    const dateB = toJsDate(b.createdAt).getTime();
    return dateA - dateB;
  });
  
  // Get final scores, filtering out undefined values
  const finalScores = sortedScores
    .filter(score => score.finalScore !== undefined)
    .map(score => score.finalScore || 0);
  
  if (finalScores.length < 3) return 'stable'; // Not enough data after filtering
  
  // Split into two halves to compare
  const midpoint = Math.floor(finalScores.length / 2);
  const firstHalf = finalScores.slice(0, midpoint);
  const secondHalf = finalScores.slice(midpoint);
  
  // Calculate averages for both halves
  const firstAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length;
  
  // Determine trend based on difference
  const difference = secondAvg - firstAvg;
  
  if (difference >= 5) return 'improving';
  if (difference <= -5) return 'declining';
  return 'stable';
}

/**
 * Calculates a risk score for a student
 */
function calculateRiskScore(averageScore: number, trend: 'improving' | 'declining' | 'stable', riskFactorCount: number): number {
  // Base score inversely proportional to average (lower average = higher risk)
  const baseScore = Math.max(0, 100 - averageScore);
  
  // Adjust based on trend
  let trendAdjustment = 0;
  if (trend === 'declining') trendAdjustment = 20;
  if (trend === 'improving') trendAdjustment = -10;
  
  // Adjust based on number of risk factors
  const riskFactorAdjustment = riskFactorCount * 5;
  
  // Calculate final score (capped at 0-100)
  return Math.min(100, Math.max(0, baseScore + trendAdjustment + riskFactorAdjustment));
}