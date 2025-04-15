'use client';

import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Navbar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    // Hide navbar on login and register pages
    if (pathname === '/login' || pathname === '/register') {
        return null;
    }

    return (
        <nav className="bg-blue-600 shadow-md">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 justify-between">
                    <div className="flex">
                        <div className="flex flex-shrink-0 items-center">
                            <Link href={user ? '/dashboard' : '/'} className="text-xl font-bold text-white">
                                EduGrade Pro
                            </Link>
                        </div>
                        {user && (
                            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                                <Link
                                    href="/dashboard"
                                    className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${pathname === '/dashboard'
                                            ? 'border-white text-white'
                                            : 'border-transparent text-blue-100 hover:border-blue-200 hover:text-white'
                                        }`}
                                >
                                    Dashboard
                                </Link>
                                <Link
                                    href="/students"
                                    className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${pathname === '/students' || pathname.startsWith('/students/')
                                            ? 'border-white text-white'
                                            : 'border-transparent text-blue-100 hover:border-blue-200 hover:text-white'
                                        }`}
                                >
                                    Students
                                </Link>
                                <Link
                                    href="/subjects"
                                    className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${pathname === '/subjects' || pathname.startsWith('/subjects/')
                                            ? 'border-white text-white'
                                            : 'border-transparent text-blue-100 hover:border-blue-200 hover:text-white'
                                        }`}
                                >
                                    Subjects
                                </Link>
                                <Link
                                    href="/dashboard/analytics/ai-insights"
                                    className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${pathname === '/dashboard/analytics/ai-insights'
                                            ? 'border-white text-white'
                                            : 'border-transparent text-blue-100 hover:border-blue-200 hover:text-white'
                                        }`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="mr-1 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 110-2h4a1 1 0 011 1v4a1 1 0 11-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 112 0v1.586l2.293-2.293a1 1 0 011.414 1.414L6.414 15H8a1 1 0 110 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 110-2h1.586l-2.293-2.293a1 1 0 011.414-1.414L15 13.586V12a1 1 0 011-1z" />
                                    </svg>
                                    AI Insights
                                </Link>
                                <Link
                                    href="/reports"
                                    className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${pathname === '/reports'
                                            ? 'border-white text-white'
                                            : 'border-transparent text-blue-100 hover:border-blue-200 hover:text-white'
                                        }`}
                                >
                                    Reports
                                </Link>
                                <Link
                                    href="/organization/dashboard"
                                    className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${pathname.startsWith('/organization')
                                            ? 'border-white text-white'
                                            : 'border-transparent text-blue-100 hover:border-blue-200 hover:text-white'
                                        }`}
                                >
                                    Organization
                                </Link>
                            </div>
                        )}
                    </div>
                    <div className="hidden sm:ml-6 sm:flex sm:items-center">
                        {user ? (
                            <div className="flex items-center space-x-4">
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                                        className="flex items-center text-sm text-white hover:text-blue-200 focus:outline-none"
                                    >
                                        <span className="mr-2">
                                            {user.displayName || user.email}
                                        </span>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {/* User dropdown menu */}
                                    {isMenuOpen && (
                                        <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                            <Link
                                                href="/profile"
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                onClick={() => setIsMenuOpen(false)}
                                            >
                                                Your Profile
                                            </Link>
                                            <Link
                                                href="/settings"
                                                className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                                                onClick={() => setIsMenuOpen(false)}
                                            >
                                                Settings
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    handleLogout();
                                                    setIsMenuOpen(false);
                                                }}
                                                className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                                Logout
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex space-x-4">
                                <Link
                                    href="/login"
                                    className="rounded-md bg-blue-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/register"
                                    className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
                                >
                                    Register
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="flex items-center sm:hidden">
                        <button
                            type="button"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="inline-flex items-center justify-center rounded-md p-2 text-blue-100 hover:bg-blue-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                        >
                            <span className="sr-only">Open main menu</span>
                            {/* Icon when menu is closed */}
                            <svg
                                className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                aria-hidden="true"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            </svg>
                            {/* Icon when menu is open */}
                            <svg
                                className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                aria-hidden="true"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu, show/hide based on menu state */}
            <div className={`${isMenuOpen ? 'block' : 'hidden'} sm:hidden`}>
                <div className="space-y-1 pt-2 pb-3">
                    {user ? (
                        <>
                            <Link
                                href="/dashboard"
                                className={`block border-l-4 py-2 pl-3 pr-4 text-base font-medium ${pathname === '/dashboard'
                                        ? 'border-white bg-blue-700 text-white'
                                        : 'border-transparent text-blue-100 hover:border-blue-300 hover:bg-blue-700 hover:text-white'
                                    }`}
                            >
                                Dashboard
                            </Link>
                            <Link
                                href="/students"
                                className={`block border-l-4 py-2 pl-3 pr-4 text-base font-medium ${pathname === '/students' || pathname.startsWith('/students/')
                                        ? 'border-white bg-blue-700 text-white'
                                        : 'border-transparent text-blue-100 hover:border-blue-300 hover:bg-blue-700 hover:text-white'
                                    }`}
                            >
                                Students
                            </Link>
                            <Link
                                href="/subjects"
                                className={`block border-l-4 py-2 pl-3 pr-4 text-base font-medium ${pathname === '/subjects' || pathname.startsWith('/subjects/')
                                        ? 'border-white bg-blue-700 text-white'
                                        : 'border-transparent text-blue-100 hover:border-blue-300 hover:bg-blue-700 hover:text-white'
                                    }`}
                            >
                                Subjects
                            </Link>
                            <Link
                                href="/dashboard/analytics/ai-insights"
                                className={`block border-l-4 py-2 pl-3 pr-4 text-base font-medium ${pathname === '/dashboard/analytics/ai-insights'
                                        ? 'border-white bg-blue-700 text-white'
                                        : 'border-transparent text-blue-100 hover:border-blue-300 hover:bg-blue-700 hover:text-white'
                                    }`}
                            >
                                <div className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 110-2h4a1 1 0 011 1v4a1 1 0 11-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 112 0v1.586l2.293-2.293a1 1 0 011.414 1.414L6.414 15H8a1 1 0 110 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 110-2h1.586l-2.293-2.293a1 1 0 011.414-1.414L15 13.586V12a1 1 0 011-1z" />
                                    </svg>
                                    AI Insights
                                </div>
                            </Link>
                            <Link
                                href="/reports"
                                className={`block border-l-4 py-2 pl-3 pr-4 text-base font-medium ${pathname === '/reports'
                                        ? 'border-white bg-blue-700 text-white'
                                        : 'border-transparent text-blue-100 hover:border-blue-300 hover:bg-blue-700 hover:text-white'
                                    }`}
                            >
                                Reports
                            </Link>
                            <Link
                                href="/organization/dashboard"
                                className={`block border-l-4 py-2 pl-3 pr-4 text-base font-medium ${pathname.startsWith('/organization')
                                        ? 'border-white bg-blue-700 text-white'
                                        : 'border-transparent text-blue-100 hover:border-blue-300 hover:bg-blue-700 hover:text-white'
                                    }`}
                            >
                                Organization
                            </Link>
                        </>
                    ) : null}
                </div>
                <div className="border-t border-blue-700 pt-4 pb-3">
                    {user ? (
                        <>
                            <div className="flex items-center px-4">
                                <div className="flex-shrink-0">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-800 text-white">
                                        {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                </div>
                                <div className="ml-3">
                                    <div className="text-base font-medium text-white">{user.displayName || 'User'}</div>
                                    <div className="text-sm font-medium text-blue-100">{user.email}</div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="ml-auto flex-shrink-0 rounded-md bg-blue-800 p-1 text-blue-100 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-800"
                                >
                                    <span className="sr-only">Logout</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                </button>
                            </div>
                            <div className="mt-3 space-y-1 px-2">
                                <Link
                                    href="/profile"
                                    className="block rounded-md px-3 py-2 text-base font-medium text-white hover:bg-blue-700"
                                >
                                    Your Profile
                                </Link>
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="block w-full text-left rounded-md px-3 py-2 text-base font-medium text-white hover:bg-blue-700"
                                >
                                    Logout
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex justify-around px-4">
                            <Link
                                href="/login"
                                className="block rounded-md px-3 py-2 text-base font-medium text-white hover:bg-blue-700"
                            >
                                Login
                            </Link>
                            <Link
                                href="/register"
                                className="block rounded-md bg-white px-3 py-2 text-base font-medium text-blue-600"
                            >
                                Register
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}