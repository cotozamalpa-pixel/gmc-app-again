import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        muzenza: {
          black: '#0a0a0a',
          red: '#c8102e',
          yellow: '#f2b705'
        }
      }
    }
  },
  plugins: []
};
export default config;
