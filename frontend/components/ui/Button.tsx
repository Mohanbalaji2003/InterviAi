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
    "inline-flex items-center justify-center gap-2 rounded-xl border font-medium transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/80 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer select-none";

  const variants = {
    primary:
      "border-violet-500/50 bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-950/40 hover:from-violet-500 hover:to-indigo-500 hover:shadow-violet-900/50 hover:border-violet-400/70 active:shadow-none",
    secondary:
      "border-slate-800 bg-slate-900/80 text-slate-100 hover:border-slate-700 hover:bg-slate-800 hover:text-white shadow-sm",
    ghost: "border-transparent bg-transparent text-slate-300 hover:bg-white/[0.06] hover:text-white",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs min-h-[34px]",
    md: "px-4 py-2.5 text-sm min-h-[40px]",
    lg: "px-5 py-3 text-sm font-semibold min-h-[46px]",
  };

  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {leading}
      {children}
    </button>
  );
}
