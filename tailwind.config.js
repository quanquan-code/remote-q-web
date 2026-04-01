/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 主色调 - 温暖的珊瑚橙，活泼但不刺眼
        primary: '#FF6B6B',
        'primary-light': '#FFE5E5',
        'primary-dark': '#E85D5D',
        // 辅助色 - 清新的青绿色
        secondary: '#4ECDC4',
        'secondary-light': '#E5F7F6',
        // 强调色 - 明亮的黄色（用于紧急、高亮）
        accent: '#FFE66D',
        // 中性色 - Notion 风格的高级灰
        'gray-50': '#FAFAFA',
        'gray-100': '#F5F5F5',
        'gray-200': '#E5E5E5',
        'gray-300': '#D4D4D4',
        'gray-400': '#A3A3A3',
        'gray-500': '#737373',
        'gray-600': '#525252',
        'gray-700': '#404040',
        'gray-800': '#262626',
        'gray-900': '#171717',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.04)',
        'card': '0 4px 12px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)',
        'hover': '0 8px 24px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.02)',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
      }
    },
  },
  plugins: [],
}