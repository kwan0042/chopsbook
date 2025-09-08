// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  // 強制 Tailwind v4 使用 PostCSS
  css: {
    processor: "postcss",
  },
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [require("tailwind-scrollbar-hide")],
};
