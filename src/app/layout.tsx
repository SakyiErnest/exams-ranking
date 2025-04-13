import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import { SettingsProvider } from "../contexts/SettingsContext";
import { OnboardingProvider } from '@/contexts/OnboardingContext';
import { OrganizationProvider } from '@/contexts/OrganizationContext';
import Navbar from "@/components/navigation/Navbar";
import OnboardingModal from '@/components/onboarding/OnboardingModal';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EduGrade Pro",
  description: "A comprehensive platform for tracking student performance, assessments, and generating detailed reports",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <OrganizationProvider>
            <SettingsProvider>
              <OnboardingProvider>
                <Navbar />
                <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                  {children}
                </main>
                <OnboardingModal />
              </OnboardingProvider>
            </SettingsProvider>
          </OrganizationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

