"use client";

import Link from "next/link";
import { AuthNav } from "@/components/auth/AuthNav";
import { useAuth } from "@/lib/supabase/auth";

const HOME_CARDS = ["AS", "KH", "QD", "JC", "10H"] as const;

export default function HomePage() {
  const { user, loading } = useAuth();
  const ready = !loading && user;

  return (
    <main className="relative flex min-h-full flex-1 flex-col overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_15%_0%,rgba(212,168,75,0.16),transparent_40%),radial-gradient(ellipse_at_85%_100%,rgba(19,77,50,0.95),var(--felt-deep))]" />
        <div className="auth-grain absolute inset-0 opacity-[0.28]" />
      </div>

      <header className="relative z-20 flex w-full items-center justify-between gap-4 px-6 py-5 sm:px-10 min-[720px]:px-12">
        <span className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-[var(--cream)] sm:text-3xl">
          Thulla
        </span>
        <AuthNav />
      </header>

      <div className="relative z-10 grid min-h-0 flex-1 min-[720px]:grid-cols-[minmax(0,1.1fr)_minmax(16rem,0.9fr)]">
        <section className="flex min-h-0 flex-col px-6 pb-8 sm:px-10 min-[720px]:px-12">
          <div className="auth-enter my-auto max-w-xl py-8">
            <h1 className="font-[family-name:var(--font-display)] text-5xl tracking-tight text-[var(--cream)] sm:text-6xl md:text-7xl">
              Thulla
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-[var(--cream)]/75 sm:text-lg">
              {ready
                ? "You’re in. Host a private table or join with a game code."
                : "Private tables. Real-time play. Only you see your cards."}
            </p>
            <div className="auth-enter auth-enter-delay-1 mt-9 flex flex-wrap gap-3">
              {loading ? null : ready ? (
                <>
                  <Link
                    href="/create"
                    className="inline-flex min-h-12 items-center rounded-lg bg-[var(--felt-gold)] px-7 py-2.5 text-sm font-semibold text-[var(--felt-deep)] shadow-[0_8px_24px_rgba(212,168,75,0.25)] transition hover:brightness-105"
                  >
                    Create Game
                  </Link>
                  <Link
                    href="/join"
                    className="inline-flex min-h-12 items-center rounded-lg border border-white/20 bg-white/10 px-7 py-2.5 text-sm font-semibold text-[var(--cream)] backdrop-blur-sm transition hover:bg-white/15"
                  >
                    Join Game
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/signup"
                    className="inline-flex min-h-12 items-center rounded-lg bg-[var(--felt-gold)] px-7 py-2.5 text-sm font-semibold text-[var(--felt-deep)] shadow-[0_8px_24px_rgba(212,168,75,0.25)] transition hover:brightness-105"
                  >
                    Get started
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex min-h-12 items-center rounded-lg border border-white/20 bg-white/10 px-7 py-2.5 text-sm font-semibold text-[var(--cream)] backdrop-blur-sm transition hover:bg-white/15"
                  >
                    Sign in
                  </Link>
                </>
              )}
            </div>
          </div>

          <p className="text-xs tracking-[0.08em] text-[var(--cream)]/30">
            Private tables · Real-time play
          </p>
        </section>

        <aside
          aria-hidden
          className="relative hidden min-h-full items-center justify-center border-l border-white/8 min-[720px]:flex"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(212,168,75,0.12),transparent_55%)]" />
          <div className="relative h-[22rem] w-[15rem] xl:h-[28rem] xl:w-[20rem]">
            {HOME_CARDS.map((id, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={id}
                src={`/cards/${id}.png`}
                alt=""
                className="auth-float-card absolute left-1/2 top-1/2 h-44 w-[7.7rem] rounded-[0.65rem] object-cover shadow-[0_22px_48px_rgba(0,0,0,0.55)] ring-1 ring-black/20 xl:h-56 xl:w-[9.75rem]"
                style={{
                  transform: `translate(-50%, -50%) rotate(${(i - 2) * 12}deg) translateY(${Math.abs(i - 2) * 6}px)`,
                  zIndex: i,
                  animationDelay: `${80 + i * 70}ms`,
                }}
              />
            ))}
          </div>
        </aside>
      </div>
    </main>
  );
}
