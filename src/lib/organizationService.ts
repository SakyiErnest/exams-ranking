'use client';

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { getDbInstance } from './db';
import {
  Organization,
  OrganizationCreateData,
  OrganizationInvitation,
  SubscriptionData,
  UserProfile
} from '@/types/organization';
import { generateToken } from './utils';

// Collection references
const getOrganizationsRef = () => collection(getDbInstance(), 'organizations');
const getOrganizationInvitationsRef = () => collection(getDbInstance(), 'organizationInvitations');
const getUserProfilesRef = () => collection(getDbInstance(), 'userProfiles');

/**
 * Creates a new organization
 * @param data Organization creation data
 * @returns The created organization
 */
export async function createOrganization(data: OrganizationCreateData): Promise<Organization> {
  try {
    console.log('OrganizationService: Creating new organization', data);
    // Get the database instance to ensure it's initialized
    getDbInstance();
    const orgRef = doc(getOrganizationsRef());

    // Default subscription tier if not provided
    const subscriptionTier = data.subscriptionTier || 'free';

    // Create organization with default values
    const now = Timestamp.now();
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    const organization: Organization = {
      id: orgRef.id,
      name: data.name,
      domain: data.domain,
      createdAt: now,
      updatedAt: now,
      status: 'active',

      // Subscription details
      subscriptionTier,
      subscriptionStatus: 'active',
      subscriptionStartDate: now,
      subscriptionEndDate: Timestamp.fromDate(oneYearFromNow),

      // Contact information
      adminEmail: data.adminEmail,
      phone: data.phone,

      // Default settings
      settings: {
        defaultLanguage: 'en',
        timeZone: 'UTC',
        features: {
          advancedReporting: subscriptionTier !== 'free',
          aiFeatures: subscriptionTier === 'enterprise',
          parentPortal: ['professional', 'enterprise'].includes(subscriptionTier),
          apiAccess: ['professional', 'enterprise'].includes(subscriptionTier),
        }
      },

      // Default limits based on subscription
      limits: {
        maxUsers: subscriptionTier === 'free' ? 3 :
                 subscriptionTier === 'basic' ? 10 :
                 subscriptionTier === 'professional' ? 50 :
                 1000, // enterprise
        maxStudents: subscriptionTier === 'free' ? 100 :
                    subscriptionTier === 'basic' ? 500 :
                    subscriptionTier === 'professional' ? 2000 :
                    10000, // enterprise
        storageLimit: subscriptionTier === 'free' ? 100 :
                     subscriptionTier === 'basic' ? 1000 :
                     subscriptionTier === 'professional' ? 5000 :
                     50000, // enterprise (in MB)
      }
    };

    console.log('OrganizationService: Saving organization to Firestore', organization);
    // Save organization to Firestore
    await setDoc(orgRef, organization);
    console.log('OrganizationService: Organization created successfully with ID', organization.id);

    return organization;
  } catch (error) {
    console.error('Error creating organization:', error);
    throw error;
  }
}

/**
 * Gets an organization by ID
 * @param id Organization ID
 * @returns The organization or null if not found
 */
export async function getOrganization(id: string): Promise<Organization | null> {
  try {
    console.log('OrganizationService: Getting organization with ID', id);
    const orgDoc = await getDoc(doc(getOrganizationsRef(), id));

    if (orgDoc.exists()) {
      console.log('OrganizationService: Organization found', orgDoc.data());
      return { id: orgDoc.id, ...orgDoc.data() } as Organization;
    }

    console.log('OrganizationService: Organization not found');
    return null;
  } catch (error) {
    console.error('Error getting organization:', error);
    throw error;
  }
}

/**
 * Updates an organization
 * @param id Organization ID
 * @param data Partial organization data to update
 * @returns The updated organization
 */
export async function updateOrganization(
  id: string,
  data: Partial<Organization>
): Promise<Organization> {
  try {
    const orgRef = doc(getOrganizationsRef(), id);
    const orgDoc = await getDoc(orgRef);

    if (!orgDoc.exists()) {
      throw new Error(`Organization with ID ${id} not found`);
    }

    // Update only the provided fields
    const updateData = {
      ...data,
      updatedAt: serverTimestamp()
    };

    await updateDoc(orgRef, updateData);

    // Get the updated organization
    const updatedOrgDoc = await getDoc(orgRef);
    return { id: updatedOrgDoc.id, ...updatedOrgDoc.data() } as Organization;
  } catch (error) {
    console.error('Error updating organization:', error);
    throw error;
  }
}

/**
 * Deactivates an organization
 * @param id Organization ID
 */
export async function deactivateOrganization(id: string): Promise<void> {
  try {
    const orgRef = doc(getOrganizationsRef(), id);

    await updateDoc(orgRef, {
      status: 'inactive',
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error deactivating organization:', error);
    throw error;
  }
}

/**
 * Updates an organization's subscription
 * @param id Organization ID
 * @param subscriptionData New subscription data
 * @returns The updated organization
 */
export async function updateSubscription(
  id: string,
  subscriptionData: SubscriptionData
): Promise<Organization> {
  try {
    const orgRef = doc(getOrganizationsRef(), id);
    const orgDoc = await getDoc(orgRef);

    if (!orgDoc.exists()) {
      throw new Error(`Organization with ID ${id} not found`);
    }

    // Update subscription fields
    const updateData = {
      subscriptionTier: subscriptionData.tier,
      subscriptionStatus: subscriptionData.status,
      subscriptionStartDate: subscriptionData.startDate,
      subscriptionEndDate: subscriptionData.endDate,
      updatedAt: serverTimestamp(),

      // Update feature flags based on new tier
      'settings.features': {
        advancedReporting: subscriptionData.tier !== 'free',
        aiFeatures: subscriptionData.tier === 'enterprise',
        parentPortal: ['professional', 'enterprise'].includes(subscriptionData.tier),
        apiAccess: ['professional', 'enterprise'].includes(subscriptionData.tier),
      },

      // Update limits based on new tier
      limits: {
        maxUsers: subscriptionData.tier === 'free' ? 3 :
                 subscriptionData.tier === 'basic' ? 10 :
                 subscriptionData.tier === 'professional' ? 50 :
                 1000, // enterprise
        maxStudents: subscriptionData.tier === 'free' ? 100 :
                    subscriptionData.tier === 'basic' ? 500 :
                    subscriptionData.tier === 'professional' ? 2000 :
                    10000, // enterprise
        storageLimit: subscriptionData.tier === 'free' ? 100 :
                     subscriptionData.tier === 'basic' ? 1000 :
                     subscriptionData.tier === 'professional' ? 5000 :
                     50000, // enterprise (in MB)
      }
    };

    await updateDoc(orgRef, updateData);

    // Get the updated organization
    const updatedOrgDoc = await getDoc(orgRef);
    return { id: updatedOrgDoc.id, ...updatedOrgDoc.data() } as Organization;
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
}

/**
 * Invites a user to an organization
 * @param organizationId Organization ID
 * @param email Invitee email
 * @param role Role to assign to the user
 * @returns The created invitation
 */
export async function inviteUser(
  organizationId: string,
  email: string,
  role: 'admin' | 'teacher' | 'department_head',
  invitedBy: string
): Promise<OrganizationInvitation> {
  try {
    // Check if organization exists
    const orgDoc = await getDoc(doc(getOrganizationsRef(), organizationId));
    if (!orgDoc.exists()) {
      throw new Error(`Organization with ID ${organizationId} not found`);
    }

    // Check if user is already invited
    const existingInvitations = await getDocs(
      query(
        getOrganizationInvitationsRef(),
        where('organizationId', '==', organizationId),
        where('email', '==', email),
        where('status', '==', 'pending')
      )
    );

    if (!existingInvitations.empty) {
      throw new Error(`User ${email} is already invited to this organization`);
    }

    // Create invitation
    const invitationRef = doc(getOrganizationInvitationsRef());
    const now = Timestamp.now();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expire after 7 days

    const invitation: OrganizationInvitation = {
      id: invitationRef.id,
      organizationId,
      email,
      role,
      status: 'pending',
      createdAt: now,
      expiresAt: Timestamp.fromDate(expiresAt),
      invitedBy,
      token: generateToken(32) // Generate a secure token
    };

    await setDoc(invitationRef, invitation);

    return invitation;
  } catch (error) {
    console.error('Error inviting user:', error);
    throw error;
  }
}

/**
 * Gets all users in an organization
 * @param organizationId Organization ID
 * @returns Array of user profiles
 */
export async function getOrganizationUsers(organizationId: string): Promise<UserProfile[]> {
  try {
    const usersQuery = query(
      getUserProfilesRef(),
      where('organizationId', '==', organizationId)
    );

    const userDocs = await getDocs(usersQuery);

    return userDocs.docs.map(doc => ({
      ...doc.data(),
      uid: doc.id
    })) as UserProfile[];
  } catch (error) {
    console.error('Error getting organization users:', error);
    throw error;
  }
}

/**
 * Removes a user from an organization
 * @param organizationId Organization ID
 * @param userId User ID
 */
export async function removeUserFromOrganization(
  organizationId: string,
  userId: string
): Promise<void> {
  try {
    const userRef = doc(getUserProfilesRef(), userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error(`User with ID ${userId} not found`);
    }

    const userData = userDoc.data() as UserProfile;

    if (userData.organizationId !== organizationId) {
      throw new Error(`User does not belong to organization ${organizationId}`);
    }

    // Update user status to inactive
    await updateDoc(userRef, {
      status: 'inactive',
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error removing user from organization:', error);
    throw error;
  }
}
