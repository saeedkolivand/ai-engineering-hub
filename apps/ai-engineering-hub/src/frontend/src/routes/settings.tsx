import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { HUB_BASE } from "../lib/hub";
import { setThemePref, type ThemePref } from "../lib/theme";
import { getSettings, saveSettings, type AppSettings } from "../lib/settings";
import { getAutostart, setAutostart } from "../lib/autostart";

export const Route = createFileRoute("/settings")({
  component: Settings,
});

function Settings() {
  const [loaded, setLoaded] = useState<AppSettings | null>(null);
  const [autostartState, setAutostartState] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void (async () => {
      const [settings, autostart] = await Promise.all([getSettings(), getAutostart()]);
      setLoaded(settings);
      setAutostartState(autostart);
    })();
  }, []);

  const form = useForm({
    defaultValues: {
      endpoint: HUB_BASE,
      theme: "system" as ThemePref,
      notifications: true,
      ...(loaded ?? {}),
    },
    onSubmit: async ({ value }) => {
      await saveSettings({
        theme: value.theme as ThemePref,
        notifications: value.notifications,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  // Re-initialise the form once settings load from the store.
  useEffect(() => {
    if (loaded) form.reset(loaded as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  const handleAutostartChange = async (enabled: boolean) => {
    setAutostartState(enabled);
    await setAutostart(enabled);
  };

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
          <div>
            <div className="label">Hub API endpoint</div>
            <input
              className="input"
              style={{ width: "100%" }}
              value={HUB_BASE}
              readOnly
              title="Configured at build time; edit lib/hub.ts to change"
            />
          </div>

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
                    setThemePref(v);
                  }}
                >
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </label>
            )}
          />

          <form.Field
            name="notifications"
            children={(field) => (
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={!!field.state.value}
                  onChange={(e) => field.handleChange(e.target.checked)}
                />
                <span className="label" style={{ margin: 0 }}>
                  Desktop notifications
                </span>
              </label>
            )}
          />

          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={autostartState}
              onChange={(e) => void handleAutostartChange(e.target.checked)}
            />
            <span className="label" style={{ margin: 0 }}>
              Launch on login
            </span>
          </label>

          <button className="btn" type="submit">
            {saved ? "Saved" : "Save"}
          </button>
        </div>
      </form>

      <div className="section-title">Integrations</div>
      <p className="muted">
        Manage which tools the Hub tracks on the <Link to="/integrations">Integrations</Link> page.
      </p>
    </div>
  );
}
