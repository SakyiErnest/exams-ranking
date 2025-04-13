import { StudentScore, Student, Subject, AssessmentComponent } from '@/types';

/**
 * Calculate the average score for a set of scores
 */
export function calculateSubjectAverage(scores: StudentScore[]): number {
  if (scores.length === 0) return 0;
  
  let total = 0;
  let count = 0;
  
  scores.forEach(score => {
    if (score.finalScore) {
      total += score.finalScore;
      count++;
    }
  });
  
  return count > 0 ? Math.round((total / count) * 10) / 10 : 0;
}

/**
 * Calculate grade distribution for scores
 */
export function calculateGradeDistribution(scores: StudentScore[]): { [grade: string]: number } {
  const distribution: { [grade: string]: number } = {
    'A (80-100%)': 0,
    'B (70-79%)': 0,
    'C (60-69%)': 0,
    'D (50-59%)': 0,
    'F (0-49%)': 0
  };
  
  if (scores.length === 0) return distribution;
  
  scores.forEach(score => {
    const finalScore = score.finalScore || 0;
    
    if (finalScore >= 80) {
      distribution['A (80-100%)']++;
    } else if (finalScore >= 70) {
      distribution['B (70-79%)']++;
    } else if (finalScore >= 60) {
      distribution['C (60-69%)']++;
    } else if (finalScore >= 50) {
      distribution['D (50-59%)']++;
    } else {
      distribution['F (0-49%)']++;
    }
  });
  
  return distribution;
}

/**
 * Calculate performance by assessment component
 */
export function calculateComponentPerformance(
  scores: StudentScore[],
  components: AssessmentComponent[]
): { [componentName: string]: number } {
  const performance: { [componentName: string]: { total: number; count: number } } = {};
  
  // Initialize performance tracking for each component
  components.forEach(component => {
    performance[component.name] = { total: 0, count: 0 };
  });
  
  // Aggregate scores by component
  scores.forEach(score => {
    if (score.classAssessmentScores) {
      Object.entries(score.classAssessmentScores).forEach(([componentId, value]) => {
        const component = components.find(c => c.id === componentId);
        if (component && component.name) {
          performance[component.name].total += value;
          performance[component.name].count++;
        }
      });
    }
  });
  
  // Calculate averages
  const result: { [componentName: string]: number } = {};
  Object.entries(performance).forEach(([name, data]) => {
    result[name] = data.count > 0 ? Math.round((data.total / data.count) * 10) / 10 : 0;
  });
  
  return result;
}

/**
 * Calculate student progress across trimesters
 */
export function calculateStudentProgress(
  studentId: string,
  scores: StudentScore[],
  subjects: Subject[]
): { [trimesterId: string]: number } {
  const progress: { [trimesterId: string]: { total: number; count: number } } = {};
  
  // Filter scores for this student
  const studentScores = scores.filter(score => score.studentId === studentId);
  
  // Group by trimester
  studentScores.forEach(score => {
    const subject = subjects.find(s => s.id === score.subjectId);
    if (subject && subject.trimesterId && score.finalScore) {
      if (!progress[subject.trimesterId]) {
        progress[subject.trimesterId] = { total: 0, count: 0 };
      }
      progress[subject.trimesterId].total += score.finalScore;
      progress[subject.trimesterId].count++;
    }
  });
  
  // Calculate average score per trimester
  const result: { [trimesterId: string]: number } = {};
  Object.entries(progress).forEach(([trimesterId, data]) => {
    result[trimesterId] = data.count > 0 ? Math.round((data.total / data.count) * 10) / 10 : 0;
  });
  
  return result;
}

/**
 * Calculate top performing students
 */
export function getTopPerformingStudents(
  scores: StudentScore[],
  students: Student[],
  limit: number = 5
): { student: Student; averageScore: number }[] {
  // Group scores by student
  const studentScores: { [studentId: string]: { total: number; count: number } } = {};
  
  scores.forEach(score => {
    if (score.finalScore) {
      if (!studentScores[score.studentId]) {
        studentScores[score.studentId] = { total: 0, count: 0 };
      }
      studentScores[score.studentId].total += score.finalScore;
      studentScores[score.studentId].count++;
    }
  });
  
  // Calculate average for each student
  const studentAverages = Object.entries(studentScores).map(([studentId, data]) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return null;
    
    return {
      student,
      averageScore: Math.round((data.total / data.count) * 10) / 10
    };
  }).filter(Boolean) as { student: Student; averageScore: number }[];
  
  // Sort by average score (descending) and take top N
  return studentAverages.sort((a, b) => b.averageScore - a.averageScore).slice(0, limit);
}
