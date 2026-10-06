"use client";

import Link from "next/link";
import type { ReactNode } from "react";

const DECK_PREVIEW = ["AS", "KH", "QD", "JC", "10S"] as const;

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <main className="relative grid min-h-full flex-1 overflow-hidden min-[720px]:grid-cols-[minmax(0,1.05fr)_minmax(16rem,0.9fr)]">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_12%_0%,rgba(212,168,75,0.2),transparent_38%),radial-gradient(ellipse_at_100%_80%,rgba(19,77,50,0.9),var(--felt-deep))]" />
        <div className="auth-grain absolute inset-0 opacity-[0.32]" />
      </div>

      {/* Form column */}
      <section className="relative z-10 flex min-h-0 flex-col overflow-y-auto px-6 py-5 sm:px-10 min-[720px]:px-12 min-[720px]:py-7">
        <Link
          href="/"
          className="auth-enter w-fit font-[family-name:var(--font-display)] text-2xl tracking-tight text-[var(--cream)] transition hover:text-[var(--felt-gold)] sm:text-3xl"
        >
          Thulla
        </Link>

        <div className="auth-enter auth-enter-delay-1 my-auto w-full max-w-md py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--felt-gold)]/90">
            Account
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-[2.15rem] leading-[1.1] text-[var(--cream)] sm:text-[2.75rem]">
            {title}
          </h1>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--cream)]/68 sm:text-[0.95rem]">
            {subtitle}
          </p>

          <div className="auth-enter auth-enter-delay-2 mt-5">{children}</div>

          <div className="auth-enter auth-enter-delay-3 mt-5 text-sm text-[var(--cream)]/60">
            {footer}
          </div>
        </div>

        <p className="text-xs tracking-[0.08em] text-[var(--cream)]/30">
          Private tables · Real-time play
        </p>
      </section>

      {/* Visual column */}
      <aside className="relative z-10 hidden min-h-full items-center justify-center border-l border-white/8 min-[720px]:flex">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(212,168,75,0.12),transparent_55%)]" />
        <div className="relative h-[22rem] w-[15rem] xl:h-[28rem] xl:w-[20rem]">
          {DECK_PREVIEW.map((id, i) => (
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
        <p className="absolute bottom-8 left-0 right-0 text-center text-[0.65rem] tracking-[0.18em] text-[var(--cream)]/35 uppercase">
          Only you see your hand
        </p>
      </aside>

      {/* Mobile card strip */}
      <div
        aria-hidden
        className="relative z-10 flex justify-center border-t border-white/5 px-6 py-6 min-[720px]:hidden"
      >
        {DECK_PREVIEW.slice(0, 3).map((id, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={id}
            src={`/cards/${id}.png`}
            alt=""
            className="auth-float-card -ml-6 h-28 w-[4.9rem] rounded-md object-cover shadow-lg first:ml-0"
            style={{
              transform: `rotate(${(i - 1) * 8}deg)`,
              zIndex: i,
              animationDelay: `${100 + i * 80}ms`,
            }}
          />
        ))}
      </div>
    </main>
  );
}

export function AuthField({
  label,
  id,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; id: string }) {
  return (
    <label htmlFor={id} className="block space-y-2">
      <span className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[var(--cream)]/55">
        {label}
      </span>
      <input
        id={id}
        className="w-full rounded-lg border border-white/18 bg-[#07160f]/80 px-4 py-3 text-[var(--cream)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] outline-none transition placeholder:text-[var(--cream)]/28 focus:border-[var(--felt-gold)]/70 focus:ring-2 focus:ring-[var(--felt-gold)]/30"
        {...props}
      />
    </label>
  );
}
