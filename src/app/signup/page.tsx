import Link from "next/link";

// Minimal account-type chooser — reached from the landing header's
// single "Sign Up" link. Purely a routing hub to the two existing,
// unchanged signup flows; no new form fields or backend logic.
export default function SignupChoicePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-16">
      <div>
        <h1 className="text-xl font-semibold text-polar-text">
          Create your POLAR account
        </h1>
        <p className="mt-1 text-sm text-polar-muted">
          Choose the type of account to create.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <Link
          href="/signup/client"
          className="rounded border border-polar-border px-4 py-3 text-center text-sm text-polar-text"
        >
          I&rsquo;m a client — Create Client Account
        </Link>
        <Link
          href="/signup/barber"
          className="rounded border border-polar-border px-4 py-3 text-center text-sm text-polar-text"
        >
          I&rsquo;m a barber — Create Barber Account
        </Link>
      </div>
      <p className="text-sm text-polar-muted">
        Already have an account?{" "}
        <Link className="underline" href="/login">
          Log in
        </Link>
      </p>
    </main>
  );
}
