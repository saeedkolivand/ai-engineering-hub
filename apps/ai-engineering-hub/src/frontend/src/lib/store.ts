import { Store, useStore } from "@tanstack/react-store";

export type SelectionKind =
  | "repository"
  | "session"
  | "task"
  | "agent"
  | "source"
  | null;

export interface Selection {
  kind: SelectionKind;
  id?: string;
  label?: string;
  meta?: Record<string, string | number | null | undefined>;
}

// Domain-oriented selection state powering the Right context panel (drill-down).
export const selectionStore = new Store<Selection>({ kind: null });

export const setSelection = (s: Selection) => selectionStore.setState(() => s);
export const clearSelection = () => selectionStore.setState(() => ({ kind: null }));
export const useSelection = () => useStore(selectionStore);
