/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        'bg-deep': '#f5f5f7',
        'bg-panel': '#ffffff',
        'bg-card': '#f0f0f2',
        'border-soft': '#e5e5ea',
        'border-hover': '#d1d1d6',
        'accent': '#0071e3',
        'accent-light': '#e8f4fd',
        'text-primary': '#1d1d1f',
        'text-secondary': '#6e6e73',
        'text-dim': '#aeaeb2',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
        'panel': '0 2px 8px rgba(0, 0, 0, 0.06)',
        'float': '0 8px 30px rgba(0, 0, 0, 0.08)',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
      },
    },
  },
  plugins: [],
}
