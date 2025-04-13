'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { getOrganization } from '@/lib/organizationService';
import { Organization } from '@/types/organization';
import { doc, getDoc } from 'firebase/firestore';
import { getDbInstance } from '@/lib/db';

interface OrganizationContextType {
  organization: Organization | null;
  isLoading: boolean;
  error: string | null;
  refreshOrganization: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType>({
  organization: null,
  isLoading: true,
  error: null,
  refreshOrganization: async () => {}
});

export const useOrganization = () => useContext(OrganizationContext);

interface OrganizationProviderProps {
  children: ReactNode;
}

export const OrganizationProvider: React.FC<OrganizationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrganization = useCallback(async () => {
    if (!user) {
      console.log('OrganizationContext: No user, setting organization to null');
      setOrganization(null);
      setIsLoading(false);
      return;
    }

    try {
      console.log('OrganizationContext: Loading organization for user', user.uid);
      setIsLoading(true);
      setError(null);

      // Get the user's profile to find their organization
      const userProfileRef = doc(getDbInstance(), 'userProfiles', user.uid);
      const userProfileDoc = await getDoc(userProfileRef);

      if (!userProfileDoc.exists()) {
        console.log('OrganizationContext: User profile not found');
        // If user profile doesn't exist, redirect to create organization
        setOrganization(null);
        setIsLoading(false);
        return;
      }

      const userProfile = userProfileDoc.data();
      console.log('OrganizationContext: User profile data', userProfile);
      const organizationId = userProfile.organizationId;

      if (!organizationId) {
        console.log('OrganizationContext: No organizationId in user profile');
        // User has a profile but no organization
        setError('Please create or join an organization');
        setIsLoading(false);
        return;
      }

      // Get the organization
      console.log('OrganizationContext: Fetching organization', organizationId);
      const org = await getOrganization(organizationId);

      if (!org) {
        console.log('OrganizationContext: Organization not found');
        setError('Organization not found');
      } else {
        console.log('OrganizationContext: Organization loaded successfully', org);
        setOrganization(org);
      }
    } catch (err) {
      console.error('Error loading organization:', err);
      setError('Failed to load organization data');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load organization when user changes
  useEffect(() => {
    loadOrganization();
  }, [user, loadOrganization]);

  // Function to manually refresh organization data
  const refreshOrganization = async () => {
    await loadOrganization();
  };

  const value = {
    organization,
    isLoading,
    error,
    refreshOrganization
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
};
