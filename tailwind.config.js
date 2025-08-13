/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Design System Color Palette
        background: "#000000",
        primaryText: "#FFFFFF",
        secondaryText: "#CCCCCC",
        accent: "#FFFFFF",
        border: "#333333",
        // Gradient highlight from design system
        highlight: {
          from: "#f6d365",
          to: "#fda085",
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'hero': 'clamp(2.5rem, 5vw, 5rem)',
        'section': '2rem',
        'subheading': '1.25rem',
      },
      letterSpacing: {
        'hero': '0.05em',
        'body': '0.01em',
      },
      lineHeight: {
        'heading': '1.1',
        'body': '1.6',
      },
      spacing: {
        'section': '6rem',
        'component': '2rem',
      },
      maxWidth: {
        'content': '1000px',
        'max': '1200px',
      },
      borderRadius: {
        'pill': '9999px',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'fadeIn': 'fadeIn 0.5s ease-in-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backdropBlur: {
        'glass': '20px',
      },
    },
  },
  plugins: [],
} 