/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // เพิ่ม Dark Mode ด้วย Class
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#0f1c33',
          900: '#13223e',
          850: '#17284a',
          750: '#1f3560',
          700: '#28406f',
        },
        brass: {
          DEFAULT: '#c9a24b',
          dim: 'rgba(201, 162, 75, 0.35)',
        },
        ink: {
          cream: '#f4efe3',
          muted: 'rgba(244, 239, 227, 0.62)',
          faint: 'rgba(244, 239, 227, 0.38)',
        },
        stamp: {
          red: '#d1483a',
          amber: '#dd9b34',
          teal: '#3fa189',
        },
        slate: {
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155',
        }
      },
      fontFamily: {
        display: ['Kanit', 'Sarabun', 'sans-serif'],
        body: ['Sarabun', 'Kanit', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
        prompt: ['Prompt', 'sans-serif'],
      },
      animation: {
        'gradient-bg': 'gradientBG 15s ease infinite',
        'rise': 'rise 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
      keyframes: {
        gradientBG: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        rise: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}