"use client";

// Small dependency-free icon set (inline SVG paths) so the app has zero
// extra icon-library dependency to install.
const PATHS: Record<string, string> = {
  "layout-dashboard": "M3 3h8v8H3V3zm10 0h8v5h-8V3zM3 13h8v8H3v-8zm10 3h8v5h-8v-5z",
  users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm7 9v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  "user-check": "M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M8.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm9-1 2 2 4-4",
  "users-round": "M18 21a8 8 0 0 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm10 9a6 6 0 0 0-8-5.65",
  school: "M22 10 12 5 2 10l10 5 10-5zM6 12.5V17c0 1 3 3 6 3s6-2 6-3v-4.5",
  "book-open": "M2 5c2-1 5-2 8-2v14c-3 0-6 1-8 2V5zm20 0c-2-1-5-2-8-2v14c3 0 6 1 8 2V5z",
  "calendar-check": "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm4 10 2 2 4-4",
  "file-text": "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM14 2v6h6M9 13h6M9 17h6M9 9h1",
  "graduation-cap": "M22 10 12 5 2 10l10 5 10-5zM6 12v5c0 1.5 2.5 3 6 3s6-1.5 6-3v-5",
  banknote: "M2 7h20v10H2V7zm10 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM6 9v6M18 9v6",
  wallet: "M21 12V7H5a2 2 0 0 1 0-4h14v4M3 5v14a2 2 0 0 0 2 2h16v-5M18 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4z",
  library: "M4 22V4a2 2 0 0 1 2-2h6v20M12 22V2h6a2 2 0 0 1 2 2v18M4 22h16M8 8h0",
  "building-2": "M6 22V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v18M6 10h10M6 14h10M6 18h10M2 22h20M16 22v-4a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v4",
  bus: "M4 17h16V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v11zM4 17a2 2 0 0 0 4 0M16 17a2 2 0 0 0 4 0M4 11h16",
  boxes: "M2 8l6-4 6 4-6 4-6-4zm12 0 6-4M8 12l6-4 6 4-6 4-6-4zm-6 4 6 4 6-4",
  "shield-alert": "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM12 8v4m0 4h.01",
  "clipboard-list": "M9 2h6a1 1 0 0 1 1 1v2H8V3a1 1 0 0 1 1-1zM8 5h8v16H8a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM10 11h6M10 15h6M10 19h3",
  "book-marked": "M4 19.5V4.5A2.5 2.5 0 0 1 6.5 2H20v20l-4-2-4 2-4-2-4 2z",
  "calendar-days": "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  award: "M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.2 13.9 6 22l6-3 6 3-2.2-8.1",
  megaphone: "M3 11v3a1 1 0 0 0 1 1h2l4 5V5l-4 5H4a1 1 0 0 0-1 1zM17 8a4 4 0 0 1 0 8M21 5a9 9 0 0 1 0 14",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  "bar-chart-3": "M3 3v18h18M8 17V9m5 8V5m5 12v-5",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.2a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.2a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.2a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.2a1.6 1.6 0 0 0-1.4 1z",
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  "log-out": "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  plus: "M12 5v14M5 12h14",
  upload: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12",
  pencil: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
  trash: "M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16z",
  x: "M18 6 6 18M6 6l12 12",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0",
  "chevron-right": "m9 18 6-6-6-6",
  "chevron-down": "m6 9 6 6 6-6",
  "check-circle": "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3",
  "id-card": "M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM7 15c1-2 5-2 6 0M8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM14 9h4M14 12h4",
  building: "M4 22h16M6 22V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v18M9 8h1M14 8h1M9 12h1M14 12h1M9 16h1M14 16h1",
  eye: "M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  "eye-off": "M9.9 4.24A9.1 9.1 0 0 1 12 4c7 0 11 7 11 7a13.2 13.2 0 0 1-3.11 3.94M6.61 6.61C3.24 8.7 1 12 1 12s4 7 11 7a9.9 9.9 0 0 0 4.24-.94M14.12 14.12a3 3 0 1 1-4.24-4.24M1 1l22 22",
};

export default function Icon({ name, className = "w-5 h-5", strokeWidth = 2 }: { name: string; className?: string; strokeWidth?: number }) {
  const d = PATHS[name] || PATHS["file-text"];
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={d} />
    </svg>
  );
}
