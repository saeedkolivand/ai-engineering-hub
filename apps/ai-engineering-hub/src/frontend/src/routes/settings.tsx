import { createFileRoute, Link } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { HUB_BASE } from "../lib/hub";
import { setThemePref, type ThemePref } from "../lib/theme";

export const Route = createFileRoute("/settings")({
  component: Settings,
});

const LS_KEY = "aeh.settings";

function load(): { endpoint: string; theme: string } {
  try {
    return { endpoint: HUB_BASE, theme: "system", ...JSON.parse(localStorage.getItem(LS_KEY) ?? "{}") };
  } catch {
    return { endpoint: HUB_BASE, theme: "system" };
  }
}

function Settings() {
  const form = useForm({
    defaultValues: load(),
    onSubmit: async ({ value }) => {
      localStorage.setItem(LS_KEY, JSON.stringify(value));
    },
  });

  return (
    <div>
      <h1 className="page-title">Settings</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void form.handleSubmit();
        }}
        style={{ maxWidth: 420 }}
      >
        <div className="card" style={{ display: "grid", gap: 12 }}>
          <form.Field
            name="endpoint"
            children={(field) => (
              <label>
                <div className="label">Hub API endpoint</div>
                <input
                  className="input"
                  style={{ width: "100%" }}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </label>
            )}
          />
          <form.Field
            name="theme"
            children={(field) => (
              <label>
                <div className="label">Theme</div>
                <select
                  className="input"
                  style={{ width: "100%" }}
                  value={field.state.value}
                  onChange={(e) => {
                    const v = e.target.value as ThemePref;
                    field.handleChange(v);
                    setThemePref(v); // apply + persist immediately (live preview)
                  }}
                >
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </label>
            )}
          />
          <button className="btn" type="submit">Save</button>
        </div>
      </form>

      <div className="section-title">Integrations</div>
      <p className="muted">
        Manage which tools the Hub tracks on the <Link to="/integrations">Integrations</Link> page.
      </p>
    </div>
  );
}
