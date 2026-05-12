import { formatCurrency, toDateOnlyString, weekOverlapsDateRange } from "@/lib/data";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

interface AgentRow {
  agente: string;
  total: number;
  polizas: number;
}

interface ScoreboardTableProps {
  agents: AgentRow[];
  selectedAgent: string | null;
  onSelectAgent: (agent: string | null) => void;
  currentMonth?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export function ScoreboardTable({ agents, selectedAgent, onSelectAgent, currentMonth, dateFrom, dateTo }: ScoreboardTableProps) {
  const month = currentMonth || (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  })();

  const { data: profiles = [] } = useQuery({
    queryKey: ["agent_profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("agent_profiles").select("*");
      if (error) throw error;
      return data as { agente: string; avatar_url: string | null }[];
    },
  });

  const { data: goals = [] } = useQuery({
    queryKey: ["agent_goals", month],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_goals")
        .select("*")
        .eq("mes", month);
      if (error) throw error;
      return data as { agente: string; meta: number; meta_inv: number | null }[];
    },
  });

  const { data: equipos = [] } = useQuery({
    queryKey: ["equipos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("equipos").select("*");
      if (error) throw error;
      return data as { id: string; nombre: string; color: string | null }[];
    },
  });

  const { data: agentTeams = [] } = useQuery({
    queryKey: ["agent_teams"],
    queryFn: async () => {
      const { data, error } = await supabase.from("agent_teams").select("*");
      if (error) throw error;
      return data as { agente: string; equipo_id: string }[];
    },
  });

  const { data: investments = [] } = useQuery({
    queryKey: ["agent_investments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("agent_investments").select("*");
      if (error) throw error;
      return data as {
        agente: string;
        semana: string;
        inv_60_second: number;
        inv_fj_call: number;
        inv_leads_propios: number;
      }[];
    },
  });

  const fromStr = dateFrom ? toDateOnlyString(dateFrom) : null;
  const toStr = dateTo ? toDateOnlyString(dateTo) : null;

  const getAvatar = (name: string) => profiles.find((p) => p.agente === name)?.avatar_url ?? null;
  const getGoal = (name: string) => goals.find((g) => g.agente === name)?.meta ?? null;
  const getGoalInv = (name: string) => {
    const g = goals.find((g) => g.agente === name);
    const v = g?.meta_inv;
    return v != null && Number(v) > 0 ? Number(v) : null;
  };
  const getTeam = (name: string) => {
    const at = agentTeams.find((t) => t.agente === name);
    if (!at) return null;
    return equipos.find((e) => e.id === at.equipo_id) ?? null;
  };
  const getInvestment = (name: string) => {
    const rows = investments.filter((inv) => {
      if (inv.agente !== name) return false;
      return weekOverlapsDateRange(inv.semana, fromStr, toStr);
    });
    if (rows.length === 0) return null;
    return rows.reduce(
      (sum, r) =>
        sum + Number(r.inv_60_second) + Number(r.inv_fj_call) + Number(r.inv_leads_propios),
      0
    );
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 animate-fade-up" style={{ animationDelay: "100ms" }}>
      <h3 className="text-lg font-semibold text-gold tracking-wide uppercase mb-4">Scoreboard</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="text-left py-3 px-2 font-medium">#</th>
              <th className="text-left py-3 px-2 font-medium">Agent</th>
              <th className="text-right py-3 px-2 font-medium">Total</th>
              <th className="text-right py-3 px-2 font-medium">Goal</th>
              <th className="text-right py-3 px-2 font-medium">Goal Inv</th>
              <th className="text-right py-3 px-2 font-medium">Policies</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent, i) => {
              const avatar = getAvatar(agent.agente);
              const goal = getGoal(agent.agente);
              const pct = goal ? Math.min((agent.total / goal) * 100, 100) : null;

              return (
                <tr
                  key={agent.agente}
                  onClick={() =>
                    onSelectAgent(selectedAgent === agent.agente ? null : agent.agente)
                  }
                  className={`border-b border-border/50 cursor-pointer transition-colors duration-150 ${
                    selectedAgent === agent.agente
                      ? "bg-primary/10"
                      : "hover:bg-secondary/50"
                  }`}
                >
                  <td className="py-3 px-2 font-bold text-muted-foreground">{i + 1}</td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Avatar className="w-7 h-7">
                        {avatar ? <AvatarImage src={avatar} alt={agent.agente} /> : null}
                        <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                          {agent.agente.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-semibold text-foreground">{agent.agente}</span>
                      {(() => {
                        const team = getTeam(agent.agente);
                        if (!team) return null;
                        return (
                          <span
                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full border whitespace-nowrap"
                            style={{
                              color: team.color || "hsl(var(--muted-foreground))",
                              borderColor: (team.color || "hsl(var(--muted-foreground))") + "55",
                              backgroundColor: (team.color || "hsl(var(--muted-foreground))") + "15",
                            }}
                          >
                            {team.nombre}
                          </span>
                        );
                      })()}
                    </div>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <div className="space-y-1">
                      <span className="font-mono font-semibold tabular-nums text-foreground">
                        {formatCurrency(agent.total)}
                      </span>
                      {pct !== null && (
                        <div className="flex items-center gap-2 justify-end">
                          <Progress value={pct} className="w-16 h-1.5" />
                          <span className="text-[10px] text-muted-foreground">{Math.round(pct)}%</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-2 text-right font-mono tabular-nums text-muted-foreground">
                    {goal ? formatCurrency(goal) : "—"}
                  </td>
                  <td className="py-3 px-2 text-right">
                    {(() => {
                      const inv = getInvestment(agent.agente);
                      const goalInv = getGoalInv(agent.agente);
                      if (inv === null && goalInv === null) {
                        return <span className="font-mono tabular-nums text-muted-foreground">—</span>;
                      }
                      const invVal = inv ?? 0;
                      const pctInv = goalInv ? Math.min((invVal / goalInv) * 100, 100) : null;
                      return (
                        <div className="space-y-1">
                          <span className="font-mono font-semibold tabular-nums text-foreground">
                            {formatCurrency(invVal)}
                          </span>
                          {goalInv !== null && (
                            <>
                              <div className="text-[10px] text-muted-foreground">
                                / {formatCurrency(goalInv)}
                              </div>
                              <div className="flex items-center gap-2 justify-end">
                                <Progress value={pctInv ?? 0} className="w-16 h-1.5" />
                                <span className="text-[10px] text-muted-foreground">{Math.round(pctInv ?? 0)}%</span>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })()}
                  </td>
                  <td className="py-3 px-2 text-right font-mono tabular-nums text-muted-foreground">
                    {agent.polizas}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
