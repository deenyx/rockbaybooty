/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#6366f1",
        secondary: "#ec4899",
        obsidian: '#060304',
        burgundy: {
          950: '#120508',
          900: '#22080e',
          800: '#4b1022',
          700: '#6d1430',
          600: '#8c1f43',
          500: '#a0354f',
        },
        champagne: '#d4b16a',
      },
      keyframes: {
        glowPulse: {
          '0%, 100%': {
            boxShadow: '0 18px 55px rgba(167, 108, 46, 0.28)',
            transform: 'translateY(0px)',
          },
          '50%': {
            boxShadow: '0 24px 75px rgba(212, 177, 106, 0.4)',
            transform: 'translateY(-2px)',
          },
        },
        floatSlow: {
          '0%, 100%': {
            transform: 'translateY(0px)',
          },
          '50%': {
            transform: 'translateY(-8px)',
          },
        },
        confetti: {
          '0%': {
            opacity: '0',
            transform: 'translate3d(0, -18px, 0) rotate(0deg) scale(0.8)',
          },
          '12%': {
            opacity: '1',
          },
          '100%': {
            opacity: '0',
            transform: 'translate3d(var(--confetti-x), 110px, 0) rotate(var(--confetti-rotate)) scale(1)',
          },
        },
        riseFade: {
          '0%': {
            opacity: '0.15',
            transform: 'scale(0.82)',
          },
          '100%': {
            opacity: '0',
            transform: 'scale(1.08)',
          },
        },
      },
      animation: {
        'glow-pulse': 'glowPulse 2.8s ease-in-out infinite',
        'float-slow': 'floatSlow 8s ease-in-out infinite',
        'confetti-fall': 'confetti 950ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'rise-fade': 'riseFade 700ms ease-out forwards',
      },
    },
  },
  plugins: [],
}
