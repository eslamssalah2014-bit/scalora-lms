/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb', // Primary Blue
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#0f172a', // Dark Navy
        },
        scalora: {
          navy: '#082B5B',
          dark: '#04152D',
          deeper: '#020C1B',
          blue: '#2563EB',
          hover: '#1D4ED8',
          accent: '#3B82F6',
          light: '#F8FAFC',
          muted: '#64748B',
          card: '#0A346E',
          border: '#E2E8F0',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #04152D 0%, #082B5B 60%, #0D3E82 100%)',
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
        'card-gradient': 'linear-gradient(180deg, rgba(8, 43, 91, 0.7) 0%, rgba(4, 21, 45, 0.9) 100%)',
        'accent-gradient': 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
        'saas-hero': 'linear-gradient(180deg, #F0F7FF 0%, #FFFFFF 100%)',
      },
      boxShadow: {
        'glow-blue': '0 0 25px rgba(37, 99, 235, 0.35)',
        'glow-accent': '0 0 30px rgba(59, 130, 246, 0.3)',
        'card-hover': '0 20px 40px -15px rgba(15, 23, 42, 0.08)',
        'saas-card': '0 2px 10px 0 rgba(15, 23, 42, 0.04), 0 1px 3px 0 rgba(15, 23, 42, 0.02)',
        'saas-hover': '0 20px 30px -10px rgba(37, 99, 235, 0.12), 0 10px 15px -3px rgba(15, 23, 42, 0.05)',
      },
    },
  },
  plugins: [],
};
