import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  leading?: ReactNode;
};

export function Button({
  children,
  className = "",
  variant = "primary",
  size = "md",
  leading,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl border font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/80 disabled:cursor-not-allowed disabled:opacity-60";

  const variants = {
    primary:
      "border-violet-500/40 bg-violet-500 text-white shadow-lg shadow-violet-950/30 hover:bg-violet-400",
    secondary:
      "border-white/10 bg-white/[0.03] text-slate-100 hover:border-violet-400/40 hover:bg-violet-500/10",
    ghost: "border-transparent bg-transparent text-slate-200 hover:bg-white/[0.04]",
  };

  const sizes = {
    sm: "px-3 py-2 text-xs",
    md: "px-4 py-2.5 text-sm",
    lg: "px-5 py-3 text-sm",
  };

  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {leading}
      {children}
    </button>
  );
}
