/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      colors: {
        ink: '#111827',
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c'
        },
        ocean: {
          500: '#0891b2',
          600: '#0e7490'
        }
      },
      boxShadow: {
        soft: '0 18px 50px rgba(15, 23, 42, 0.10)'
      }
    }
  },
  plugins: []
}
