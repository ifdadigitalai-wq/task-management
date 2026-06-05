import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "sans-serif"],
      },
      fontSize: {
        xs: ["var(--font-size-xs)", { lineHeight: "var(--line-height-tight)" }],
        sm: ["var(--font-size-sm)", { lineHeight: "var(--line-height-normal)" }],
        base: ["var(--font-size-base)", { lineHeight: "var(--line-height-normal)" }],
        md: ["var(--font-size-md)", { lineHeight: "var(--line-height-normal)" }],
        lg: ["var(--font-size-lg)", { lineHeight: "var(--line-height-normal)" }],
        xl: ["var(--font-size-xl)", { lineHeight: "var(--line-height-normal)" }],
        "2xl": ["var(--font-size-2xl)", { lineHeight: "var(--line-height-tight)" }],
        "3xl": ["var(--font-size-3xl)", { lineHeight: "var(--line-height-tight)" }],
      },
      colors: {
        brand: {
          DEFAULT: "var(--brand)",
          hover: "var(--brand-hover)",
          light: "var(--brand-light)",
          text: "var(--brand-text)",
        },
        bg: "var(--color-bg)",
        surface: {
          DEFAULT: "var(--color-surface)",
          raised: "var(--color-surface-raised)",
        },
        border: {
          DEFAULT: "var(--color-border)",
          strong: "var(--color-border-strong)",
        },
        text: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          tertiary: "var(--color-text-tertiary)",
          disabled: "var(--color-text-disabled)",
        },
        status: {
          "todo-bg": "var(--status-todo-bg)",
          "todo-text": "var(--status-todo-text)",
          "progress-bg": "var(--status-progress-bg)",
          "progress-text": "var(--status-progress-text)",
          "review-bg": "var(--status-review-bg)",
          "review-text": "var(--status-review-text)",
          "done-bg": "var(--status-done-bg)",
          "done-text": "var(--status-done-text)",
          "cancelled-bg": "var(--status-cancelled-bg)",
          "cancelled-text": "var(--status-cancelled-text)",
        },
        priority: {
          "low-bg": "var(--priority-low-bg)",
          "low-text": "var(--priority-low-text)",
          "medium-bg": "var(--priority-medium-bg)",
          "medium-text": "var(--priority-medium-text)",
          "high-bg": "var(--priority-high-bg)",
          "high-text": "var(--priority-high-text)",
          "critical-bg": "var(--priority-critical-bg)",
          "critical-text": "var(--priority-critical-text)",
        },
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
      },
    },
  },
  plugins: [],
};

export default config;
