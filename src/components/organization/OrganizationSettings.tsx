'use client';

import React, { useState } from 'react';
// Organization type is used in the useOrganization context
import { updateOrganization } from '@/lib/organizationService';
import { useOrganization } from '@/contexts/OrganizationContext';

const OrganizationSettings: React.FC = () => {
  const { organization, refreshOrganization } = useOrganization();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [settings, setSettings] = useState({
    defaultLanguage: organization?.settings.defaultLanguage || 'en',
    timeZone: organization?.settings.timeZone || 'UTC',
    gradingScale: organization?.settings.gradingScale || {},
    academicYearStart: organization?.settings.academicYearStart || '09-01', // September 1st
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!organization) {
      setError('Organization not found');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);

      await updateOrganization(organization.id, {
        settings: {
          ...organization.settings,
          defaultLanguage: settings.defaultLanguage,
          timeZone: settings.timeZone,
          gradingScale: settings.gradingScale,
          academicYearStart: settings.academicYearStart,
        }
      });

      setSuccess('Settings updated successfully');
      refreshOrganization();
    } catch (err) {
      console.error('Error updating organization settings:', err);
      setError('Failed to update settings. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!organization) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p>Loading organization settings...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Organization Settings</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="defaultLanguage" className="block text-sm font-medium text-gray-700 mb-1">
            Default Language
          </label>
          <select
            id="defaultLanguage"
            name="defaultLanguage"
            value={settings.defaultLanguage}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="zh">Chinese</option>
          </select>
        </div>

        <div className="mb-4">
          <label htmlFor="timeZone" className="block text-sm font-medium text-gray-700 mb-1">
            Time Zone
          </label>
          <select
            id="timeZone"
            name="timeZone"
            value={settings.timeZone}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="UTC">UTC</option>
            <option value="America/New_York">Eastern Time (ET)</option>
            <option value="America/Chicago">Central Time (CT)</option>
            <option value="America/Denver">Mountain Time (MT)</option>
            <option value="America/Los_Angeles">Pacific Time (PT)</option>
            <option value="Europe/London">London</option>
            <option value="Europe/Paris">Paris</option>
            <option value="Asia/Tokyo">Tokyo</option>
          </select>
        </div>

        <div className="mb-4">
          <label htmlFor="academicYearStart" className="block text-sm font-medium text-gray-700 mb-1">
            Academic Year Start Date
          </label>
          <input
            type="text"
            id="academicYearStart"
            name="academicYearStart"
            value={settings.academicYearStart}
            onChange={handleChange}
            placeholder="MM-DD (e.g., 09-01 for September 1st)"
            pattern="[0-1][0-9]-[0-3][0-9]"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Format: MM-DD (e.g., 09-01 for September 1st)
          </p>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-2">Subscription Information</h3>
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Current Plan:</span>
              <span className="font-medium capitalize">{organization.subscriptionTier}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Status:</span>
              <span className="font-medium capitalize">{organization.subscriptionStatus}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Renewal Date:</span>
              <span className="font-medium">
                {new Date(organization.subscriptionEndDate.seconds * 1000).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OrganizationSettings;
