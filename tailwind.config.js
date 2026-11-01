/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        paper: '#FAFAF8',
        navy: {
          50: '#f3f6fa',
          100: '#e4eaf3',
          200: '#c7d3e5',
          300: '#9fb2cf',
          400: '#6f89b3',
          500: '#4b6a99',
          600: '#37537f',
          700: '#2a4266',
          800: '#1e3050',
          900: '#14213a',
        },
        sage: {
          50: '#f3f9f5',
          100: '#e1f0e6',
          200: '#c3e0cd',
          300: '#98c9aa',
          400: '#74b48b',
          500: '#5fa777',
          600: '#4a8d62',
          700: '#3d7250',
        },
        sand: {
          50: '#fbf8f2',
          100: '#f5efe3',
          200: '#ebdfc8',
          400: '#d9b878',
          500: '#c9a05a',
        },
      },
      boxShadow: {
        soft: '0 1px 2px rgba(20,33,58,0.04), 0 4px 16px rgba(20,33,58,0.04)',
        lift: '0 2px 4px rgba(20,33,58,0.05), 0 12px 28px rgba(20,33,58,0.08)',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: {
          from: { opacity: 0, transform: 'translateY(12px) scale(0.98)' },
          to: { opacity: 1, transform: 'translateY(0) scale(1)' },
        },
        pop: {
          '0%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(1.18)' },
          '100%': { transform: 'scale(1)' },
        },
        flame: {
          '0%,100%': { transform: 'rotate(-3deg) scale(1)' },
          '50%': { transform: 'rotate(3deg) scale(1.08)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn .25s ease-out both',
        slideUp: 'slideUp .3s cubic-bezier(.2,.8,.2,1) both',
        pop: 'pop .35s ease-out',
        flame: 'flame 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
