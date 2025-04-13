// Type definitions for the application
import { Timestamp } from 'firebase/firestore';

// User type (from Firebase Auth)
export interface User {
    uid: string;
    email: string;
    displayName?: string;
}

// Extended user profile stored in Firestore
export interface UserProfile {
    uid: string;
    email: string;
    displayName?: string;
    organizationId: string;
    role: 'admin' | 'teacher' | 'department_head';
    status: 'active' | 'inactive';
    departmentIds?: string[];
    lastLogin?: Timestamp;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    createdBy?: string;
}

// Base entity interface with common fields
export interface BaseEntity {
    id: string;
    organizationId: string;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
    createdBy?: string;
}

// Grade level
export interface GradeLevel extends BaseEntity {
    name: string; // e.g., "Grade 6", "Form 1", etc.
    teacherId: string; // Reference to the teacher who created this grade level
}

// Academic year
export interface AcademicYear extends BaseEntity {
    name: string; // e.g., "2023-2024"
    teacherId: string;
}

// Trimester
export interface Trimester extends BaseEntity {
    name: string; // e.g., "Trimester 1", "Fall Semester", etc.
    academicYearId: string;
    teacherId: string;
}

// Subject
export interface Subject extends BaseEntity {
    name: string;
    gradeLevelId: string;
    academicYearId: string;
    trimesterId: string;
    teacherId: string;
}

// Student
export interface Student extends BaseEntity {
    name: string;
    gradeLevelId: string;
    teacherId: string;
}

// Assessment Component
export interface AssessmentComponent extends BaseEntity {
    name: string;
    weight: number;
    subjectId: string;
    teacherId: string;
}

// Student Score
export interface StudentScore extends BaseEntity {
    studentId: string;
    subjectId: string;
    examScore: number;
    classAssessmentScores: Record<string, number>;
    finalScore?: number;
    rank?: number;
    teacherId: string;
}

// Activity Log
export interface ActivityLog extends BaseEntity {
    date: Date;
    action: string;
    entityType: string;
    entityId: string;
    details?: string;
    teacherId: string;
}

// Default assessment components for new subjects
export const defaultAssessmentComponents = [
    {
        name: "Quizzes",
        weight: 25
    },
    {
        name: "Homework",
        weight: 25
    },
    {
        name: "Classwork",
        weight: 25
    },
    {
        name: "Participation",
        weight: 25
    }
];