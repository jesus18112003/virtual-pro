import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatCurrency, Poliza } from "@/lib/data";
import { useTheme } from "next-themes";

interface CompanyPieChartProps {
  data: Poliza[];
}

const COLORS = [
  "hsl(213, 94%, 55%)",
  "hsl(160, 60%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(340, 75%, 55%)",
  "hsl(270, 60%, 55%)",
  "hsl(190, 70%, 50%)",
  "hsl(15, 80%, 55%)",
  "hsl(95, 55%, 45%)",
  "hsl(320, 65%, 50%)",
];

export function CompanyPieChart({ data }: CompanyPieChartProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const chartData = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of data) {
      const empresa = p.empresa || "Sin empresa";
      map.set(empresa, (map.get(empresa) || 0) + p.monto);
    }
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  const colors = {
    tooltipBg: isDark ? "hsl(0, 0%, 10%)" : "hsl(0, 0%, 100%)",
    tooltipBorder: isDark ? "hsl(0, 0%, 18%)" : "hsl(0, 0%, 85%)",
    tooltipText: isDark ? "hsl(0, 0%, 95%)" : "hsl(0, 0%, 10%)",
    legend: isDark ? "hsl(0, 0%, 55%)" : "hsl(0, 0%, 30%)",
  };

  return (
    <div
      className="bg-card border border-border rounded-xl p-6 animate-fade-up"
      style={{ animationDelay: "300ms" }}
    >
      <h3 className="text-lg font-semibold text-gold tracking-wide uppercase mb-4">
        Sales – Company
      </h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={3}
              dataKey="value"
              nameKey="name"
              stroke="none"
            >
              {chartData.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: colors.tooltipBg,
                border: `1px solid ${colors.tooltipBorder}`,
                borderRadius: "8px",
                color: colors.tooltipText,
              }}
              formatter={(value: number) => formatCurrency(value)}
            />
            <Legend
              wrapperStyle={{ color: colors.legend, fontSize: "12px" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
