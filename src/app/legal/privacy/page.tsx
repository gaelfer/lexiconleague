import { LEGAL } from "../legal-config";

export default function PrivacyPolicyPage() {
  return (
    <div className="space-y-6 text-sm leading-6 text-[#CBD5E1]">
      <h2 className="text-2xl font-bold text-white">Privacy Policy</h2>
      <p>Last updated: {LEGAL.lastUpdated}</p>

      <p>
        {LEGAL.operatorName} ("we", "our", "us") operates {LEGAL.productName}.
        This Privacy Policy explains how we collect, use, disclose, and protect
        information when you use our website, mobile experience, and related
        services.
      </p>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold text-white">1. Information We Collect</h3>
        <p>We may collect:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>
            Account information such as username, email address, and login
            method.
          </li>
          <li>
            Profile information such as grade level, account type (student or
            teacher), and avatar settings.
          </li>
          <li>
            Gameplay and learning data such as scores, progress, rankings,
            classroom participation, and session reports.
          </li>
          <li>
            Device and usage data such as IP address, browser type, language,
            and pages visited.
          </li>
          <li>
            Support and communications data if you contact us.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold text-white">2. How We Use Information</h3>
        <p>We use information to:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Provide and maintain the service.</li>
          <li>Authenticate users and secure accounts.</li>
          <li>Personalize gameplay and learning experience.</li>
          <li>Operate classroom features for teachers and students.</li>
          <li>Improve product quality, reliability, and safety.</li>
          <li>Communicate updates, support messages, and required notices.</li>
          <li>Comply with legal obligations and enforce our terms.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold text-white">3. Legal Bases (Where Applicable)</h3>
        <p>
          Depending on jurisdiction, we process personal information based on
          contract performance, legitimate interests, consent, and legal
          obligations.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold text-white">4. Sharing of Information</h3>
        <p>We may share information with:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Service providers that host and operate our infrastructure.</li>
          <li>Authentication providers (for example Google, Apple, Microsoft).</li>
          <li>School or district personnel where classroom accounts are used.</li>
          <li>Law enforcement or regulators where legally required.</li>
          <li>Successor entities if we are involved in a merger or sale.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold text-white">5. Data Retention</h3>
        <p>
          We retain personal data for as long as needed to provide services,
          resolve disputes, comply with legal obligations, and enforce
          agreements. Retention periods may vary by account type and data class.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold text-white">6. Security</h3>
        <p>
          We use reasonable technical and organizational safeguards to protect
          personal data. No method of transmission or storage is guaranteed to
          be fully secure.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold text-white">7. Your Rights</h3>
        <p>
          Depending on your location, you may have rights to access, correct,
          delete, or export your information, and to object to or limit certain
          processing. You may exercise rights by contacting us at{" "}
          <a
            href={`mailto:${LEGAL.contactEmail}`}
            className="text-[#93C5FD] hover:text-white"
          >
            {LEGAL.contactEmail}
          </a>
          .
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold text-white">8. Children and Education Data</h3>
        <p>
          We offer student-facing features. For details about children&apos;s data
          and parent rights, see our{" "}
          <a href="/legal/children-privacy" className="text-[#93C5FD] hover:text-white">
            Children&apos;s Privacy Notice
          </a>
          .
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold text-white">9. International Transfers</h3>
        <p>
          If personal data is transferred internationally, we use appropriate
          safeguards where required by applicable law.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold text-white">10. Changes to This Policy</h3>
        <p>
          We may update this policy periodically. When we do, we will revise the
          "Last updated" date and post the revised version on this page.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold text-white">11. Contact</h3>
        <p>
          Email:{" "}
          <a href={`mailto:${LEGAL.contactEmail}`} className="text-[#93C5FD] hover:text-white">
            {LEGAL.contactEmail}
          </a>
          <br />
          Mailing address: {LEGAL.mailingAddress}
        </p>
      </section>
    </div>
  );
}

