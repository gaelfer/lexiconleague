import { LEGAL } from "../legal-config";

export default function CookiePolicyPage() {
  return (
    <div className="space-y-6 text-sm leading-6 text-[#CBD5E1]">
      <h2 className="text-2xl font-bold text-white">Cookie Policy</h2>
      <p>Last updated: {LEGAL.lastUpdated}</p>

      <p>
        This Cookie Policy explains how {LEGAL.productName} uses cookies and
        similar technologies.
      </p>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold text-white">1. What Are Cookies</h3>
        <p>
          Cookies are small text files placed on your device to recognize your
          browser and store preferences or session information.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold text-white">2. Types of Cookies We Use</h3>
        <ul className="list-disc space-y-1 pl-6">
          <li>
            Essential cookies: required for login, security, and core
            functionality.
          </li>
          <li>
            Functional cookies: remember user settings like preferences and
            language.
          </li>
          <li>
            Analytics cookies: help us understand usage and improve performance.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold text-white">3. Similar Technologies</h3>
        <p>
          We may also use local storage, pixels, and software development kits
          for similar operational and measurement purposes.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold text-white">4. How to Control Cookies</h3>
        <p>
          You can control cookies through browser settings and device controls.
          Disabling essential cookies may prevent parts of the service from
          functioning properly.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold text-white">5. Changes</h3>
        <p>
          We may update this Cookie Policy periodically. Material updates will
          be reflected by revising the "Last updated" date.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold text-white">6. Contact</h3>
        <p>
          Questions:{" "}
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

