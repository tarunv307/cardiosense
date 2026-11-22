/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Master CardioSense Palette (Royal Medical Blue & Slate)
        canvas: '#F5F8FC',
        surface: '#FFFFFF',
        navy: {
          DEFAULT: '#0F1E36',
          secondary: '#4B5E7D',
          muted: '#687C9E',
          dark: '#091222',
        },
        action: {
          DEFAULT: '#1542A1',
          hover: '#0F317B',
        },
        teal: {
          DEFAULT: '#1E60E2',
          light: '#EEF4FF',
          50: '#F0F6FE',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          500: '#1E60E2',
          600: '#1A53C5',
          700: '#1542A1',
          800: '#0F317B',
        },
        border: {
          DEFAULT: '#D8E2F0',
          subtle: '#D8E2F0',
        },
        status: {
          success: '#176B45',
          'success-bg': '#E8F5ED',
          warning: '#8A5700',
          'warning-bg': '#FFF4D6',
          critical: '#B42335',
          'critical-bg': '#FDEBEC',
          info: '#1E60E2',
          'info-bg': '#EEF4FF',
        },
        ecg: {
          waveform: '#1E60E2',
          grid: '#DFE8F5',
          event: '#B42335',
          sample: '#8A5700',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(15, 30, 54, 0.05), 0 1px 2px -1px rgba(15, 30, 54, 0.05)',
        'card': '0 1px 3px 0 rgba(15, 30, 54, 0.04), 0 4px 6px -2px rgba(15, 30, 54, 0.02)',
        'elevated': '0 10px 25px -5px rgba(15, 30, 54, 0.08), 0 8px 10px -6px rgba(15, 30, 54, 0.04)',
      }
    },
  },
  plugins: [],
}
