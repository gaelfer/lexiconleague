import { LEGAL } from "../legal-config";

export default function DataDeletionPage() {
  return (
    <div className="space-y-6 text-sm leading-6 text-[#CBD5E1]">
      <h2 className="text-2xl font-bold text-white">Data Deletion Request Policy</h2>
      <p>Last updated: {LEGAL.lastUpdated}</p>

      <p>
        You can request deletion of your {LEGAL.productName} account and related
        personal information by contacting{" "}
        <a
          href={`mailto:${LEGAL.contactEmail}`}
          className="text-[#93C5FD] hover:text-white"
        >
          {LEGAL.contactEmail}
        </a>
        .
      </p>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold text-white">1. How to Submit a Request</h3>
        <ul className="list-disc space-y-1 pl-6">
          <li>Use subject line: "Data Deletion Request".</li>
          <li>Include your account email or username.</li>
          <li>
            If requesting on behalf of a child, include relationship and
            relevant school/class context.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold text-white">2. Verification</h3>
        <p>
          We may verify identity or authorization before processing deletion
          requests to protect account security.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold text-white">3. Processing Timeline</h3>
        <p>
          We target completion within 30 days of verification, unless additional
          time is required by law or technical constraints.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold text-white">4. Data We May Retain</h3>
        <p>
          Some records may be retained where legally required, for fraud
          prevention, dispute handling, or security obligations.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold text-white">5. Classroom and School Accounts</h3>
        <p>
          For student accounts managed by a school or district, we may coordinate
          requests with authorized school administrators before deletion.
        </p>
      </section>
    </div>
  );
}

