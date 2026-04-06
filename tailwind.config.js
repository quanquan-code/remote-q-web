/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 主色调 - 深蓝灰，专业沉稳
        primary: '#1E3A5F',
        'primary-light': '#E8EEF4',
        'primary-dark': '#152942',
        // 辅助色 - 森林绿，用于成功/可用状态
        secondary: '#059669',
        'secondary-light': '#ECFDF5',
        // 强调色 - 琥珀色，用于紧急/高亮
        accent: '#D97706',
        'accent-light': '#FEF3C7',
        // 中性色 - 更柔和的灰度
        'gray-50': '#F8FAFC',
        'gray-100': '#F1F5F9',
        'gray-200': '#E2E8F0',
        'gray-300': '#CBD5E1',
        'gray-400': '#94A3B8',
        'gray-500': '#64748B',
        'gray-600': '#475569',
        'gray-700': '#334155',
        'gray-800': '#1E293B',
        'gray-900': '#0F172A',
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