'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import {
    profileUpdateSchema,
    passwordChangeSchema,
    ProfileUpdateValues,
    PasswordChangeValues
} from '@/lib/validation';
import {
    updateUserProfile,
    updateUserPassword,
    canUpdateCredentials
} from '@/lib/userProfile';
import { FiUser, FiLock, FiCheck, FiAlertCircle, FiLoader } from 'react-icons/fi';

// Shared UI components
const Spinner = ({ className = "h-5 w-5" }: { className?: string }) => (
    <FiLoader className={`animate-spin ${className}`} aria-label="Loading..." />
);

const SuccessMessage = ({ message }: { message: string | null }) => {
    if (!message) return null;
    return (
        <div className="mb-4 flex items-center rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-700 shadow-sm" role="alert">
            <FiCheck className="mr-2 h-5 w-5 flex-shrink-0" />
            <span>{message}</span>
        </div>
    );
};

const ErrorMessage = ({ message }: { message: string | null }) => {
    if (!message) return null;
    return (
        <div className="mb-4 flex items-center rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700 shadow-sm" role="alert">
            <FiAlertCircle className="mr-2 h-5 w-5 flex-shrink-0" />
            <span>{message}</span>
        </div>
    );
};

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    id: string;
    label: string;
    icon?: React.ElementType;
    error?: string;
}

const FormInput = ({ id, label, icon: Icon, type = 'text', error, ...props }: FormInputProps) => (
    <div className="space-y-1">
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">
            {label}
        </label>
        <div className="relative">
            {Icon && (
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Icon className="h-5 w-5 text-slate-400" aria-hidden="true" />
                </div>
            )}
            <input
                id={id}
                name={id}
                type={type}
                {...props}
                className={`block w-full rounded-md border ${error ? 'border-red-300 ring-red-500' : 'border-slate-300'} px-3 py-2 shadow-sm transition-colors duration-150 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${Icon ? 'pl-10' : ''
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
            />
        </div>
        {error && (
            <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
    </div>
);

export default function ProfilePage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [canUpdateAuth, setCanUpdateAuth] = useState(false);

    // Form 1: Profile update form
    const {
        register: registerProfile,
        handleSubmit: handleSubmitProfile,
        formState: { errors: profileErrors, isSubmitting: profileSubmitting },
        reset: resetProfileForm
    } = useForm<ProfileUpdateValues>({
        resolver: zodResolver(profileUpdateSchema),
        defaultValues: {
            displayName: user?.displayName || '',
        }
    });

    // Form 2: Password change form
    const {
        register: registerPassword,
        handleSubmit: handleSubmitPassword,
        formState: { errors: passwordErrors, isSubmitting: passwordSubmitting },
        reset: resetPasswordForm
    } = useForm<PasswordChangeValues>({
        resolver: zodResolver(passwordChangeSchema),
        defaultValues: {
            currentPassword: '',
            newPassword: '',
            confirmNewPassword: ''
        }
    });

    // Redirect if not logged in
    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    // Update form defaults when user data is available
    useEffect(() => {
        if (user) {
            resetProfileForm({
                displayName: user.displayName || '',
            });
            setCanUpdateAuth(canUpdateCredentials(user));
        }
    }, [user, resetProfileForm]);

    // Handle profile update
    const onProfileUpdate = useCallback(async (data: ProfileUpdateValues) => {
        setError(null);
        setSuccess(null);

        try {
            const updates: { displayName?: string } = {};
            
            // Only update display name if it has changed
            if (data.displayName !== user?.displayName) {
                updates.displayName = data.displayName;
            }

            // Only proceed if there are changes
            if (Object.keys(updates).length === 0) {
                setSuccess('No changes to update');
                return;
            }

            await updateUserProfile(updates);
            setSuccess('Profile updated successfully');
        } catch (err) {
            console.error('Error updating profile:', err);
            setError('Failed to update profile. Please try again.');
        }
    }, [user]);

    // Handle password change
    const onPasswordChange = useCallback(async (data: PasswordChangeValues) => {
        setError(null);
        setSuccess(null);

        try {
            await updateUserPassword({
                currentPassword: data.currentPassword,
                newPassword: data.newPassword
            });
            
            // Reset form after successful password change
            resetPasswordForm();
            setSuccess('Password changed successfully');
        } catch (err: unknown) {
            console.error('Error changing password:', err);
            
            // Show specific error message for wrong password
            if (typeof err === 'object' && err !== null && 'code' in err && err.code === 'auth/wrong-password') {
                setError('Current password is incorrect');
            } else {
                setError('Failed to change password. Please try again.');
            }
        }
    }, [resetPasswordForm]);

    // If still loading or no user, show loading
    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Spinner className="h-8 w-8" />
                <span className="ml-2">Loading profile...</span>
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-2xl px-4 py-8">
            <h1 className="mb-8 text-3xl font-bold">Your Profile</h1>

            {/* Profile Overview Card */}
            <div className="mb-8 rounded-lg bg-white p-6 shadow-md">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        {user?.photoURL ? (
                            <Image
                                src={user.photoURL}
                                alt={user.displayName || 'Profile'}
                                className="h-16 w-16 rounded-full"
                                width={64}
                                height={64}
                            />
                        ) : (
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                                <FiUser className="h-8 w-8" />
                            </div>
                        )}
                    </div>
                    <div className="ml-5">
                        <h2 className="text-xl font-semibold text-gray-900">{user?.displayName || 'User'}</h2>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                        {/* Show provider information */}
                        <p className="mt-1 text-xs text-gray-400">
                            Sign-in method: {user?.providerData[0]?.providerId === 'password' ? 'Email/Password' : 'Google'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Success or Error Messages */}
            <SuccessMessage message={success} />
            <ErrorMessage message={error} />

            {/* Profile Update Form */}
            <div className="mb-8 rounded-lg bg-white p-6 shadow-md">
                <h2 className="mb-4 text-xl font-semibold">Update Profile Information</h2>
                <form onSubmit={handleSubmitProfile(onProfileUpdate)} className="space-y-5">
                    <FormInput
                        id="displayName"
                        label="Display Name"
                        icon={FiUser}
                        error={profileErrors.displayName?.message}
                        disabled={profileSubmitting}
                        {...registerProfile('displayName')}
                    />

                    <button
                        type="submit"
                        disabled={profileSubmitting}
                        className="flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {profileSubmitting ? (
                            <>
                                <Spinner className="mr-2 h-4 w-4" />
                                Updating Profile...
                            </>
                        ) : (
                            'Update Profile'
                        )}
                    </button>
                </form>
            </div>

            {/* Password Change Form - Only show for users with password authentication */}
            {canUpdateAuth && (
                <div className="rounded-lg bg-white p-6 shadow-md">
                    <h2 className="mb-4 text-xl font-semibold">Change Password</h2>
                    <form onSubmit={handleSubmitPassword(onPasswordChange)} className="space-y-5">
                        <FormInput
                            id="currentPassword"
                            label="Current Password"
                            type="password"
                            icon={FiLock}
                            error={passwordErrors.currentPassword?.message}
                            disabled={passwordSubmitting}
                            {...registerPassword('currentPassword')}
                        />

                        <FormInput
                            id="newPassword"
                            label="New Password"
                            type="password"
                            icon={FiLock}
                            error={passwordErrors.newPassword?.message}
                            disabled={passwordSubmitting}
                            {...registerPassword('newPassword')}
                        />

                        <FormInput
                            id="confirmNewPassword"
                            label="Confirm New Password"
                            type="password"
                            icon={FiLock}
                            error={passwordErrors.confirmNewPassword?.message}
                            disabled={passwordSubmitting}
                            {...registerPassword('confirmNewPassword')}
                        />

                        <button
                            type="submit"
                            disabled={passwordSubmitting}
                            className="flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {passwordSubmitting ? (
                                <>
                                    <Spinner className="mr-2 h-4 w-4" />
                                    Changing Password...
                                </>
                            ) : (
                                'Change Password'
                            )}
                        </button>
                    </form>
                </div>
            )}

            {/* For Google users - information notice */}
            {!canUpdateAuth && (
                <div className="rounded-lg bg-yellow-50 p-6 shadow-md border border-yellow-200">
                    <h2 className="mb-2 text-lg font-semibold text-yellow-800">Google Sign-In Account</h2>
                    <p className="text-sm text-yellow-700">
                        You&apos;re signed in with Google. Password management is handled through your Google account.
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                        Don&apos;t see an option to update your password? Third-party authentication providers like Google manage your credentials.
                    </p>
                </div>
            )}

            {/* Back to Dashboard Link */}
            <div className="mt-6 text-center">
                <button
                    onClick={() => router.push('/dashboard')}
                    className="inline-block text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                    Back to Dashboard
                </button>
            </div>
        </div>
    );
}
