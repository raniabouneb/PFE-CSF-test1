import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "csf-blue": "var(--csf-blue)",
        "csf-green": "var(--csf-green)",
        "csf-light": "var(--csf-light)",
      },
    },
  },
  plugins: [],
}

export default config
