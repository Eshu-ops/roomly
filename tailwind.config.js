/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        card: 'var(--card)',
        ink: 'var(--ink)',
        line: 'var(--line)',
        accent: 'var(--accent)',
      },
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
        serif: ['"Source Serif 4"', 'serif'],
      },
      borderRadius: { xl2: '18px' },
    },
  },
  plugins: [],
};
