import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        vz: {
          red: "#ee0000",
          dark: "#000000",
          gray: "#f6f6f6",
        },
      },
    },
  },
  plugins: [],
};
export default config;
