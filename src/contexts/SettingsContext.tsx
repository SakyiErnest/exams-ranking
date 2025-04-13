'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Define the shape of our settings
interface Settings {
  theme: 'light' | 'dark' | 'system';
  dashboardLayout: 'default' | 'compact' | 'expanded';
  gradingScale: 'percentage' | 'letter' | 'gpa' | 'standards';
  defaultComponentWeights: {
    quizzes: number;
    homework: number;
    classwork: number;
    participation: number;
  };
  emailNotifications: boolean;
  inAppNotifications: boolean;
}

// Default settings
const defaultSettings: Settings = {
  theme: 'light',
  dashboardLayout: 'default',
  gradingScale: 'percentage',
  defaultComponentWeights: {
    quizzes: 25,
    homework: 25,
    classwork: 25,
    participation: 25,
  },
  emailNotifications: true,
  inAppNotifications: true,
};

// Create the context
interface SettingsContextType {
  settings: Settings;
  isLoading: boolean;
  updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
  resetSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Provider component
interface SettingsProviderProps {
  children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Load settings from Firestore when user changes
  useEffect(() => {
    const loadSettings = async () => {
      if (!user) {
        setSettings(defaultSettings);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const settingsDoc = await getDoc(doc(db, 'userSettings', user.uid));

        if (settingsDoc.exists()) {
          const userSettings = settingsDoc.data() as Settings;
          setSettings(userSettings);
        } else {
          // If no settings exist for this user, create default settings
          try {
            await setDoc(doc(db, 'userSettings', user.uid), defaultSettings);
          } catch (writeError) {
            console.warn('Could not save default settings, will try again later:', writeError);
            // Continue with default settings in memory even if we couldn't save them
          }
          setSettings(defaultSettings);
        }
      } catch (error) {
        console.warn('Error loading settings, using defaults:', error);
        // Fall back to default settings on error
        setSettings(defaultSettings);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [user]);

  // Update settings in state and Firestore
  const updateSettings = async (newSettings: Partial<Settings>) => {
    if (!user) return;

    try {
      // Update in memory first
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);

      // Then try to update in Firestore
      try {
        await setDoc(doc(db, 'userSettings', user.uid), updatedSettings);
      } catch (writeError) {
        console.warn('Could not save settings to database, will try again later:', writeError);
        // Settings are still updated in memory, so the user can continue using the app
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      // Don't throw the error, just log it
    }
  };

  // Reset settings to defaults
  const resetSettings = async () => {
    if (!user) return;

    try {
      // Reset in memory first
      setSettings(defaultSettings);

      // Then try to update in Firestore
      try {
        await setDoc(doc(db, 'userSettings', user.uid), defaultSettings);
      } catch (writeError) {
        console.warn('Could not save reset settings to database, will try again later:', writeError);
        // Settings are still reset in memory, so the user can continue using the app
      }
    } catch (error) {
      console.error('Error resetting settings:', error);
      // Don't throw the error, just log it
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, isLoading, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

// Custom hook to use the settings context
export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
