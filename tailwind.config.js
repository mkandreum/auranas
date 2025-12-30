/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Cyberpunk 2077 Remastered Palette
                // Using CSS variables for dynamic runtime theming ability
                background: "var(--bg-color)",
                foreground: "var(--text-primary)",

                primary: {
                    DEFAULT: "var(--cyber-yellow)",
                    foreground: "#000000",
                },
                secondary: {
                    DEFAULT: "var(--holo-cyan)",
                    foreground: "#000000",
                },
                destructive: {
                    DEFAULT: "var(--samurai-red)",
                    foreground: "#ffffff",
                },
                muted: {
                    DEFAULT: "var(--bg-secondary)",
                    foreground: "var(--text-secondary)",
                },
                accent: {
                    DEFAULT: "var(--neon-orange)",
                    foreground: "#000000",
                },
                border: "var(--border-color)",
                input: "var(--bg-tertiary)",
                ring: "var(--cyber-yellow)",
            },
            fontFamily: {
                sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
                mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
            },
            backgroundImage: {
                'cyber-grid': "radial-gradient(circle at center, transparent 0%, #000 100%), linear-gradient(0deg, rgba(252, 238, 10, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(252, 238, 10, 0.03) 1px, transparent 1px)",
                'scanlines': "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))",
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-out',
                'zoom-in': 'zoomIn 0.2s ease-out',
                'glitch': 'glitch 3s infinite',
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'scanline': 'scanline 8s linear infinite',
                'hologram': 'hologram 4s ease-in-out infinite',
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
                    '2%': { transform: 'translate(-2px, 2px)' },
                    '4%': { transform: 'translate(2px, -2px)' },
                    '6%': { transform: 'translate(-2px, -2px)' },
                    '8%': { transform: 'translate(2px, 2px)' },
                    '10%': { transform: 'translate(0)' },
                    '100%': { transform: 'translate(0)' },
                },
                scanline: {
                    '0%': { transform: 'translateY(-100%)' },
                    '100%': { transform: 'translateY(100%)' },
                },
                hologram: {
                    '0%, 100%': { opacity: '1', filter: 'brightness(1) blur(0px)' },
                    '50%': { opacity: '0.8', filter: 'brightness(1.2) blur(1px)' },
                },
            }
        },
    },
    plugins: [],
}
