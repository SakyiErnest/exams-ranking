import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateEmail,
  updatePassword,
  updateProfile,
  User
} from 'firebase/auth';
import { getFirebase } from './firebase';

interface UpdateProfileParams {
  displayName?: string;
  photoURL?: string;
}

interface UpdateEmailParams {
  newEmail: string;
  currentPassword: string;
}

interface UpdatePasswordParams {
  currentPassword: string;
  newPassword: string;
}

/**
 * Helper function to reauthenticate a user using their current password.
 * Throws an error if reauthentication fails.
 */
async function reauthenticateUser(user: User, currentPassword: string): Promise<void> {
  if (!user.email) {
    throw new Error('User does not have an email address to reauthenticate');
  }
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
}

/**
 * Updates the user's profile information (display name and/or photo URL)
 */
export async function updateUserProfile(updates: UpdateProfileParams): Promise<void> {
  const { auth } = getFirebase();
  const user = auth?.currentUser;
  if (!user) {
    throw new Error('No authenticated user found');
  }
  await updateProfile(user, updates);
}

/**
 * Updates the user's email address (requires recent authentication)
 */
export async function updateUserEmail({ newEmail, currentPassword }: UpdateEmailParams): Promise<void> {
  const { auth } = getFirebase();
  const user = auth?.currentUser;
  if (!user) {
    throw new Error('No authenticated user found');
  }
  if (!user.email) {
    throw new Error('Current user has no email address');
  }
  await reauthenticateUser(user, currentPassword);
  await updateEmail(user, newEmail);
}

/**
 * Updates the user's password (requires recent authentication)
 */
export async function updateUserPassword({ currentPassword, newPassword }: UpdatePasswordParams): Promise<void> {
  const { auth } = getFirebase();
  const user = auth?.currentUser;
  if (!user) {
    throw new Error('No authenticated user found');
  }
  if (!user.email) {
    throw new Error('Current user has no email');
  }
  await reauthenticateUser(user, currentPassword);
  await updatePassword(user, newPassword);
}

/**
 * Retrieves the authentication provider IDs for the user.
 */
export function getUserAuthProviders(user: User | null): string[] {
  if (!user) return [];
  return user.providerData.map(provider => provider.providerId);
}

/**
 * Determines if the user can update their email and password.
 * (Users signed in with OAuth providers cannot change password through Firebase)
 */
export function canUpdateCredentials(user: User | null): boolean {
  if (!user) return false;
  const providers = getUserAuthProviders(user);
  return providers.includes('password');
}
