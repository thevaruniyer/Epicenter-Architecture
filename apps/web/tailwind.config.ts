import type { Config } from "tailwindcss";

// Bootstrap Tailwind config. The full UI/UX Doctrine token set (Epicenter
// Yellow #EDC001, #FDFDFD, #000000, semantic/radius/glass tokens, Satoshi)
// is ported into this file in Stage 0 Prompt 0.3, before any component is
// generated — see architecture doc §0 for the exact block.
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
