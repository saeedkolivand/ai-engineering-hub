import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useVirtualizer } from "@tanstack/react-virtual";
import { hub } from "../lib/hub";
import { shortTime } from "../lib/format";
import type { HubEvent } from "shared-events";

export const Route = createFileRoute("/activity")({
  component: Activity,
});

interface FeedRow {
  ts: string;
  source: string;
  type: string;
  detail: string;
}

function toRow(ev: HubEvent): FeedRow {
  if (ev.type === "activity") {
    const a = ev.payload;
    return { ts: a.timestamp, source: a.source, type: a.event_type, detail: `${a.repository} · ${a.agent} · Δ${a.token_impact}` };
  }
  const e = ev.payload;
  return { ts: e.timestamp, source: e.source, type: e.event_type, detail: JSON.stringify(e.payload).slice(0, 120) };
}

function Activity() {
  const [rows, setRows] = useState<FeedRow[]>([]);
  const [connected, setConnected] = useState(false);
  const parentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ws = hub.connect(
      (ev) => setRows((prev) => [toRow(ev), ...prev].slice(0, 1000)),
      () => setConnected(false),
    );
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    return () => ws.close();
  }, []);

  const virt = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 30,
    overscan: 12,
  });

  return (
    <div>
      <h1 className="page-title">
        Activity{" "}
        <span className={`pill ${connected ? "ok" : "muted"}`}>{connected ? "live" : "offline"}</span>
      </h1>
      <div className="feed" ref={parentRef}>
        <div style={{ height: virt.getTotalSize(), position: "relative" }}>
          {virt.getVirtualItems().map((vi) => {
            const r = rows[vi.index];
            return (
              <div
                key={vi.key}
                className="feed-row"
                style={{ position: "absolute", top: 0, left: 0, right: 0, transform: `translateY(${vi.start}px)` }}
              >
                <div className="dot" />
                <span className="muted" style={{ width: 150, flex: "none" }}>{shortTime(r.ts)}</span>
                <span style={{ width: 110, flex: "none" }}>{r.source}</span>
                <span style={{ width: 110, flex: "none" }}>{r.type}</span>
                <span className="muted" style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{r.detail}</span>
              </div>
            );
          })}
        </div>
        {rows.length === 0 && <div className="state">Waiting for live events…</div>}
      </div>
    </div>
  );
}
