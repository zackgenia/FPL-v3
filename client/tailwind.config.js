/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fpl: {
          forest: '#228B22',
          olive: '#6B8E23',
          pine: '#01796F',
          sage: '#9DC183',
          mint: '#98FB98',
        }
      }
    },
  },
  plugins: [],
}
