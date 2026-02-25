import { LEGAL } from "../legal-config";

export default function ChildrenPrivacyPage() {
  return (
    <div className="space-y-6 text-sm leading-6 text-[#CBD5E1]">
      <h2 className="text-2xl font-bold text-white">Children&apos;s Privacy Notice</h2>
      <p>Last updated: {LEGAL.lastUpdated}</p>

      <p>
        {LEGAL.productName} includes features used by students. This notice
        describes how we handle personal information for children, including
        users under age 13 in the United States.
      </p>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold text-white">1. Information Collected for Student Use</h3>
        <ul className="list-disc space-y-1 pl-6">
          <li>Student usernames or identifiers.</li>
          <li>Classroom membership and participation data.</li>
          <li>Learning performance and progress metrics.</li>
          <li>Technical logs required for security and reliability.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold text-white">2. How Student Data Is Used</h3>
        <ul className="list-disc space-y-1 pl-6">
          <li>To provide educational gameplay and classroom activities.</li>
          <li>To show progress and reports to authorized teachers/schools.</li>
          <li>To maintain account security and platform integrity.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold text-white">3. COPPA and School Authorization</h3>
        <p>
          For school-based use, we rely on school authorization and applicable
          educational privacy frameworks. Parents and guardians may contact us to
          review or request deletion of their child&apos;s personal information,
          subject to applicable law and school agreements.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold text-white">4. No Behavioral Advertising to Children</h3>
        <p>
          We do not use children&apos;s personal information for behavioral
          advertising.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold text-white">5. Parent and Guardian Requests</h3>
        <p>
          To request access, correction, or deletion of a child&apos;s information,
          contact{" "}
          <a
            href={`mailto:${LEGAL.contactEmail}`}
            className="text-[#93C5FD] hover:text-white"
          >
            {LEGAL.contactEmail}
          </a>
          . We may require identity verification before fulfilling a request.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold text-white">6. Contact</h3>
        <p>
          {LEGAL.operatorName}
          <br />
          {LEGAL.mailingAddress}
          <br />
          <a
            href={`mailto:${LEGAL.contactEmail}`}
            className="text-[#93C5FD] hover:text-white"
          >
            {LEGAL.contactEmail}
          </a>
        </p>
      </section>
    </div>
  );
}

