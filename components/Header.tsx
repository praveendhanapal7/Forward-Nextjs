"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useAuth } from "./auth/AuthContext";
import "@/styles/Header.css";

const HEADER_HEIGHT = 68;

const navItems = [
  { label: "Home", path: "/home" },
  { label: "Works", path: "/works" },
  { label: "Services", path: "/services" },
  { label: "About", path: "/about" },
  { label: "Blog", path: "/blog" },
  { label: "Contact", path: "/contact" },
];

function NavLinks({
  pathname,
  isAuthenticated,
  onNavigate,
}: {
  pathname: string;
  isAuthenticated: boolean;
  onNavigate?: () => void;
}) {
  return (
    <>
      {navItems.map((item) => (
        <li key={item.path}>
          <Link
            href={item.path}
            onClick={onNavigate}
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
            onClick={onNavigate}
            className={pathname.startsWith("/dashboard") ? "active" : ""}
          >
            Dashboard
          </Link>
        </li>
      )}
    </>
  );
}

function MobileAuth({
  isAuthenticated,
  userName,
  onSignOut,
  onNavigate,
}: {
  isAuthenticated: boolean;
  userName?: string | null;
  onSignOut: () => void;
  onNavigate: () => void;
}) {
  if (isAuthenticated) {
    return (
      <>
        {userName && (
          <span className="HeaderUserGreeting">Hi, {userName.split(" ")[0]}</span>
        )}
        <button
          type="button"
          className="HeaderButton HeaderActionLink"
          onClick={onSignOut}
        >
          Sign Out
        </button>
      </>
    );
  }

  return (
    <>
      <Link
        href="/signin"
        className="HeaderButton HeaderActionLink"
        onClick={onNavigate}
      >
        Sign In
      </Link>
      <Link
        href="/signup"
        className="HeaderButton2 HeaderActionLink"
        onClick={onNavigate}
      >
        Sign Up
      </Link>
    </>
  );
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, signOut } = useAuth();

  const close = () => setIsMenuOpen(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isMenuOpen]);

  const handleSignOut = async () => {
    close();
    await signOut();
    router.replace("/");
  };

  const mobileMenu =
    mounted && isMenuOpen
      ? createPortal(
          <div
            className="HeaderMobileRoot"
            style={{ ["--header-height" as string]: `${HEADER_HEIGHT}px` }}
          >
            <button
              type="button"
              className="HeaderMobileOverlay"
              aria-label="Close menu"
              onClick={close}
            />
            <nav
              id="mobile-nav"
              className="HeaderMobilePanel"
              aria-label="Mobile navigation"
            >
              <ul className="HeaderUl">
                <NavLinks
                  pathname={pathname}
                  isAuthenticated={isAuthenticated}
                  onNavigate={close}
                />
              </ul>
              <div className="HeaderNavMobileAuth">
                <MobileAuth
                  isAuthenticated={isAuthenticated}
                  userName={user?.name}
                  onSignOut={handleSignOut}
                  onNavigate={close}
                />
              </div>
            </nav>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <header
        className="HeaderContainer"
        style={{ ["--header-height" as string]: `${HEADER_HEIGHT}px` }}
      >
        <Link
          href="/"
          className="LogoLink"
          aria-label="Forward Agency Home"
          onClick={close}
        >
          <Image
            src="/Images/forward-logo.png"
            alt="Forward Agency"
            width={150}
            height={92}
            priority
            style={{ objectFit: "cover" }}
          />
        </Link>

        <nav className="HeaderNav HeaderNavDesktop" aria-label="Main navigation">
          <ul className="HeaderUl">
            <NavLinks pathname={pathname} isAuthenticated={isAuthenticated} />
          </ul>
        </nav>

        <div className="ButtonsContainer">
          <MobileAuth
            isAuthenticated={isAuthenticated}
            userName={user?.name}
            onSignOut={handleSignOut}
            onNavigate={close}
          />
        </div>

        <button
          type="button"
          className="MenuToggle"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-nav"
          onClick={() => setIsMenuOpen((prev) => !prev)}
        >
          {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {mobileMenu}
    </>
  );
}
