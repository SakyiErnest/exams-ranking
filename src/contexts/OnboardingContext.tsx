'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type OnboardingContextType = {
  hasCompletedOnboarding: boolean;
  isOnboardingActive: boolean;
  currentStep: number;
  startOnboarding: () => void;
  completeOnboarding: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipOnboarding: () => void;
  totalSteps: number;
};

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(true);
  const [isOnboardingActive, setIsOnboardingActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) {
        // If no user is logged in, don't try to access Firestore
        setHasCompletedOnboarding(true); // Default to true when not logged in
        setIsOnboardingActive(false);
        return;
      }

      try {
        const userDocRef = doc(db, 'userProfiles', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setHasCompletedOnboarding(userData.hasCompletedOnboarding || false);

          // Automatically start onboarding for new users who haven't completed it
          if (!userData.hasCompletedOnboarding) {
            setIsOnboardingActive(true);
          }
        } else {
          // If user profile doesn't exist yet, they are new
          setHasCompletedOnboarding(false);
          setIsOnboardingActive(true);

          try {
            // Create user profile with onboarding flag
            await setDoc(userDocRef, {
              uid: user.uid,
              email: user.email,
              hasCompletedOnboarding: false,
              createdAt: new Date()
            });
          } catch (writeError) {
            console.warn('Could not create user profile, will try again later:', writeError);
            // Don't throw the error, just log it and continue
          }
        }
      } catch (error) {
        console.warn('Error checking onboarding status, will use defaults:', error);
        // Use default values instead of failing
        setHasCompletedOnboarding(true);
        setIsOnboardingActive(false);
      }
    };

    checkOnboardingStatus();
  }, [user]);

  const startOnboarding = () => {
    setIsOnboardingActive(true);
    setCurrentStep(1);
  };

  const completeOnboarding = async () => {
    setIsOnboardingActive(false);
    setHasCompletedOnboarding(true);

    if (user) {
      try {
        const userDocRef = doc(db, 'userProfiles', user.uid);
        await setDoc(userDocRef, { hasCompletedOnboarding: true }, { merge: true });
      } catch (error) {
        console.error('Error updating onboarding status:', error);
      }
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipOnboarding = () => {
    completeOnboarding();
  };

  return (
    <OnboardingContext.Provider
      value={{
        hasCompletedOnboarding,
        isOnboardingActive,
        currentStep,
        startOnboarding,
        completeOnboarding,
        nextStep,
        prevStep,
        skipOnboarding,
        totalSteps
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};
