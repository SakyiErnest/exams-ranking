'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { getOrganizationUsers } from '@/lib/organizationService';
import { UserProfile } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import UserInviteForm from '@/components/organization/UserInviteForm';
import TokenManagement from '@/components/organization/TokenManagement';
import styles from '@/styles/ProgressBar.module.css';

export default function OrganizationDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { organization, isLoading: orgLoading, error: orgError } = useOrganization();
  const router = useRouter();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to get the appropriate width class based on percentage
  const getWidthClass = (percentage: number): string => {
    if (percentage <= 0) return styles.w0;
    if (percentage <= 25) return styles.w25;
    if (percentage <= 50) return styles.w50;
    if (percentage <= 75) return styles.w75;
    return styles.w100;
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Redirect to create organization if no organization
  useEffect(() => {
    console.log('Dashboard: Organization state', { organization, orgLoading, orgError });
    if (!orgLoading && !organization && !orgError) {
      console.log('Dashboard: No organization found, redirecting to create page');
      router.push('/organization/create');
    }
  }, [organization, orgLoading, orgError, router]);

  // Load organization users
  useEffect(() => {
    const loadUsers = async () => {
      if (!organization) return;

      try {
        setIsLoadingUsers(true);
        const organizationUsers = await getOrganizationUsers(organization.id);
        setUsers(organizationUsers);
      } catch (err) {
        console.error('Error loading organization users:', err);
        setError('Failed to load organization users');
      } finally {
        setIsLoadingUsers(false);
      }
    };

    loadUsers();
  }, [organization]);

  if (authLoading || orgLoading) {
    console.log('Dashboard: Loading state', { authLoading, orgLoading });
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-600 mx-auto"></div>
          <p>Loading organization data...</p>
        </div>
      </div>
    );
  }

  if (orgError || !organization) {
    console.log('Dashboard: Error or no organization', { orgError, organization });
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 p-6 rounded-lg border border-red-200 text-center">
            <h2 className="text-xl font-bold text-red-700 mb-2">Organization Required</h2>
            <p className="text-red-600 mb-4">{orgError || 'You need to create or join an organization to access this page'}</p>
            <Link
              href="/organization/create"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create Organization
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{organization.name}</h1>
        <p className="text-gray-600">Organization Dashboard</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Organization Info Card */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Organization Info</h2>

          <div className="space-y-3">
            <div>
              <span className="text-gray-600 block text-sm">Name:</span>
              <span className="font-medium">{organization.name}</span>
            </div>

            {organization.domain && (
              <div>
                <span className="text-gray-600 block text-sm">Domain:</span>
                <span className="font-medium">{organization.domain}</span>
              </div>
            )}

            <div>
              <span className="text-gray-600 block text-sm">Admin Email:</span>
              <span className="font-medium">{organization.adminEmail}</span>
            </div>

            <div>
              <span className="text-gray-600 block text-sm">Subscription:</span>
              <span className="font-medium capitalize">{organization.subscriptionTier}</span>
            </div>

            <div>
              <span className="text-gray-600 block text-sm">Status:</span>
              <span className="font-medium capitalize">{organization.status}</span>
            </div>
          </div>

          <div className="mt-6">
            <Link
              href="/organization/settings"
              className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              Organization Settings
            </Link>
          </div>
        </div>

        {/* Users Card */}
        <div className="bg-white p-6 rounded-lg shadow-md md:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Users</h2>
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
              {users.length} / {organization.limits.maxUsers}
            </span>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {isLoadingUsers ? (
            <div className="text-center py-4">
              <div className="mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500">Loading users...</p>
            </div>
          ) : (
            <>
              {users.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-md">
                  <p className="text-gray-500 mb-2">No users found</p>
                  <p className="text-sm text-gray-400">Invite users to get started</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.uid} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">
                              {user.displayName || 'No Name'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-gray-500">{user.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {user.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-6">
                <div className="mb-8">
                  <h3 className="text-lg font-medium mb-4">Email Invitation</h3>
                  <UserInviteForm />
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Token-Based Invitation</h3>
                  <TokenManagement />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Subscription Card */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Subscription</h2>

          <div className="space-y-3 mb-6">
            <div>
              <span className="text-gray-600 block text-sm">Current Plan:</span>
              <span className="font-medium capitalize">{organization.subscriptionTier}</span>
            </div>

            <div>
              <span className="text-gray-600 block text-sm">Status:</span>
              <span className="font-medium capitalize">{organization.subscriptionStatus}</span>
            </div>

            <div>
              <span className="text-gray-600 block text-sm">Renewal Date:</span>
              <span className="font-medium">
                {new Date(organization.subscriptionEndDate.seconds * 1000).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="font-medium text-gray-800 mb-2">Plan Limits</h3>

            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Users</span>
                  <span>{users.length} / {organization.limits.maxUsers}</span>
                </div>
                <div className={styles.progressBar}>
                  <div
                    className={`${styles.progressFill} ${styles.progressBlue} ${getWidthClass(Math.min(100, (users.length / organization.limits.maxUsers) * 100))}`}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Students</span>
                  <span>0 / {organization.limits.maxStudents}</span>
                </div>
                <div className={styles.progressBar}>
                  <div
                    className={`${styles.progressFill} ${styles.progressGreen} ${styles.w0}`}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Storage</span>
                  <span>0 MB / {organization.limits.storageLimit} MB</span>
                </div>
                <div className={styles.progressBar}>
                  <div
                    className={`${styles.progressFill} ${styles.progressPurple} ${styles.w0}`}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <Link
              href="/organization/subscription"
              className="inline-block w-full px-4 py-2 bg-blue-600 text-white text-center rounded-md hover:bg-blue-700"
            >
              Upgrade Plan
            </Link>
          </div>
        </div>

        {/* Features Card */}
        <div className="bg-white p-6 rounded-lg shadow-md md:col-span-2">
          <h2 className="text-xl font-bold mb-4">Available Features</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-gray-200 rounded-md">
              <div className="flex items-start">
                <div className={`p-2 rounded-full ${
                  organization.settings.features.advancedReporting
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="font-medium">Advanced Reporting</h3>
                  <p className="text-sm text-gray-500">
                    {organization.settings.features.advancedReporting
                      ? 'Generate detailed reports and analytics'
                      : 'Upgrade to access advanced reporting features'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 border border-gray-200 rounded-md">
              <div className="flex items-start">
                <div className={`p-2 rounded-full ${
                  organization.settings.features.parentPortal
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="font-medium">Parent Portal</h3>
                  <p className="text-sm text-gray-500">
                    {organization.settings.features.parentPortal
                      ? 'Share progress with parents'
                      : 'Upgrade to enable parent access'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 border border-gray-200 rounded-md">
              <div className="flex items-start">
                <div className={`p-2 rounded-full ${
                  organization.settings.features.aiFeatures
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="font-medium">AI Features</h3>
                  <p className="text-sm text-gray-500">
                    {organization.settings.features.aiFeatures
                      ? 'AI-powered insights and recommendations'
                      : 'Upgrade to enterprise for AI features'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 border border-gray-200 rounded-md">
              <div className="flex items-start">
                <div className={`p-2 rounded-full ${
                  organization.settings.features.apiAccess
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="font-medium">API Access</h3>
                  <p className="text-sm text-gray-500">
                    {organization.settings.features.apiAccess
                      ? 'Integrate with other systems'
                      : 'Upgrade for API access'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
