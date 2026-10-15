import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        blue: { DEFAULT: '#007AFF' },
        green: { DEFAULT: '#34C759' },
        red: { DEFAULT: '#FF3B30' },
        orange: { DEFAULT: '#FF9500' },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '22px',
      },
    },
  },
  plugins: [],
}

export default config
