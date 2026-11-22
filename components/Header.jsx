"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import BrandLogo from "@/components/BrandLogo";
import MobileTabBar from "@/components/MobileTabBar";
import { IconChevronDown } from "@/components/icons";
import { formatDisplayName, initialsFor } from "@/lib/names";

// Admin redesign: the server layout passes the signed-in user
// (or null) as initialUser, so the first paint already shows the
// right account state. The Header initialises from that prop and
// never blanks the account slot while refreshing: on navigation it
// re-fetches /api/auth/me in the background and only swaps the
// state when the answer arrives, so a slow fetch can never flash
// the wrong links. A failed fetch keeps the last known state; a
// clear non-OK answer (signed out) clears it.
//
// Signed-in account area: the raw Google name used to print in the
// header as plain grey text next to a bare Sign out button. Now the
// desktop header shows an avatar button (initials + cased name);
// tapping it opens a small menu with the name, email and Sign out.
// On mobile there is no header account area at all: navigation is
// a fixed bottom tab bar (MobileTabBar), and its Profile tab opens
// a sheet with the same account block, Participation, Admin and
// Sign out. The old hamburger + drawer are gone.
export default function Header({ initialUser = null }) {
  const [user, setUser] = useState(initialUser);
  const [accountOpen, setAccountOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const firstFetchSkipped = useRef(true);
  const accountRef = useRef(null);
  const accountButtonRef = useRef(null);

  // P0 (M3): re-fetch the session on every navigation, not just on
  // mount, so the Header cannot show a stale signed-in / signed-out
  // state after a client-side navigation. The first run is skipped:
  // the server already passed the session in initialUser. While a
  // refresh is running, the current user stays on screen.
  useEffect(() => {
    if (firstFetchSkipped.current) {
      firstFetchSkipped.current = false;
      return;
    }
    let cancelled = false;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        if (j.ok) setUser(j.data.user);
        else setUser(null);
      })
      .catch(() => {
        // Keep the last known state on a failed fetch: a network
        // blip must not flash the signed-out links.
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  // Automatically close the account menu when navigating to
  // another route.
  useEffect(() => {
    setAccountOpen(false);
  }, [pathname]);

  // Vercel pattern: the header is transparent at the top of the
  // page and gains its blur + border once the user scrolls. The
  // threshold is 8px so a tiny nudge does not flicker the style.
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the account menu on Escape (returning focus to the avatar
  // button) and on any click outside the menu.
  useEffect(() => {
    if (!accountOpen) return;
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        setAccountOpen(false);
        accountButtonRef.current?.focus();
      }
    }
    function handlePointerDown(e) {
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setAccountOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [accountOpen]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  function navLinkClass(href) {
    const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
    return `site-nav__link${active ? " is-active" : ""}`;
  }

  return (
    <>
    <header className={`site-header${scrolled ? " is-scrolled" : ""}`}>
      <div className="site-header__inner">
        <Link className="site-brand" href="/" aria-label="Vector Flow home">
          <BrandLogo className="site-brand__logo" priority />
          <span className="site-brand__copy">
            <strong>Vector Flow</strong>
            <span>VVCE · CSE (AI &amp; ML)</span>
          </span>
        </Link>

        <nav
          className="site-nav"
          id="site-navigation"
          aria-label="Main navigation"
        >
          <div className="site-nav__links">
            <Link className={navLinkClass("/")} href="/" aria-current={pathname === "/" ? "page" : undefined}>
              <span>Home</span>
            </Link>
            <Link className={navLinkClass("/gallery")} href="/gallery" aria-current={pathname.startsWith("/gallery") ? "page" : undefined}>
              <span>Gallery</span>
            </Link>
            <Link className={navLinkClass("/team")} href="/team" aria-current={pathname.startsWith("/team") ? "page" : undefined}>
              <span>Team</span>
            </Link>
            <Link className={navLinkClass("/participation")} href="/participation" aria-current={pathname.startsWith("/participation") ? "page" : undefined}>
              <span>Participation</span>
            </Link>
            {user && user.role === "ADMIN" && (
              <Link className={navLinkClass("/admin")} href="/admin" aria-current={pathname.startsWith("/admin") ? "page" : undefined}>
                <span>Admin</span>
              </Link>
            )}
          </div>

          <div className="site-nav__account">
            {/* Desktop: avatar button + dropdown menu. */}
            {user ? (
                <div className="site-account site-account--desktop" ref={accountRef}>
                  <button
                    className="site-account__button"
                    type="button"
                    ref={accountButtonRef}
                    aria-haspopup="menu"
                    aria-expanded={accountOpen}
                    aria-label={`Account menu for ${formatDisplayName(user.name)}`}
                    onClick={() => setAccountOpen((open) => !open)}
                  >
                    <span className="site-account__avatar" aria-hidden="true">
                      {initialsFor(user.name)}
                    </span>
                    <span className="site-account__name">{formatDisplayName(user.name)}</span>
                    <IconChevronDown className="site-account__chevron" />
                  </button>
                  {accountOpen && (
                    <div className="site-account__menu" role="menu">
                      <div className="site-account__menu-head">
                        <span className="site-account__avatar" aria-hidden="true">
                          {initialsFor(user.name)}
                        </span>
                        <div className="site-account__menu-identity">
                          <strong>{formatDisplayName(user.name)}</strong>
                          <span>{user.email}</span>
                        </div>
                      </div>
                      <button
                        className="site-account__signout"
                        type="button"
                        role="menuitem"
                        onClick={logout}
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
            ) : (
              <Link
                className="site-nav__signin"
                href="/signin"
                aria-current={pathname.startsWith("/signin") ? "page" : undefined}
              >
                Sign in
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
    <MobileTabBar user={user} onSignOut={logout} />
    </>
  );
}
