import { Store } from "@tanstack/react-store";

export interface PendingUpdate {
  version: string;
  body: string | null;
  install: () => Promise<void>;
}

export const updateStore = new Store<{
  pending: PendingUpdate | null;
  checking: boolean;
  dismissed: boolean;
  lastChecked: number | null;
  error: string | null;
}>({
  pending: null,
  checking: false,
  dismissed: false,
  lastChecked: null,
  error: null,
});
