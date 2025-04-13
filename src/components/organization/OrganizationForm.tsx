'use client';

import React, { useState } from 'react';
import { Organization, OrganizationCreateData } from '@/types/organization';
import { createOrganization, updateOrganization } from '@/lib/organizationService';
import { createOrUpdateUserProfile } from '@/lib/userProfileService';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useRouter } from 'next/navigation';

interface OrganizationFormProps {
  existingOrganization?: Organization;
  onSuccess?: (organization: Organization) => void;
}

const OrganizationForm: React.FC<OrganizationFormProps> = ({
  existingOrganization,
  onSuccess
}) => {
  const { user } = useAuth();
  const { refreshOrganization } = useOrganization();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<OrganizationCreateData>({
    name: existingOrganization?.name || '',
    domain: existingOrganization?.domain || '',
    adminEmail: existingOrganization?.adminEmail || user?.email || '',
    phone: existingOrganization?.phone || '',
    subscriptionTier: existingOrganization?.subscriptionTier || 'free'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError('You must be logged in to create or update an organization');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      let organization: Organization;

      if (existingOrganization) {
        // Update existing organization
        organization = await updateOrganization(existingOrganization.id, {
          name: formData.name,
          domain: formData.domain,
          adminEmail: formData.adminEmail,
          phone: formData.phone,
        });
      } else {
        // Create new organization
        organization = await createOrganization(formData);

        // Create or update user profile with organization association
        await createOrUpdateUserProfile(user.uid, {
          email: user.email || formData.adminEmail,
          displayName: user.displayName || '',
          organizationId: organization.id,
          role: 'admin' // Set as admin for the organization creator
        });
      }

      console.log('OrganizationForm: Organization created/updated successfully', organization);

      // Add a small delay to ensure data is properly saved
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Refresh the organization context
      await refreshOrganization();

      console.log('OrganizationForm: Organization context refreshed');

      // Add another small delay before redirecting
      await new Promise(resolve => setTimeout(resolve, 500));

      if (onSuccess) {
        onSuccess(organization);
      } else {
        console.log('OrganizationForm: Redirecting to dashboard');
        // Redirect to organization dashboard
        router.push('/organization/dashboard');
      }
    } catch (err) {
      console.error('Error submitting organization form:', err);
      setError('Failed to save organization. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">
        {existingOrganization ? 'Update Organization' : 'Create New Organization'}
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Organization Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter organization name"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="domain" className="block text-sm font-medium text-gray-700 mb-1">
            Domain (Optional)
          </label>
          <input
            type="text"
            id="domain"
            name="domain"
            value={formData.domain}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="example.com"
          />
          <p className="mt-1 text-xs text-gray-500">
            If provided, only users with email addresses from this domain can join your organization.
          </p>
        </div>

        <div className="mb-4">
          <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700 mb-1">
            Admin Email *
          </label>
          <input
            type="email"
            id="adminEmail"
            name="adminEmail"
            value={formData.adminEmail}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="admin@example.com"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone (Optional)
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="+1 (123) 456-7890"
          />
        </div>

        {!existingOrganization && (
          <div className="mb-6">
            <label htmlFor="subscriptionTier" className="block text-sm font-medium text-gray-700 mb-1">
              Subscription Tier *
            </label>
            <select
              id="subscriptionTier"
              name="subscriptionTier"
              value={formData.subscriptionTier}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="free">Free</option>
              <option value="basic">Basic</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : existingOrganization ? 'Update Organization' : 'Create Organization'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OrganizationForm;
