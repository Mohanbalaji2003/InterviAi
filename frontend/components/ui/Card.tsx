import type { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function Card({ children, className = "", ...props }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-slate-800/80 bg-[#0d121c]/90 shadow-xl shadow-black/20 backdrop-blur-sm transition-all duration-200 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
