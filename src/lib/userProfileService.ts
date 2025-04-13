'use client';

import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { getDbInstance } from './db';
import { UserProfile } from '@/types';

/**
 * Creates or updates a user profile
 * @param uid User ID
 * @param data User profile data
 */
export async function createOrUpdateUserProfile(
  uid: string,
  data: Partial<UserProfile>
): Promise<UserProfile> {
  try {
    console.log('UserProfileService: Creating/updating profile for user', uid, data);
    const db = getDbInstance();
    const userProfileRef = doc(db, 'userProfiles', uid);

    // Check if profile already exists
    const userProfileDoc = await getDoc(userProfileRef);

    if (userProfileDoc.exists()) {
      console.log('UserProfileService: Existing profile found, updating');
      // Update existing profile
      const updateData = {
        ...data,
        updatedAt: serverTimestamp()
      };

      await setDoc(userProfileRef, updateData, { merge: true });
      console.log('UserProfileService: Profile updated successfully');

      return {
        uid,
        ...userProfileDoc.data(),
        ...data
      } as UserProfile;
    } else {
      console.log('UserProfileService: No existing profile, creating new one');
      // Create new profile
      const now = serverTimestamp();
      const newProfile: Partial<UserProfile> = {
        uid,
        email: data.email,
        displayName: data.displayName,
        organizationId: data.organizationId,
        role: data.role || 'admin', // Default to admin for new profiles
        status: 'active',
        createdAt: now,
        updatedAt: now
      };

      console.log('UserProfileService: Saving new profile', newProfile);
      await setDoc(userProfileRef, newProfile);
      console.log('UserProfileService: New profile created successfully');

      return {
        ...newProfile,
        uid
      } as UserProfile;
    }
  } catch (error) {
    console.error('Error creating/updating user profile:', error);
    throw error;
  }
}

/**
 * Gets a user profile by ID
 * @param uid User ID
 * @returns The user profile or null if not found
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const db = getDbInstance();
    const userProfileRef = doc(db, 'userProfiles', uid);
    const userProfileDoc = await getDoc(userProfileRef);

    if (userProfileDoc.exists()) {
      return {
        uid,
        ...userProfileDoc.data()
      } as UserProfile;
    }

    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
}
