"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { formatLocation } from "@/lib/geo";
import { useAppDispatch, useSession } from "@/store/hooks";
import { logout, openLocationPrompt } from "@/store/sessionSlice";
import Avatar from "./Avatar";
import { ClapperIcon, FeedIcon, FilmIcon, HomeIcon } from "./Icons";
import Logo from "./Logo";

export default function Header() {
  const { user, ready } = useSession();
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // On the home page the header floats over the cinematic hero until you scroll.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const overHero = pathname === "/" && !scrolled;

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  if (pathname === "/login" || pathname === "/signup") {
    return (
      <header className="bg-surface border-b border-line">
        <div className="mx-auto max-w-7xl px-4 h-16 flex items-center">
          <Logo />
        </div>
      </header>
    );
  }

  const tab = (href: string, label: string, icon: React.ReactNode) => {
    const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
    return (
      <Link
        href={href}
        title={label}
        className={`relative flex items-center justify-center gap-2 h-16 px-6 lg:px-8 transition-colors ${
          active ? "text-primary" : "text-muted hover:text-text"
        }`}
      >
        {icon}
        <span className="hidden lg:inline text-sm font-semibold">{label}</span>
        {active && <span className="absolute inset-x-3 bottom-0 h-[3px] rounded-t-full brand-gradient" />}
      </Link>
    );
  };

  return (
    <header
      data-over-hero={overHero}
      className="sticky top-0 z-30 bg-surface/90 backdrop-blur-md border-b border-line transition-colors duration-300"
    >
      <div className="mx-auto max-w-7xl px-4 h-16 flex items-center">
        <div className="flex-1 flex items-center">
          <span className="hidden sm:flex">
            <Logo />
          </span>
          <span className="sm:hidden">
            <Logo compact />
          </span>
        </div>

        <nav className="flex items-center">
          {tab("/", "Home", <HomeIcon size={22} />)}
          {tab("/feed", "Feed", <FeedIcon size={22} />)}
          {tab("/movies", "Movies", <ClapperIcon size={22} filled={false} />)}
          {user?.role === "director" && tab("/director", "My Studio", <FilmIcon size={22} />)}
        </nav>

        <div className="flex-1 flex justify-end items-center gap-2">
          {!ready ? (
            <span className="w-9 h-9 rounded-full bg-surface-2 animate-pulse" />
          ) : user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setOpen((o) => !o)}
                className="flex items-center gap-2 rounded-full p-1 pr-3 hover:bg-surface-2 cursor-pointer"
              >
                <Avatar name={user.name} size={34} />
                <span className="text-left leading-tight hidden md:block">
                  <span className="block text-sm font-semibold">{user.name}</span>
                  <span className="block text-[11px] text-muted">
                    {user.role === "director" ? "Director" : "Audience"}
                  </span>
                </span>
              </button>
              {open && (
                <div className="absolute right-0 mt-2 w-64 card p-1.5 text-sm">
                  <div className="px-3 py-2 border-b border-line mb-1">
                    <div className="font-semibold">{user.name}</div>
                    <div className="text-xs text-muted truncate">{user.email}</div>
                    {user.location?.city && (
                      <div className="text-xs text-muted mt-0.5">📍 {formatLocation(user.location)}</div>
                    )}
                  </div>
                  {user.role === "director" && (
                    <Link href="/director" onClick={() => setOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-surface-2">
                      My Studio
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setOpen(false);
                      dispatch(openLocationPrompt());
                    }}
                    className="block w-full text-left px-3 py-2 rounded-lg hover:bg-surface-2 cursor-pointer"
                  >
                    {user.location?.city ? "Change location" : "Set location"}
                  </button>
                  <button
                    onClick={async () => {
                      setOpen(false);
                      await dispatch(logout());
                      router.push("/");
                    }}
                    className="block w-full text-left px-3 py-2 rounded-lg text-like hover:bg-surface-2 cursor-pointer"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost !py-2 hidden sm:inline-flex">
                Sign in
              </Link>
              <Link href="/signup" className="btn btn-primary !py-2">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
