/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    // Retro 8-bit: TIDAK ADA sudut membulat di mana pun. Override total skala
    // radius supaya semua `rounded-*` lama (termasuk rounded-full) jadi kotak.
    borderRadius: {
      none: '0', sm: '0', DEFAULT: '0', md: '0', lg: '0',
      xl: '0', '2xl': '0', '3xl': '0', full: '0', card: '0',
    },
    extend: {
      // Palet diturunkan dari PICO-8 — palet 8-bit yang memang dirancang,
      // bukan warna karangan. Semua cerah & jenuh, tak ada yang kusam/gelap.
      colors: {
        brand: '#00C46A',        // hijau arcade (dulu #1D9E75 — terlalu gelap)
        lime: '#00E436',         // PICO-8 green: isian bar & aksen di dark mode
        accent: '#FFA300',       // PICO-8 orange: streak
        gold: '#FFEC27',
        coral: '#FF004D',        // PICO-8 red
        success: '#00B562',
        cream: '#FFF1E8',        // PICO-8 white — putih hangat
        ink: '#1D2B53',          // PICO-8 dark-blue: garis & bayangan (BUKAN hitam)
        // Ganti total skala `slate` bawaan Tailwind dengan skala biru-malam.
        // Satu perubahan ini me-reskin SEMUA `dark:bg-slate-*` / `text-slate-*`
        // di aplikasi — mode gelap jadi navy, bukan hitam pekat.
        slate: {
          50: '#FFF1E8', 100: '#EDE6DC', 200: '#C2C3C7', 300: '#9BA3C0',
          400: '#7E88A8', 500: '#5F6B94', 600: '#44507E', 700: '#2E3A66',
          800: '#243057', 900: '#1D2B53', 950: '#141E3C',
        },
      },
      fontFamily: {
        // Body: pixel tapi tetap terbaca untuk paragraf Bahasa Indonesia.
        sans: ['"Pixelify Sans"', 'system-ui', 'sans-serif'],
        // Display/tombol/angka: arcade sejati, hanya untuk teks pendek.
        pixel: ['"Press Start 2P"', 'ui-monospace', 'monospace'],
      },
      // Bayangan keras tanpa blur — sprite dicetak di atas layar, bukan melayang.
      boxShadow: {
        card: '4px 4px 0 0 #1D2B53',
        pixel: '4px 4px 0 0 #1D2B53',
        'pixel-sm': '2px 2px 0 0 #1D2B53',
      },
      transitionTimingFunction: {
        // Gerak per-frame ala sprite, bukan easing halus.
        soft: 'steps(4, end)',
        pixel: 'steps(8, end)',
      },
      keyframes: {
        'fade-up': { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        blink: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.35' } },
        // Sprite 8-bit tidak melayang mulus — ia lompat antara DUA posisi.
        bob: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-4px)' } },
        flicker: { '0%, 100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.12)' } },
        'grid-scroll': { to: { backgroundPosition: '0 32px, 32px 0, 0 0' } },
      },
      animation: {
        'fade-up': 'fade-up 0.24s steps(4, end) both',
        blink: 'blink 1s steps(2, end) infinite',
        // steps(1) = pindah posisi seketika, tanpa interpolasi. Itu kuncinya.
        bob: 'bob 0.9s steps(1, end) infinite',
        flicker: 'flicker 0.4s steps(1, end) infinite',
      },
    },
  },
  plugins: [],
}
