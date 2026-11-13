/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#1769FF', deep: '#0A2B68', ink: '#080D18', soft: '#F5F8FF', line: '#E5EAF2', muted: '#64748B' },
      },
      fontFamily: { sans: ['Manrope', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      boxShadow: { card: '0 1px 2px rgba(10,43,104,.05), 0 8px 24px -12px rgba(10,43,104,.18)', lift: '0 18px 40px -18px rgba(23,105,255,.45)' },
      keyframes: { rise: { '0%': { opacity: 0, transform: 'translateY(14px)' }, '100%': { opacity: 1, transform: 'none' } }, floaty: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } } },
      animation: { rise: 'rise .6s ease both', floaty: 'floaty 6s ease-in-out infinite' },
    },
  },
  plugins: [],
};
