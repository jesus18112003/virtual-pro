import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useTheme } from "next-themes";

interface ChartData {
  name: string;
  value: number;
}

interface SalesPieChartProps {
  data: ChartData[];
}

const COLORS = [
  "hsl(213, 94%, 55%)",
  "hsl(160, 60%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(340, 75%, 55%)",
  "hsl(270, 60%, 55%)",
  "hsl(190, 70%, 50%)",
  "hsl(15, 80%, 55%)",
];

export function SalesPieChart({ data }: SalesPieChartProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const colors = {
    tooltipBg: isDark ? "hsl(0, 0%, 10%)" : "hsl(0, 0%, 100%)",
    tooltipBorder: isDark ? "hsl(0, 0%, 18%)" : "hsl(0, 0%, 85%)",
    tooltipText: isDark ? "hsl(0, 0%, 95%)" : "hsl(0, 0%, 10%)",
    legend: isDark ? "hsl(0, 0%, 55%)" : "hsl(0, 0%, 30%)",
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 animate-fade-up" style={{ animationDelay: "300ms" }}>
      <h3 className="text-lg font-semibold text-gold tracking-wide uppercase mb-4">
        Sales – Company
      </h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={3}
              dataKey="value"
              nameKey="name"
              stroke="none"
            >
              {data.map((_, index) => (
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
              formatter={(value: number) =>
                new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)
              }
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
