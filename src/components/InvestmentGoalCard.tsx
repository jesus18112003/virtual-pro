import { useMemo } from "react";
import { TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/data";
import { cn } from "@/lib/utils";

interface InvestmentGoalCardProps {
  current: number;
  goal: number | null;
  delay?: number;
}

export function InvestmentGoalCard({ current, goal, delay = 0 }: InvestmentGoalCardProps) {
  const pct = goal && goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  const remaining = goal ? Math.max(goal - current, 0) : 0;

  const dailyNeeded = useMemo(() => {
    if (!goal || remaining <= 0) return 0;
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysLeft = lastDay - now.getDate();
    if (daysLeft <= 0) return remaining;
    return remaining / daysLeft;
  }, [goal, remaining]);

  const tier = useMemo(() => {
    if (!goal) return "none";
    if (pct >= 100) return "complete";
    if (pct >= 75) return "close";
    if (pct >= 50) return "halfway";
    if (pct >= 25) return "started";
    return "low";
  }, [pct, goal]);

  return (
    <div
      className={cn(
        "relative rounded-xl p-4 sm:p-6 flex items-center gap-3 sm:gap-4 animate-fade-up overflow-hidden transition-all duration-700 border",
        tier === "none" && "bg-card border-border",
        tier === "low" && "bg-card border-border",
        tier === "started" && "bg-card border-primary/20",
        tier === "halfway" && "bg-card border-amber-500/30",
        tier === "close" && "bg-card border-amber-400/50",
        tier === "complete" && "bg-card border-gold/60",
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {tier !== "none" && tier !== "low" && (
        <div
          className={cn("absolute inset-0 rounded-xl pointer-events-none")}
          style={{
            background:
              tier === "started"
                ? "radial-gradient(ellipse at 20% 50%, hsla(213, 94%, 55%, 0.06) 0%, transparent 70%)"
                : tier === "halfway"
                ? "radial-gradient(ellipse at 20% 50%, hsla(38, 92%, 50%, 0.08) 0%, transparent 70%)"
                : tier === "close"
                ? "radial-gradient(ellipse at 20% 50%, hsla(38, 92%, 50%, 0.12) 0%, transparent 70%)"
                : "radial-gradient(ellipse at 50% 50%, hsla(43, 96%, 56%, 0.15) 0%, transparent 70%)",
          }}
        />
      )}

      <div
        className={cn(
          "relative flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center transition-all duration-700",
          tier === "none" && "bg-gold/10 text-gold",
          tier === "low" && "bg-gold/10 text-gold",
          tier === "started" && "bg-primary/15 text-primary",
          tier === "halfway" && "bg-amber-500/15 text-amber-400",
          tier === "close" && "bg-amber-400/20 text-amber-300",
          tier === "complete" && "bg-gold/20 text-gold",
        )}
      >
        <TrendingUp className={cn("w-6 h-6", tier === "complete" && "animate-pulse")} />
      </div>

      <div className="min-w-0 flex-1 relative z-10">
        <p className="text-xs sm:text-sm text-muted-foreground font-medium">Meta de Inversión</p>
        {goal ? (
          <>
            <p
              className={cn(
                "text-base sm:text-xl lg:text-2xl font-extrabold tracking-tight break-words transition-colors duration-700",
                tier === "low" && "text-foreground",
                tier === "started" && "text-foreground",
                tier === "halfway" && "text-amber-200",
                tier === "close" && "text-amber-100",
                tier === "complete" && "text-gold",
              )}
            >
              {formatCurrency(current)} / {formatCurrency(goal)}
            </p>
            <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-1000 ease-out",
                  tier === "low" && "bg-muted-foreground",
                  tier === "started" && "bg-primary",
                  tier === "halfway" && "bg-amber-500",
                  tier === "close" && "bg-amber-400",
                  tier === "complete" && "bg-gradient-to-r from-amber-400 to-gold",
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-x-3 mt-1">
              <p className="text-[10px] font-medium text-muted-foreground">
                {Math.round(pct)}% invertido
                {tier === "complete" && " 🎉"}
                {tier === "close" && " 🔥"}
              </p>
              {tier !== "complete" && remaining > 0 && (
                <p className="text-[10px] font-semibold text-muted-foreground">
                  Faltan {formatCurrency(remaining)}
                </p>
              )}
            </div>
            {tier !== "complete" && dailyNeeded > 0 && (
              <p className="text-[10px] mt-0.5 text-muted-foreground/70">
                📅 ~{formatCurrency(dailyNeeded)}/día para la meta
              </p>
            )}
          </>
        ) : (
          <p className="text-base sm:text-xl lg:text-2xl font-extrabold tracking-tight text-foreground">
            Sin meta
          </p>
        )}
      </div>
    </div>
  );
}
