import { format } from "date-fns";
import { fr } from "date-fns/locale";

export function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return format(date, "dd MMM yyyy", { locale: fr });
}

export function formatDateTime(d: Date | string | null | undefined) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return format(date, "dd MMM yyyy à HH:mm", { locale: fr });
}

export function formatCurrency(n: number | string | null | undefined) {
  const value = typeof n === "string" ? parseFloat(n) : n ?? 0;
  // Franc CFA (XOF) : pas de décimales, séparateur de milliers "espace"
  return `${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(value)} FCFA`;
}

export function formatNumber(n: number | string | null | undefined) {
  const value = typeof n === "string" ? parseFloat(n) : n ?? 0;
  return new Intl.NumberFormat("fr-FR").format(value);
}
