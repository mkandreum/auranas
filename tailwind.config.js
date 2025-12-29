/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Cyberpunk 2077 Theme
                background: "#0d0d0d",
                foreground: "#fef3c7",

                card: {
                    DEFAULT: "#0f0f0f",
                    foreground: "#fef3c7",
                },

                primary: {
                    DEFAULT: "#fcd34d",
                    foreground: "#000000",
                },

                secondary: {
                    DEFAULT: "#ef4444",
                    foreground: "#ffffff",
                },

                muted: {
                    DEFAULT: "#1a1a1a",
                    foreground: "#a8a29e",
                },

                accent: {
                    DEFAULT: "#f59e0b",
                    foreground: "#000000",
                },

                destructive: {
                    DEFAULT: "#dc2626",
                    foreground: "#ffffff",
                },

                border: "#3d3d00",
                input: "#1a1a1a",
                ring: "#fcd34d",

                // Legacy colors for compatibility
                surface: "rgba(13, 13, 13, 0.9)",
            },
            fontFamily: {
                sans: ['Rajdhani', 'Orbitron', 'Inter', 'sans-serif'],
                mono: ['Orbitron', 'monospace'],
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-out',
                'zoom-in': 'zoomIn 0.2s ease-out',
                'glitch': 'glitch 0.3s ease infinite',
                'pulse-neon': 'pulseNeon 2s ease-in-out infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                zoomIn: {
                    '0%': { transform: 'scale(0.95)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
                glitch: {
                    '0%': { transform: 'translate(0)' },
                    '20%': { transform: 'translate(-2px, 2px)' },
                    '40%': { transform: 'translate(2px, -2px)' },
                    '60%': { transform: 'translate(-2px, -2px)' },
                    '80%': { transform: 'translate(2px, 2px)' },
                    '100%': { transform: 'translate(0)' },
                },
                pulseNeon: {
                    '0%, 100%': { opacity: '1', filter: 'brightness(1)' },
                    '50%': { opacity: '0.8', filter: 'brightness(1.2)' },
                }
            }
        },
    },
    plugins: [],
}
