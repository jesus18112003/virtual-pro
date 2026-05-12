import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, toDateOnlyString, weekOverlapsDateRange } from "@/lib/data";
import { toast } from "sonner";
import { Download, CalendarIcon, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Investment {
  id: string;
  semana: string;
  agente: string;
  inv_60_second: number;
  inv_fj_call: number;
  inv_leads_propios: number;
  leads_recibidos_60_second: number;
  leads_recibidos_fj_call: number;
  leads_recibidos_leads_propios: number;
  leads_cerrados_60_second: number;
  leads_cerrados_fj_call: number;
  leads_cerrados_leads_propios: number;
  pct_cierre_60_second: number;
  pct_cierre_fj_call: number;
  pct_cierre_leads_propios: number;
}

export function AdminInvestments() {
  const [filterAgent, setFilterAgent] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: agentes = [] } = useQuery({
    queryKey: ["agentes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("agentes").select("*").order("nombre");
      if (error) throw error;
      return data;
    },
  });

  const { data: investments = [], isLoading } = useQuery({
    queryKey: ["agent_investments_admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_investments")
        .select("*")
        .order("semana", { ascending: false });
      if (error) throw error;
      return data as Investment[];
    },
  });

  const filtered = useMemo(() => {
    return investments.filter((r) => {
      const matchAgent = filterAgent === "all" || r.agente === filterAgent;
      const matchDate = weekOverlapsDateRange(
        r.semana,
        dateFrom ? toDateOnlyString(dateFrom) : null,
        dateTo ? toDateOnlyString(dateTo) : null,
      );
      return matchAgent && matchDate;
    });
  }, [investments, filterAgent, dateFrom, dateTo]);

  const totals = useMemo(() => {
    const t = { inv: 0, rec: 0, cer: 0 };
    for (const r of filtered) {
      t.inv += Number(r.inv_60_second || 0) + Number(r.inv_fj_call || 0) + Number(r.inv_leads_propios || 0);
      t.rec += Number(r.leads_recibidos_60_second || 0) + Number(r.leads_recibidos_fj_call || 0) + Number(r.leads_recibidos_leads_propios || 0);
      t.cer += Number(r.leads_cerrados_60_second || 0) + Number(r.leads_cerrados_fj_call || 0) + Number(r.leads_cerrados_leads_propios || 0);
    }
    return t;
  }, [filtered]);

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("agent_investments").delete().eq("id", deleteId);
    if (error) {
      toast.error("Error al eliminar: " + error.message);
    } else {
      toast.success("Inversión eliminada");
      queryClient.invalidateQueries({ queryKey: ["agent_investments_admin"] });
      queryClient.invalidateQueries({ queryKey: ["agent_investments"] });
    }
    setDeleteId(null);
  };

  const exportCSV = () => {
    if (filtered.length === 0) {
      toast.error("No hay inversiones para exportar");
      return;
    }
    const header = [
      "Semana", "Agente",
      "Inv 60 Second", "Leads Recibidos 60s", "Leads Cerrados 60s", "% Cierre 60s",
      "Inv F&J Call", "Leads Recibidos F&J", "Leads Cerrados F&J", "% Cierre F&J",
      "Inv Leads Propios", "Leads Recibidos Propios", "Leads Cerrados Propios", "% Cierre Propios",
      "Total Invertido", "Total Leads Recibidos", "Total Leads Cerrados",
    ].join(",");
    const rows = filtered.map((r) => {
      const totalInv = Number(r.inv_60_second || 0) + Number(r.inv_fj_call || 0) + Number(r.inv_leads_propios || 0);
      const totalRec = Number(r.leads_recibidos_60_second || 0) + Number(r.leads_recibidos_fj_call || 0) + Number(r.leads_recibidos_leads_propios || 0);
      const totalCer = Number(r.leads_cerrados_60_second || 0) + Number(r.leads_cerrados_fj_call || 0) + Number(r.leads_cerrados_leads_propios || 0);
      return [
        r.semana, `"${r.agente}"`,
        r.inv_60_second, r.leads_recibidos_60_second, r.leads_cerrados_60_second, r.pct_cierre_60_second,
        r.inv_fj_call, r.leads_recibidos_fj_call, r.leads_cerrados_fj_call, r.pct_cierre_fj_call,
        r.inv_leads_propios, r.leads_recibidos_leads_propios, r.leads_cerrados_leads_propios, r.pct_cierre_leads_propios,
        totalInv, totalRec, totalCer,
      ].join(",");
    });
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const fromStr = dateFrom ? format(dateFrom, "yyyy-MM-dd") : "todo";
    const toStr = dateTo ? format(dateTo, "yyyy-MM-dd") : "todo";
    link.href = url;
    link.download = `inversiones_${fromStr}_${toStr}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`${filtered.length} inversiones exportadas`);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3">
        <Select value={filterAgent} onValueChange={setFilterAgent}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Todos los agentes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los agentes</SelectItem>
            {agentes.map((a) => (
              <SelectItem key={a.nombre} value={a.nombre}>{a.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn("gap-2 text-sm h-10", dateFrom && "text-primary border-primary/40")}>
              <CalendarIcon className="w-4 h-4" />
              {dateFrom ? format(dateFrom, "MMM d, yyyy") : "Desde"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} className="p-3 pointer-events-auto" />
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn("gap-2 text-sm h-10", dateTo && "text-primary border-primary/40")}>
              <CalendarIcon className="w-4 h-4" />
              {dateTo ? format(dateTo, "MMM d, yyyy") : "Hasta"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar mode="single" selected={dateTo} onSelect={setDateTo} className="p-3 pointer-events-auto" />
          </PopoverContent>
        </Popover>
        {(dateFrom || dateTo || filterAgent !== "all") && (
          <Button variant="ghost" size="sm" className="h-10" onClick={() => { setDateFrom(undefined); setDateTo(undefined); setFilterAgent("all"); }}>
            Limpiar filtros
          </Button>
        )}
        <Button variant="outline" size="sm" className="gap-2 text-sm h-10 ml-auto" onClick={exportCSV}>
          <Download className="w-4 h-4" /> Exportar CSV
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="border rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Registros</p>
          <p className="text-xl font-bold">{filtered.length}</p>
        </div>
        <div className="border rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Total Invertido</p>
          <p className="text-xl font-bold">{formatCurrency(totals.inv)}</p>
        </div>
        <div className="border rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Leads Recibidos</p>
          <p className="text-xl font-bold">{totals.rec}</p>
        </div>
        <div className="border rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Leads Cerrados</p>
          <p className="text-xl font-bold">{totals.cer}</p>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <p className="text-muted-foreground text-center py-10">Cargando...</p>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Semana</TableHead>
                <TableHead>Agente</TableHead>
                <TableHead className="text-right">60s Inv</TableHead>
                <TableHead className="text-center">60s Rec/Cer</TableHead>
                <TableHead className="text-right">F&J Inv</TableHead>
                <TableHead className="text-center">F&J Rec/Cer</TableHead>
                <TableHead className="text-right">Propios Inv</TableHead>
                <TableHead className="text-center">Propios Rec/Cer</TableHead>
                <TableHead className="text-right">Total Inv</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => {
                const total = Number(r.inv_60_second || 0) + Number(r.inv_fj_call || 0) + Number(r.inv_leads_propios || 0);
                return (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap">{r.semana}</TableCell>
                    <TableCell>{r.agente}</TableCell>
                    <TableCell className="text-right">{formatCurrency(Number(r.inv_60_second))}</TableCell>
                    <TableCell className="text-center text-xs">{r.leads_recibidos_60_second}/{r.leads_cerrados_60_second}</TableCell>
                    <TableCell className="text-right">{formatCurrency(Number(r.inv_fj_call))}</TableCell>
                    <TableCell className="text-center text-xs">{r.leads_recibidos_fj_call}/{r.leads_cerrados_fj_call}</TableCell>
                    <TableCell className="text-right">{formatCurrency(Number(r.inv_leads_propios))}</TableCell>
                    <TableCell className="text-center text-xs">{r.leads_recibidos_leads_propios}/{r.leads_cerrados_leads_propios}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(total)}</TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(r.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    No se encontraron inversiones
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta inversión?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
