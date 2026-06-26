"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useAuth } from "./auth/AuthContext";
import "@/styles/Header.css";

const navItems = [
  { label: "Home", path: "/home" },
  { label: "Works", path: "/works" },
  { label: "Services", path: "/services" },
  { label: "About", path: "/about" },
  { label: "Blog", path: "/blog" },
  { label: "Contact", path: "/contact" },
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, signOut } = useAuth();

  const close = () => setIsMenuOpen(false);

  const handleSignOut = async () => {
    close();
    await signOut();
    router.replace("/");
  };

  return (
    <>
      {isMenuOpen && (
        <div className="HeaderOverlay" onClick={close} aria-hidden="true" />
      )}

      <header className="HeaderContainer">
        <Link href="/" className="LogoLink" aria-label="Forward Agency Home" onClick={close}>
          <Image
            src="/Images/forward-logo.png"
            alt="Forward Agency"
            width={52}
            height={52}
            priority
            style={{ objectFit: "contain" }}
          />
        </Link>

        <nav
          className={`HeaderNav ${isMenuOpen ? "HeaderNavOpen" : ""}`}
          aria-label="Main navigation"
        >
          <ul className="HeaderUl">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  href={item.path}
                  onClick={close}
                  className={pathname === item.path ? "active" : ""}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            {isAuthenticated && (
              <li>
                <Link
                  href="/dashboard"
                  onClick={close}
                  className={pathname === "/dashboard" ? "active" : ""}
                >
                  Dashboard
                </Link>
              </li>
            )}
          </ul>

          {/* Mobile-only auth actions inside drawer */}
          <div className="HeaderNavMobileAuth">
            {isAuthenticated ? (
              <>
                {user?.name && (
                  <span className="HeaderUserGreeting">Hi, {user.name.split(" ")[0]}</span>
                )}
                <button type="button" className="HeaderButton HeaderActionLink" onClick={handleSignOut}>
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/signin" className="HeaderButton HeaderActionLink" onClick={close}>Sign In</Link>
                <Link href="/signup" className="HeaderButton2 HeaderActionLink" onClick={close}>Sign Up</Link>
              </>
            )}
          </div>
        </nav>

        {/* Desktop auth buttons */}
        <div className="ButtonsContainer">
          {isAuthenticated ? (
            <>
              {user?.name && (
                <span className="HeaderUserGreeting">Hi, {user.name.split(" ")[0]}</span>
              )}
              <button type="button" className="HeaderButton HeaderActionLink" onClick={handleSignOut}>
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/signin" className="HeaderButton HeaderActionLink">Sign In</Link>
              <Link href="/signup" className="HeaderButton2 HeaderActionLink">Sign Up</Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="MenuToggle"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((p) => !p)}
        >
          {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>
    </>
  );
}
