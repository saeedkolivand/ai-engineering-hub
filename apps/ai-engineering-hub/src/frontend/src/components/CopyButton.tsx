import { useState } from "react";
import { copyToClipboard } from "../lib/clipboard";

interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
}

export function CopyButton({ text, label = "Copy", className = "btn subtle" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <button className={className} onClick={handleCopy} title={`Copy: ${text}`}>
      {copied ? "Copied" : label}
    </button>
  );
}
