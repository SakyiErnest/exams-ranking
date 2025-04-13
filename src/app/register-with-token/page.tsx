'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { validateToken, markTokenAsUsed, InvitationToken } from '@/lib/tokenService';
import { createOrUpdateUserProfile } from '@/lib/userProfileService';
import Link from 'next/link';
import { FiAlertCircle, FiLoader, FiUser, FiMail, FiLock, FiKey } from 'react-icons/fi';

// Error and loading indicators
const Spinner = ({ className = "h-5 w-5" }: { className?: string }) => (
  <FiLoader className={`animate-spin ${className}`} aria-label="Loading..." />
);

const ErrorMessage = ({ message }: { message: string | null }) => {
  if (!message) return null;
  return (
    <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 flex items-center">
      <FiAlertCircle className="mr-2 h-5 w-5 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
};

// Form input with validation
interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  icon?: React.ElementType;
  error?: string;
}

const FormInput = ({ id, label, icon: Icon, type = 'text', error, ...props }: FormInputProps) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <div className="relative">
      {Icon && (
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Icon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>
      )}
      <input
        id={id}
        name={id}
        type={type}
        {...props}
        className={`mt-1 block w-full rounded-md border ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'} px-3 py-2 shadow-sm focus:outline-none focus:ring-1 ${Icon ? 'pl-10' : ''}`}
      />
    </div>
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
);

// Component that uses searchParams - will be wrapped in Suspense
function RegisterWithTokenContent() {
  const { user, signup, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [token, setToken] = useState<string>('');
  const [tokenData, setTokenData] = useState<InvitationToken | null>(null);
  const [isValidatingToken, setIsValidatingToken] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validate token from URL
  const validateTokenFromParam = async (tokenValue: string) => {
    try {
      setIsValidatingToken(true);
      setTokenError(null);

      const validatedToken = await validateToken(tokenValue);

      if (!validatedToken) {
        setTokenError('Invalid or expired invitation token');
      } else {
        setTokenData(validatedToken);
        // Pre-fill email if token has one
        if (validatedToken.email) {
          setEmail(validatedToken.email);
        }
      }
    } catch (err) {
      console.error('Error validating token:', err);
      setTokenError('Failed to validate invitation token');
    } finally {
      setIsValidatingToken(false);
    }
  };

  // Check for token in URL
  useEffect(() => {
    const tokenParam = searchParams?.get('token');
    if (tokenParam) {
      setToken(tokenParam);
      validateTokenFromParam(tokenParam);
    }
  }, [searchParams]);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  // Validate token from input
  const handleValidateToken = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token.trim()) {
      setTokenError('Please enter an invitation token');
      return;
    }

    await validateTokenFromParam(token.trim());
  };

  // Handle registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tokenData) {
      setError('Invalid token. Please enter a valid invitation token');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Create user account
      const userCredential = await signup(email, password);

      if (!userCredential || !userCredential.user) {
        throw new Error('Failed to create user account');
      }

      // Create user profile with organization association
      await createOrUpdateUserProfile(userCredential.user.uid, {
        email,
        displayName: displayName || email.split('@')[0],
        organizationId: tokenData.organizationId,
        role: tokenData.role
      });

      // Mark token as used
      await markTokenAsUsed(tokenData.id, userCredential.user.uid);

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: unknown) {
      console.error('Registration error:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to register. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Spinner className="h-12 w-12 mx-auto mb-4 text-blue-600" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Register with Invitation
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter your invitation token to create an account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {!tokenData ? (
            // Token validation form
            <>
              <ErrorMessage message={tokenError} />

              <form className="space-y-6" onSubmit={handleValidateToken}>
                <FormInput
                  id="token"
                  label="Invitation Token"
                  icon={FiKey}
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Enter your invitation token"
                />

                <div>
                  <button
                    type="submit"
                    disabled={isValidatingToken}
                    className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {isValidatingToken ? (
                      <>
                        <Spinner className="mr-2" />
                        Validating...
                      </>
                    ) : (
                      'Validate Token'
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-2 text-gray-500">Already have an account?</span>
                  </div>
                </div>

                <div className="mt-6">
                  <Link
                    href="/login"
                    className="flex w-full justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Sign in
                  </Link>
                </div>
              </div>
            </>
          ) : (
            // Registration form
            <>
              <ErrorMessage message={error} />

              <div className="mb-4 rounded-md bg-blue-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1 md:flex md:justify-between">
                    <p className="text-sm text-blue-700">
                      Valid invitation token. You will be registered as a <strong>{tokenData.role}</strong>.
                    </p>
                  </div>
                </div>
              </div>

              <form className="space-y-6" onSubmit={handleRegister}>
                <FormInput
                  id="email"
                  label="Email address"
                  icon={FiMail}
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!!tokenData.email}
                />
                {tokenData.email && (
                  <p className="mt-1 text-xs text-gray-500">
                    Email is pre-filled from your invitation
                  </p>
                )}

                <FormInput
                  id="displayName"
                  label="Display Name"
                  icon={FiUser}
                  autoComplete="name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name (optional)"
                />

                <FormInput
                  id="password"
                  label="Password"
                  icon={FiLock}
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <FormInput
                  id="confirmPassword"
                  label="Confirm Password"
                  icon={FiLock}
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={password !== confirmPassword ? "Passwords don't match" : undefined}
                />

                <div>
                  <button
                    type="submit"
                    disabled={isSubmitting || password !== confirmPassword}
                    className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner className="mr-2" />
                        Registering...
                      </>
                    ) : (
                      'Register'
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Loading fallback for Suspense
function TokenRegistrationLoading() {
  return (
    <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Loading Registration...
        </h2>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main page component with Suspense boundary
export default function RegisterWithTokenPage() {
  return (
    <Suspense fallback={<TokenRegistrationLoading />}>
      <RegisterWithTokenContent />
    </Suspense>
  );
}
