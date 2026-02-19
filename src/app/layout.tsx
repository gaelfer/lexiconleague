import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { PartyProvider } from "@/context/PartyContext";
import { NotificationProvider } from "@/context/NotificationContext";
import PartyBar from "@/components/PartyBar";
import PartyRealtimeSync from "@/components/PartyRealtimeSync";
import OnboardingGate from "@/components/OnboardingGate";
import ProfileSyncOnLoad from "@/components/ProfileSyncOnLoad";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "Lexicon League — Words are your superpower!",
  description:
    "A fun vocabulary and punctuation game for kids. Climb the ranks, beat your best, and become a word champion!",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased min-h-screen bg-white text-[#0F172A]">
        <ThemeProvider>
          <AuthProvider>
            <PartyProvider>
              <NotificationProvider>
                <OnboardingGate>
                  <PartyRealtimeSync />
                  <ProfileSyncOnLoad />
                  {children}
                <PartyBar />
                </OnboardingGate>
              </NotificationProvider>
            </PartyProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
