'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, AuthError } from 'firebase/auth';
import { getFirebase } from '@/lib/firebase';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterFormValues } from '@/lib/validation';
// Icons if needed
import { FiAlertCircle, FiLoader, FiUser, FiMail, FiLock } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';

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

export default function Register() {
    const [serverError, setServerError] = useState<string | null>(null);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const router = useRouter();

    // Initialize React Hook Form
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting }
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: '',
            email: '',
            password: '',
            confirmPassword: ''
        }
    });

    const onSubmit = useCallback(async (data: RegisterFormValues) => {
        setServerError(null);

        try {
            const { auth } = getFirebase();
            if (!auth) {
                throw new Error('Authentication service is not available');
            }

            // Create the user with email and password
            await createUserWithEmailAndPassword(auth, data.email, data.password);

            // Update the user's profile with their name
            if (auth.currentUser) {
                await updateProfile(auth.currentUser, {
                    displayName: data.name
                });
            }

            router.push('/dashboard');
        } catch (error: unknown) {
            const authError = error as AuthError;
            console.error('Registration error:', authError);

            if (authError.code === 'auth/email-already-in-use') {
                setServerError('Email is already in use');
            } else if (authError.code === 'auth/invalid-email') {
                setServerError('Invalid email address');
            } else if (authError.code === 'auth/weak-password') {
                setServerError('Password is too weak');
            } else {
                setServerError('Failed to register. Please try again');
            }
        }
    }, [router]);

    const handleGoogleSignIn = useCallback(async () => {
        setServerError(null);
        setIsGoogleLoading(true);

        try {
            const { auth, googleProvider } = getFirebase();
            if (!auth || !googleProvider) {
                throw new Error('Authentication service is not available');
                setIsGoogleLoading(false);
                return;
            }

            const result = await signInWithPopup(auth, googleProvider);

            // If it's a new user and there's no display name, you might want to update it
            if (result.user && !result.user.displayName) {
                await updateProfile(result.user, {
                    displayName: result.user.email?.split('@')[0] || 'User'
                });
            }

            router.push('/dashboard');
        } catch (error: unknown) {
            const authError = error as AuthError;
            console.error('Google sign-in error:', authError);

            if (authError.code === 'auth/popup-closed-by-user') {
                // User closed the popup, no need to show error
            } else if (authError.code === 'auth/cancelled-popup-request') {
                // No need to show error for cancelled popup
            } else {
                setServerError('Failed to sign in with Google. Please try again');
            }
        } finally {
            setIsGoogleLoading(false);
        }
    }, [router]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
                        Create your account
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Start managing your classroom today
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    {serverError && <ErrorMessage message={serverError} />}

                    <div className="space-y-4 rounded-md shadow-sm">
                        <FormInput
                            id="name"
                            label="Full Name"
                            type="text"
                            placeholder="Jane Doe"
                            icon={FiUser}
                            error={errors.name?.message}
                            disabled={isSubmitting || isGoogleLoading}
                            {...register('name')}
                        />

                        <FormInput
                            id="email"
                            label="Email Address"
                            type="email"
                            placeholder="jane@example.com"
                            icon={FiMail}
                            error={errors.email?.message}
                            disabled={isSubmitting || isGoogleLoading}
                            {...register('email')}
                        />

                        <FormInput
                            id="password"
                            label="Password"
                            type="password"
                            placeholder="••••••••"
                            icon={FiLock}
                            error={errors.password?.message}
                            disabled={isSubmitting || isGoogleLoading}
                            {...register('password')}
                        />

                        <FormInput
                            id="confirmPassword"
                            label="Confirm Password"
                            type="password"
                            placeholder="••••••••"
                            icon={FiLock}
                            error={errors.confirmPassword?.message}
                            disabled={isSubmitting || isGoogleLoading}
                            {...register('confirmPassword')}
                        />
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isSubmitting || isGoogleLoading}
                            className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-75"
                        >
                            {isSubmitting ? (
                                <>
                                    <Spinner className="mr-2 h-4 w-4" />
                                    Creating account...
                                </>
                            ) : 'Create account'}
                        </button>
                    </div>

                    <div className="flex items-center">
                        <div className="flex-grow border-t border-gray-300"></div>
                        <span className="mx-4 flex-shrink text-sm text-gray-500">OR</span>
                        <div className="flex-grow border-t border-gray-300"></div>
                    </div>

                    <div>
                        <button
                            type="button"
                            onClick={handleGoogleSignIn}
                            disabled={isSubmitting || isGoogleLoading}
                            className="flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-75"
                        >
                            {isGoogleLoading ? (
                                <>
                                    <Spinner className="mr-2 h-4 w-4" />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    <FcGoogle className="mr-2 h-5 w-5" />
                                    Continue with Google
                                </>
                            )}
                        </button>
                    </div>

                    <div className="flex items-center justify-center">
                        <div className="text-sm">
                            <span className="text-gray-500">Already have an account? </span>
                            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                                Sign in
                            </Link>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}