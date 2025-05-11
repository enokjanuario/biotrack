/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
      './src/components/**/*.{js,ts,jsx,tsx,mdx}',
      './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
      extend: {
        colors: {
          blue: {
            50: '#e6f3ff',
            100: '#cce7ff',
            200: '#99c9ff',
            300: '#66abff',
            400: '#338dff',
            500: '#006FFF',
            600: '#0059cc',
            700: '#004399',
            800: '#002c66',
            900: '#001633',
          },
        },
        fontFamily: {
          sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        },
      },
    },
    plugins: [
      require('@tailwindcss/forms'),
    ],
  }