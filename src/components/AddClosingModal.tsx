import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CARRIERS = [
  "Americo", "F&G", "MOO", "NLG", "AMAM", "Transamerica",
  "Corebridge", "Aetna", "Ethos",
];

const PRODUCTS = ["IUL", "FEX", "TERM"];

const US_STATES: { name: string; abbr: string }[] = [
  { name: "Alabama", abbr: "AL" }, { name: "Alaska", abbr: "AK" },
  { name: "Arizona", abbr: "AZ" }, { name: "Arkansas", abbr: "AR" },
  { name: "California", abbr: "CA" }, { name: "Colorado", abbr: "CO" },
  { name: "Connecticut", abbr: "CT" }, { name: "Delaware", abbr: "DE" },
  { name: "Florida", abbr: "FL" }, { name: "Georgia", abbr: "GA" },
  { name: "Hawaii", abbr: "HI" }, { name: "Idaho", abbr: "ID" },
  { name: "Illinois", abbr: "IL" }, { name: "Indiana", abbr: "IN" },
  { name: "Iowa", abbr: "IA" }, { name: "Kansas", abbr: "KS" },
  { name: "Kentucky", abbr: "KY" }, { name: "Louisiana", abbr: "LA" },
  { name: "Maine", abbr: "ME" }, { name: "Maryland", abbr: "MD" },
  { name: "Massachusetts", abbr: "MA" }, { name: "Michigan", abbr: "MI" },
  { name: "Minnesota", abbr: "MN" }, { name: "Mississippi", abbr: "MS" },
  { name: "Missouri", abbr: "MO" }, { name: "Montana", abbr: "MT" },
  { name: "Nebraska", abbr: "NE" }, { name: "Nevada", abbr: "NV" },
  { name: "New Hampshire", abbr: "NH" }, { name: "New Jersey", abbr: "NJ" },
  { name: "New Mexico", abbr: "NM" }, { name: "New York", abbr: "NY" },
  { name: "North Carolina", abbr: "NC" }, { name: "North Dakota", abbr: "ND" },
  { name: "Ohio", abbr: "OH" }, { name: "Oklahoma", abbr: "OK" },
  { name: "Oregon", abbr: "OR" }, { name: "Pennsylvania", abbr: "PA" },
  { name: "Rhode Island", abbr: "RI" }, { name: "South Carolina", abbr: "SC" },
  { name: "South Dakota", abbr: "SD" }, { name: "Tennessee", abbr: "TN" },
  { name: "Texas", abbr: "TX" }, { name: "Utah", abbr: "UT" },
  { name: "Vermont", abbr: "VT" }, { name: "Virginia", abbr: "VA" },
  { name: "Washington", abbr: "WA" }, { name: "West Virginia", abbr: "WV" },
  { name: "Wisconsin", abbr: "WI" }, { name: "Wyoming", abbr: "WY" },
];

interface AddClosingModalProps {
  onSuccess: () => void;
}

export function AddClosingModal({ onSuccess }: AddClosingModalProps) {
  const [open, setOpen] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const messageRef = useRef<HTMLInputElement>(null);
  const { data: agentes = [] } = useQuery({
    queryKey: ["agentes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("agentes").select("*").order("nombre");
      if (error) throw error;
      return data;
    },
  });
  const AGENTS = agentes.map((a) => a.nombre);
  const [cliente, setCliente] = useState("");
  const [monto, setMonto] = useState("");
  const [agente, setAgente] = useState("");
  const [carrier, setCarrier] = useState("");
  const [fechaCobro, setFechaCobro] = useState("");
  const [fechaCobroType, setFechaCobroType] = useState<"date" | "upon">("date");
  const [producto, setProducto] = useState("");
  const [estado, setEstado] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setCliente("");
    setMonto("");
    setAgente("");
    setCarrier("");
    setFechaCobro("");
    setFechaCobroType("date");
    setProducto("");
    setEstado("");
  };

  const isValid =
    cliente.trim() && monto.trim() && agente && carrier && producto && estado &&
    (fechaCobroType === "upon" || fechaCobro.trim());

  const handleSubmit = async () => {
    if (!isValid) return;
    setSubmitting(true);

    const now = new Date();
    const stateAbbr = US_STATES.find((s) => s.name === estado)?.abbr || estado;
    const cobroText = fechaCobroType === "upon" ? "Upon Issue" : fechaCobro;

    // Ajuste 1: Se eliminó el toLocaleString para evitar la coma en el monto
    const cleanMonto = Math.floor(parseFloat(monto)).toString();
    const message = `$${cleanMonto} ${carrier} ${producto} ${cobroText} ${stateAbbr} (${cliente.trim()})`;

    try {
      const { error } = await supabase.from("polizas").insert({
        agente,
        monto: parseFloat(monto),
        empresa: carrier,
        tipo_poliza: producto,
        cliente: cliente.trim(),
        created_at: now.toISOString(),
      });

      if (error) throw error;

      // Try clipboard, but always show message dialog as fallback
      let copied = false;
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(message);
          copied = true;
        }
      } catch {
        copied = false;
      }

      if (copied) {
        toast.success("Cierre agregado y mensaje copiado al portapapeles");
        resetForm();
        setOpen(false);
        onSuccess();
      } else {
        // Show message in a dedicated dialog so user can copy it
        setGeneratedMessage(message);
        setShowMessage(true);
        setCopySuccess(false);
        resetForm();
        setOpen(false);
        onSuccess();
      }
    } catch (e) {
      console.error(e);
      toast.error("Error al agregar el cierre");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyMessage = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(generatedMessage);
        setCopySuccess(true);
        return;
      }
    } catch { /* fallback below */ }

    // Fallback: select text in the input so user can manually copy
    if (messageRef.current) {
      messageRef.current.select();
      messageRef.current.setSelectionRange(0, 99999);
      try {
        document.execCommand("copy");
        setCopySuccess(true);
      } catch {
        toast.info("Selecciona el texto y cópialo manualmente");
      }
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2 text-sm">
          <Plus className="w-4 h-4" />
          Agregar Cierre
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar Cierre Manual</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Cliente */}
          <div className="space-y-2">
            <Label>Nombre del Cliente</Label>
            <Input placeholder="Ej: Jose Arroyo" value={cliente} onChange={(e) => setCliente(e.target.value)} />
          </div>

          {/* Monto */}
          <div className="space-y-2">
            <Label>Monto ($)</Label>
            <Input type="number" placeholder="Ej: 1800" value={monto} onChange={(e) => setMonto(e.target.value)} />
          </div>

          {/* Agente */}
          <div className="space-y-2">
            <Label>Agente</Label>
            <Select value={agente} onValueChange={setAgente}>
              <SelectTrigger><SelectValue placeholder="Seleccionar agente" /></SelectTrigger>
              <SelectContent>
                {AGENTS.map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Carrier */}
          <div className="space-y-2">
            <Label>Carrier</Label>
            <Select value={carrier} onValueChange={setCarrier}>
              <SelectTrigger><SelectValue placeholder="Seleccionar carrier" /></SelectTrigger>
              <SelectContent>
                {CARRIERS.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fecha de Cobro */}
          <div className="space-y-2">
            <Label>Fecha de Cobro</Label>
            <div className="flex gap-2">
              <Select value={fechaCobroType} onValueChange={(v) => setFechaCobroType(v as "date" | "upon")}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Fecha (MM/DD)</SelectItem>
                  <SelectItem value="upon">Upon Issue</SelectItem>
                </SelectContent>
              </Select>
              {fechaCobroType === "date" && (
                <Input placeholder="MM/DD ej: 04/24" value={fechaCobro} onChange={(e) => setFechaCobro(e.target.value)} />
              )}
            </div>
          </div>

          {/* Producto */}
          <div className="space-y-2">
            <Label>Producto</Label>
            <Select value={producto} onValueChange={setProducto}>
              <SelectTrigger><SelectValue placeholder="Seleccionar producto" /></SelectTrigger>
              <SelectContent>
                {PRODUCTS.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Estado */}
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select value={estado} onValueChange={setEstado}>
              <SelectTrigger><SelectValue placeholder="Seleccionar estado" /></SelectTrigger>
              <SelectContent>
                {US_STATES.map((s) => (
                  <SelectItem key={s.abbr} value={s.name}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Submit */}
          <Button onClick={handleSubmit} disabled={!isValid || submitting} className="w-full mt-2">
            {submitting ? "Guardando..." : "Submit / Copiar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

      {/* Message copy dialog - shown when clipboard API fails */}
      <Dialog open={showMessage} onOpenChange={setShowMessage}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>✅ Cierre agregado</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Copia el mensaje para compartirlo:
          </p>
          <div className="flex items-center gap-2">
            <Input
              ref={messageRef}
              readOnly
              value={generatedMessage}
              className="font-mono text-sm"
              onFocus={(e) => e.target.select()}
            />
            <Button size="icon" variant="outline" onClick={handleCopyMessage}>
              {copySuccess ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          {copySuccess && (
            <p className="text-sm text-primary font-medium">¡Copiado!</p>
          )}
          <p className="text-xs text-muted-foreground">
            Si el botón no funciona, mantén presionado el texto para seleccionarlo y cópialo manualmente.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}

