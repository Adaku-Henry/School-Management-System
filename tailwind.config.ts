import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0f2a4a",
          50: "#eef3f8",
          100: "#d6e2ee",
          200: "#adc5dd",
          300: "#84a8cc",
          400: "#5b8bbb",
          500: "#356ea6",
          600: "#285783",
          700: "#1c4060",
          800: "#132c44",
          900: "#0f2a4a",
          950: "#091b30",
        },
        brandYellow: {
          DEFAULT: "#f5b301",
          50: "#fffbea",
          100: "#fff3c4",
          200: "#ffe58a",
          300: "#ffd451",
          400: "#f5b301",
          500: "#d99900",
          600: "#b37b00",
        },
        brandGreen: {
          DEFAULT: "#1e7e34",
          50: "#eafbf0",
          100: "#c8f2d8",
          200: "#96e4b4",
          300: "#5fd08c",
          400: "#2fb968",
          500: "#1e7e34",
          600: "#166529",
          700: "#124f21",
        },
      },
    },
  },
  plugins: [],
};
export default config;
