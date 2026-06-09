import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";
import { useForm } from "@tanstack/react-form";
import { HUB_BASE } from "../lib/hub";
import { setThemePref, type ThemePref } from "../lib/theme";
import { getSettings, saveSettings, type AppSettings } from "../lib/settings";
import { getAutostart, setAutostart } from "../lib/autostart";
import { checkForUpdates } from "../lib/updater";
import { updateStore } from "../lib/updateStore";
import { ChangelogModal } from "../components/ChangelogModal";

export const Route = createFileRoute("/settings")({
  component: Settings,
});

const inputClass = "text-ui border border-hairline rounded-xs px-2.5 py-1.5 bg-canvas text-ink outline-none focus:border-accent";
const labelClass = "text-ui-sm text-ink-faint";

function SoftwareSection() {
  const { pending, checking, dismissed, lastChecked, error } = useStore(updateStore);
  const [appVersion, setAppVersion] = useState<string | null>(null);
  const [changelogOpen, setChangelogOpen] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const { getVersion } = await import("@tauri-apps/api/app");
        setAppVersion(await getVersion());
      } catch {
        // Outside Tauri (browser dev); version not available.
      }
    })();
  }, []);

  const handleCheck = () => void checkForUpdates(false);

  const handleInstall = async () => {
    if (!pending) return;
    setInstalling(true);
    try {
      await pending.install();
    } catch {
      setInstalling(false);
    }
  };

  const lastCheckedLabel = lastChecked
    ? new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
        Math.round((lastChecked - Date.now()) / 60000),
        "minute",
      )
    : null;

  return (
    <div style={{ marginTop: 24 }}>
      <div className="text-ui-lg font-semibold mb-2">Software</div>
      <div
        className="bg-canvas border border-hairline rounded-md p-3"
        style={{ maxWidth: 420, display: "grid", gap: 12 }}
      >
        {appVersion && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className={labelClass}>Current version</span>
            <span className="text-ui" style={{ fontVariantNumeric: "tabular-nums" }}>
              {appVersion}
            </span>
          </div>
        )}

        {/* Update status */}
        {pending && !dismissed ? (
          <div
            style={{
              padding: "8px 10px",
              background: "color-mix(in srgb, var(--color-accent) 10%, var(--color-canvas))",
              border: "1px solid color-mix(in srgb, var(--color-accent) 22%, transparent)",
              borderRadius: "var(--radius-xs)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span style={{ flex: 1, fontSize: "var(--fs-ui-sm)" }}>
              <strong>{pending.version}</strong> available
              {pending.body && (
                <button
                  onClick={() => setChangelogOpen(true)}
                  style={{
                    marginLeft: 8,
                    color: "var(--color-accent)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    fontSize: "var(--fs-ui-sm)",
                    textDecoration: "underline",
                    textUnderlineOffset: 2,
                  }}
                >
                  View changelog
                </button>
              )}
            </span>
            <button
              className="btn"
              style={{ fontSize: "var(--fs-ui-sm)", padding: "3px 12px" }}
              disabled={installing}
              onClick={() => void handleInstall()}
            >
              {installing ? "Installing…" : "Install & Restart"}
            </button>
          </div>
        ) : pending && dismissed ? (
          <div className={labelClass} style={{ fontSize: "var(--fs-ui-sm)" }}>
            Version {pending.version} available —{" "}
            <button
              onClick={() => updateStore.setState((s) => ({ ...s, dismissed: false }))}
              style={{ color: "var(--color-accent)", background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: "inherit" }}
            >
              show banner
            </button>
          </div>
        ) : error ? (
          <div style={{ fontSize: "var(--fs-ui-sm)", color: "var(--color-error)" }}>
            Check failed: {error}
          </div>
        ) : lastChecked ? (
          <div className={labelClass} style={{ fontSize: "var(--fs-ui-sm)" }}>
            Up to date{lastCheckedLabel ? ` · checked ${lastCheckedLabel}` : ""}
          </div>
        ) : null}

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            className="btn subtle"
            type="button"
            disabled={checking}
            onClick={handleCheck}
            style={{ fontSize: "var(--fs-ui-sm)" }}
          >
            {checking ? "Checking…" : "Check for updates"}
          </button>
        </div>
      </div>

      {changelogOpen && pending?.body && (
        <ChangelogModal
          body={pending.body}
          version={pending.version}
          onClose={() => setChangelogOpen(false)}
        />
      )}
    </div>
  );
}

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
      <h1 className="text-metric font-display font-semibold tracking-[-0.3px] m-0 mb-4">Settings</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void form.handleSubmit();
        }}
        style={{ maxWidth: 420 }}
      >
        <div className="bg-canvas border border-hairline rounded-md p-3" style={{ display: "grid", gap: 12 }}>
          <div>
            <div className={labelClass}>Hub API endpoint</div>
            <input
              className={`${inputClass} w-full`}
              value={HUB_BASE}
              readOnly
              title="Configured at build time; edit lib/hub.ts to change"
            />
          </div>

          <form.Field
            name="theme"
            children={(field) => (
              <label>
                <div className={labelClass}>Theme</div>
                <select
                  className={`${inputClass} w-full`}
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
                <span className={`${labelClass} m-0`}>
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
            <span className={`${labelClass} m-0`}>
              Launch on login
            </span>
          </label>

          <button className="btn" type="submit">
            {saved ? "Saved" : "Save"}
          </button>
        </div>
      </form>

      <div className="text-ui-lg font-semibold mt-6 mb-2">Integrations</div>
      <p className="text-ink-faint">
        Manage which tools the Hub tracks on the <Link to="/integrations">Integrations</Link> page.
      </p>

      <SoftwareSection />
    </div>
  );
}
