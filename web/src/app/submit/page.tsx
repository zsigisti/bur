import { currentUser } from "@/lib/session";
import SubmitForm from "./SubmitForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Submit a package — BUR" };

export default async function Submit() {
  const user = await currentUser();

  return (
    <div className="wrap prose">
      <span className="eyebrow">Contributing</span>
      <h1>Submit a package</h1>
      <p>
        Packages use the <code>bpm.toml</code> format — the same one the official
        Blueberry repository uses. Paste your recipe below. The package name and
        version are read from it.
      </p>

      {user ? (
        <SubmitForm />
      ) : (
        <div className="notice notice-err">
          You need an account to submit. <a href="/login">Sign in</a> or{" "}
          <a href="/register">create one</a>.
        </div>
      )}

      <h2>How the flow works</h2>
      <ol>
        <li><strong>Submit</strong> the recipe here (or with <code>bur submit .</code>).</li>
        <li>A <strong>maintainer reviews</strong> it — unless you are a trusted contributor or it is your own package, in which case it is approved automatically.</li>
        <li>Once approved, <strong>build it locally</strong> and <strong>upload</strong> the <code>.bpm</code> from your dashboard.</li>
        <li>It is published to <code>repo1.blueberrylinux.org</code> and installable with <code>bur install</code>.</li>
      </ol>
      <p>
        After twenty approved recipes you become a trusted contributor and your
        submissions publish without review. See the <a href="/docs">docs</a> for
        the full recipe reference.
      </p>
    </div>
  );
}
