import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, Plus, Trash2, Pencil, Save, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Equipo {
  id: string;
  nombre: string;
  color: string | null;
}

interface AgentTeam {
  id: string;
  agente: string;
  equipo_id: string;
}

interface TeamMeta {
  id: string;
  equipo_id: string;
  mes: string;
  meta: number;
}

const TEAM_COLORS = [
  { value: "#3b82f6", label: "Azul" },
  { value: "#10b981", label: "Verde" },
  { value: "#f59e0b", label: "Ámbar" },
  { value: "#ef4444", label: "Rojo" },
  { value: "#8b5cf6", label: "Violeta" },
  { value: "#ec4899", label: "Rosa" },
  { value: "#06b6d4", label: "Cian" },
  { value: "#f97316", label: "Naranja" },
];

export function AdminTeamManager() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  );
  const [addOpen, setAddOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamColor, setNewTeamColor] = useState(TEAM_COLORS[0].value);
  const [editTeam, setEditTeam] = useState<Equipo | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [deleteTeamId, setDeleteTeamId] = useState<string | null>(null);
  const [metas, setMetas] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const { data: equipos = [] } = useQuery({
    queryKey: ["equipos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("equipos").select("*").order("nombre");
      if (error) throw error;
      return data as Equipo[];
    },
  });

  const { data: agentes = [] } = useQuery({
    queryKey: ["agentes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("agentes").select("*").order("nombre");
      if (error) throw error;
      return data as { id: string; nombre: string }[];
    },
  });

  const { data: agentTeams = [] } = useQuery({
    queryKey: ["agent_teams"],
    queryFn: async () => {
      const { data, error } = await supabase.from("agent_teams").select("*");
      if (error) throw error;
      return data as AgentTeam[];
    },
  });

  const { data: teamMetas = [] } = useQuery({
    queryKey: ["team_metas", selectedMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_metas")
        .select("*")
        .eq("mes", selectedMonth);
      if (error) throw error;
      return data as TeamMeta[];
    },
  });

  useEffect(() => {
    const map: Record<string, string> = {};
    for (const m of teamMetas) map[m.equipo_id] = String(m.meta);
    setMetas(map);
  }, [teamMetas]);

  const teamByAgent = useMemo(() => {
    const m = new Map<string, string>();
    for (const at of agentTeams) m.set(at.agente, at.equipo_id);
    return m;
  }, [agentTeams]);

  const monthLabel = useMemo(() => {
    const [y, m] = selectedMonth.split("-");
    return new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  }, [selectedMonth]);

  const handleAddTeam = async () => {
    const name = newTeamName.trim();
    if (!name) return;
    if (equipos.some((e) => e.nombre.toLowerCase() === name.toLowerCase())) {
      toast.error("Ese equipo ya existe");
      return;
    }
    const { error } = await supabase.from("equipos").insert({ nombre: name, color: newTeamColor });
    if (error) {
      toast.error("Error al crear equipo: " + error.message);
    } else {
      toast.success(`Equipo "${name}" creado`);
      setNewTeamName("");
      setAddOpen(false);
      queryClient.invalidateQueries({ queryKey: ["equipos"] });
    }
  };

  const handleEditTeam = async () => {
    if (!editTeam) return;
    const name = editName.trim();
    if (!name) return;
    const { error } = await supabase
      .from("equipos")
      .update({ nombre: name, color: editColor })
      .eq("id", editTeam.id);
    if (error) {
      toast.error("Error al editar: " + error.message);
    } else {
      toast.success("Equipo actualizado");
      setEditTeam(null);
      queryClient.invalidateQueries({ queryKey: ["equipos"] });
    }
  };

  const handleDeleteTeam = async () => {
    if (!deleteTeamId) return;
    const { error } = await supabase.from("equipos").delete().eq("id", deleteTeamId);
    if (error) {
      toast.error("Error al eliminar: " + error.message);
    } else {
      toast.success("Equipo eliminado");
      queryClient.invalidateQueries({ queryKey: ["equipos"] });
      queryClient.invalidateQueries({ queryKey: ["agent_teams"] });
      queryClient.invalidateQueries({ queryKey: ["team_metas"] });
    }
    setDeleteTeamId(null);
  };

  const handleAssignAgent = async (agente: string, equipoId: string) => {
    const existing = agentTeams.find((at) => at.agente === agente);
    if (equipoId === "none") {
      if (existing) {
        const { error } = await supabase.from("agent_teams").delete().eq("id", existing.id);
        if (error) {
          toast.error("Error: " + error.message);
          return;
        }
      }
    } else if (existing) {
      const { error } = await supabase
        .from("agent_teams")
        .update({ equipo_id: equipoId })
        .eq("id", existing.id);
      if (error) {
        toast.error("Error: " + error.message);
        return;
      }
    } else {
      const { error } = await supabase
        .from("agent_teams")
        .insert({ agente, equipo_id: equipoId });
      if (error) {
        toast.error("Error: " + error.message);
        return;
      }
    }
    toast.success(`${agente} asignado`);
    queryClient.invalidateQueries({ queryKey: ["agent_teams"] });
  };

  const handleSaveMetas = async () => {
    setSaving(true);
    try {
      for (const equipo of equipos) {
        const raw = metas[equipo.id] || "";
        const val = parseFloat(raw);
        const existing = teamMetas.find((m) => m.equipo_id === equipo.id);
        if (!raw || isNaN(val) || val <= 0) {
          if (existing) await supabase.from("team_metas").delete().eq("id", existing.id);
          continue;
        }
        if (existing) {
          await supabase.from("team_metas").update({ meta: val }).eq("id", existing.id);
        } else {
          await supabase.from("team_metas").insert({ equipo_id: equipo.id, mes: selectedMonth, meta: val });
        }
      }
      toast.success("Metas guardadas");
      queryClient.invalidateQueries({ queryKey: ["team_metas"] });
    } catch (e: any) {
      toast.error("Error al guardar: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Gestión de Equipos</h2>
            <p className="text-sm text-muted-foreground">Crea equipos, asigna agentes y define metas</p>
          </div>
        </div>
        <Button onClick={() => setAddOpen(true)} size="sm" className="gap-1">
          <Plus className="w-4 h-4" /> Crear Equipo
        </Button>
      </div>

      {/* Equipos & Metas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Metas por Equipo</h3>
          </div>
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
            <span className="px-3 py-2 text-sm font-medium capitalize min-w-[140px] text-center">{monthLabel}</span>
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
        </div>

        {equipos.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6 border border-dashed border-border rounded-lg">
            Aún no hay equipos. Crea uno para empezar.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {equipos.map((equipo) => {
              const memberCount = agentTeams.filter((at) => at.equipo_id === equipo.id).length;
              return (
                <div key={equipo.id} className="border border-border rounded-lg p-4 bg-card flex items-center gap-3">
                  <div
                    className="w-3 h-12 rounded-full shrink-0"
                    style={{ backgroundColor: equipo.color || "hsl(var(--muted-foreground))" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{equipo.nombre}</p>
                    <p className="text-xs text-muted-foreground">{memberCount} {memberCount === 1 ? "agente" : "agentes"}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">Meta $</span>
                      <Input
                        type="number"
                        placeholder="0"
                        value={metas[equipo.id] || ""}
                        onChange={(e) => setMetas((p) => ({ ...p, [equipo.id]: e.target.value }))}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-primary h-8 w-8"
                      onClick={() => {
                        setEditTeam(equipo);
                        setEditName(equipo.nombre);
                        setEditColor(equipo.color || TEAM_COLORS[0].value);
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive h-8 w-8"
                      onClick={() => setDeleteTeamId(equipo.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {equipos.length > 0 && (
          <div className="flex justify-end">
            <Button onClick={handleSaveMetas} disabled={saving} className="gap-2">
              <Save className="w-4 h-4" />
              {saving ? "Guardando..." : "Guardar Metas"}
            </Button>
          </div>
        )}
      </div>

      {/* Asignación de agentes */}
      {equipos.length > 0 && agentes.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">Asignar Agentes a Equipos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {agentes.map((agent) => {
              const equipoId = teamByAgent.get(agent.nombre) || "none";
              const equipo = equipos.find((e) => e.id === equipoId);
              return (
                <div key={agent.id} className="border border-border rounded-lg p-3 bg-card flex items-center gap-3">
                  {equipo && (
                    <div
                      className="w-2 h-10 rounded-full shrink-0"
                      style={{ backgroundColor: equipo.color || "hsl(var(--muted-foreground))" }}
                    />
                  )}
                  <span className="flex-1 font-medium text-foreground truncate">{agent.nombre}</span>
                  <Select
                    value={equipoId}
                    onValueChange={(v) => handleAssignAgent(agent.nombre, v)}
                  >
                    <SelectTrigger className="w-[180px] h-9">
                      <SelectValue placeholder="Sin equipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin equipo</SelectItem>
                      {equipos.map((e) => (
                        <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Team Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Equipo</DialogTitle>
            <DialogDescription>Por ejemplo: "Equipo Caracas", "Equipo Valencia".</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleAddTeam(); }} className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre del equipo</Label>
              <Input
                placeholder="Equipo Caracas"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Color identificador</Label>
              <div className="flex flex-wrap gap-2">
                {TEAM_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setNewTeamColor(c.value)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform ${newTeamColor === c.value ? "border-foreground scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setAddOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={!newTeamName.trim()}>Crear</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Team Dialog */}
      <Dialog open={!!editTeam} onOpenChange={(open) => !open && setEditTeam(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Equipo</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleEditTeam(); }} className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {TEAM_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setEditColor(c.value)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform ${editColor === c.value ? "border-foreground scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setEditTeam(null)}>Cancelar</Button>
              <Button type="submit" disabled={!editName.trim()}>Guardar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTeamId} onOpenChange={(open) => !open && setDeleteTeamId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este equipo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esto quitará la asignación de los agentes y eliminará las metas del equipo. Las pólizas no se ven afectadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTeam} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
