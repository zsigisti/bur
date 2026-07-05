import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BUR — Blueberry User Repository",
  description:
    "Community recipes for Blueberry Linux. Write a bpm.toml, build it, get it reviewed, publish it.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <span className="brand">🫐 BUR</span>
          <nav>
            <a href="/packages">Packages</a>
            <a href="/submit">Submit</a>
            <a href="/docs">Docs</a>
            <a href="/login">Sign in</a>
          </nav>
        </header>
        {children}
        <footer className="footer">
          Blueberry User Repository · community recipes ·{" "}
          <a href="https://repo1.mmzsigmond.me">repo1.mmzsigmond.me</a>
        </footer>
      </body>
    </html>
  );
}
