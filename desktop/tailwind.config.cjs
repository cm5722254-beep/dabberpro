/** @type {import("tailwindcss").Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "Noto Sans Khmer", "sans-serif"],
        khmer: ["Noto Sans Khmer", "Inter", "sans-serif"],
      },
      colors: {
        navy: {
          950: "#060913",
          900: "#090d17",
          800: "#0d1220",
          700: "#111929",
          600: "#151d2e",
          500: "#1a2438",
          400: "#1e2b42",
          300: "#243249",
        },
        cyan: {
          glow: "#67d9ff",
          bright: "#48d5fa",
          mid: "#31b9d9",
          dim: "#1689a8",
        },
        purple: {
          glow: "#c4a8ff",
          mid: "#9b8aff",
          dim: "#6b5fa0",
        },
        green: {
          glow: "#66e4c2",
          mid: "#36d7a1",
          dim: "#1e8b79",
        },
        amber: {
          glow: "#ffce77",
          mid: "#f0a832",
        },
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.2s ease-in-out",
        "slide-in": "slideIn 0.25s ease-out",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideIn: { "0%": { transform: "translateY(4px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
      },
    },
  },
  plugins: [],
};
