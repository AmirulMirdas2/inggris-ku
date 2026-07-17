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
      // Bayangan ber-tint brand (bukan hitam generik) — kesan lembut & "mahal".
      boxShadow: {
        card: '0 1px 2px rgba(29,158,117,0.05), 0 10px 30px -14px rgba(29,158,117,0.15)',
      },
      transitionTimingFunction: {
        // ease keluar yang lembut (bukan 'ease' generik) untuk mikro-interaksi.
        soft: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'fade-up': { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: {
        'fade-up': 'fade-up 0.35s cubic-bezier(0.16,1,0.3,1) both',
      },
    },
  },
  plugins: [],
}
