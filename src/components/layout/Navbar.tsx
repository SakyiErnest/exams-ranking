import { useOnboarding } from '@/contexts/OnboardingContext';
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

export default function Navbar() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user: _user, logout: _logout } = useAuth();
  const { startOnboarding } = useOnboarding();

  // Add this line to create the state
  const [helpMenuOpen, setHelpMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 justify-between">
          {/* ...existing code... */}
          
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {/* Add Help dropdown before the profile dropdown */}
            <div className="ml-3 relative">
              <div>
                <button
                  type="button"
                  onClick={() => setHelpMenuOpen(!helpMenuOpen)}
                  className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 items-center px-3 py-2 text-gray-700 hover:text-gray-900"
                  id="help-menu-button"
                  aria-expanded="false"
                  aria-haspopup="true"
                >
                  <span className="sr-only">Open help menu</span>
                  <QuestionMarkCircleIcon className="h-6 w-6 mr-1" />
                  <span>Help</span>
                </button>
              </div>
              
              {helpMenuOpen && (
                <div
                  className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="help-menu-button"
                  tabIndex={-1}
                >
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      startOnboarding();
                      setHelpMenuOpen(false);
                    }}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                  >
                    Start Onboarding Guide
                  </a>
                  <Link
                    href="/assessment-calculation"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                    onClick={() => setHelpMenuOpen(false)}
                  >
                    Score Calculation Guide
                  </Link>
                  <a
                    href="#"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                  >
                    FAQ
                  </a>
                  <a
                    href="#"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                  >
                    Contact Support
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
