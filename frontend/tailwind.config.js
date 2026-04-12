/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        agent: {
          deployer: '#FF6B6B',
          distributor: '#4ECDC4',
          swapper: '#FFE66D',
          extractor: '#95E1D3'
        }
      }
    }
  },
  plugins: []
};
