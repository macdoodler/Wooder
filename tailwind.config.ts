import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
content: {
  files: [
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
},
  theme: {
    extend: {
      colors: {
        'brand-orange': '#F97316',
        'off-white': '#FFFBF7',
        'dark-gray': '#1F2937',
      },
      borderRadius: {
        medium: '10px',
        small: '8px',
      },
      boxShadow: {
        soft: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      
    },
  },
  plugins: [],
  
}

export default config