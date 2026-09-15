/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      colors: {
        blush: {
          50: '#fdf3f5',
          100: '#fbe6ea',
          200: '#f6cdd6',
          300: '#efa9b9',
          400: '#e57893',
          500: '#d64f72',
          600: '#bd345a',
          700: '#9c2749',
          800: '#82223f',
          900: '#6f1f39',
        },
        plum: {
          50: '#f6f4fb',
          100: '#ece7f6',
          200: '#dcd2ee',
          300: '#c1adde',
          400: '#a281c9',
          500: '#8760b3',
          600: '#71489a',
          700: '#5e3a7f',
          800: '#4f3168',
          900: '#372345',
        },
        ink: {
          950: '#0f0b13',
          900: '#171119',
          800: '#231b28',
        },
      },
      boxShadow: {
        soft: '0 10px 40px -12px rgba(94, 41, 74, 0.25)',
        glow: '0 0 0 1px rgba(255,255,255,0.06), 0 20px 60px -20px rgba(214, 79, 114, 0.35)',
      },
      backgroundImage: {
        'romantic-radial': 'radial-gradient(circle at 20% 20%, rgba(230,120,150,0.18), transparent 45%), radial-gradient(circle at 80% 0%, rgba(135,96,179,0.18), transparent 40%)',
      },
    },
  },
  plugins: [],
};
