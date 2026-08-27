import { LEGAL_VERSIONS } from "@/lib/legal/versions";

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <div className="rounded border border-polar-border bg-polar-surface p-4 text-sm">
        <strong>V1 PRIVATE TRIAL DRAFT — {LEGAL_VERSIONS.terms}</strong>
        <p className="mt-1 text-polar-muted">
          This is a working draft for POLAR&apos;s private V1 trial only,
          built from POLAR HQ 2&apos;s Section 14 requirements. It has not
          yet received formal UK legal/privacy review and must be reviewed
          and updated before any wider or public launch.
        </p>
      </div>

      <h1 className="mt-8 text-xl font-semibold text-polar-text">
        POLAR — Terms &amp; Conditions
      </h1>

      <div className="mt-6 space-y-5 text-sm leading-relaxed text-polar-text">
        <section>
          <h2 className="font-medium">Who operates POLAR</h2>
          <p>
            POLAR is currently a private V1 trial operated for a single
            barber. Full operator/business details will be added here
            before any wider release.
          </p>
        </section>

        <section>
          <h2 className="font-medium">Age requirement</h2>
          <p>
            POLAR accounts are for persons aged 16 or over. A person under
            16 may not create or operate their own POLAR account. A parent
            or legal guardian may use their own POLAR account on behalf of
            a child under 16 until that child is old enough to hold their
            own account.
          </p>
        </section>

        <section>
          <h2 className="font-medium">Accepting these Terms</h2>
          <p>
            By ticking the acceptance box during sign-up you agree to the
            version of these Terms shown above. POLAR records which
            version you accepted and when.
          </p>
        </section>

        <section>
          <h2 className="font-medium">Your account</h2>
          <p>
            You must provide accurate information and keep your account
            secure. You must not impersonate another person, transfer or
            misuse your account, or attempt to access another user&apos;s
            account or private information.
          </p>
        </section>

        <section>
          <h2 className="font-medium">Acceptable use</h2>
          <p>
            You must not attempt to hack POLAR, bypass its security,
            manipulate its systems or database, upload malicious content,
            abuse its APIs, use it for fraud or unlawful activity, or
            attempt to discover or exploit vulnerabilities maliciously.
          </p>
        </section>

        <section>
          <h2 className="font-medium">Bookings</h2>
          <p>
            POLAR lets you view availability, make, reschedule and cancel
            bookings. Another client&apos;s booked appointment slot is
            shown to you only as &quot;BOOKED&quot; — their identity and
            details are never shown to you.
          </p>
        </section>

        <section>
          <h2 className="font-medium">Payments — V1</h2>
          <p>
            POLAR V1 is cash only. POLAR does not process card payments,
            does not store card details, and does not take online
            deposits during V1.
          </p>
        </section>

        <section>
          <h2 className="font-medium">Privacy</h2>
          <p>
            How your personal information is handled is set out in
            POLAR&apos;s Privacy Policy, which forms part of these Terms.
          </p>
        </section>

        <section>
          <h2 className="font-medium">Security &amp; your responsibilities</h2>
          <p>
            You must protect your login details, must not attempt to
            compromise another account, and should report any suspected
            account compromise.
          </p>
        </section>

        <section>
          <h2 className="font-medium">Availability</h2>
          <p>
            POLAR aims to be reliable but cannot guarantee uninterrupted
            availability, and may occasionally be unavailable for
            maintenance, updates, technical issues or security reasons.
          </p>
        </section>

        <section>
          <h2 className="font-medium">Changes to these Terms</h2>
          <p>
            These Terms may change as POLAR develops. Each version has an
            identifying version code. Continued use after a material
            change may require fresh acceptance.
          </p>
        </section>

        <section>
          <h2 className="font-medium">Contact</h2>
          <p>
            Support, complaint and privacy-enquiry contact details will be
            added here before any wider release.
          </p>
        </section>

        <section>
          <h2 className="font-medium">Governing law</h2>
          <p>
            POLAR is currently being developed for UK use. Final governing
            law and jurisdiction details will be confirmed before public
            launch.
          </p>
        </section>
      </div>
    </main>
  );
}
