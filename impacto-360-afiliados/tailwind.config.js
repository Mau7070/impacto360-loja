/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        impact: {
          orange: '#ea580c',
          dark: '#111827',
          muted: '#64748b',
          soft: '#f8fafc',
        },
      },
      boxShadow: {
        impact: '0 18px 50px rgba(15, 23, 42, .15)',
      },
    },
  },
  plugins: [],
}
