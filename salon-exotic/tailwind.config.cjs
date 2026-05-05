module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        blackline: {
          DEFAULT: '#000000',
          surface: '#0A0A0A',
          accent: '#C0C0C0',
          muted: '#9CA3AF'
        }
      }
    },
  },
  plugins: [],
}
