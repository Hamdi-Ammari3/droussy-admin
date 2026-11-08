"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions";

const ITEMS = [
  { href: "/contenus", label: "📚 Contenus" },
  { href: "/eleves", label: "🎓 Élèves" },
  { href: "/enseignants", label: "🏫 Enseignants" },
];

// Same markup and classes as the platform navbar (app/components/Navbar.js).
export default function AdminNavbar() {
  const pathname = usePathname();
  const isActive = (href) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link href="/contenus" className="navbar-brand">
          <span className="navbar-logo-badge">🎒</span>
          <span className="navbar-wordmark">
            Droussy <span className="navbar-brand-accent">TN</span>
          </span>
          <span className="adm-badge">Admin</span>
        </Link>

        <nav className="navbar-links">
          <span className="navbar-row-break" aria-hidden="true" />
          {ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className={`navbar-link ${isActive(item.href) ? "navbar-link-active" : ""}`}>
              {item.label}
            </Link>
          ))}
          <form action={logoutAction}>
            <button type="submit" className="navbar-logout-btn">
              Déconnexion
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
