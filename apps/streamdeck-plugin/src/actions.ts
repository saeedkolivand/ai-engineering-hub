import {
  action,
  SingletonAction,
  type WillAppearEvent,
  type WillDisappearEvent,
} from "@elgato/streamdeck";
import type { AnalyticsMetrics } from "shared-types";
import { color, dark } from "shared-design-tokens";
import { hub } from "./hub";

const UUID = "com.aiengineering.monitor";
const POLL_MS = 5000;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type KeyState = "neutral" | "accent" | "success" | "unreported";

interface KeyData {
  icon: string;   // SVG path d= string, drawn in a 28×28 coordinate space
  label: string;
  value: string;  // "7.5", "$96", "OK", "—"
  unit?: string;  // muted suffix rendered smaller: "M", "k", "%"
  state: KeyState;
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function fmtCompact(n: number): { value: string; unit?: string } {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return { value: (n / 1_000_000).toFixed(1), unit: "M" };
  if (abs >= 1_000)     return { value: (n / 1_000).toFixed(1),     unit: "k" };
  return { value: String(Math.round(n)) };
}

function fmtPct(
  n: number | null | undefined,
  higherIsBetter = true,
): { value: string; unit?: string; state: KeyState } {
  if (n == null) return { value: "—", state: "unreported" };
  const pct = Math.round(n);
  let state: KeyState;
  if (higherIsBetter) {
    state = pct >= 85 ? "success" : pct >= 50 ? "neutral" : "accent";
  } else {
    state = pct < 20 ? "success" : pct <= 50 ? "neutral" : "accent";
  }
  return { value: String(pct), unit: "%", state };
}

function fmtDollar(n: number | null | undefined): { value: string; state: KeyState } {
  if (n == null) return { value: "—", state: "unreported" };
  if (n <= 0)    return { value: "$0", state: "neutral" };
  const { value, unit } = fmtCompact(n);
  return { value: `$${value}${unit ?? ""}`, state: "success" };
}

// ---------------------------------------------------------------------------
// Thin-stroke icon paths (28×28 coordinate space, fill:none, stroke applied by renderKey)
// ---------------------------------------------------------------------------

const ICONS = {
  // Bar chart: 3 ascending bars
  token: "M2 22V14h6v8H2zm8 0V8h6v14h-6zm8 0V2h6v20h-6z",

  // Circle with dollar sign
  savings: "M14 2a12 12 0 1 0 0 24A12 12 0 0 0 14 2zm0 5v14M11 8.5c0-1.38 1.34-2.5 3-2.5s3 1.12 3 2.5S15.66 11 14 11s-3 1.12-3 2.5S12.34 16 14 16s3-1.12 3-2.5",

  // Person silhouette
  agent: "M14 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm-9 12c0-4.97 4.03-9 9-9s9 4.03 9 9",

  // Checkmark tick
  task: "M5 14l6 6L23 8",

  // Alert triangle with exclamation
  intervention: "M14 3L2 24h24L14 3zm0 8v6m0 3v2",

  // Lightning bolt
  productivity: "M16 2L8 15h7l-3 11 10-14h-7L16 2z",

  // Wrench
  build: "M20.7 7.3a6 6 0 0 1-8 8L6 22a2 2 0 0 1-2.83-2.83l6.7-6.7a6 6 0 0 1 8-8l-3.17 3.17a2 2 0 0 0 0 2.83l1.83 1.83a2 2 0 0 0 2.83 0L20.7 7.3z",

  // Magnifying glass
  retrieval: "M19.5 19.5l-4.24-4.24M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z",

  // Shield with checkmark
  context: "M14 3l9 4v6c0 5-3.9 9.7-9 11C8.9 22.7 5 18 5 13V7l9-4zm-3 10l3 3 5-5",
} as const;

// ---------------------------------------------------------------------------
// renderKey — the single SVG renderer for all keys
// ---------------------------------------------------------------------------

function renderKey(data: KeyData): string {
  const { icon, label, value, unit, state } = data;

  const iconStroke = state === "accent" ? color.accentOnDark : dark.inkFaint;
  const valueColor =
    state === "accent"     ? color.accentOnDark :
    state === "success"    ? dark.success :
    state === "unreported" ? dark.inkFaint :
    dark.ink;

  const unitSpan = unit
    ? `<tspan font-size="16" font-weight="400" fill="${dark.inkFaint}">${unit}</tspan>`
    : "";

  // Offline dot — shown only when state is unreported (disconnected / no data)
  const offlineDot = state === "unreported"
    ? `<circle cx="123" cy="123" r="5" fill="${dark.inkFaint}" opacity="0.6"/>`
    : "";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 144 144" width="144" height="144">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${dark.pearl}"/>
      <stop offset="100%" stop-color="${dark.parchment}"/>
    </linearGradient>
  </defs>
  <rect width="144" height="144" rx="16" fill="url(#bg)" stroke="${dark.hairline}" stroke-width="1"/>
  <g transform="translate(16,16)">
    <path d="${icon}" fill="none" stroke="${iconStroke}" stroke-width="1.6"
          stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <text x="16" y="108" font-size="14" fill="${dark.inkFaint}" letter-spacing=".04em"
        font-family="ui-monospace,SF Mono,monospace" font-weight="400"
        dominant-baseline="auto">${label.toUpperCase()}</text>
  <text x="16" y="132" font-size="24" fill="${valueColor}" letter-spacing="-.02em"
        font-family="ui-monospace,SF Mono,monospace" font-weight="600"
        font-variant-numeric="tabular-nums" dominant-baseline="auto">${value}${unitSpan}</text>
  ${offlineDot}
</svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function offlineKey(label: string, icon: string): KeyData {
  return { icon, label, value: "—", state: "unreported" };
}

// ---------------------------------------------------------------------------
// Base monitor
// ---------------------------------------------------------------------------

abstract class MetricMonitor extends SingletonAction {
  protected abstract label: string;
  protected abstract icon: string;
  protected abstract buildKey(a: AnalyticsMetrics): KeyData;

  readonly #timers = new Map<string, ReturnType<typeof setInterval>>();

  override async onWillAppear(ev: WillAppearEvent): Promise<void> {
    await this.refresh(ev);
    this.#timers.set(ev.action.id, setInterval(() => void this.refresh(ev), POLL_MS));
  }

  override onWillDisappear(ev: WillDisappearEvent): void {
    const t = this.#timers.get(ev.action.id);
    if (t) clearInterval(t);
    this.#timers.delete(ev.action.id);
  }

  private async refresh(ev: WillAppearEvent): Promise<void> {
    if (!ev.action.isKey()) return;
    try {
      const a = await hub.analytics();
      await ev.action.setTitle("");
      await ev.action.setImage(renderKey(this.buildKey(a)));
    } catch {
      await ev.action.setTitle("");
      await ev.action.setImage(renderKey(offlineKey(this.label, this.icon)));
    }
  }
}

// ---------------------------------------------------------------------------
// Concrete monitors
// ---------------------------------------------------------------------------

@action({ UUID: `${UUID}.token` })
export class TokenMonitor extends MetricMonitor {
  protected label = "Tokens";
  protected icon = ICONS.token;
  protected buildKey(a: AnalyticsMetrics): KeyData {
    const { value, unit } = fmtCompact(a.tokens.monthly_usage);
    return { icon: this.icon, label: this.label, value, unit, state: "accent" };
  }
}

@action({ UUID: `${UUID}.savings` })
export class SavingsMonitor extends MetricMonitor {
  protected label = "Savings";
  protected icon = ICONS.savings;
  protected buildKey(a: AnalyticsMetrics): KeyData {
    const { value, state } = fmtDollar(a.savings.total_savings);
    return { icon: this.icon, label: this.label, value, state };
  }
}

@action({ UUID: `${UUID}.agent` })
export class AgentMonitor extends MetricMonitor {
  protected label = "Top Agent";
  protected icon = ICONS.agent;
  protected buildKey(a: AnalyticsMetrics): KeyData {
    const name = a.tokens.agent_breakdown[0]?.label ?? null;
    return {
      icon: this.icon,
      label: this.label,
      value: name ?? "—",
      state: name ? "neutral" : "unreported",
    };
  }
}

@action({ UUID: `${UUID}.task` })
export class TaskMonitor extends MetricMonitor {
  protected label = "Tasks Done";
  protected icon = ICONS.task;
  protected buildKey(a: AnalyticsMetrics): KeyData {
    const { value, unit, state } = fmtPct(a.productivity.task_completion_rate);
    return { icon: this.icon, label: this.label, value, unit, state };
  }
}

@action({ UUID: `${UUID}.intervention` })
export class InterventionMonitor extends MetricMonitor {
  protected label = "Intervene";
  protected icon = ICONS.intervention;
  protected buildKey(a: AnalyticsMetrics): KeyData {
    const { value, unit, state } = fmtPct(a.productivity.intervention_rate, false);
    return { icon: this.icon, label: this.label, value, unit, state };
  }
}

@action({ UUID: `${UUID}.productivity` })
export class ProductivityMonitor extends MetricMonitor {
  protected label = "1st Pass";
  protected icon = ICONS.productivity;
  protected buildKey(a: AnalyticsMetrics): KeyData {
    const { value, unit, state } = fmtPct(a.productivity.first_pass_success);
    return { icon: this.icon, label: this.label, value, unit, state };
  }
}

@action({ UUID: `${UUID}.build` })
export class BuildHealthMonitor extends MetricMonitor {
  protected label = "Build";
  protected icon = ICONS.build;
  protected buildKey(a: AnalyticsMetrics): KeyData {
    const { value, unit, state } = fmtPct(a.quality.build_success);
    return { icon: this.icon, label: this.label, value, unit, state };
  }
}

@action({ UUID: `${UUID}.retrieval` })
export class RetrievalMonitor extends MetricMonitor {
  protected label = "Retrieval";
  protected icon = ICONS.retrieval;
  protected buildKey(a: AnalyticsMetrics): KeyData {
    const raw = a.retrieval.accuracy == null ? null : a.retrieval.accuracy * 100;
    const { value, unit, state } = fmtPct(raw);
    return { icon: this.icon, label: this.label, value, unit, state };
  }
}

@action({ UUID: `${UUID}.context` })
export class ContextHealthMonitor extends MetricMonitor {
  protected label = "Context";
  protected icon = ICONS.context;
  protected buildKey(a: AnalyticsMetrics): KeyData {
    const raw = a.productivity.retry_rate == null ? null : 100 - a.productivity.retry_rate;
    const { value, unit, state } = fmtPct(raw);
    return { icon: this.icon, label: this.label, value, unit, state };
  }
}

export const allActions = [
  new TokenMonitor(),
  new SavingsMonitor(),
  new AgentMonitor(),
  new TaskMonitor(),
  new InterventionMonitor(),
  new ProductivityMonitor(),
  new BuildHealthMonitor(),
  new RetrievalMonitor(),
  new ContextHealthMonitor(),
];
