/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // 미니멀 흑백 팔레트
        surface: {
          DEFAULT: '#ffffff',
          subtle: '#f5f5f5',
          muted: '#e8e8e8',
        },
        ink: {
          DEFAULT: '#0a0a0a',
          secondary: '#404040',
          tertiary: '#737373',
          disabled: '#a3a3a3',
        },
        border: {
          DEFAULT: '#e5e5e5',
          strong: '#d4d4d4',
        },
      },
      fontFamily: {
        sans: ['System'],
        mono: ['SpaceMono'],
      },
    },
  },
  plugins: [],
};
