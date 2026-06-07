/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'magic-purple': '#8B5CF6',
        'magic-pink': '#EC4899',
        'magic-blue': '#3B82F6',
        'magic-green': '#10B981',
        'magic-gold': '#F59E0B',
        'dark-bg': '#0F0A1F',
        'dark-card': '#1A1033',
        'dark-border': '#2D1F54'
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px #8B5CF6, 0 0 10px #8B5CF6' },
          '100%': { boxShadow: '0 0 20px #8B5CF6, 0 0 30px #EC4899' },
        }
      }
    },
  },
  plugins: [],
}
