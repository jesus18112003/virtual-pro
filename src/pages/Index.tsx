import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { CalendarIcon, DollarSign, FileText, Star, X, RefreshCw, Settings, TrendingUp } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";
import { formatCurrency, Poliza, localDateString, toDateOnlyString } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { StatCard } from "@/components/StatCard";
import { ScoreboardTable } from "@/components/ScoreboardTable";
import { Podium } from "@/components/Podium";
import { SalesPieChart } from "@/components/SalesPieChart";
import { SalesLineChart } from "@/components/SalesLineChart";
import { CompanyPieChart } from "@/components/CompanyPieChart";
import { AddClosingModal } from "@/components/AddClosingModal";
import { AddInvestmentModal } from "@/components/AddInvestmentModal";
import { TeamGoalCard } from "@/components/TeamGoalCard";
import { InvestmentGoalCard } from "@/components/InvestmentGoalCard";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import voLogo from "@/assets/vo-logo.png";
import voLogoDark from "@/assets/vo-logo-dark.png";
import voIsotipo from "@/assets/vo-isotipo.png";
import voBg from "@/assets/vo-bg.png";

export default function Index() {
  const [dateFrom, setDateFrom] = useState<Date | undefined>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [dateTo, setDateTo] = useState<Date | undefined>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0);
  });
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const queryClient = useQueryClient();

  const { data: polizas = [], isLoading, refetch } = useQuery({
    queryKey: ["polizas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("polizas")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Poliza[];
    },
  });

  const syncDiscord = async () => {
    setSyncing(true);
    try {
      const { error } = await supabase.functions.invoke("discord-poll");
      if (error) throw error;
      await refetch();
      toast.success("Sincronización completada");
    } catch (e) {
      toast.error("Error al sincronizar con Discord");
      console.error(e);
    } finally {
      setSyncing(false);
    }
  };

  const filtered = useMemo(() => {
    let data = polizas;
    if (dateFrom) {
      const fromStr = toDateOnlyString(dateFrom);
      data = data.filter((p) => localDateString(p.created_at) >= fromStr);
    }
    if (dateTo) {
      const toStr = toDateOnlyString(dateTo);
      data = data.filter((p) => localDateString(p.created_at) <= toStr);
    }
    return data;
  }, [polizas, dateFrom, dateTo]);

  const agentStats = useMemo(() => {
    const map = new Map<string, { total: number; polizas: number }>();
    for (const p of filtered) {
      const cur = map.get(p.agente) || { total: 0, polizas: 0 };
      cur.total += p.monto;
      cur.polizas += 1;
      map.set(p.agente, cur);
    }
    return Array.from(map.entries())
      .map(([agente, stats]) => ({ agente, ...stats }))
      .sort((a, b) => b.total - a.total);
  }, [filtered]);

  const displayData = useMemo(() => {
    if (selectedAgent) return filtered.filter((p) => p.agente === selectedAgent);
    return filtered;
  }, [filtered, selectedAgent]);

  const salesTotal = displayData.reduce((sum, p) => sum + p.monto, 0);
  const totalPolicies = displayData.length;
  const avgPolicyValue = totalPolicies > 0 ? salesTotal / totalPolicies : 0;

  const currentMonth = dateFrom
    ? `${dateFrom.getFullYear()}-${String(dateFrom.getMonth() + 1).padStart(2, "0")}`
    : `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

  const { data: teamGoal } = useQuery({
    queryKey: ["team_goals", currentMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_goals")
        .select("*")
        .eq("mes", currentMonth)
        .maybeSingle();
      if (error) throw error;
      return data as { id: string; mes: string; meta: number } | null;
    },
  });

  const { data: investmentGoal } = useQuery({
    queryKey: ["investment_goals", currentMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("investment_goals")
        .select("*")
        .eq("mes", currentMonth)
        .maybeSingle();
      if (error) throw error;
      return data as { id: string; mes: string; meta: number } | null;
    },
  });

  const { data: monthInvestments = [] } = useQuery({
    queryKey: ["agent_investments", "month", currentMonth],
    queryFn: async () => {
      const [y, m] = currentMonth.split("-").map(Number);
      // Incluir semanas que se solapen con el mes: la semana (lunes) puede empezar
      // hasta 6 días antes del 1 del mes y aún tener días dentro del mes.
      const monthStart = new Date(y, m - 1, 1);
      const rangeStart = new Date(monthStart);
      rangeStart.setDate(rangeStart.getDate() - 6);
      const rangeEnd = new Date(y, m, 1); // primer día del mes siguiente (exclusivo)
      const startStr = toDateOnlyString(rangeStart);
      const endStr = toDateOnlyString(rangeEnd);
      const { data, error } = await supabase
        .from("agent_investments")
        .select("inv_60_second, inv_fj_call, inv_leads_propios")
        .gte("semana", startStr)
        .lt("semana", endStr);
      if (error) throw error;
      return data as { inv_60_second: number; inv_fj_call: number; inv_leads_propios: number }[];
    },
  });

  const monthSalesTotal = useMemo(() => {
    const [y, m] = currentMonth.split("-").map(Number);
    const monthStart = toDateOnlyString(new Date(y, m - 1, 1));
    const monthEnd = toDateOnlyString(new Date(y, m, 0));
    return polizas.reduce((sum, p) => {
      const d = localDateString(p.created_at);
      if (d >= monthStart && d <= monthEnd) return sum + p.monto;
      return sum;
    }, 0);
  }, [polizas, currentMonth]);

  const investmentTotal = useMemo(
    () =>
      monthInvestments.reduce(
        (sum, i) => sum + Number(i.inv_60_second || 0) + Number(i.inv_fj_call || 0) + Number(i.inv_leads_propios || 0),
        0,
      ),
    [monthInvestments],
  );

  const firstClosings = useMemo(() => {
    const firstDates = new Map<string, string>();
    for (const p of polizas) {
      const dateStr = localDateString(p.created_at);
      const cur = firstDates.get(p.agente);
      if (!cur || dateStr < cur) firstDates.set(p.agente, dateStr);
    }
    return Array.from(firstDates.entries()).filter(([, d]) => {
      if (dateFrom && d < toDateOnlyString(dateFrom)) return false;
      if (dateTo && d > toDateOnlyString(dateTo)) return false;
      return true;
    }).length;
  }, [polizas, dateFrom, dateTo]);

  const pieData = useMemo(() => {
    return agentStats.map((a) => ({ name: a.agente, value: a.total }));
  }, [agentStats]);

  const allAgents = useMemo(
    () => [...new Set(polizas.map((p) => p.agente))].sort(),
    [polizas]
  );

  const clearFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    setSelectedAgent(null);
  };

  const hasFilters = dateFrom || dateTo || selectedAgent;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 relative overflow-hidden">
      {/* Decorative isotipo — Virtual Origin portal */}
      <img
        src={voIsotipo}
        alt=""
        aria-hidden="true"
        className="pointer-events-none select-none absolute -right-32 -top-32 w-[28rem] opacity-[0.06] dark:opacity-[0.10] animate-float-slow"
      />
      <img
        src={voIsotipo}
        alt=""
        aria-hidden="true"
        className="pointer-events-none select-none absolute -left-40 bottom-10 w-[22rem] opacity-[0.04] dark:opacity-[0.08] rotate-12"
      />

      <div className="max-w-7xl mx-auto space-y-6 relative">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-up">
          <div className="flex items-center gap-4">
            <img src={voLogo} alt="Virtual Origin" className="h-14 sm:h-16 w-auto dark:invert dark:brightness-200" />
            <div className="hidden sm:block h-12 w-px bg-border" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                Sales Dashboard
              </h1>
              <p className="text-muted-foreground text-sm mt-0.5">Agent Scoreboard</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ThemeToggle />
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("gap-2 text-sm", dateFrom && "text-primary border-primary/40")}>
                  <CalendarIcon className="w-4 h-4" />
                  {dateFrom ? format(dateFrom, "MMM d, yyyy") : "From"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("gap-2 text-sm", dateTo && "text-primary border-primary/40")}>
                  <CalendarIcon className="w-4 h-4" />
                  {dateTo ? format(dateTo, "MMM d, yyyy") : "To"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar mode="single" selected={dateTo} onSelect={setDateTo} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("gap-2 text-sm", selectedAgent && "text-primary border-primary/40")}>
                  {selectedAgent || "All Agents"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-44 p-2" align="end">
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedAgent(null)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                      !selectedAgent ? "bg-primary/10 text-primary" : "hover:bg-secondary text-foreground"
                    )}
                  >
                    All Agents
                  </button>
                  {allAgents.map((a) => (
                    <button
                      key={a}
                      onClick={() => setSelectedAgent(a)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                        selectedAgent === a ? "bg-primary/10 text-primary" : "hover:bg-secondary text-foreground"
                      )}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground hover:text-foreground">
                <X className="w-3 h-3" /> Clear
              </Button>
            )}

            <Button variant="outline" size="sm" onClick={syncDiscord} disabled={syncing} className="gap-2 text-sm">
              <RefreshCw className={cn("w-4 h-4", syncing && "animate-spin")} />
              {syncing ? "Syncing..." : "Sync Discord"}
            </Button>

            <AddClosingModal onSuccess={() => refetch()} />
            <AddInvestmentModal onSuccess={() => queryClient.invalidateQueries({ queryKey: ["agent_investments"] })} />

            <Link to="/admin">
              <Button variant="outline" size="sm" className="gap-2 text-sm">
                <Settings className="w-4 h-4" /> Admin
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard title="Sales Total" value={formatCurrency(salesTotal)} icon={<DollarSign className="w-6 h-6" />} delay={50} />
          <StatCard title="Total Insurance Policies" value={totalPolicies} icon={<FileText className="w-6 h-6" />} delay={100} />
          <StatCard title="First Closings" value={firstClosings} icon={<Star className="w-6 h-6" />} delay={150} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <TeamGoalCard current={salesTotal} goal={teamGoal?.meta ?? null} delay={200} monthCurrent={monthSalesTotal} />
          <InvestmentGoalCard current={investmentTotal} goal={investmentGoal?.meta ?? null} delay={225} />
          <StatCard title="Promedio por Póliza" value={formatCurrency(avgPolicyValue)} icon={<TrendingUp className="w-6 h-6" />} delay={250} />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3">
            <ScoreboardTable
              agents={agentStats}
              selectedAgent={selectedAgent}
              onSelectAgent={setSelectedAgent}
              currentMonth={currentMonth}
              dateFrom={dateFrom}
              dateTo={dateTo}
            />
          </div>
          <div className="lg:col-span-2">
            <Podium agents={agentStats.slice(0, 3)} />
          </div>
        </div>

        {/* Line Chart - Sales by Day */}
        <SalesLineChart data={displayData} dateFrom={dateFrom} dateTo={dateTo} />

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SalesPieChart data={pieData} />
          <CompanyPieChart data={displayData} />
        </div>
      </div>
    </div>
  );
}
