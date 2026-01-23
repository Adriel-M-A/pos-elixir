const plugin = require('tailwindcss/plugin')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {}
  },
  plugins: [
    plugin(function ({ addUtilities }) {
      addUtilities(
        {
          /* Thin scrollbar (WebKit) */
          '.scrollbar-thin::-webkit-scrollbar': { width: '8px', height: '8px' },
          '.scrollbar-thin::-webkit-scrollbar-track': {
            background: 'var(--color-scrollbar-track)',
            borderRadius: '9999px'
          },
          '.scrollbar-thin::-webkit-scrollbar-thumb': {
            backgroundColor: 'var(--color-scrollbar-thumb)',
            borderRadius: '9999px',
            border: '2px solid transparent',
            backgroundClip: 'padding-box',
            transition: 'background-color .15s ease, box-shadow .15s ease'
          },
          '.scrollbar-thin::-webkit-scrollbar-thumb:hover': {
            backgroundColor: 'var(--color-scrollbar-thumb-hover)',
            boxShadow: '0 0 0 3px rgba(0,0,0,0.06)'
          },
          /* Thin scrollbar (Firefox) */
          '.scrollbar-thin': { 'scrollbar-width': 'thin' },

          /* No scrollbar */
          '.no-scrollbar::-webkit-scrollbar': { display: 'none' },
          '.no-scrollbar': { 'scrollbar-width': 'none', '-ms-overflow-style': 'none' },

          /* Scroll gap utilities */
          '.scroll-gap': { 'scrollbar-gutter': 'stable', 'padding-inline-end': '8px' },
          '.scroll-gap-sm': { 'scrollbar-gutter': 'stable', 'padding-inline-end': '6px' },
          '.scroll-gap-lg': { 'scrollbar-gutter': 'stable', 'padding-inline-end': '12px' }
        },
        { variants: ['responsive'] }
      )
    })
  ]
}
