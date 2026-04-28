/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: { bg: '#09090b', card: '#18181b', border: '#27272a', surface: '#27272a' },
        brand: { primary: '#f97316', accent: '#eab308', danger: '#ef4444', success: '#22c55e' }
      }
    }
  },
  plugins: []
}