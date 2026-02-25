import { LEGAL } from "../legal-config";

export default function TermsPage() {
  return (
    <div className="space-y-6 text-sm leading-6 text-[#CBD5E1]">
      <h2 className="text-2xl font-bold text-white">Terms of Service</h2>
      <p>Effective date: {LEGAL.effectiveDate}</p>

      <p>
        These Terms of Service ("Terms") are an agreement between you and{" "}
        {LEGAL.operatorName}. By accessing or using {LEGAL.productName}, you
        agree to these Terms.
      </p>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold text-white">1. Eligibility and Accounts</h3>
        <ul className="list-disc space-y-1 pl-6">
          <li>You must provide accurate account information.</li>
          <li>You are responsible for maintaining account credentials.</li>
          <li>
            If you are under the age of majority, use of the service must be
            supervised or authorized by a parent, guardian, or school.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold text-white">2. Permitted Use</h3>
        <p>
          You may use the service for lawful educational and personal purposes
          only. You agree not to:
        </p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Abuse, harass, or harm other users.</li>
          <li>Attempt unauthorized access to systems or accounts.</li>
          <li>Use automation to scrape, copy, or disrupt the service.</li>
          <li>Upload malware or harmful code.</li>
          <li>Violate applicable law, school policies, or third-party rights.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold text-white">3. Educational and Classroom Use</h3>
        <p>
          Teacher and school users are responsible for obtaining any required
          permissions for student participation and for using classroom data in
          compliance with applicable education privacy laws.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold text-white">4. Intellectual Property</h3>
        <p>
          The service, including software, design, text, logos, and gameplay
          content, is owned by or licensed to {LEGAL.operatorName} and protected
          by law. Except as allowed by these Terms, you may not copy, modify, or
          distribute service content without permission.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold text-white">5. Feedback</h3>
        <p>
          If you submit feedback, you grant us a non-exclusive, worldwide,
          royalty-free license to use and improve the service based on that
          feedback.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold text-white">6. Service Availability</h3>
        <p>
          We may update, modify, suspend, or discontinue portions of the service
          at any time. We do not guarantee uninterrupted availability.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold text-white">7. Termination</h3>
        <p>
          We may suspend or terminate access if these Terms are violated or when
          required to protect users, systems, or legal compliance.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold text-white">8. Disclaimers</h3>
        <p>
          The service is provided "as is" and "as available" to the extent
          permitted by law, without warranties of any kind.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold text-white">9. Limitation of Liability</h3>
        <p>
          To the maximum extent permitted by law, {LEGAL.operatorName} will not
          be liable for indirect, incidental, special, consequential, or
          punitive damages, or loss of data, profits, or business opportunities.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold text-white">10. Governing Law</h3>
        <p>
          These Terms are governed by {LEGAL.governingLaw}, without regard to
          conflict-of-law principles.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold text-white">11. Changes to Terms</h3>
        <p>
          We may revise these Terms from time to time. Continued use after
          updates means you accept the revised Terms.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold text-white">12. Contact</h3>
        <p>
          Questions about these Terms:{" "}
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

