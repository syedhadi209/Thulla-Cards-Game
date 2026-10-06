import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const styles: Record<Variant, string> = {
  primary:
    "bg-[var(--felt-gold)] text-[var(--felt-deep)] hover:brightness-105 disabled:opacity-50",
  secondary:
    "bg-white/10 text-[var(--cream)] border border-white/20 hover:bg-white/15 disabled:opacity-50",
  ghost: "bg-transparent text-[var(--cream)] hover:bg-white/10 disabled:opacity-50",
  danger: "bg-red-700/90 text-white hover:bg-red-600 disabled:opacity-50",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center rounded-md px-5 py-2.5 text-sm font-semibold tracking-wide transition ${styles[variant]} ${className}`}
      {...props}
    />
  );
}
