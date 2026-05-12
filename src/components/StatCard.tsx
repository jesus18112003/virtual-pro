import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  delay?: number;
}

export function StatCard({ title, value, icon, delay = 0 }: StatCardProps) {
  return (
    <div
      className="bg-card border border-border rounded-xl p-4 sm:p-6 flex items-center gap-3 sm:gap-4 animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gold/10 flex items-center justify-center text-gold">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs sm:text-sm text-muted-foreground font-medium">{title}</p>
        <p className="text-base sm:text-xl lg:text-2xl font-extrabold tracking-tight text-foreground break-words">{String(value)}</p>
      </div>
    </div>
  );
}
