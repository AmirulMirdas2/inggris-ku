/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: '#1D9E75',        // primary hijau-teal
        accent: '#EF9F27',       // amber / streak
        coral: '#D85A30',        // error lembut
        success: '#639922',
        cream: '#FAF8F2',        // latar off-white hangat
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Nunito', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '18px',
      },
    },
  },
  plugins: [],
}
