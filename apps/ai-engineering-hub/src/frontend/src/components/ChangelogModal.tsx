import { createPortal } from "react-dom";

interface ChangelogItem {
  scope: string | null;
  text: string;
}
interface ChangelogSection {
  title: string;
  items: ChangelogItem[];
}

// Parse conventional-commit markdown release notes into structured sections.
// Handles "### Section Title" headers and "* **scope**: description" bullets.
// Falls back to raw preformatted text if no structure is found.
function parseChangelog(md: string): ChangelogSection[] {
  const sections: ChangelogSection[] = [];
  let current: ChangelogSection | null = null;

  for (const line of md.split("\n")) {
    const header = line.match(/^#{1,3}\s+(.+)/);
    if (header) {
      if (current) sections.push(current);
      current = { title: header[1].trim().replace(/\[.*?\]/g, "").trim(), items: [] };
      continue;
    }
    if (!current) continue;
    const bullet = line.match(/^\*\s+(.+)/);
    if (!bullet) continue;
    const rest = bullet[1];
    // Strip trailing commit link: "text ([abc1234](url))" or "text (link)"
    const clean = rest.replace(/\s*\([^)]{0,80}\)\s*$/, "").trim();
    const scopeMatch = clean.match(/^\*\*([^*]+)\*\*:\s+(.+)/);
    if (scopeMatch) {
      current.items.push({ scope: scopeMatch[1], text: scopeMatch[2] });
    } else {
      current.items.push({ scope: null, text: clean.replace(/^\*\*([^*]+)\*\*/, "$1") });
    }
  }
  if (current) sections.push(current);
  return sections.filter((s) => s.items.length > 0);
}

const SECTION_ICON: Record<string, string> = {
  Features: "✦",
  "Bug Fixes": "◆",
  "Performance Improvements": "◈",
  Reverts: "↩",
  "Breaking Changes": "!",
};

export function ChangelogModal({
  body,
  version,
  onClose,
}: {
  body: string;
  version: string;
  onClose: () => void;
}) {
  const sections = parseChangelog(body);

  return createPortal(
    <div
      className="cp-overlay"
      style={{ alignItems: "center", paddingTop: 0 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "var(--color-canvas)",
          border: "1px solid var(--color-hairline)",
          borderRadius: "var(--radius-md)",
          width: "min(540px, 92vw)",
          maxHeight: "70vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "14px 16px",
            borderBottom: "1px solid var(--color-hairline)",
            gap: 8,
          }}
        >
          <div>
            <div style={{ fontSize: "var(--fs-ui)", fontWeight: 600, color: "var(--color-ink)" }}>
              What's new in {version}
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--color-ink-faint)",
              padding: "2px 6px",
              fontSize: 20,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ overflow: "auto", padding: "16px 20px" }}>
          {sections.length > 0 ? (
            sections.map((section) => (
              <div key={section.title} style={{ marginBottom: 18 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{
                      color: "var(--color-accent)",
                      fontSize: "var(--fs-ui-sm)",
                      fontWeight: 700,
                    }}
                  >
                    {SECTION_ICON[section.title] ?? "◆"}
                  </span>
                  <span
                    style={{
                      fontSize: "var(--fs-ui-sm)",
                      fontWeight: 600,
                      color: "var(--color-ink)",
                    }}
                  >
                    {section.title}
                  </span>
                </div>
                <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                  {section.items.map((item, i) => (
                    <li
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: 7,
                        padding: "3px 0 3px 16px",
                      }}
                    >
                      <span
                        style={{
                          color: "var(--color-ink-faint)",
                          fontSize: "var(--fs-micro)",
                          flexShrink: 0,
                        }}
                      >
                        –
                      </span>
                      {item.scope && (
                        <code
                          style={{
                            fontSize: "var(--fs-micro)",
                            color: "var(--color-accent)",
                            background:
                              "color-mix(in srgb, var(--color-accent) 10%, transparent)",
                            padding: "1px 5px",
                            borderRadius: "var(--radius-xs)",
                            flexShrink: 0,
                          }}
                        >
                          {item.scope}
                        </code>
                      )}
                      <span
                        style={{
                          fontSize: "var(--fs-ui-sm)",
                          color: "var(--color-ink-muted)",
                        }}
                      >
                        {item.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          ) : (
            // Fallback: render body as pre-formatted text if parsing finds no structure.
            <pre
              style={{
                margin: 0,
                fontFamily: "inherit",
                fontSize: "var(--fs-ui-sm)",
                color: "var(--color-ink-muted)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {body}
            </pre>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
