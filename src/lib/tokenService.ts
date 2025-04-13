'use client';

import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { getDbInstance } from './db';
import { generateToken } from './utils';

// Token interface
export interface InvitationToken {
  id: string;
  token: string;
  organizationId: string;
  role: 'admin' | 'teacher' | 'department_head';
  email?: string;
  createdBy: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  isUsed: boolean;
  usedBy?: string;
  usedAt?: Timestamp;
}

// Collection reference
const getTokensRef = () => collection(getDbInstance(), 'invitationTokens');

/**
 * Generates a new invitation token
 * @param organizationId Organization ID
 * @param role Role to assign to the user
 * @param createdBy User ID of the creator
 * @param email Optional email to associate with the token
 * @param expirationDays Number of days until the token expires
 * @returns The created invitation token
 */
export async function generateInvitationToken(
  organizationId: string,
  role: 'admin' | 'teacher' | 'department_head',
  createdBy: string,
  email?: string,
  expirationDays: number = 30
): Promise<InvitationToken> {
  try {
    // Ensure database is initialized
    getDbInstance();
    const tokenRef = doc(getTokensRef());

    // Generate a secure random token
    const token = generateToken(16);

    // Calculate expiration date
    const now = Timestamp.now();
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + expirationDays);

    const invitationToken: InvitationToken = {
      id: tokenRef.id,
      token,
      organizationId,
      role,
      email,
      createdBy,
      createdAt: now,
      expiresAt: Timestamp.fromDate(expirationDate),
      isUsed: false
    };

    await setDoc(tokenRef, invitationToken);

    return invitationToken;
  } catch (error) {
    console.error('Error generating invitation token:', error);
    throw error;
  }
}

/**
 * Gets all invitation tokens for an organization
 * @param organizationId Organization ID
 * @returns Array of invitation tokens
 */
export async function getOrganizationTokens(organizationId: string): Promise<InvitationToken[]> {
  try {
    const tokensQuery = query(
      getTokensRef(),
      where('organizationId', '==', organizationId)
    );

    const querySnapshot = await getDocs(tokensQuery);

    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as InvitationToken[];
  } catch (error) {
    console.error('Error getting organization tokens:', error);
    throw error;
  }
}

/**
 * Validates an invitation token
 * @param token Token string
 * @returns The token information if valid, null otherwise
 */
export async function validateToken(token: string): Promise<InvitationToken | null> {
  try {
    const tokensQuery = query(
      getTokensRef(),
      where('token', '==', token)
    );

    const querySnapshot = await getDocs(tokensQuery);

    if (querySnapshot.empty) {
      return null; // Token not found
    }

    const tokenDoc = querySnapshot.docs[0];
    const tokenData = tokenDoc.data() as InvitationToken;

    // Check if token is already used
    if (tokenData.isUsed) {
      return null;
    }

    // Check if token is expired
    const now = Timestamp.now();
    if (tokenData.expiresAt.seconds < now.seconds) {
      return null;
    }

    return {
      ...tokenData,
      id: tokenDoc.id
    };
  } catch (error) {
    console.error('Error validating token:', error);
    throw error;
  }
}

/**
 * Marks a token as used
 * @param tokenId Token ID
 * @param userId User ID who used the token
 */
export async function markTokenAsUsed(tokenId: string, userId: string): Promise<void> {
  try {
    const tokenRef = doc(getDbInstance(), 'invitationTokens', tokenId);

    await setDoc(tokenRef, {
      isUsed: true,
      usedBy: userId,
      usedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Error marking token as used:', error);
    throw error;
  }
}

/**
 * Revokes (deletes) an invitation token
 * @param tokenId Token ID
 */
export async function revokeToken(tokenId: string): Promise<void> {
  try {
    const tokenRef = doc(getDbInstance(), 'invitationTokens', tokenId);
    await deleteDoc(tokenRef);
  } catch (error) {
    console.error('Error revoking token:', error);
    throw error;
  }
}
