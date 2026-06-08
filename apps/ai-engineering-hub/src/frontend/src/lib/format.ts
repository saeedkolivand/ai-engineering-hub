export const num = (n: number | null | undefined): string =>
  n == null ? "—" : new Intl.NumberFormat().format(Math.round(n));

export const pct = (n: number | null | undefined): string =>
  n == null ? "—" : `${n.toFixed(1)}%`;

export const ms = (n: number | null | undefined): string =>
  n == null ? "—" : `${Math.round(n)} ms`;

export const shortTime = (iso?: string | null): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
};
