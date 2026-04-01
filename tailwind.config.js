/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // <-- Dòng này giúp Tailwind biết chỗ nào cần tô màu
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}