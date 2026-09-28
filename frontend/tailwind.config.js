/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#C1F3BA', // Soft pastel light mint / sage green
          foreground: '#0A0E08',
          hover: '#ADE8A5',
          accent: '#7EE081',
        },
        secondary: {
          DEFAULT: '#141712',
          foreground: '#C1F3BA',
        },
        accent: {
          DEFAULT: '#C1F3BA',
          light: '#DDFBE1',
          soft: '#EAF8E8',
          coral: '#FF6554',
          cyan: '#15E6CD',
        },
        dark: {
          DEFAULT: '#0D1109',
          surface: '#151A12',
          card: '#1C2318',
          border: '#273322',
        },
        background: '#FAFDF4',
        surface: '#FFFFFF',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#FF6554',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'lime-glow': '0 0 25px -4px rgba(206, 253, 55, 0.45)',
        'dark-card': '0 20px 40px -15px rgba(0, 0, 0, 0.15)',
      }
    },
  },
  plugins: [],
}
