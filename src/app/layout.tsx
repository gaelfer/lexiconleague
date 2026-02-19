import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "Lexicon League — Words are your superpower!",
  description:
    "A fun vocabulary and punctuation game for kids. Climb the ranks, beat your best, and become a word champion!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased min-h-screen bg-white text-[#0F172A]">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
