import { Medal, Trophy, Award } from "lucide-react";
import { formatCurrency } from "@/lib/data";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface PodiumAgent {
  agente: string;
  total: number;
  polizas: number;
}

interface PodiumProps {
  agents: PodiumAgent[];
}

export function Podium({ agents }: PodiumProps) {
  const { data: profiles = [] } = useQuery({
    queryKey: ["agent_profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("agent_profiles").select("*");
      if (error) throw error;
      return data as { agente: string; avatar_url: string | null }[];
    },
  });

  const getAvatar = (name: string) => profiles.find((p) => p.agente === name)?.avatar_url ?? null;

  if (agents.length === 0) return null;

  const medals = [
    { icon: Trophy, color: "text-gold", bg: "bg-gold/10", border: "border-gold/30", label: "1st" },
    { icon: Medal, color: "text-silver", bg: "bg-silver/10", border: "border-silver/30", label: "2nd" },
    { icon: Award, color: "text-bronze", bg: "bg-bronze/10", border: "border-bronze/30", label: "3rd" },
  ];

  const podiumOrder = agents.length >= 3
    ? [agents[1], agents[0], agents[2]]
    : agents;
  const medalOrder = agents.length >= 3
    ? [medals[1], medals[0], medals[2]]
    : medals;
  const heights = agents.length >= 3
    ? ["h-32", "h-44", "h-24"]
    : ["h-44"];

  return (
    <div className="bg-card border border-border rounded-xl p-6 animate-fade-up" style={{ animationDelay: "200ms" }}>
      <h3 className="text-lg font-semibold text-gold tracking-wide uppercase mb-6">Top Agents</h3>
      <div className="flex items-end justify-center gap-3">
        {podiumOrder.map((agent, i) => {
          const m = medalOrder[i];
          const Icon = m.icon;
          const avatar = getAvatar(agent.agente);
          return (
            <div key={agent.agente} className="flex flex-col items-center gap-2 flex-1">
              <Avatar className="w-12 h-12 border-2 border-border">
                {avatar ? <AvatarImage src={avatar} alt={agent.agente} /> : null}
                <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                  {agent.agente.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Icon className={`w-8 h-8 ${m.color}`} />
              <span className="text-sm font-bold text-foreground text-center truncate w-full">
                {agent.agente}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatCurrency(agent.total)}
              </span>
              <span className="text-xs text-muted-foreground">
                {agent.polizas} pólizas
              </span>
              <div
                className={`w-full ${heights[i]} rounded-t-lg ${m.bg} border ${m.border} flex items-center justify-center`}
              >
                <span className={`text-2xl font-black ${m.color}`}>{m.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
