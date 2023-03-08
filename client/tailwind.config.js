/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    //"./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        //'reward-token': "url('/img/asset_COMP.svg')",
        //'footer-texture': "url('/img/footer-texture.png')",
      },
      colors: {
        'app-bg': '#070A0E',
      },
    },
  },
  plugins: [],
}
