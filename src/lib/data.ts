export interface Poliza {
  id: string;
  agente: string;
  monto: number;
  created_at: string;
  empresa: string | null;
  tipo_poliza: string | null;
  forma_pago: string | null;
  cliente: string | null;
}

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);
}

/**
 * Convierte un timestamp ISO (UTC) a "YYYY-MM-DD" en la zona horaria LOCAL
 * del navegador. Evita el bug de que un cierre creado de noche aparezca
 * al día siguiente porque su representación UTC ya cambió de día.
 */
export function localDateString(iso: string): string {
  const d = new Date(iso);
  // Caso especial: pólizas históricas guardadas como "fecha pura" a las
  // 00:00:00 UTC. Si las convertimos a hora local se desplazan al día
  // anterior y desaparecen del filtro de su mes real. Para esos casos
  // usamos la fecha en UTC tal cual fue registrada.
  if (
    d.getUTCHours() === 0 &&
    d.getUTCMinutes() === 0 &&
    d.getUTCSeconds() === 0 &&
    d.getUTCMilliseconds() === 0
  ) {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Devuelve el lunes (00:00 local) de la semana de la fecha dada. */
export function startOfWeekMonday(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); // 0 = domingo
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

/** "YYYY-MM-DD" para una Date local (sin desfase UTC). */
export function toDateOnlyString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDaysToDateString(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return toDateOnlyString(date);
}

export function weekOverlapsDateRange(weekStart: string, from?: string | null, to?: string | null): boolean {
  const weekEnd = addDaysToDateString(weekStart, 6);
  if (from && weekEnd < from) return false;
  if (to && weekStart > to) return false;
  return true;
}
