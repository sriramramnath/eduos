export const ACCENT_COLOR_OPTIONS = [
  {
    key: "green",
    label: "Green",
    value: "#10b981",
    weak: "#d1fae5",
    text: "#047857",
    border: "#a7f3d0",
  },
  {
    key: "teal",
    label: "Teal",
    value: "#0d9488",
    weak: "#ccfbf1",
    text: "#0f766e",
    border: "#99f6e4",
  },
  {
    key: "blue",
    label: "Blue",
    value: "#0284c7",
    weak: "#e0f2fe",
    text: "#0369a1",
    border: "#bae6fd",
  },
  {
    key: "indigo",
    label: "Indigo",
    value: "#6366f1",
    weak: "#e0e7ff",
    text: "#4338ca",
    border: "#c7d2fe",
  },
  {
    key: "amber",
    label: "Amber",
    value: "#d97706",
    weak: "#fef3c7",
    text: "#b45309",
    border: "#fde68a",
  },
  {
    key: "pink",
    label: "Pink",
    value: "#db2777",
    weak: "#fce7f3",
    text: "#be185d",
    border: "#f9a8d4",
  },
  {
    key: "rose",
    label: "Rose",
    value: "#e11d48",
    weak: "#ffe4e6",
    text: "#be123c",
    border: "#fda4af",
  },
  {
    key: "orange",
    label: "Orange",
    value: "#ea580c",
    weak: "#ffedd5",
    text: "#c2410c",
    border: "#fdba74",
  },
] as const;

export type AccentColorKey = (typeof ACCENT_COLOR_OPTIONS)[number]["key"];

export const DEFAULT_ACCENT_COLOR: AccentColorKey = "green";

export const ACCENT_COLOR_MAP: Record<AccentColorKey, (typeof ACCENT_COLOR_OPTIONS)[number]> =
  Object.fromEntries(ACCENT_COLOR_OPTIONS.map((item) => [item.key, item])) as Record<
    AccentColorKey,
    (typeof ACCENT_COLOR_OPTIONS)[number]
  >;
