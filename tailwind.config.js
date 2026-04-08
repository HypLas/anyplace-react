/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        rouge: { DEFAULT: '#E8001C', dk: '#B8001A' },
        or:    { DEFAULT: '#F5C42E', lt: '#FFD95A', dk: '#C9A000' },
        noir:  { DEFAULT: '#0D0D12', 2: '#13131A', 3: '#1C1C26' },
        gris:  { DEFAULT: '#252535', lt: '#3C3C52' },
        creme: { DEFAULT: '#F0F0F5', dim: '#9090A8' },
      },
      fontFamily: {
        display: ["'Barlow Condensed'", 'sans-serif'],
        heading: ["'Barlow Condensed'", 'sans-serif'],
        body:    ["'Barlow'", 'sans-serif'],
      },
    },
  },
  plugins: [],
};
