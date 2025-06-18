// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export const content = [
    "./src/**/*.{js,jsx,ts,tsx}",
];
export const theme = {
    extend: {
        colors: {
            primary: '#8A2BE2', // BlueViolet
            secondary: '#FF1493', // DeepPink
            dark: '#0B0019', // Deep Purple/Navy
            light: '#1A0D2A',
            "text-primary": '#EAE6F0',
            "text-secondary": '#A9A1B8',
        },
        fontFamily: {
            heading: ['Sora', 'sans-serif'],
            body: ['Inter', 'sans-serif'],
        },
        backdropBlur: {
            'xl': '20px',
        }
    },
};
export const plugins = [];