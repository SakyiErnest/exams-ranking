'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createDocument } from '@/lib/db';
import { GradeLevel } from '@/types'; // Import type for createDocument

// --- Import reusable components & icons ---
import { FiPlusSquare, FiAward, FiCheck, FiX, FiAlertCircle, FiLoader } from 'react-icons/fi';

// --- Reusable UI Components ---

const LoadingSpinner = ({ message = 'Loading...' }: { message?: string }) => (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center text-center">
        <div>
            <FiLoader className="mx-auto mb-4 h-10 w-10 animate-spin text-blue-600" />
            <p className="text-sm font-medium text-slate-600">{message}</p>
        </div>
    </div>
);

const ErrorMessage = ({ message }: { message: string | null }) => {
    if (!message) return null;
    return (
        <div className="mb-5 flex items-center rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700 shadow-sm" role="alert">
            <FiAlertCircle className="mr-2 h-5 w-5 flex-shrink-0" />
            <span>{message}</span>
        </div>
    );
};

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    id: string;
    label: string;
    helperText?: string;
    icon?: React.ElementType;
}
const FormInput = ({ id, label, helperText, icon: Icon, type = 'text', ...props }: FormInputProps) => (
    <div>
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
                className={`block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm transition-colors duration-150 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${Icon ? 'pl-10' : ''
                } disabled:opacity-50 disabled:cursor-not-allowed`}
            />
        </div>
        {helperText && (
            <p className="mt-1.5 text-xs text-slate-500">{helperText}</p>
        )}
    </div>
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    isLoading?: boolean;
    loadingText?: string;
    variant?: 'primary' | 'secondary' | 'success' | 'danger';
    icon?: React.ElementType;
}
const Button = ({ children, isLoading = false, loadingText = "Processing...", variant = 'primary', icon: Icon, className = '', ...props }: ButtonProps) => {
    const baseStyle = "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold shadow-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed";
    const variants = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
        secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus:ring-blue-500',
        // *** Added missing variants ***
        success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    };

    // *** Removed @ts-ignore ***
    return (
        <button
            type="button" // Default to type="button" unless explicitly set to "submit"
            disabled={isLoading || props.disabled}
            // Added fallback just in case, though TS should prevent invalid variants now
            className={`${baseStyle} ${variants[variant] || variants.secondary} ${className}`}
            {...props}
        >
            {isLoading ? (
                <>
                    <FiLoader className="mr-2 h-4 w-4 animate-spin" />
                    {loadingText}
                </>
            ) : (
                <>
                    {Icon && <Icon className="mr-1.5 h-4 w-4" aria-hidden="true" />}
                    {children}
                </>
            )}
        </button>
    );
};


// --- AddGradeLevel Component ---

export default function AddGradeLevel() {
    const [name, setName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !user) {
            router.replace('/login');
        }
    }, [user, authLoading, router]);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const trimmedName = name.trim();
        if (!trimmedName) {
            setError('Grade level name cannot be empty.');
            return;
        }

        if (!user?.uid) {
            setError('Authentication error. Please log in again.');
            return;
        }

        setIsLoading(true);

        try {
            const gradeLevelData: Omit<GradeLevel, 'id'> = {
                name: trimmedName,
                teacherId: user.uid,
            };
            await createDocument<GradeLevel>('gradeLevels', gradeLevelData);
            router.push('/grade-levels');

        } catch (err: unknown) {
            console.error('Error creating grade level:', err);
            let message = 'Failed to create grade level. Please try again.';
            if (err instanceof Error) {
                message = err.message;
            } else if (typeof err === 'string') {
                message = err;
            }
            setError(message);
            setIsLoading(false);
        }
    }, [name, user, router]);

    if (authLoading) {
        return <LoadingSpinner message="Checking authentication..." />;
    }

    if (!user) {
        return null;
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <header className="mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center">
                    <FiPlusSquare className="mr-3 h-7 w-7 text-blue-600" />
                    Add New Grade Level
                </h1>
                <p className="mt-1 text-base text-slate-600">
                    Define a new class group for organization.
                </p>
            </header>

            <div className="max-w-xl rounded-lg border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
                <ErrorMessage message={error} />

                <form onSubmit={handleSubmit} className="space-y-5">
                    <FormInput
                        id="name"
                        label="Grade Level Name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Grade 6A, Form 1 Blue"
                        required
                        maxLength={100}
                        icon={FiAward}
                        helperText="Enter a descriptive name (e.g., Grade 7, Section B)."
                        disabled={isLoading}
                    />

                    <div className="flex items-center justify-end gap-x-3 pt-2">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => router.back()}
                            disabled={isLoading}
                            icon={FiX}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit" // Ensure this one is type="submit"
                            variant="primary"
                            isLoading={isLoading}
                            loadingText="Adding..."
                            icon={FiCheck}
                        >
                            Add Grade Level
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}