import { LEGAL_VERSIONS } from "@/lib/legal/versions";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <div className="rounded border border-polar-border bg-polar-surface p-4 text-sm">
        <strong>V1 PRIVATE TRIAL DRAFT — {LEGAL_VERSIONS.privacy}</strong>
        <p className="mt-1 text-polar-muted">
          This is a working draft for POLAR&apos;s private V1 trial only,
          built from POLAR HQ 2&apos;s Section 13 requirements. It has not
          yet received formal UK legal/privacy review and must be reviewed
          and updated before any wider or public launch.
        </p>
      </div>

      <h1 className="mt-8 text-xl font-semibold text-polar-text">
        POLAR — Privacy Policy
      </h1>

      <div className="mt-6 space-y-5 text-sm leading-relaxed text-polar-text">
        <section>
          <h2 className="font-medium">Age requirement</h2>
          <p>
            POLAR accounts are for persons aged 16 or over. Under-16s may
            not create or operate their own account. A parent or legal
            guardian may use their own account when managing appointments
            or services for a child under 16.
          </p>
        </section>

        <section>
          <h2 className="font-medium">What we collect</h2>
          <p>
            For a client account: your name, phone number, email, and
            postal address. Later, once you use those features, POLAR may
            also store haircut/appointment-relevant information you or
            your barber add, such as hair type, scalp condition,
            allergies, and appointment history.
          </p>
          <p className="mt-2">
            For a barber account: your name, phone number, email, the
            professional details you provide (barber/stylist name,
            business name, years of experience, work location), your
            Personal/Home Address, and a Work/Commercial Address (which
            may be the same as your home address, or a separate business
            location).
          </p>
          <p className="mt-2">
            We also record which version of these Terms and this Privacy
            Policy you accepted, when, and your confirmation that you are
            aged 16 or over — this is kept as an audit record and is not
            editable by you or POLAR staff after the fact.
          </p>
        </section>

        <section>
          <h2 className="font-medium">How your address is used</h2>
          <p>
            A client&apos;s address is private — visible only to that
            client and to appropriately authorised POLAR roles, never to
            other clients or shown in booking/calendar information.
          </p>
          <p className="mt-2">
            A barber&apos;s Personal/Home Address is always private and is
            never shown to clients, even if it is also used as the
            barber&apos;s Work/Commercial Address. A barber&apos;s
            Work/Commercial Address — the location services are actually
            provided from — may be shown to a client with a confirmed
            appointment, so they know where to attend.
          </p>
        </section>

        <section>
          <h2 className="font-medium">What we do not collect in V1</h2>
          <p>
            POLAR V1 is cash only. We do not collect card numbers,
            expiry dates, CVV codes, or any other online payment details.
            We do not collect your date of birth.
          </p>
        </section>

        <section>
          <h2 className="font-medium">Who can see your information</h2>
          <p>
            Your own account information is visible only to you and to
            your barber where relevant to providing your service. Other
            clients can never see your name, contact details, or
            appointment information — an occupied appointment slot is
            shown to other clients only as &quot;BOOKED&quot;.
          </p>
          <p className="mt-2">
            A barber&apos;s private notes and insights about a client
            remain visible only to that barber and are never shared with
            another barber or with the client.
          </p>
        </section>

        <section>
          <h2 className="font-medium">How your information is protected</h2>
          <p>
            Access to your information is enforced at the database level,
            not just hidden in the app&apos;s screens. Your password is
            never stored by POLAR directly — it is handled and securely
            hashed by our authentication provider.
          </p>
        </section>

        <section>
          <h2 className="font-medium">Your choices</h2>
          <p>
            You can view and update the information you control from your
            account. You can request account closure; some records may be
            kept where POLAR has a legal reason to retain them.
          </p>
        </section>

        <section>
          <h2 className="font-medium">Contact</h2>
          <p>
            Privacy-related enquiry contact details will be added here
            before any wider release.
          </p>
        </section>
      </div>
    </main>
  );
}
