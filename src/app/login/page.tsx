'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, signInWithPopup, AuthError } from 'firebase/auth';
import { getFirebase } from '@/lib/firebase';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormValues } from '@/lib/validation';
import { FiLogIn, FiMail, FiLock, FiAlertCircle, FiLoader } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';

// --- Reusable UI Components ---

const Spinner = ({ className = "h-5 w-5" }: { className?: string }) => (
    <FiLoader className={`animate-spin ${className}`} aria-label="Loading..." />
);

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

export default function Login() {
    const [serverError, setServerError] = useState<string | null>(null);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const router = useRouter();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting }
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: ''
        }
    });

    const onSubmit = useCallback(async (data: LoginFormValues) => {
        setServerError(null);

        try {
            const { auth } = getFirebase();
            if (!auth) {
                throw new Error('Authentication service is not available. Please try again later.');
            }

            await signInWithEmailAndPassword(auth, data.email, data.password);
            router.push('/dashboard');

        } catch (error: unknown) {
            const authError = error as AuthError;
            console.error('Login Error:', authError.code, authError.message);

            switch (authError.code) {
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    setServerError('Invalid email or password. Please check your credentials.');
                    break;
                case 'auth/too-many-requests':
                    setServerError('Access temporarily disabled due to too many login attempts. Please try again later.');
                    break;
                case 'auth/network-request-failed':
                    setServerError('Network error. Please check your internet connection and try again.');
                    break;
                default:
                    setServerError(authError.message || 'An unexpected error occurred during login. Please try again.');
                    break;
            }
        }
    }, [router]);

    const handleGoogleSignIn = useCallback(async () => {
        setServerError(null);
        setIsGoogleLoading(true);

        try {
            const { auth, googleProvider } = getFirebase();
            if (!auth || !googleProvider) {
                throw new Error('Authentication service is not available. Please try again later.');
            }

            await signInWithPopup(auth, googleProvider);
            router.push('/dashboard');

        } catch (error: unknown) {
            const authError = error as AuthError;
            console.error('Google Sign-In Error:', authError.code, authError.message);

            switch (authError.code) {
                case 'auth/popup-closed-by-user':
                case 'auth/cancelled-popup-request':
                    console.log('Google Sign-In cancelled by user.');
                    break;
                case 'auth/account-exists-with-different-credential':
                    setServerError('An account already exists with the same email address using a different sign-in method.');
                    break;
                case 'auth/network-request-failed':
                    setServerError('Network error. Please check your internet connection and try again.');
                    break;
                default:
                    setServerError(authError.message || 'Failed to sign in with Google. Please try again.');
                    break;
            }
        } finally {
            setIsGoogleLoading(false);
        }
    }, [router]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
            <div className="w-full max-w-md">
                <div className="rounded-xl bg-white p-6 sm:p-8 shadow-lg border border-slate-200">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                            Teacher Dashboard Login
                        </h1>
                        <p className="mt-2 text-sm text-slate-600">
                            Access your student ranking tools.
                        </p>
                    </div>

                    <ErrorMessage message={serverError} />

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <FormInput
                            id="email"
                            label="Email Address"
                            type="email"
                            error={errors.email?.message}
                            icon={FiMail}
                            disabled={isSubmitting || isGoogleLoading}
                            {...register('email')}
                        />

                        <FormInput
                            id="password"
                            label="Password"
                            type="password"
                            error={errors.password?.message}
                            icon={FiLock}
                            disabled={isSubmitting || isGoogleLoading}
                            {...register('password')}
                        />

                        <button
                            type="submit"
                            disabled={isSubmitting || isGoogleLoading}
                            className="flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <Spinner className="mr-2 h-4 w-4" />
                                    Logging In...
                                </>
                            ) : (
                                <>
                                    <FiLogIn className="mr-2 h-5 w-5" />
                                    Log In
                                </>
                            )}
                        </button>
                    </form>

                    <div className="my-6 flex items-center">
                        <div className="flex-grow border-t border-slate-200"></div>
                        <span className="mx-4 flex-shrink text-xs font-medium uppercase text-slate-400">Or continue with</span>
                        <div className="flex-grow border-t border-slate-200"></div>
                    </div>

                    <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={isSubmitting || isGoogleLoading}
                        className="flex w-full items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors duration-150 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {isGoogleLoading ? (
                            <>
                                <Spinner className="mr-2 h-4 w-4" />
                                Signing In...
                            </>
                        ) : (
                            <>
                                <FcGoogle className="mr-2 h-5 w-5" />
                                Google
                            </>
                        )}
                    </button>

                    <div className="mt-8 text-center text-sm">
                        <p className="text-slate-600 mb-2">
                            Don&apos;t have an account?{' '}
                            <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-700 underline underline-offset-2">
                                Create one here
                            </Link>
                        </p>
                        <p className="text-slate-600">
                            Have an invitation token?{' '}
                            <Link href="/register-with-token" className="font-semibold text-blue-600 hover:text-blue-700 underline underline-offset-2">
                                Register with token
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}