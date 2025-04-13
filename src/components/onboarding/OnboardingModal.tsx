'use client';

import { useOnboarding } from '@/contexts/OnboardingContext';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const onboardingSteps = [
  {
    title: 'Welcome to EduGrade Pro',
    description: 'A comprehensive tool to track student performance and generate detailed reports across all subjects.',
    image: '/images/onboarding/welcome.svg',
    content: (
      <div className="space-y-4">
        <p>Here&apos;s what you can do with our system:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Manage student records and grade levels</li>
          <li>Create and customize assessment components</li>
          <li>Record exam and assessment scores</li>
          <li>Generate comprehensive ranking reports</li>
          <li>Track student performance trends</li>
        </ul>
      </div>
    )
  },
  {
    title: 'Setting Up Your Classes',
    description: 'Add your grade levels and students to get started.',
    image: '/images/onboarding/setup.svg',
    content: (
      <div className="space-y-4">
        <p>Start by creating grade levels and adding your students:</p>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Navigate to the <strong>Grade Levels</strong> section</li>
          <li>Create grade levels for each class you teach</li>
          <li>Add students to each grade level</li>
          <li>You can import students from a CSV file or add them manually</li>
        </ol>
      </div>
    )
  },
  {
    title: 'Managing Subjects & Assessments',
    description: 'Create subjects and define assessment components.',
    image: '/images/onboarding/subjects.svg',
    content: (
      <div className="space-y-4">
        <p>Define subjects and their assessment structure:</p>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Go to the <strong>Subjects</strong> section</li>
          <li>Create subjects you teach</li>
          <li>For each subject, define assessment components</li>
          <li>Set weights for each component to calculate final scores</li>
          <li>Examples: Quizzes (20%), Homework (30%), Projects (50%)</li>
        </ol>
      </div>
    )
  },
  {
    title: 'Recording Scores',
    description: 'Record exam scores and assessment scores for your students.',
    image: '/images/onboarding/scores.svg',
    content: (
      <div className="space-y-4">
        <p>Input student performance data:</p>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Navigate to the <strong>Scores</strong> section</li>
          <li>Select a subject and grade level</li>
          <li>Enter exam scores (worth 50% of total)</li>
          <li>Enter scores for each assessment component</li>
          <li>The system automatically calculates weighted averages</li>
        </ol>
        <p className="text-sm text-blue-600">
          <Link href="/assessment-calculation">Learn more about how scores are calculated →</Link>
        </p>
      </div>
    )
  },
  {
    title: 'Generating Reports',
    description: 'Create detailed ranking reports to analyze student performance.',
    image: '/images/onboarding/reports.svg',
    content: (
      <div className="space-y-4">
        <p>Create comprehensive performance reports:</p>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Go to the <strong>Reports</strong> section</li>
          <li>Select a subject and grade level</li>
          <li>Generate a ranking report</li>
          <li>View performance categories and rankings</li>
          <li>Export to PDF for sharing or printing</li>
        </ol>
        <p>Students are ranked based on their total scores and categorized by performance level.</p>
      </div>
    )
  }
];

export default function OnboardingModal() {
  const {
    isOnboardingActive,
    currentStep,
    nextStep,
    prevStep,
    skipOnboarding,
    completeOnboarding,
    totalSteps
  } = useOnboarding();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isOnboardingActive) {
    return null;
  }

  const step = onboardingSteps[currentStep - 1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-3xl rounded-lg bg-white shadow-xl">
        <div className="relative flex flex-col md:flex-row">
          {/* Image area */}
          <div className="hidden md:flex md:w-2/5 items-center justify-center bg-blue-50 p-8 rounded-l-lg">
            <div className="relative h-64 w-full">
              {step.image && (
                <div className="flex items-center justify-center h-full">
                  <Image
                    src={step.image}
                    alt={step.title}
                    width={200}
                    height={200}
                    className="max-h-64 w-auto object-contain"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Content area */}
          <div className="flex-1 p-6 md:p-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">{step.title}</h2>
              <button
                type="button"
                onClick={skipOnboarding}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Skip
              </button>
            </div>

            <p className="mb-4 text-gray-600">{step.description}</p>

            <div className="mb-8 min-h-[180px]">
              {step.content}
            </div>

            {/* Progress indicator */}
            <div className="mb-6 flex justify-center space-x-2">
              {Array.from({ length: totalSteps }).map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2 w-10 rounded-full ${
                    idx + 1 === currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className={`px-4 py-2 rounded-md border ${
                  currentStep === 1
                    ? 'border-gray-200 text-gray-400'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Previous
              </button>

              <button
                type="button"
                onClick={currentStep === totalSteps ? completeOnboarding : nextStep}
                className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                {currentStep === totalSteps ? 'Get Started' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
