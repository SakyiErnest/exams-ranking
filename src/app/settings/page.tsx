'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';

// Define the tabs for the settings page
const TABS = [
  { id: 'profile', label: 'Profile' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'grading', label: 'Grading' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'data', label: 'Data Management' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Theme settings
  const [theme, setTheme] = useState('light');
  const [dashboardLayout, setDashboardLayout] = useState('default');

  // Grading settings
  const [gradingScale, setGradingScale] = useState('percentage');
  const [defaultComponentWeights, setDefaultComponentWeights] = useState({
    quizzes: 25,
    homework: 25,
    classwork: 25,
    participation: 25,
  });

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [inAppNotifications, setInAppNotifications] = useState(true);

  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!user) {
      router.push('/login');
      return;
    }

    // Load user settings from Firestore
    const loadUserSettings = async () => {
      try {
        // In a real implementation, we would fetch the user's settings from Firestore
        // For now, we'll just simulate a loading delay
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      } catch (error) {
        console.error('Error loading settings:', error);
        setErrorMessage('Failed to load settings');
        setIsLoading(false);
      }
    };

    loadUserSettings();
  }, [user, router]);

  const saveSettings = async () => {
    if (!user) return;

    setIsSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      // In a real implementation, we would save the settings to Firestore
      // For now, we'll just simulate a saving delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSuccessMessage('Settings saved successfully');
      setIsSaving(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      setErrorMessage('Failed to save settings');
      setIsSaving(false);
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-600"></div>
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-lg text-gray-600">
          Customize EduGrade Pro to fit your teaching style
        </p>
      </header>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-6 rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{errorMessage}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row">
        {/* Sidebar */}
        <div className="mb-6 w-full md:mb-0 md:w-64">
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <ul className="divide-y divide-gray-200">
              {TABS.map((tab) => (
                <li key={tab.id}>
                  <button
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`block w-full px-4 py-3 text-left text-sm font-medium ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 md:ml-8">
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-6">
              {/* Profile Settings */}
              {activeTab === 'profile' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Profile Settings</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Update your personal information and account settings
                  </p>

                  <div className="mt-6 space-y-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        defaultValue={user?.displayName || ''}
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        defaultValue={user?.email || ''}
                        disabled
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Email cannot be changed. Contact support for assistance.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Profile Picture</h3>
                      <div className="mt-2 flex items-center">
                        <div className="h-12 w-12 overflow-hidden rounded-full bg-gray-100">
                          {user?.photoURL ? (
                            <div className="relative h-full w-full">
                              <Image
                                src={user.photoURL}
                                alt="Profile"
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <svg className="h-full w-full text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                          )}
                        </div>
                        <button
                          type="button"
                          className="ml-4 rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-300 hover:bg-gray-50"
                        >
                          Change
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Password</h3>
                      <div className="mt-2">
                        <button
                          type="button"
                          className="rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-300 hover:bg-gray-50"
                        >
                          Change Password
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Appearance Settings */}
              {activeTab === 'appearance' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Appearance Settings</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Customize the look and feel of your EduGrade Pro experience
                  </p>

                  <div className="mt-6 space-y-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Theme</h3>
                      <div className="mt-2 space-y-2" role="radiogroup" aria-labelledby="theme-label">
                        <div id="theme-label" className="sr-only">Select theme</div>
                        <div className="flex items-center">
                          <input
                            id="theme-light"
                            name="theme"
                            type="radio"
                            className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={theme === 'light'}
                            onChange={() => setTheme('light')}
                            aria-describedby="theme-light-description"
                          />
                          <label htmlFor="theme-light" className="ml-3 block text-sm font-medium text-gray-700">
                            Light
                          </label>
                          <span id="theme-light-description" className="sr-only">Light theme with bright background and dark text</span>
                        </div>
                        <div className="flex items-center">
                          <input
                            id="theme-dark"
                            name="theme"
                            type="radio"
                            className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={theme === 'dark'}
                            onChange={() => setTheme('dark')}
                            aria-describedby="theme-dark-description"
                          />
                          <label htmlFor="theme-dark" className="ml-3 block text-sm font-medium text-gray-700">
                            Dark
                          </label>
                          <span id="theme-dark-description" className="sr-only">Dark theme with dark background and light text</span>
                        </div>
                        <div className="flex items-center">
                          <input
                            id="theme-system"
                            name="theme"
                            type="radio"
                            className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={theme === 'system'}
                            onChange={() => setTheme('system')}
                            aria-describedby="theme-system-description"
                          />
                          <label htmlFor="theme-system" className="ml-3 block text-sm font-medium text-gray-700">
                            System Default
                          </label>
                          <span id="theme-system-description" className="sr-only">Follow your device&apos;s theme settings</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="dashboard-layout" className="block text-sm font-medium text-gray-700">Dashboard Layout</label>
                      <div className="mt-2">
                        <select
                          id="dashboard-layout"
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          value={dashboardLayout}
                          onChange={(e) => setDashboardLayout(e.target.value)}
                        >
                          <option value="default">Default</option>
                          <option value="compact">Compact</option>
                          <option value="expanded">Expanded</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Grading Settings */}
              {activeTab === 'grading' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Grading Settings</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Configure how grades are calculated and displayed
                  </p>

                  <div className="mt-6 space-y-6">
                    <div>
                      <label htmlFor="grading-scale" className="block text-sm font-medium text-gray-700">Grading Scale</label>
                      <div className="mt-2">
                        <select
                          id="grading-scale"
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          value={gradingScale}
                          onChange={(e) => setGradingScale(e.target.value)}
                        >
                          <option value="percentage">Percentage (0-100%)</option>
                          <option value="letter">Letter Grades (A, B, C, D, F)</option>
                          <option value="gpa">GPA Scale (0.0-4.0)</option>
                          <option value="standards">Standards-Based (Exceeds, Meets, Approaching, Below)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Default Assessment Component Weights</h3>
                      <p className="mt-1 text-xs text-gray-500">
                        Set the default weights for new assessment components (must total 100%)
                      </p>

                      <div className="mt-2 space-y-3">
                        <div>
                          <label htmlFor="weight-quizzes" className="block text-sm font-medium text-gray-700">
                            Quizzes (%)
                          </label>
                          <input
                            type="number"
                            id="weight-quizzes"
                            min="0"
                            max="100"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            value={defaultComponentWeights.quizzes}
                            onChange={(e) => setDefaultComponentWeights({
                              ...defaultComponentWeights,
                              quizzes: parseInt(e.target.value) || 0
                            })}
                          />
                        </div>

                        <div>
                          <label htmlFor="weight-homework" className="block text-sm font-medium text-gray-700">
                            Homework (%)
                          </label>
                          <input
                            type="number"
                            id="weight-homework"
                            min="0"
                            max="100"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            value={defaultComponentWeights.homework}
                            onChange={(e) => setDefaultComponentWeights({
                              ...defaultComponentWeights,
                              homework: parseInt(e.target.value) || 0
                            })}
                          />
                        </div>

                        <div>
                          <label htmlFor="weight-classwork" className="block text-sm font-medium text-gray-700">
                            Classwork (%)
                          </label>
                          <input
                            type="number"
                            id="weight-classwork"
                            min="0"
                            max="100"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            value={defaultComponentWeights.classwork}
                            onChange={(e) => setDefaultComponentWeights({
                              ...defaultComponentWeights,
                              classwork: parseInt(e.target.value) || 0
                            })}
                          />
                        </div>

                        <div>
                          <label htmlFor="weight-participation" className="block text-sm font-medium text-gray-700">
                            Participation (%)
                          </label>
                          <input
                            type="number"
                            id="weight-participation"
                            min="0"
                            max="100"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            value={defaultComponentWeights.participation}
                            onChange={(e) => setDefaultComponentWeights({
                              ...defaultComponentWeights,
                              participation: parseInt(e.target.value) || 0
                            })}
                          />
                        </div>

                        <div className="pt-2">
                          <div className={`text-sm ${
                            Object.values(defaultComponentWeights).reduce((a, b) => a + b, 0) === 100
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}>
                            Total: {Object.values(defaultComponentWeights).reduce((a, b) => a + b, 0)}%
                            {Object.values(defaultComponentWeights).reduce((a, b) => a + b, 0) !== 100 && ' (must equal 100%)'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notification Settings */}
              {activeTab === 'notifications' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Notification Settings</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Control how and when you receive notifications
                  </p>

                  <div className="mt-6 space-y-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Email Notifications</h3>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center">
                          <input
                            id="email-notifications"
                            name="email-notifications"
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={emailNotifications}
                            onChange={(e) => setEmailNotifications(e.target.checked)}
                            aria-describedby="email-notifications-description"
                          />
                          <label htmlFor="email-notifications" className="ml-3 block text-sm font-medium text-gray-700">
                            Receive email notifications
                          </label>
                          <span id="email-notifications-description" className="sr-only">Get notified about important events via email</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-700">In-App Notifications</h3>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center">
                          <input
                            id="in-app-notifications"
                            name="in-app-notifications"
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={inAppNotifications}
                            onChange={(e) => setInAppNotifications(e.target.checked)}
                            aria-describedby="in-app-notifications-description"
                          />
                          <label htmlFor="in-app-notifications" className="ml-3 block text-sm font-medium text-gray-700">
                            Receive in-app notifications
                          </label>
                          <span id="in-app-notifications-description" className="sr-only">Get notified about important events within the application</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Data Management Settings */}
              {activeTab === 'data' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Data Management</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Import, export, and manage your data
                  </p>

                  <div className="mt-6 space-y-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Import Data</h3>
                      <p className="mt-1 text-xs text-gray-500">
                        Import student data from CSV or Excel files
                      </p>
                      <div className="mt-2">
                        <button
                          type="button"
                          className="rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-300 hover:bg-gray-50"
                        >
                          Import Students
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Export Data</h3>
                      <p className="mt-1 text-xs text-gray-500">
                        Export your data for backup or analysis
                      </p>
                      <div className="mt-2 space-x-3">
                        <button
                          type="button"
                          className="rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-300 hover:bg-gray-50"
                        >
                          Export Students
                        </button>
                        <button
                          type="button"
                          className="rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-300 hover:bg-gray-50"
                        >
                          Export Scores
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Academic Year Management</h3>
                      <p className="mt-1 text-xs text-gray-500">
                        Archive data from previous academic years
                      </p>
                      <div className="mt-2">
                        <button
                          type="button"
                          className="rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-300 hover:bg-gray-50"
                        >
                          Manage Academic Years
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  onClick={saveSettings}
                  disabled={isSaving}
                  className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-400"
                >
                  {isSaving ? (
                    <>
                      <svg className="mr-2 h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Save Settings'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
