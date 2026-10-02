/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        'bg-deep': '#060d1a',
        'bg-panel': '#0d1829',
        'bg-card': '#111f35',
        'border-dark': '#1e3a5f',
        'border-bright': '#2e5a8f',
      },
    },
  },
  plugins: [],
}
