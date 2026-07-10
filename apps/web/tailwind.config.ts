import type { Config } from "tailwindcss";

/**
 * UI/UX Doctrine V1 token set — the binding visual source of truth.
 * Ported verbatim from Product Context/Epicenter_Education_Architecture_v1.md §0.
 * Epicenter Yellow #EDC001 / paper #FDFDFD / ink #000000, Satoshi typography.
 *
 * The old storyboard palette and the superseded violet AI-badge colours are
 * explicitly NOT present here and must never be reintroduced. The AI marker is a
 * minimal BLACK badge, never violet (CLAUDE.md §4, Doctrine §7.10/§35.7).
 *
 * shadcn/ui structural tokens (background, primary, border, ring, ...) are mapped
 * to CSS variables defined in app/globals.css, which resolve to Doctrine colours —
 * so every shadcn primitive inherits the Doctrine look, not shadcn's defaults.
 *
 * Loaded under Tailwind v4 via the `@config "../tailwind.config.ts"` bridge in
 * app/globals.css. Animation utilities come from the `tw-animate-css` CSS import
 * (v4-native), so no JS animation plugin is declared here. Per the bridge's
 * limitations, do NOT add corePlugins/safelist/separator to this config.
 */
const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core (Doctrine §6)
        yellow: "#EDC001", // brand-yellow — primary actions, selected emphasis, progress
        paper: "#FDFDFD", // surface-primary — main app background
        ink: "#000000", // ink-primary — primary text, secondary brand identity
        "surface-raised": "#FFFFFF",
        "surface-muted": "#F5F5F2",
        "surface-subtle": "#FAFAF7",
        "border-soft": "#E8E8E2",
        "border-strong": "#D7D7CF",
        "ink-secondary": "#5F5F59",
        "ink-tertiary": "#85857E",
        "disabled-surface": "#F0F0EC",
        "disabled-ink": "#9A9A94",
        // Semantic (Doctrine §7) — bg/border/ink triplets
        complete: { bg: "#EAF2E9", border: "#C9DDC8", ink: "#49684D" },
        overdue: { bg: "#F8E9E7", border: "#E8C4C0", ink: "#8A413B" },
        pending: { bg: "#F1E9E9", border: "#DDCECF", ink: "#73595C" },
        reach: { bg: "#FFF5C7", border: "#ECD978", ink: "#695600" },
        target: { bg: "#EAF1F8", border: "#C8D8E8", ink: "#365A79" },
        safety: { bg: "#EAF2E9", border: "#C9DDC8", ink: "#45664A" },
        error: { bg: "#F8E7E5", border: "#E5B8B3", ink: "#8D352E" },
        // Glass tokens (Doctrine §12.2) — used for selected nav, panels, modals; never every card
        glass: "rgba(255,255,255,.72)",
        "glass-heavy": "rgba(255,255,255,.84)",
        // shadcn/ui structural tokens → CSS vars (resolve to Doctrine colours in globals.css)
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
      },
      fontFamily: {
        // Satoshi loaded via Fontshare in globals.css (Doctrine §9.1) — no second typeface
        sans: ["Satoshi", "Helvetica Neue", "Arial", "sans-serif"],
      },
      borderRadius: {
        // Doctrine §11.1
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
        pill: "999px",
      },
      boxShadow: {
        // Glass elevation (Doctrine §12.2)
        glass: "0 8px 30px rgba(0,0,0,.06)",
        "glass-float": "0 18px 60px rgba(0,0,0,.08)",
      },
      backdropBlur: {
        glass: "14px",
      },
    },
  },
  plugins: [],
};

export default config;
