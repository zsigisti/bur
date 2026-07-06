import "./globals.css";
import type { Metadata } from "next";
import { currentUserFull } from "@/lib/session";
import { isMaintainer, isAuthor } from "@/lib/permissions";
import SignOut from "@/components/SignOut";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata: Metadata = {
  title: "BUR — Blueberry User Repository",
  description:
    "The community package repository for Blueberry Linux. Write a recipe, build it, get it reviewed, and publish it for everyone.",
};

// Applied before paint so the chosen theme doesn't flash.
const THEME_INIT = `try{var t=localStorage.getItem('theme');if(!t){t=matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t}catch(e){}`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUserFull();

  return (
    <html lang="en">
      <body>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
        <header className="masthead">
          <div className="bar">
            <a className="brand" href="/">
              <img src="/logo-green.png" alt="" className="brand-mark" />
              BUR<span className="sub hide-sm">Blueberry User Repository</span>
            </a>
            <nav>
              <a href="/packages">Packages</a>
              <a href="/submit">Submit</a>
              <a href="/docs">Docs</a>
              <a href="/support" className="hide-sm">Support</a>
              {user ? (
                <>
                  <a href="/dashboard">Dashboard</a>
                  {isMaintainer(user) && <a href="/review">Review</a>}
                  {isAuthor(user) && <a href="/admin">Admin</a>}
                  <a href="/account" className="who hide-sm">{user.username}</a>
                  <SignOut />
                </>
              ) : (
                <a href="/login" className="btn btn-ghost" style={{ padding: "0.4rem 0.9rem" }}>
                  Sign in
                </a>
              )}
              <ThemeToggle />
            </nav>
          </div>
        </header>

        <main>{children}</main>

        <footer className="footer">
          <div className="wrap">
            <div className="cols">
              <div className="col">
                <a className="brand" href="/">
                  <img src="/logo-green.png" alt="" className="brand-mark" />
                  BUR
                </a>
                <p className="about">
                  The community package repository for Blueberry Linux. Recipes
                  are written, built, reviewed, and published by the community.
                </p>
              </div>
              <div className="col">
                <h4>Product</h4>
                <a href="/packages">Packages</a>
                <a href="/submit">Submit a package</a>
                <a href="/docs">Documentation</a>
                <a href="/support">Support the project</a>
              </div>
              <div className="col">
                <h4>Repositories</h4>
                <a href="https://repo.blueberrylinux.org">repo (official)</a>
                <a href="https://repo1.blueberrylinux.org">repo1 (community)</a>
              </div>
              <div className="col">
                <h4>Account</h4>
                {user ? (
                  <>
                    <a href="/dashboard">Dashboard</a>
                    <a href="/submit">Submit</a>
                  </>
                ) : (
                  <>
                    <a href="/login">Sign in</a>
                    <a href="/register">Create account</a>
                  </>
                )}
              </div>
            </div>
            <div className="legal">
              Blueberry User Repository · Community-maintained · Not affiliated
              with any upstream project.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
