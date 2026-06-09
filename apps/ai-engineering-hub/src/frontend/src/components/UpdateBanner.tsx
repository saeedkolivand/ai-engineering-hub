import { useState } from "react";
import { useStore } from "@tanstack/react-store";
import { updateStore } from "../lib/updateStore";
import { ChangelogModal } from "./ChangelogModal";

export function UpdateBanner() {
  const { pending, dismissed } = useStore(updateStore);
  const [installing, setInstalling] = useState(false);
  const [changelogOpen, setChangelogOpen] = useState(false);

  if (!pending || dismissed) return null;

  const handleInstall = async () => {
    setInstalling(true);
    try {
      await pending.install();
    } catch {
      setInstalling(false);
    }
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "7px 16px",
          background: "color-mix(in srgb, var(--color-accent) 10%, var(--color-canvas))",
          borderBottom: "1px solid color-mix(in srgb, var(--color-accent) 22%, transparent)",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: "var(--fs-ui-sm)",
            color: "var(--color-accent)",
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          ↑
        </span>
        <span style={{ flex: 1, fontSize: "var(--fs-ui-sm)", color: "var(--color-ink)" }}>
          Version <strong>{pending.version}</strong> is available
          {pending.body && (
            <button
              onClick={() => setChangelogOpen(true)}
              style={{
                marginLeft: 10,
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
        <button
          className="btn subtle"
          style={{ fontSize: "var(--fs-ui-sm)", padding: "3px 10px" }}
          onClick={() =>
            updateStore.setState((s) => ({ ...s, dismissed: true }))
          }
          aria-label="Dismiss update notification"
        >
          Later
        </button>
      </div>
      {changelogOpen && pending.body && (
        <ChangelogModal
          body={pending.body}
          version={pending.version}
          onClose={() => setChangelogOpen(false)}
        />
      )}
    </>
  );
}
