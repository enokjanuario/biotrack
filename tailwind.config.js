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
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9', // Azul principal
          600: '#0284c7',
          700: '#0369a1',
        },
        secondary: {
          400: '#34d399', // Verde para métricas positivas
          500: '#10b981',
        },
        warning: {
          500: '#f59e0b', // Laranja para alertas
        },
        danger: {
          500: '#ef4444', // Vermelho para métricas negativas
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