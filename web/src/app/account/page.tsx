import { redirect } from "next/navigation";
import { currentUserFull } from "@/lib/session";
import PasswordForm from "./PasswordForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Account — BUR" };

export default async function Account() {
  const user = await currentUserFull();
  if (!user) redirect("/login");

  return (
    <section className="section">
      <div className="wrap" style={{ maxWidth: "620px" }}>
        <h1 style={{ fontSize: "2rem" }}>Account</h1>
        <table className="table">
          <tbody>
            <tr><th>Username</th><td>{user.username}</td></tr>
            <tr><th>Email</th><td className="mono-sm">{user.email}</td></tr>
            <tr><th>Role</th><td>{user.globalRole.toLowerCase()}</td></tr>
            <tr><th>Approved recipes</th><td>{user.approvedCount}</td></tr>
          </tbody>
        </table>

        <h2 style={{ fontSize: "1.4rem", marginTop: "2.5rem" }}>Change password</h2>
        <PasswordForm />
      </div>
    </section>
  );
}
