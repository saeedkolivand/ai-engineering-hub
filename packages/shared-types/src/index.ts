export interface Metric {
  id: string;
  type: string;
  value: number | string;
  unit?: string;
  timestamp?: number;
  name?: string;
  status?: string;
  category?: string;
}