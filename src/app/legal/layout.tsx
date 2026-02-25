import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Legal | Lexicon League",
  description: "Legal policies for Lexicon League.",
};

const legalLinks = [
  { href: "/legal", label: "Legal Overview" },
  { href: "/legal/privacy", label: "Privacy Policy" },
  { href: "/legal/terms", label: "Terms of Service" },
  { href: "/legal/cookies", label: "Cookie Policy" },
  { href: "/legal/children-privacy", label: "Children's Privacy" },
  { href: "/legal/data-deletion", label: "Data Deletion" },
];

export default function LegalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="min-h-screen bg-[#0B1220] text-[#E2E8F0]">
      <div className="mx-auto w-full max-w-5xl px-6 py-12">
        <header className="mb-8">
          <Link href="/" className="text-sm text-[#93C5FD] hover:text-white">
            Back to Home
          </Link>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white">
            Legal
          </h1>
          <p className="mt-2 text-sm text-[#94A3B8]">
            These pages describe how Lexicon League handles privacy, terms,
            cookies, and account data.
          </p>
        </header>

        <nav className="mb-10 flex flex-wrap gap-2">
          {legalLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-[#CBD5E1] transition hover:border-[#60A5FA]/40 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <article className="rounded-2xl border border-white/10 bg-[#0F172A] p-6 sm:p-8">
          {children}
        </article>
      </div>
    </main>
  );
}

