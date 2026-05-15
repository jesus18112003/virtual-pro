import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { format, eachDayOfInterval } from "date-fns";
import { formatCurrency, Poliza, localDateString, toDateOnlyString } from "@/lib/data";
import { useTheme } from "next-themes";

interface SalesLineChartProps {
  data: Poliza[];
  dateFrom?: Date;
  dateTo?: Date;
}

export function SalesLineChart({ data, dateFrom, dateTo }: SalesLineChartProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const chartData = useMemo(() => {
    if (data.length === 0) return [];

    const sorted = [...data].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const minDate = dateFrom || startOfDay(new Date(sorted[0].created_at));
    const maxDate = dateTo || startOfDay(new Date(sorted[sorted.length - 1].created_at));

    if (minDate > maxDate) return [];

    const days = eachDayOfInterval({ start: minDate, end: maxDate });

    const dayMap = new Map<string, number>();
    for (const d of days) {
      dayMap.set(format(d, "yyyy-MM-dd"), 0);
    }

    for (const p of data) {
      const key = format(startOfDay(new Date(p.created_at)), "yyyy-MM-dd");
      if (dayMap.has(key)) {
        dayMap.set(key, (dayMap.get(key) || 0) + p.monto);
      }
    }

    return Array.from(dayMap.entries()).map(([date, total]) => ({
      date,
      label: format(new Date(date), "d MMM"),
      total,
    }));
  }, [data, dateFrom, dateTo]);

  const colors = {
    grid: isDark ? "hsl(0,0%,18%)" : "hsl(0,0%,88%)",
    tick: isDark ? "hsl(0,0%,55%)" : "hsl(0,0%,30%)",
    axis: isDark ? "hsl(0,0%,25%)" : "hsl(0,0%,75%)",
    tooltipBg: isDark ? "hsl(0,0%,10%)" : "hsl(0,0%,100%)",
    tooltipBorder: isDark ? "hsl(0,0%,18%)" : "hsl(0,0%,85%)",
    tooltipText: isDark ? "hsl(0,0%,95%)" : "hsl(0,0%,10%)",
    label: isDark ? "hsl(0,0%,90%)" : "hsl(0,0%,15%)",
  };

  return (
    <div
      className="bg-card border border-border rounded-xl p-6 animate-fade-up"
      style={{ animationDelay: "350ms" }}
    >
      <h3 className="text-lg font-semibold text-gold tracking-wide uppercase mb-4">
        Sales Total – Days
      </h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 20, bottom: 5, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
            <XAxis
              dataKey="label"
              tick={{ fill: colors.tick, fontSize: 12 }}
              axisLine={{ stroke: colors.axis }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: colors.tick, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: colors.tooltipBg,
                border: `1px solid ${colors.tooltipBorder}`,
                borderRadius: "8px",
                color: colors.tooltipText,
              }}
              formatter={(value: number) => [formatCurrency(value), "Monto"]}
              labelFormatter={(label) => label}
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke="hsl(45,80%,55%)"
              strokeWidth={2}
              dot={{ fill: "hsl(45,80%,55%)", r: 4 }}
              activeDot={{ r: 6 }}
              label={{
                position: "top",
                fill: colors.label,
                fontSize: 11,
                formatter: (v: number) => formatCurrency(v),
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
