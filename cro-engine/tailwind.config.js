/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(220 13% 91%)",
        input: "hsl(220 13% 91%)",
        ring: "hsl(221 83% 53%)",
        background: "hsl(0 0% 100%)",
        foreground: "hsl(224 71% 4%)",
        primary: { DEFAULT: "hsl(221 83% 53%)", foreground: "hsl(210 40% 98%)" },
        secondary: { DEFAULT: "hsl(220 14% 96%)", foreground: "hsl(220 9% 46%)" },
        destructive: { DEFAULT: "hsl(0 84% 60%)", foreground: "hsl(210 40% 98%)" },
        muted: { DEFAULT: "hsl(220 14% 96%)", foreground: "hsl(220 9% 46%)" },
        accent: { DEFAULT: "hsl(220 14% 96%)", foreground: "hsl(224 71% 4%)" },
        card: { DEFAULT: "hsl(0 0% 100%)", foreground: "hsl(224 71% 4%)" },
      },
      borderRadius: {
        lg: "0.5rem",
        md: "calc(0.5rem - 2px)",
        sm: "calc(0.5rem - 4px)",
      },
    },
  },
  plugins: [],
};
