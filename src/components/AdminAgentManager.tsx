import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/data";
import { toast } from "sonner";
import { Target, Camera, Save, UserPlus, Trash2, Users, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AgentGoal {
  id: string;
  agente: string;
  mes: string;
  meta: number;
  meta_inv: number | null;
}

interface AgentProfile {
  id: string;
  agente: string;
  avatar_url: string | null;
}

export function AdminAgentManager() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  );
  const [goals, setGoals] = useState<Record<string, string>>({});
  const [goalsInv, setGoalsInv] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [uploadingAgent, setUploadingAgent] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newAgentName, setNewAgentName] = useState("");
  const [addingAgent, setAddingAgent] = useState(false);
  const [deleteAgentName, setDeleteAgentName] = useState<string | null>(null);
  const [editAgent, setEditAgent] = useState<{ oldName: string; newName: string } | null>(null);
  const [renamingAgent, setRenamingAgent] = useState(false);
  const queryClient = useQueryClient();

  const { data: agentes = [] } = useQuery({
    queryKey: ["agentes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agentes")
        .select("*")
        .order("nombre");
      if (error) throw error;
      return data;
    },
  });

  const agentNames = agentes.map((a) => a.nombre);

  const { data: agentGoals = [] } = useQuery({
    queryKey: ["agent_goals", selectedMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_goals")
        .select("*")
        .eq("mes", selectedMonth);
      if (error) throw error;
      return data as AgentGoal[];
    },
  });

  const { data: agentProfiles = [] } = useQuery({
    queryKey: ["agent_profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_profiles")
        .select("*");
      if (error) throw error;
      return data as AgentProfile[];
    },
  });

  const { data: teamGoal } = useQuery({
    queryKey: ["team_goals", selectedMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_goals")
        .select("*")
        .eq("mes", selectedMonth)
        .maybeSingle();
      if (error) throw error;
      return data as { id: string; mes: string; meta: number } | null;
    },
  });

  const [teamGoalValue, setTeamGoalValue] = useState("");
  const [investmentGoalValue, setInvestmentGoalValue] = useState("");

  const { data: investmentGoal } = useQuery({
    queryKey: ["investment_goals", selectedMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("investment_goals")
        .select("*")
        .eq("mes", selectedMonth)
        .maybeSingle();
      if (error) throw error;
      return data as { id: string; mes: string; meta: number } | null;
    },
  });

  useEffect(() => {
    const map: Record<string, string> = {};
    const mapInv: Record<string, string> = {};
    for (const g of agentGoals) {
      map[g.agente] = String(g.meta);
      if (g.meta_inv != null && Number(g.meta_inv) > 0) {
        mapInv[g.agente] = String(g.meta_inv);
      }
    }
    setGoals(map);
    setGoalsInv(mapInv);
  }, [agentGoals]);

  useEffect(() => {
    setTeamGoalValue(teamGoal ? String(teamGoal.meta) : "");
  }, [teamGoal]);

  useEffect(() => {
    setInvestmentGoalValue(investmentGoal ? String(investmentGoal.meta) : "");
  }, [investmentGoal]);

  const getAvatar = (agente: string) => {
    return agentProfiles.find((p) => p.agente === agente)?.avatar_url ?? null;
  };

  const handleSaveGoals = async () => {
    setSaving(true);
    try {
      // Save team goal
      const teamVal = parseFloat(teamGoalValue);
      if (!teamGoalValue || isNaN(teamVal) || teamVal <= 0) {
        if (teamGoal) {
          await supabase.from("team_goals").delete().eq("id", teamGoal.id);
        }
      } else if (teamGoal) {
        await supabase.from("team_goals").update({ meta: teamVal }).eq("id", teamGoal.id);
      } else {
        await supabase.from("team_goals").insert({ mes: selectedMonth, meta: teamVal });
      }

      // Save investment goal
      const invVal = parseFloat(investmentGoalValue);
      if (!investmentGoalValue || isNaN(invVal) || invVal <= 0) {
        if (investmentGoal) {
          await supabase.from("investment_goals").delete().eq("id", investmentGoal.id);
        }
      } else if (investmentGoal) {
        await supabase.from("investment_goals").update({ meta: invVal }).eq("id", investmentGoal.id);
      } else {
        await supabase.from("investment_goals").insert({ mes: selectedMonth, meta: invVal });
      }

      // Save agent goals (sales + investment)
      for (const agent of agentNames) {
        const raw = goals[agent] || "";
        const val = parseFloat(raw);
        const rawInv = goalsInv[agent] || "";
        const valInv = parseFloat(rawInv);
        const hasSales = raw && !isNaN(val) && val > 0;
        const hasInv = rawInv && !isNaN(valInv) && valInv > 0;
        const existing = agentGoals.find((g) => g.agente === agent);

        if (!hasSales && !hasInv) {
          if (existing) {
            await supabase.from("agent_goals").delete().eq("id", existing.id);
          }
          continue;
        }

        const payload = {
          meta: hasSales ? val : 0,
          meta_inv: hasInv ? valInv : 0,
        };

        if (existing) {
          await supabase.from("agent_goals").update(payload).eq("id", existing.id);
        } else {
          await supabase.from("agent_goals").insert({ agente: agent, mes: selectedMonth, ...payload });
        }
      }
      toast.success("Metas guardadas con éxito");
      queryClient.invalidateQueries({ queryKey: ["agent_goals"] });
      queryClient.invalidateQueries({ queryKey: ["team_goals"] });
      queryClient.invalidateQueries({ queryKey: ["investment_goals"] });
    } catch {
      toast.error("Error al guardar metas");
    } finally {
      setSaving(false);
    }
  };

  const handleUploadAvatar = async (agent: string, file: File) => {
    setUploadingAgent(agent);
    try {
      const ext = file.name.split(".").pop();
      const path = `${agent.replace(/\s+/g, "_").toLowerCase()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("agent-avatars")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("agent-avatars")
        .getPublicUrl(path);

      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const existing = agentProfiles.find((p) => p.agente === agent);
      if (existing) {
        await supabase
          .from("agent_profiles")
          .update({ avatar_url: avatarUrl })
          .eq("id", existing.id);
      } else {
        await supabase
          .from("agent_profiles")
          .insert({ agente: agent, avatar_url: avatarUrl });
      }

      toast.success(`Foto de ${agent} actualizada`);
      queryClient.invalidateQueries({ queryKey: ["agent_profiles"] });
    } catch (e: any) {
      toast.error("Error al subir foto: " + e.message);
    } finally {
      setUploadingAgent(null);
    }
  };

  const handleAddAgent = async () => {
    const name = newAgentName.trim();
    if (!name) return;
    if (agentNames.some((a) => a.toLowerCase() === name.toLowerCase())) {
      toast.error("Este agente ya existe");
      return;
    }
    setAddingAgent(true);
    const { error } = await supabase.from("agentes").insert({ nombre: name });
    setAddingAgent(false);
    if (error) {
      toast.error("Error al agregar agente: " + error.message);
    } else {
      toast.success(`Agente "${name}" agregado`);
      setNewAgentName("");
      setAddOpen(false);
      queryClient.invalidateQueries({ queryKey: ["agentes"] });
    }
  };

  const handleDeleteAgent = async () => {
    if (!deleteAgentName) return;
    const { error } = await supabase.from("agentes").delete().eq("nombre", deleteAgentName);
    if (error) {
      toast.error("Error al eliminar agente: " + error.message);
    } else {
      toast.success(`Agente "${deleteAgentName}" eliminado`);
      queryClient.invalidateQueries({ queryKey: ["agentes"] });
    }
    setDeleteAgentName(null);
  };

  const handleRenameAgent = async () => {
    if (!editAgent) return;
    const newName = editAgent.newName.trim();
    const oldName = editAgent.oldName;
    if (!newName || newName === oldName) {
      setEditAgent(null);
      return;
    }
    if (agentNames.some((a) => a.toLowerCase() === newName.toLowerCase() && a !== oldName)) {
      toast.error("Ya existe un agente con ese nombre");
      return;
    }
    setRenamingAgent(true);
    try {
      // Update all related tables to keep data in sync
      const [agentesRes, polizasRes, goalsRes, profilesRes] = await Promise.all([
        supabase.from("agentes").update({ nombre: newName }).eq("nombre", oldName),
        supabase.from("polizas").update({ agente: newName }).eq("agente", oldName),
        supabase.from("agent_goals").update({ agente: newName }).eq("agente", oldName),
        supabase.from("agent_profiles").update({ agente: newName }).eq("agente", oldName),
      ]);
      const err = agentesRes.error || polizasRes.error || goalsRes.error || profilesRes.error;
      if (err) throw err;
      toast.success(`Agente renombrado a "${newName}"`);
      queryClient.invalidateQueries({ queryKey: ["agentes"] });
      queryClient.invalidateQueries({ queryKey: ["agent_goals"] });
      queryClient.invalidateQueries({ queryKey: ["agent_profiles"] });
      queryClient.invalidateQueries({ queryKey: ["polizas"] });
      setEditAgent(null);
    } catch (e: any) {
      toast.error("Error al renombrar: " + (e.message || "desconocido"));
    } finally {
      setRenamingAgent(false);
    }
  };

  const monthLabel = (() => {
    const [y, m] = selectedMonth.split("-");
    const date = new Date(parseInt(y), parseInt(m) - 1);
    return date.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  })();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Target className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Metas y Fotos de Agentes</h2>
            <p className="text-sm text-muted-foreground capitalize">{monthLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground">Mes:</Label>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => {
                const [y, m] = selectedMonth.split("-").map(Number);
                const prev = new Date(y, m - 2, 1);
                setSelectedMonth(`${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`);
              }}
            >
              ←
            </Button>
            <span className="px-3 py-2 text-sm font-medium capitalize min-w-[140px] text-center">
              {monthLabel}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => {
                const [y, m] = selectedMonth.split("-").map(Number);
                const next = new Date(y, m, 1);
                setSelectedMonth(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`);
              }}
            >
              →
            </Button>
          </div>
          <Button onClick={() => setAddOpen(true)} size="sm" className="gap-1">
            <UserPlus className="w-4 h-4" />
            Agregar Agente
          </Button>
        </div>
      </div>

      {/* Team Goal */}
      <div className="border border-border rounded-lg p-4 bg-card flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-foreground">Meta del Equipo</p>
          <p className="text-xs text-muted-foreground capitalize">{monthLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Meta $</span>
          <Input
            type="number"
            placeholder="0"
            value={teamGoalValue}
            onChange={(e) => setTeamGoalValue(e.target.value)}
            className="h-8 text-sm w-32"
          />
        </div>
      </div>

      {/* Investment Goal */}
      <div className="border border-border rounded-lg p-4 bg-card flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
          <Target className="w-5 h-5 text-gold" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-foreground">Meta de Inversión</p>
          <p className="text-xs text-muted-foreground capitalize">{monthLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Meta $</span>
          <Input
            type="number"
            placeholder="0"
            value={investmentGoalValue}
            onChange={(e) => setInvestmentGoalValue(e.target.value)}
            className="h-8 text-sm w-32"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {agentNames.map((agent) => {
          const avatarUrl = getAvatar(agent);
          return (
            <div
              key={agent}
              className="border border-border rounded-lg p-4 flex items-center gap-4 bg-card"
            >
              {/* Avatar */}
              <div className="relative group">
                <Avatar className="w-14 h-14">
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} alt={agent} />
                  ) : null}
                  <AvatarFallback className="text-sm font-bold bg-primary/10 text-primary">
                    {agent.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  {uploadingAgent === agent ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-5 h-5 text-white" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUploadAvatar(agent, f);
                    }}
                  />
                </label>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 space-y-2">
                <p className="font-semibold text-foreground truncate">{agent}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground whitespace-nowrap w-16">Meta $</span>
                  <Input
                    type="number"
                    placeholder="0"
                    value={goals[agent] || ""}
                    onChange={(e) => setGoals((prev) => ({ ...prev, [agent]: e.target.value }))}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gold whitespace-nowrap w-16">Meta Inv $</span>
                  <Input
                    type="number"
                    placeholder="0"
                    value={goalsInv[agent] || ""}
                    onChange={(e) => setGoalsInv((prev) => ({ ...prev, [agent]: e.target.value }))}
                    className="h-8 text-sm"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-primary h-8 w-8"
                  onClick={() => setEditAgent({ oldName: agent, newName: agent })}
                  title="Editar nombre"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive h-8 w-8"
                  onClick={() => setDeleteAgentName(agent)}
                  title="Eliminar agente"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSaveGoals} disabled={saving} className="gap-2">
          <Save className="w-4 h-4" />
          {saving ? "Guardando..." : "Guardar Metas"}
        </Button>
      </div>

      {/* Add Agent Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Agente</DialogTitle>
            <DialogDescription>Ingresa el nombre del nuevo agente.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleAddAgent(); }} className="space-y-4">
            <Input
              placeholder="Nombre del agente"
              value={newAgentName}
              onChange={(e) => setNewAgentName(e.target.value)}
              autoFocus
            />
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setAddOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={addingAgent || !newAgentName.trim()}>
                {addingAgent ? "Agregando..." : "Agregar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Agent Name Dialog */}
      <Dialog open={!!editAgent} onOpenChange={(open) => !open && setEditAgent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar nombre del agente</DialogTitle>
            <DialogDescription>
              Esto actualizará el nombre en toda la plataforma: pólizas, metas, fotos y la lista para agregar cierres.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleRenameAgent(); }} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Nombre actual</Label>
              <Input value={editAgent?.oldName ?? ""} disabled />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Nuevo nombre</Label>
              <Input
                placeholder="Nuevo nombre del agente"
                value={editAgent?.newName ?? ""}
                onChange={(e) => setEditAgent((prev) => prev ? { ...prev, newName: e.target.value } : prev)}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setEditAgent(null)}>Cancelar</Button>
              <Button
                type="submit"
                disabled={
                  renamingAgent ||
                  !editAgent?.newName.trim() ||
                  editAgent?.newName.trim() === editAgent?.oldName
                }
              >
                {renamingAgent ? "Guardando..." : "Guardar cambios"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteAgentName} onOpenChange={(open) => !open && setDeleteAgentName(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar a {deleteAgentName}?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará el agente de la lista. Sus pólizas y metas existentes no se borrarán.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAgent} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
