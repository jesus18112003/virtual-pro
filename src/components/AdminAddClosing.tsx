import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ClipboardPaste, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const KNOWN_CARRIERS: Record<string, string> = {
  amam: "AMAM",
  moo: "MOO",
  americo: "Americo",
  américo: "Americo",
  ame: "Americo",
  AME: "Americo",
  nl: "NL",
  nlg: "NL",
  "national life": "NL",
  ethos: "Ethos",
  "f&g": "F&G",
  fg: "F&G",
  "f & g": "F&G",
  transamerica: "Transamerica",
  corebridge: "Corebridge",
  aetna: "Aetna",
  mutual: "Mutual",
};

const KNOWN_PRODUCTS: Record<string, string> = {
  iul: "IUL",
  fex: "FEX",
  term: "TERM",
  gi: "GI",
};

function parseClosingMessage(msg: string) {
  const result: {
    monto: number | null;
    carrier: string | null;
    producto: string | null;
    formaPago: string | null;
    cliente: string | null;
    estado: string | null;
  } = { monto: null, carrier: null, producto: null, formaPago: null, cliente: null, estado: null };

  // Extract amount: $1,200 or $1200
  const montoMatch = msg.match(/\$[\d,]+(?:\.\d+)?/);
  if (montoMatch) {
    result.monto = parseFloat(montoMatch[0].replace(/[$,]/g, ""));
  }

  // Extract client name from parentheses
  const clientMatch = msg.match(/\(([^)]+)\)/);
  if (clientMatch) {
    result.cliente = clientMatch[1].trim();
  }

  // Normalize for keyword matching - remove amount and client
  const cleaned = msg
    .replace(/\$[\d,]+(?:\.\d+)?/, "")
    .replace(/\([^)]*\)/, "")
    .trim();

  const words = cleaned.split(/\s+/);

  // Extract carrier
  for (let i = 0; i < words.length; i++) {
    const w = words[i].toLowerCase().replace(/[^a-záéíóúñ&]/gi, "");
    // Check two-word combos first
    if (i < words.length - 1) {
      const twoWord = `${w} ${words[i + 1].toLowerCase().replace(/[^a-záéíóúñ&]/gi, "")}`;
      if (KNOWN_CARRIERS[twoWord]) {
        result.carrier = KNOWN_CARRIERS[twoWord];
        break;
      }
    }
    if (KNOWN_CARRIERS[w]) {
      result.carrier = KNOWN_CARRIERS[w];
      break;
    }
  }

  // Extract product
  for (const w of words) {
    const lower = w.toLowerCase().replace(/[^a-z]/g, "");
    if (KNOWN_PRODUCTS[lower]) {
      result.producto = KNOWN_PRODUCTS[lower];
      break;
    }
  }

  // Extract forma de pago (Upon Issue)
  if (/upon\s*issue/i.test(msg)) {
    result.formaPago = "Upon Issue";
  }

  // Extract state abbreviation (2 uppercase letters at end or standalone)
  const stateMatch = cleaned.match(/\b([A-Z]{2})\b/);
  if (stateMatch) {
    result.estado = stateMatch[1];
  }

  return result;
}

export function AdminAddClosing() {
  const [message, setMessage] = useState("");
  const [agente, setAgente] = useState("");
  const [parsed, setParsed] = useState<ReturnType<typeof parseClosingMessage> | null>(null);
  const [editMonto, setEditMonto] = useState("");
  const [editCarrier, setEditCarrier] = useState("");
  const [editProducto, setEditProducto] = useState("");
  const [editCliente, setEditCliente] = useState("");
  const [editFormaPago, setEditFormaPago] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const { data: agentes = [] } = useQuery({
    queryKey: ["agentes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("agentes").select("*").order("nombre");
      if (error) throw error;
      return data;
    },
  });

  const handleParse = () => {
    if (!message.trim()) return;
    const result = parseClosingMessage(message);
    setParsed(result);
    setEditMonto(result.monto ? String(result.monto) : "");
    setEditCarrier(result.carrier ?? "");
    setEditProducto(result.producto ?? "");
    setEditCliente(result.cliente ?? "");
    setEditFormaPago(result.formaPago ?? "");
  };

  const handleSubmit = async () => {
    if (!agente || !editMonto) {
      toast.error("Agente y monto son requeridos");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("polizas").insert({
        agente,
        monto: parseFloat(editMonto),
        empresa: editCarrier || null,
        tipo_poliza: editProducto || null,
        forma_pago: editFormaPago || null,
        cliente: editCliente || null,
      });
      if (error) throw error;
      toast.success("Cierre agregado exitosamente");
      setMessage("");
      setAgente("");
      setParsed(null);
      queryClient.invalidateQueries({ queryKey: ["polizas"] });
    } catch (e: any) {
      toast.error("Error al agregar cierre: " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <ClipboardPaste className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Agregar Cierre por Mensaje</h2>
          <p className="text-sm text-muted-foreground">
            Pega el mensaje de cierre y se extraerán los datos automáticamente
          </p>
        </div>
      </div>

      {/* Message input */}
      <div className="space-y-2">
        <Label>Mensaje de cierre</Label>
        <Textarea
          placeholder='Ej: $2400 IUL Américo Upon Issue (Josefa Garcia) Tx'
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
        />
        <Button onClick={handleParse} disabled={!message.trim()} size="sm" className="gap-2">
          <ClipboardPaste className="w-4 h-4" />
          Extraer datos
        </Button>
      </div>

      {parsed && (
        <div className="border border-border rounded-lg p-4 bg-card space-y-4">
          <p className="text-sm font-medium text-foreground">Datos extraídos (editable):</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Agente *</Label>
              <Select value={agente} onValueChange={setAgente}>
                <SelectTrigger><SelectValue placeholder="Seleccionar agente" /></SelectTrigger>
                <SelectContent>
                  {agentes.map((a) => (
                    <SelectItem key={a.id} value={a.nombre}>{a.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Monto ($) *</Label>
              <Input
                type="number"
                value={editMonto}
                onChange={(e) => setEditMonto(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Carrier</Label>
              <Input
                value={editCarrier}
                onChange={(e) => setEditCarrier(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Producto</Label>
              <Input
                value={editProducto}
                onChange={(e) => setEditProducto(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Cliente</Label>
              <Input
                value={editCliente}
                onChange={(e) => setEditCliente(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Forma de Pago</Label>
              <Input
                value={editFormaPago}
                onChange={(e) => setEditFormaPago(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={submitting || !agente || !editMonto} className="gap-2">
              <Send className="w-4 h-4" />
              {submitting ? "Guardando..." : "Guardar Cierre"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
