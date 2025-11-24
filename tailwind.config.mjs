/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            colors: {
                brand: {
                    blue: '#0066FF',        // Electric blue - más vibrante
                    'blue-light': '#00D9FF', // Bright cyan
                    'blue-deep': '#003D99',  // Deep blue
                    cyan: '#00D9FF',         // Bright cyan
                    dark: '#0f172a',
                    gray: '#F3F4F6',
                    green: '#00FF88',        // Energetic green para "ahorro"
                    orange: '#FF6B35',       // Orange para "urgencia"
                    purple: '#8B5CF6',       // Premium purple
                }
            },
            backgroundImage: {
                'gradient-water': 'linear-gradient(135deg, #00D9FF 0%, #0066FF 100%)',
                'gradient-energy': 'linear-gradient(135deg, #00FF88 0%, #00D9FF 100%)',
                'gradient-premium': 'linear-gradient(135deg, #8B5CF6 0%, #0066FF 100%)',
                'gradient-fire': 'linear-gradient(135deg, #FF6B35 0%, #FBBF24 100%)',
            },
            borderRadius: {
                '4xl': '2rem',
                '5xl': '2.5rem',
            },
            animation: {
                'fade-up': 'fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                'fade-in': 'fadeIn 0.8s ease-out',
                'slide-up': 'slideUp 0.6s ease-out',
                'slide-down': 'slideDown 0.6s ease-out',
                'pulse-soft': 'pulseSoft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'float': 'float 3s ease-in-out infinite',
                'float-delayed': 'float 3s ease-in-out 1.5s infinite',
                'glow': 'glow 2s ease-in-out infinite',
                'shimmer': 'shimmer 2.5s infinite',
            },
            keyframes: {
                fadeUp: {
                    '0%': {
                        opacity: '0',
                        transform: 'translateY(30px) scale(0.95)'
                    },
                    '100%': {
                        opacity: '1',
                        transform: 'translateY(0) scale(1)'
                    },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': {
                        opacity: '0',
                        transform: 'translateY(40px)'
                    },
                    '100%': {
                        opacity: '1',
                        transform: 'translateY(0)'
                    },
                },
                slideDown: {
                    '0%': {
                        opacity: '0',
                        transform: 'translateY(-40px)'
                    },
                    '100%': {
                        opacity: '1',
                        transform: 'translateY(0)'
                    },
                },
                pulseSoft: {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.7' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-20px)' },
                },
                glow: {
                    '0%, 100%': {
                        boxShadow: '0 0 20px rgba(0, 102, 255, 0.5)',
                    },
                    '50%': {
                        boxShadow: '0 0 40px rgba(0, 217, 255, 0.8)',
                    },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
            },
            boxShadow: {
                'glow-blue': '0 0 30px rgba(0, 102, 255, 0.4)',
                'glow-cyan': '0 0 30px rgba(0, 217, 255, 0.4)',
                'glow-green': '0 0 30px rgba(0, 255, 136, 0.4)',
                'glow-purple': '0 0 30px rgba(139, 92, 246, 0.4)',
            },
        },
    },
    plugins: [],
}
