'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import OrganizationForm from '@/components/organization/OrganizationForm';
import { useRouter } from 'next/navigation';
import { Organization } from '@/types/organization';

export default function CreateOrganizationPage() {
  const { user, loading } = useAuth();
  const { organization, isLoading: orgLoading } = useOrganization();
  const router = useRouter();
  const [success, setSuccess] = useState(false);
  const [createdOrg, setCreatedOrg] = useState<Organization | null>(null);

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Redirect to dashboard if already has organization
  React.useEffect(() => {
    if (!orgLoading && organization) {
      console.log('CreateOrganizationPage: User already has organization, redirecting to dashboard');
      router.push('/organization/dashboard');
    }
  }, [organization, orgLoading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-600 mx-auto"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Create Your Organization</h1>

        <div className="mb-8">
          <p className="text-gray-600 mb-4">
            Setting up your organization is the first step to using EduGrade Pro.
            Your organization will be the central hub for all your teachers, students, and classes.
          </p>

          <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
            <h3 className="font-medium text-blue-800 mb-2">Why create an organization?</h3>
            <ul className="list-disc list-inside text-blue-700 space-y-1">
              <li>Centralize management of all your educational data</li>
              <li>Invite teachers and staff to collaborate</li>
              <li>Set organization-wide policies and settings</li>
              <li>Access advanced analytics and reporting</li>
            </ul>
          </div>
        </div>

        {success && createdOrg ? (
          <div className="bg-green-50 p-6 rounded-lg border border-green-200 text-center">
            <h2 className="text-xl font-bold text-green-700 mb-2">Organization Created!</h2>
            <p className="text-green-600 mb-4">Your organization &quot;{createdOrg.name}&quot; has been created successfully.</p>
            <button
              type="button"
              onClick={() => router.push('/organization/dashboard')}
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Go to Organization Dashboard
            </button>
          </div>
        ) : (
          <OrganizationForm
            onSuccess={(org) => {
              console.log('CreateOrganizationPage: Organization created successfully', org);
              setCreatedOrg(org);
              setSuccess(true);
            }}
          />
        )}
      </div>
    </div>
  );
}
