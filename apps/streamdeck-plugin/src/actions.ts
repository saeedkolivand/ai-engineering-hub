import {
  action,
  SingletonAction,
  type WillAppearEvent,
  type WillDisappearEvent,
} from "@elgato/streamdeck";
import type { AnalyticsMetrics } from "shared-types";
import { hub } from "./hub";

const UUID = "com.aiengineering.monitor";
const POLL_MS = 5000;

const compact = (n: number): string =>
  Math.abs(n) >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${Math.round(n)}`;
// Rate metrics are nullable — "—" means no connected tool reports that signal yet.
const pct = (n: number | null | undefined): string => (n == null ? "—" : `${n.toFixed(0)}%`);

/**
 * Base monitor: polls the Hub analytics endpoint on an interval and renders a key
 * title. Each concrete monitor only selects which metric to show — no analytics math.
 */
abstract class MetricMonitor extends SingletonAction {
  protected abstract label: string;
  protected abstract render(a: AnalyticsMetrics): string;
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
      await ev.action.setTitle(`${this.label}\n${this.render(a)}`);
    } catch {
      await ev.action.setTitle(`${this.label}\n—`);
    }
  }
}

@action({ UUID: `${UUID}.token` })
export class TokenMonitor extends MetricMonitor {
  protected label = "Tokens";
  protected render = (a: AnalyticsMetrics) => compact(a.tokens.monthly_usage);
}

@action({ UUID: `${UUID}.savings` })
export class SavingsMonitor extends MetricMonitor {
  protected label = "Savings";
  protected render = (a: AnalyticsMetrics) => compact(a.savings.total_savings);
}

@action({ UUID: `${UUID}.agent` })
export class AgentMonitor extends MetricMonitor {
  protected label = "Top agent";
  protected render = (a: AnalyticsMetrics) => a.tokens.agent_breakdown[0]?.label ?? "—";
}

@action({ UUID: `${UUID}.task` })
export class TaskMonitor extends MetricMonitor {
  protected label = "Tasks done";
  protected render = (a: AnalyticsMetrics) => pct(a.productivity.task_completion_rate);
}

@action({ UUID: `${UUID}.intervention` })
export class InterventionMonitor extends MetricMonitor {
  protected label = "Intervene";
  protected render = (a: AnalyticsMetrics) => pct(a.productivity.intervention_rate);
}

@action({ UUID: `${UUID}.productivity` })
export class ProductivityMonitor extends MetricMonitor {
  protected label = "1st pass";
  protected render = (a: AnalyticsMetrics) => pct(a.productivity.first_pass_success);
}

@action({ UUID: `${UUID}.build` })
export class BuildHealthMonitor extends MetricMonitor {
  protected label = "Build";
  protected render = (a: AnalyticsMetrics) => pct(a.quality.build_success);
}

@action({ UUID: `${UUID}.retrieval` })
export class RetrievalMonitor extends MetricMonitor {
  protected label = "Retrieval";
  protected render = (a: AnalyticsMetrics) =>
    a.retrieval.accuracy == null ? "—" : pct(a.retrieval.accuracy * 100);
}

@action({ UUID: `${UUID}.context` })
export class ContextHealthMonitor extends MetricMonitor {
  protected label = "Context";
  // Context stability proxy: inverse of the retry rate.
  protected render = (a: AnalyticsMetrics) =>
    a.productivity.retry_rate == null ? "—" : pct(100 - a.productivity.retry_rate);
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
