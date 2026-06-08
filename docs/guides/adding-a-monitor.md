# Adding a Stream Deck monitor

A **monitor** is a hardware keypad action that displays live metrics from the Hub. The plugin ships with 9; adding a 10th follows a template.

Example: **Memory Usage Monitor** — display the app's resident memory (hypothetical; requires a new `/api/v1/metrics/memory` endpoint first).

## 1. Add the API endpoint (backend)

See [adding-an-endpoint.md](adding-an-endpoint.md) for full details. Example:

**`core/src/server.rs`:**

```rust
#[derive(serde::Serialize)]
struct MemoryMetrics {
    resident_mb: u64,
    peak_mb: u64,
}

async fn memory_metrics(
    State(state): State<AppState>,
) -> Result<Json<MemoryMetrics>, AppError> {
    // Query the process's memory via sysinfo or a custom observer
    let mem = get_process_memory()?;
    Ok(Json(MemoryMetrics {
        resident_mb: mem.resident_mb,
        peak_mb: mem.peak_mb,
    }))
}
```

Expose at `/api/v1/metrics/memory`.

## 2. Define the monitor in the plugin manifest

**`apps/streamdeck-plugin/com.aiengineering.monitor.sdPlugin/manifest.json`:**

Add an action UUID + definition:

```json
{
  "Actions": [
    // ... existing monitors (token, savings, etc.) ...
    {
      "Icon": "imgs/actions/memory/key",
      "States": [
        {
          "Image": "imgs/actions/memory/key",
          "TitleAlignment": "bottom",
          "FontSize": 13
        }
      ],
      "Tooltip": "App memory usage",
      "UUID": "com.aieng.monitor.memory"
    }
  ]
}
```

Also add the icon assets:

```
imgs/actions/memory/
  key.png       (72x72, action-blue glyph on dark tile)
  key@2x.png    (144x144, 2x resolution)
  icon.png      (light 256x256 for property inspector, if adding settings)
  icon@2x.png
```

(Generate with Pillow or your design tool using Action Blue `#0066cc`.)

## 3. Add the monitor class (TypeScript)

**`apps/streamdeck-plugin/src/actions.ts`:**

```typescript
import { SingletonAction } from "@elgato/streamdeck";

// Extend the base MetricMonitor
class MemoryMonitor extends MetricMonitor {
  constructor() {
    super("com.aieng.monitor.memory", "Memory Usage");
  }

  async onWillAppear(ev: WillAppearEvent<ActionContext>) {
    await super.onWillAppear(ev);
    this.startPolling();
  }

  async updateDisplay(ctx: ActionContext) {
    try {
      const res = await fetch(`${HUB_BASE}/api/v1/metrics/memory`);
      if (!res.ok) {
        ctx.setTitle("—");
        return;
      }
      const data = await res.json();
      ctx.setTitle(`${data.resident_mb}M`);
    } catch (err) {
      ctx.setTitle("—");
      console.error("memory monitor error:", err);
    }
  }
}

// Register the monitor
const memoryMonitor = new MemoryMonitor();
streamDeck.actions.registerAction(memoryMonitor);
```

Add the import to `src/plugin.ts` if needed:

```typescript
import { MemoryMonitor } from "./actions";  // or just let actions.ts register it
```

## 4. Add package.json scripts (Elgato CLI)

The plugin build is already set up. Validate and package:

```bash
pnpm --filter ai-engineering-monitor-plugin run sd:validate  # Check manifest
pnpm --filter ai-engineering-monitor-plugin run sd:pack      # Create .streamDeckPlugin
pnpm --filter ai-engineering-monitor-plugin run sd:link      # Dev-install
```

## 5. Test it

```bash
# 1. Make sure the Hub is running
pnpm app:dev

# 2. Link the plugin for development (installs into Stream Deck software)
pnpm --filter ai-engineering-monitor-plugin run sd:link

# 3. Open Stream Deck software, add the "Memory Usage" action to a key
# 4. Watch it update live as the app runs
```

If the action doesn't appear, check:
- Does `manifest.json` have the UUID?
- Are the icon files in the right paths?
- Run `sd:validate` for detailed errors.

## 6. Polling vs. WebSocket

By default, monitors **poll** the API every N seconds. For live updates, switch to the `/ws/events` stream:

```typescript
class MemoryMonitor extends MetricMonitor {
  async onWillAppear(ev: WillAppearEvent<ActionContext>) {
    // Instead of startPolling(), connect to the WS stream:
    await this.hub.connect();
    this.hub.on("event", (event: HubEvent) => {
      if (event.type === "metric" && event.payload.category === "memory") {
        this.updateDisplay(ev.action.getActionContext());
      }
    });
  }
}
```

(Requires the Hub's WS to broadcast memory update events — add that to the event enum in `shared-events`.)

## 7. Limitations (hard boundaries)

✅ **allowed:**
- Call the Hub API + WS (HTTP fetch, WebSocket)
- Render static UI / key titles / colors
- Local state + preferences

❌ **never:**
- Parse logs or tool data files
- Access SQLite directly
- Compute analytics (let the Hub do it)
- Touch the file system

The plugin is an **ops display**, not a second backend. Keep it thin.

---

Related: [Stream Deck plugin](../streamdeck.md) · [API reference](../api.md)
