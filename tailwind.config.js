/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    "./*.html",
    "./js/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#070D1B',
          900: '#0A192F',
          800: '#112240',
          700: '#1D3557'
        },
        teal: {
          50: '#FDFBF7',     /* Ultra-light champagne cream */
          100: '#FEF3C7',    /* Soft luminous gold wash */
          200: '#FDE68A',    /* Pale sunny gold */
          300: '#FCD34D',    /* Light gold */
          400: '#FBBF24',    /* Warm gold */
          500: '#F59E0B',    /* Vibrant gold */
          600: '#D97706',    /* Refined deep fiduciary gold */
          700: '#B45309',    /* Warm burnished gold */
          800: '#92400E',    /* Deep bronze gold */
          900: '#78350F'     /* Midnight bronze gold */
        },
        gold: {
          50: '#FDFBF6',
          100: '#FBF5E5',
          200: '#F6E7C4',
          300: '#ECD399',
          400: '#DFBA6A',
          500: '#D4AF37',    /* Classic Metallic Gold */
          600: '#B89228',
          700: '#94721E',
          800: '#775A1C',
          900: '#644A1B'
        },
        champagne: {
          50: '#FAF7EE',
          100: '#F5EEDB',
          200: '#EADBB8',
          300: '#DFBA6A',
          400: '#D4AF37'
        },
        amber: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309'
        }
      },
      fontFamily: {
        serif: ['Lora', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};
