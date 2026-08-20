/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        scalora: {
          navy: '#082B5B',
          dark: '#04152D',
          deeper: '#020C1B',
          blue: '#2D8CFF',
          hover: '#1A78EC',
          accent: '#00D2FF',
          light: '#F5F7FA',
          muted: '#8A99AD',
          card: '#0A346E',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #04152D 0%, #082B5B 60%, #0D3E82 100%)',
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
        'card-gradient': 'linear-gradient(180deg, rgba(8, 43, 91, 0.7) 0%, rgba(4, 21, 45, 0.9) 100%)',
        'accent-gradient': 'linear-gradient(135deg, #2D8CFF 0%, #00D2FF 100%)',
      },
      boxShadow: {
        'glow-blue': '0 0 25px rgba(45, 140, 255, 0.35)',
        'glow-accent': '0 0 30px rgba(0, 210, 255, 0.3)',
        'card-hover': '0 20px 40px -15px rgba(8, 43, 91, 0.25)',
      },
    },
  },
  plugins: [],
};
