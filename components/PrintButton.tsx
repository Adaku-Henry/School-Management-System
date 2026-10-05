"use client";

import Icon from "./Icon";

export default function PrintButton({ label = "Print / Save as PDF" }: { label?: string }) {
  return (
    <button onClick={() => window.print()} className="btn-primary">
      <Icon name="file-text" className="w-4 h-4" /> {label}
    </button>
  );
}
