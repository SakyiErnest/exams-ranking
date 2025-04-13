import { Timestamp } from 'firebase/firestore';

export interface Organization {
  id: string;
  name: string;
  domain?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status: 'active' | 'inactive' | 'trial';
  
  // Subscription details
  subscriptionTier: 'free' | 'basic' | 'professional' | 'enterprise';
  subscriptionStatus: 'active' | 'past_due' | 'canceled' | 'trialing';
  subscriptionStartDate: Timestamp;
  subscriptionEndDate: Timestamp;
  
  // Contact information
  adminEmail: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  
  // Customization
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    favicon?: string;
  };
  
  // Settings
  settings: {
    gradingScale?: Record<string, number>;
    academicYearStart?: string;
    defaultLanguage: string;
    timeZone: string;
    features: {
      advancedReporting: boolean;
      aiFeatures: boolean;
      parentPortal: boolean;
      apiAccess: boolean;
    };
  };
  
  // Limits based on subscription
  limits: {
    maxUsers: number;
    maxStudents: number;
    storageLimit: number;
  };
}

export interface OrganizationInvitation {
  id: string;
  organizationId: string;
  email: string;
  role: 'admin' | 'teacher' | 'department_head';
  status: 'pending' | 'accepted' | 'expired';
  createdAt: Timestamp;
  expiresAt: Timestamp;
  invitedBy: string;
  token: string;
}

export interface OrganizationCreateData {
  name: string;
  domain?: string;
  adminEmail: string;
  phone?: string;
  subscriptionTier?: 'free' | 'basic' | 'professional' | 'enterprise';
}

export interface SubscriptionData {
  tier: 'free' | 'basic' | 'professional' | 'enterprise';
  status: 'active' | 'past_due' | 'canceled' | 'trialing';
  startDate: Timestamp;
  endDate: Timestamp;
}

export interface OrganizationSettings {
  gradingScale?: Record<string, number>;
  academicYearStart?: string;
  defaultLanguage: string;
  timeZone: string;
  features: {
    advancedReporting: boolean;
    aiFeatures: boolean;
    parentPortal: boolean;
    apiAccess: boolean;
  };
}
