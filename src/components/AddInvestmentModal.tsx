import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { startOfWeekMonday, toDateOnlyString, formatCurrency } from "@/lib/data";

interface AddInvestmentModalProps {
  onSuccess: () => void;
}

const SOURCES = [
  { key: "60_second", label: "60 Second" },
  { key: "fj_call", label: "F&J Call" },
  { key: "leads_propios", label: "Leads Propios" },
] as const;

type SourceKey = typeof SOURCES[number]["key"];

export function AddInvestmentModal({ onSuccess }: AddInvestmentModalProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { data: agentes = [] } = useQuery({
    queryKey: ["agentes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("agentes").select("*").order("nombre");
      if (error) throw error;
      return data as { nombre: string }[];
    },
  });

  const [agente, setAgente] = useState("");
  const [enabled, setEnabled] = useState<Record<SourceKey, boolean>>({
    "60_second": false, fj_call: false, leads_propios: false,
  });
  const [montos, setMontos] = useState<Record<SourceKey, string>>({
    "60_second": "", fj_call: "", leads_propios: "",
  });
  const [pcts, setPcts] = useState<Record<SourceKey, string>>({
    "60_second": "", fj_call: "", leads_propios: "",
  });
  const [leadsRecibidosBy, setLeadsRecibidosBy] = useState<Record<SourceKey, string>>({
    "60_second": "", fj_call: "", leads_propios: "",
  });
  const [leadsCerradosBy, setLeadsCerradosBy] = useState<Record<SourceKey, string>>({
    "60_second": "", fj_call: "", leads_propios: "",
  });

  // Calcular semana anterior (lunes de la semana pasada respecto a hoy)
  const targetWeek = useMemo(() => {
    const thisMonday = startOfWeekMonday(new Date());
    const lastMonday = new Date(thisMonday);
    lastMonday.setDate(thisMonday.getDate() - 7);
    return lastMonday;
  }, [open]);

  const weekLabel = useMemo(() => {
    const end = new Date(targetWeek);
    end.setDate(targetWeek.getDate() + 6);
    const fmt = (d: Date) =>
      d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
    return `${fmt(targetWeek)} – ${fmt(end)}`;
  }, [targetWeek]);

  const totalInversion = useMemo(() => {
    return SOURCES.reduce((sum, s) => {
      if (!enabled[s.key]) return sum;
      const v = parseFloat(montos[s.key]);
      return sum + (isNaN(v) ? 0 : v);
    }, 0);
  }, [enabled, montos]);

  const isValid = useMemo(() => {
    if (!agente) return false;
    const anySource = SOURCES.some((s) => enabled[s.key]);
    if (!anySource) return false;
    // Cada fuente activa requiere monto > 0
    for (const s of SOURCES) {
      if (enabled[s.key]) {
        const v = parseFloat(montos[s.key]);
        if (isNaN(v) || v <= 0) return false;
      }
    }
    return true;
  }, [agente, enabled, montos]);

  const resetForm = () => {
    setAgente("");
    setEnabled({ "60_second": false, fj_call: false, leads_propios: false });
    setMontos({ "60_second": "", fj_call: "", leads_propios: "" });
    setPcts({ "60_second": "", fj_call: "", leads_propios: "" });
    setLeadsRecibidosBy({ "60_second": "", fj_call: "", leads_propios: "" });
    setLeadsCerradosBy({ "60_second": "", fj_call: "", leads_propios: "" });
  };

  const num = (v: string) => {
    const n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  };

  const handleSubmit = async () => {
    if (!isValid) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("agent_investments").insert({
        agente,
        semana: toDateOnlyString(targetWeek),
        inv_60_second: enabled["60_second"] ? num(montos["60_second"]) : 0,
        inv_fj_call: enabled["fj_call"] ? num(montos["fj_call"]) : 0,
        inv_leads_propios: enabled["leads_propios"] ? num(montos["leads_propios"]) : 0,
        leads_recibidos_60_second: enabled["60_second"] ? (parseInt(leadsRecibidosBy["60_second"]) || 0) : 0,
        leads_cerrados_60_second: enabled["60_second"] ? (parseInt(leadsCerradosBy["60_second"]) || 0) : 0,
        leads_recibidos_fj_call: enabled["fj_call"] ? (parseInt(leadsRecibidosBy["fj_call"]) || 0) : 0,
        leads_cerrados_fj_call: enabled["fj_call"] ? (parseInt(leadsCerradosBy["fj_call"]) || 0) : 0,
        leads_recibidos_leads_propios: enabled["leads_propios"] ? (parseInt(leadsRecibidosBy["leads_propios"]) || 0) : 0,
        leads_cerrados_leads_propios: enabled["leads_propios"] ? (parseInt(leadsCerradosBy["leads_propios"]) || 0) : 0,
        leads_recibidos: SOURCES.reduce((s, src) => s + (enabled[src.key] ? (parseInt(leadsRecibidosBy[src.key]) || 0) : 0), 0),
        leads_cerrados: SOURCES.reduce((s, src) => s + (enabled[src.key] ? (parseInt(leadsCerradosBy[src.key]) || 0) : 0), 0),
        pct_cierre_60_second: enabled["60_second"] ? num(pcts["60_second"]) : 0,
        pct_cierre_fj_call: enabled["fj_call"] ? num(pcts["fj_call"]) : 0,
        pct_cierre_leads_propios: enabled["leads_propios"] ? num(pcts["leads_propios"]) : 0,
      });
      if (error) throw error;
      toast.success(`Inversión de ${formatCurrency(totalInversion)} registrada`);
      resetForm();
      setOpen(false);
      onSuccess();
    } catch (e) {
      console.error(e);
      toast.error("Error al guardar la inversión");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2 text-sm">
          <TrendingUp className="w-4 h-4" />
          Agregar Inversión
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar Inversión Semanal</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="rounded-lg border border-border bg-secondary/40 px-3 py-2 text-xs">
            <div className="text-muted-foreground">Se registrará para la semana:</div>
            <div className="font-semibold text-foreground">{weekLabel}</div>
          </div>

          {/* Agente */}
          <div className="space-y-2">
            <Label>Agente</Label>
            <Select value={agente} onValueChange={setAgente}>
              <SelectTrigger><SelectValue placeholder="Seleccionar agente" /></SelectTrigger>
              <SelectContent>
                {agentes.map((a) => (
                  <SelectItem key={a.nombre} value={a.nombre}>{a.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>¿Cuánto invertiste?</Label>
            {SOURCES.map((s) => (
              <div key={s.key} className="rounded-lg border border-border p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`src-${s.key}`}
                    checked={enabled[s.key]}
                    onCheckedChange={(v) =>
                      setEnabled((prev) => ({ ...prev, [s.key]: !!v }))
                    }
                  />
                  <label htmlFor={`src-${s.key}`} className="text-sm font-medium cursor-pointer">
                    {s.label}
                  </label>
                </div>
                {enabled[s.key] && (
                  <div className="grid grid-cols-2 gap-2 pl-6">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Monto ($)</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={montos[s.key]}
                        onChange={(e) =>
                          setMontos((prev) => ({ ...prev, [s.key]: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">% Cierre</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={pcts[s.key]}
                        onChange={(e) =>
                          setPcts((prev) => ({ ...prev, [s.key]: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Leads recibidos</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={leadsRecibidosBy[s.key]}
                        onChange={(e) =>
                          setLeadsRecibidosBy((prev) => ({ ...prev, [s.key]: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Leads cerrados</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={leadsCerradosBy[s.key]}
                        onChange={(e) =>
                          setLeadsCerradosBy((prev) => ({ ...prev, [s.key]: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
            <span className="text-sm text-muted-foreground">Total inversión</span>
            <span className="font-mono font-bold text-primary">{formatCurrency(totalInversion)}</span>
          </div>

          <Button onClick={handleSubmit} disabled={!isValid || submitting} className="w-full">
            {submitting ? "Guardando..." : "Guardar Inversión"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
