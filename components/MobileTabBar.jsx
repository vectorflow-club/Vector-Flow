"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  IconClipboardList,
  IconHome,
  IconImage,
  IconLogOut,
  IconShield,
  IconUser,
  IconUsers,
} from "@/components/icons";
import { formatDisplayName, initialsFor } from "@/lib/names";

// Mobile navigation: a fixed bottom tab bar (YouTube-style),
// replacing the old hamburger + drawer. Four tabs: Home,
// Participation, Team, Profile. Profile opens a sheet floating
// above the bar with the account block, Gallery, Admin (admins
// only) and Sign out; a signed-out visitor gets a Sign in button
// there instead.
// The whole component is display:none above the 860px breakpoint
// (see globals.css), so desktop output is untouched: desktop keeps
// its top nav and avatar dropdown, and this bar never renders
// visibly there. It is rendered by Header (never on /signin,
// where SiteChrome renders no Header at all).
export default function MobileTabBar({ user = null, onSignOut }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const pathname = usePathname();
  const profileButtonRef = useRef(null);

  const isHome = pathname === "/";
  const isParticipation = pathname.startsWith("/participation");
  const isTeam = pathname.startsWith("/team");
  // Gallery and Admin live behind Profile, so the Profile
  // tab reads as active on those pages too.
  const isProfilePage =
    pathname.startsWith("/gallery") || pathname.startsWith("/admin");
  const isProfileActive = sheetOpen || isProfilePage;

  // Close the sheet on navigation, same as the desktop account menu.
  useEffect(() => {
    setSheetOpen(false);
  }, [pathname]);

  // Close the sheet on Escape, returning focus to the Profile button.
  useEffect(() => {
    if (!sheetOpen) return;
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        setSheetOpen(false);
        profileButtonRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [sheetOpen]);

  function tabClass(active) {
    return `mobile-tabbar__tab${active ? " is-active" : ""}`;
  }

  return (
    <div className="mobile-tabbar-root">
      {sheetOpen && (
        <div
          className="mobile-sheet-backdrop"
          onClick={() => setSheetOpen(false)}
          aria-hidden="true"
        />
      )}
      {sheetOpen && (
        <div className="mobile-profile-sheet" role="dialog" aria-label="Profile menu">
          <div className="mobile-profile-sheet__grab" aria-hidden="true" />
          {user ? (
            <>
              <div className="mobile-profile-sheet__account">
                <span
                  className="site-account__avatar mobile-profile-sheet__avatar"
                  aria-hidden="true"
                >
                  {initialsFor(user.name)}
                </span>
                <div className="mobile-profile-sheet__identity">
                  <strong>{formatDisplayName(user.name)}</strong>
                  <span>{user.email}</span>
                </div>
              </div>
              <Link className="mobile-profile-sheet__row" href="/gallery">
                <IconImage /> Gallery
              </Link>
              {user.role === "ADMIN" && (
                <Link className="mobile-profile-sheet__row" href="/admin">
                  <IconShield /> Admin
                </Link>
              )}
              <button
                className="mobile-profile-sheet__row mobile-profile-sheet__row--danger"
                type="button"
                onClick={onSignOut}
              >
                <IconLogOut /> Sign out
              </button>
            </>
          ) : (
            <Link className="mobile-profile-sheet__signin" href="/signin">
              Sign in
            </Link>
          )}
        </div>
      )}
      <nav className="mobile-tabbar" aria-label="Mobile navigation">
        <Link
          className={tabClass(isHome)}
          href="/"
          aria-current={isHome ? "page" : undefined}
        >
          <IconHome />
          <span className="mobile-tabbar__label">Home</span>
          <span className="mobile-tabbar__dot" aria-hidden="true" />
        </Link>
        <Link
          className={tabClass(isParticipation)}
          href="/participation"
          aria-current={isParticipation ? "page" : undefined}
        >
          <IconClipboardList />
          <span className="mobile-tabbar__label">Participation</span>
          <span className="mobile-tabbar__dot" aria-hidden="true" />
        </Link>
        <Link
          className={tabClass(isTeam)}
          href="/team"
          aria-current={isTeam ? "page" : undefined}
        >
          <IconUsers />
          <span className="mobile-tabbar__label">Team</span>
          <span className="mobile-tabbar__dot" aria-hidden="true" />
        </Link>
        <button
          className={tabClass(isProfileActive)}
          type="button"
          ref={profileButtonRef}
          aria-expanded={sheetOpen}
          aria-haspopup="dialog"
          onClick={() => setSheetOpen((open) => !open)}
        >
          <IconUser />
          <span className="mobile-tabbar__label">Profile</span>
          <span className="mobile-tabbar__dot" aria-hidden="true" />
        </button>
      </nav>
    </div>
  );
}
