'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useRouter } from 'next/navigation';
import OrganizationSettings from '@/components/organization/OrganizationSettings';
import Link from 'next/link';

export default function OrganizationSettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const { organization, isLoading: orgLoading, error: orgError } = useOrganization();
  const router = useRouter();
  
  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);
  
  // Redirect to create organization if no organization
  React.useEffect(() => {
    if (!orgLoading && !organization && !orgError) {
      router.push('/organization/create');
    }
  }, [organization, orgLoading, orgError, router]);
  
  if (authLoading || orgLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-600 mx-auto"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }
  
  if (orgError || !organization) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 p-6 rounded-lg border border-red-200 text-center">
            <h2 className="text-xl font-bold text-red-700 mb-2">Organization Error</h2>
            <p className="text-red-600 mb-4">{orgError || 'Organization not found'}</p>
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
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link 
            href="/organization/dashboard" 
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
        
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">{organization.name}</h1>
          <p className="text-gray-600">Organization Settings</p>
        </div>
        
        <OrganizationSettings />
      </div>
    </div>
  );
}
