/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      fontFamily: {
        sans: ["var(--bc-font-sans)"],
        display: ["var(--bc-font-display)"],
      },
      colors: {
        brand: {
          primary: "rgb(var(--bc-primary) / <alpha-value>)",
          accent: "rgb(var(--bc-accent) / <alpha-value>)",
          warning: "rgb(var(--bc-warn) / <alpha-value>)",
          dark: "rgb(var(--bc-ink) / <alpha-value>)",
          bg: "rgb(var(--bc-bg) / <alpha-value>)",
          card: "rgb(var(--bc-card) / <alpha-value>)",
          border: "rgb(var(--bc-border) / <alpha-value>)",
          muted: "rgb(var(--bc-muted) / <alpha-value>)",
        },
      },
      borderRadius: {
        card: "var(--bc-radius-card)",
        control: "var(--bc-radius-control)",
      },
      boxShadow: {
        subtle: "var(--bc-shadow-soft)",
        ambient: "var(--bc-shadow)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
