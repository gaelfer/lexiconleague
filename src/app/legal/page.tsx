import Link from "next/link";
import { LEGAL } from "./legal-config";

export default function LegalIndexPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Legal Overview</h2>
      <p className="text-sm leading-6 text-[#CBD5E1]">
        These documents are effective as of {LEGAL.effectiveDate}. They are
        written for a US-based online education product and should be reviewed
        by your attorney before launch.
      </p>

      <ul className="space-y-3 text-sm">
        <li>
          <Link href="/legal/privacy" className="text-[#93C5FD] hover:text-white">
            Privacy Policy
          </Link>
        </li>
        <li>
          <Link href="/legal/terms" className="text-[#93C5FD] hover:text-white">
            Terms of Service
          </Link>
        </li>
        <li>
          <Link href="/legal/cookies" className="text-[#93C5FD] hover:text-white">
            Cookie Policy
          </Link>
        </li>
        <li>
          <Link
            href="/legal/children-privacy"
            className="text-[#93C5FD] hover:text-white"
          >
            Children's Privacy Notice
          </Link>
        </li>
        <li>
          <Link
            href="/legal/data-deletion"
            className="text-[#93C5FD] hover:text-white"
          >
            Data Deletion Request Policy
          </Link>
        </li>
      </ul>

      <p className="text-xs text-[#94A3B8]">
        Legal contact:{" "}
        <a href={`mailto:${LEGAL.contactEmail}`} className="text-[#93C5FD] hover:text-white">
          {LEGAL.contactEmail}
        </a>
      </p>
    </div>
  );
}

