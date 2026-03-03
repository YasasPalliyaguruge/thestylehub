import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        black: {
          DEFAULT: '#0A0A0A',
          primary: '#0A0A0A',
          pure: '#000000',
          dark: '#1A1A1A',
          medium: '#2D2D2D',
          light: '#A0A0A0',
        },
        gold: {
          DEFAULT: '#D4AF37',
          primary: '#D4AF37',
          light: '#F4E4C1',
          dark: '#8B7355',
          rose: '#B76E79',
          champagne: '#F7E7CE',
        },
        white: {
          DEFAULT: '#FFFFFF',
          pure: '#FFFFFF',
          off: '#FAFAFA',
          cream: '#FFF8E7',
        },
        accent: {
          red: '#FF6B6B',
          green: '#4ECDC4',
        },
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        heading: ['Inter', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      fontSize: {
        'hero-lg': ['140px', { lineHeight: '0.95', letterSpacing: '-0.03em' }],
        'hero-md': ['110px', { lineHeight: '1', letterSpacing: '-0.025em' }],
        'hero-sm': ['72px', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-xl': ['120px', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-lg': ['96px', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-md': ['72px', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'heading-xl': ['48px', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'heading-lg': ['36px', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'heading-md': ['24px', { lineHeight: '1.3' }],
        'body-lg': ['18px', { lineHeight: '1.5' }],
        'body': ['16px', { lineHeight: '1.5' }],
        'body-sm': ['14px', { lineHeight: '1.5' }],
      },
      letterSpacing: {
        'ultra-wide': '0.25em',
        'tighter': '-0.03em',
        'tight': '-0.025em',
      },
      spacing: {
        '18': '4.5rem',
        '128': '32rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'level-1': '0 2px 4px rgba(0,0,0,0.1)',
        'level-2': '0 4px 8px rgba(0,0,0,0.15)',
        'level-3': '0 8px 16px rgba(0,0,0,0.2)',
        'level-4': '0 16px 32px rgba(0,0,0,0.25)',
        'gold-glow': '0 0 20px rgba(212,175,55,0.3)',
        'gold-glow-lg': '0 0 40px rgba(212,175,55,0.4)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-gold': 'linear-gradient(135deg, #D4AF37 0%, #8B7355 50%, #F4E4C1 100%)',
        'gradient-dark': 'linear-gradient(180deg, #0A0A0A 0%, #1A1A1A 100%)',
      },
      animation: {
        'shimmer': 'shimmer 4s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        'float-slower': 'float 10s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
        'spin-slower': 'spin 8s linear infinite',
        'border-rotate': 'borderRotate 4s linear infinite',
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.8s ease-out forwards',
        'scale-in': 'scaleIn 0.5s ease-out forwards',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '200% center' },
          '100%': { backgroundPosition: '-200% center' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 20px rgba(212,175,55,0.3)' },
          '50%': { opacity: '0.8', boxShadow: '0 0 40px rgba(212,175,55,0.5)' },
        },
        borderRotate: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      transitionTimingFunction: {
        'luxury': 'cubic-bezier(0.4, 0.0, 0.2, 1)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      transitionDuration: {
        '400': '400ms',
      },
    },
  },
  plugins: [],
}

export default config
