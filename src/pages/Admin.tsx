import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Poliza, formatCurrency, localDateString, toDateOnlyString } from "@/lib/data";
import { toast } from "sonner";
import { Lock, Pencil, Trash2, Search, ArrowLeft, Download, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminAgentManager } from "@/components/AdminAgentManager";
import { AdminAddClosing } from "@/components/AdminAddClosing";
import { AdminTeamManager } from "@/components/AdminTeamManager";
import { AdminInvestments } from "@/components/AdminInvestments";

export default function Admin() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [searchClient, setSearchClient] = useState("");
  const [filterAgent, setFilterAgent] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [dateTo, setDateTo] = useState<Date | undefined>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0);
  });

  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editPoliza, setEditPoliza] = useState<Poliza | null>(null);
  const [editMonto, setEditMonto] = useState("");
  const [editAgente, setEditAgente] = useState("");
  const [editCliente, setEditCliente] = useState("");
  const [editEmpresa, setEditEmpresa] = useState("");
  const [editTipo, setEditTipo] = useState("");
  const [editFecha, setEditFecha] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deleteOpen, setDeleteOpen] = useState(false);
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
  const AGENTS = agentes.map((a) => a.nombre);

  const { data: polizas = [], isLoading } = useQuery({
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

  const filtered = useMemo(() => {
    return polizas.filter((p) => {
      const matchClient = !searchClient || (p.cliente ?? "").toLowerCase().includes(searchClient.toLowerCase());
      const matchAgent = filterAgent === "all" || p.agente === filterAgent;
      const dateStr = localDateString(p.created_at);
      const matchFrom = !dateFrom || dateStr >= toDateOnlyString(dateFrom);
      const matchTo = !dateTo || dateStr <= toDateOnlyString(dateTo);
      return matchClient && matchAgent && matchFrom && matchTo;
    });
  }, [polizas, searchClient, filterAgent, dateFrom, dateTo]);

  const scoreboardData = useMemo(() => {
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

  const exportScoreboard = () => {
    const header = "Posición,Agente,Total,Pólizas";
    const rows = scoreboardData.map((a, i) =>
      `${i + 1},"${a.agente}",${a.total},${a.polizas}`
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const fromStr = dateFrom ? format(dateFrom, "yyyy-MM-dd") : "inicio";
    const toStr = dateTo ? format(dateTo, "yyyy-MM-dd") : "fin";
    link.href = url;
    link.download = `scoreboard_${fromStr}_${toStr}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Scoreboard exportado");
  };


  const handleLogin = () => {
    if (password === "admin1811") {
      setAuthenticated(true);
    } else {
      toast.error("Contraseña incorrecta");
    }
  };

  const openEdit = (p: Poliza) => {
    setEditPoliza(p);
    setEditMonto(String(p.monto));
    setEditAgente(p.agente);
    setEditCliente(p.cliente ?? "");
    setEditEmpresa(p.empresa ?? "");
    setEditTipo(p.tipo_poliza ?? "");
    setEditFecha(localDateString(p.created_at));
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editPoliza) return;
    setSaving(true);
    const { error } = await supabase
      .from("polizas")
      .update({
        monto: parseFloat(editMonto),
        agente: editAgente,
        cliente: editCliente || null,
        empresa: editEmpresa || null,
        tipo_poliza: editTipo || null,
        created_at: new Date(editFecha + "T12:00:00").toISOString(),
      })
      .eq("id", editPoliza.id);

    setSaving(false);
    if (error) {
      toast.error("Error al guardar: " + error.message);
    } else {
      toast.success("Cambios guardados con éxito");
      setEditOpen(false);
      queryClient.invalidateQueries({ queryKey: ["polizas"] });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("polizas").delete().eq("id", deleteId);
    if (error) {
      toast.error("Error al eliminar: " + error.message);
    } else {
      toast.success("Registro eliminado con éxito");
      queryClient.invalidateQueries({ queryKey: ["polizas"] });
    }
    setDeleteOpen(false);
    setDeleteId(null);
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Panel Admin</h1>
          <p className="text-muted-foreground text-sm">Ingresa la contraseña para continuar</p>
          <form
            onSubmit={(e) => { e.preventDefault(); handleLogin(); }}
            className="space-y-4"
          >
            <Input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="text-center"
            />
            <Button type="submit" className="w-full">Acceder</Button>
          </form>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Volver al dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Panel de Administración</h1>
            <p className="text-sm text-muted-foreground">{filtered.length} registros</p>
          </div>
          <Link to="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="polizas" className="space-y-6">
          <TabsList>
            <TabsTrigger value="polizas">Pólizas</TabsTrigger>
            <TabsTrigger value="cierres">Agregar Cierre</TabsTrigger>
            <TabsTrigger value="inversiones">Inversiones</TabsTrigger>
            <TabsTrigger value="agentes">Metas y Fotos</TabsTrigger>
            <TabsTrigger value="equipos">Equipos</TabsTrigger>
          </TabsList>

          <TabsContent value="polizas" className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por cliente..."
                  value={searchClient}
                  onChange={(e) => setSearchClient(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterAgent} onValueChange={setFilterAgent}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Todos los agentes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los agentes</SelectItem>
                  {AGENTS.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
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
              <Button variant="outline" size="sm" className="gap-2 text-sm h-10" onClick={exportScoreboard}>
                <Download className="w-4 h-4" /> Exportar Scoreboard
              </Button>
            </div>

            {/* Table */}
            {isLoading ? (
              <p className="text-muted-foreground text-center py-10">Cargando...</p>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Agente</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead className="text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="whitespace-nowrap">{localDateString(p.created_at)}</TableCell>
                        <TableCell>{p.agente}</TableCell>
                        <TableCell>{p.cliente ?? "—"}</TableCell>
                        <TableCell>{p.empresa ?? "—"}</TableCell>
                        <TableCell>{p.tipo_poliza ?? "—"}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(p.monto)}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => { setDeleteId(p.id); setDeleteOpen(true); }}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filtered.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No se encontraron registros
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="cierres">
            <AdminAddClosing />
          </TabsContent>

          <TabsContent value="agentes">
            <AdminAgentManager />
          </TabsContent>

          <TabsContent value="inversiones">
            <AdminInvestments />
          </TabsContent>

          <TabsContent value="equipos">
            <AdminTeamManager />
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Póliza</DialogTitle>
            <DialogDescription>Modifica los campos y guarda los cambios.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Input value={editCliente} onChange={(e) => setEditCliente(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Monto</Label>
              <Input type="number" value={editMonto} onChange={(e) => setEditMonto(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Agente</Label>
              <Select value={editAgente} onValueChange={setEditAgente}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AGENTS.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Empresa</Label>
              <Input value={editEmpresa} onChange={(e) => setEditEmpresa(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Producto</Label>
              <Input value={editTipo} onChange={(e) => setEditTipo(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input type="date" value={editFecha} onChange={(e) => setEditFecha(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este registro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El registro se eliminará permanentemente.
            </AlertDialogDescription>
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



