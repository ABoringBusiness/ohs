/** @type {import('tailwindcss').Config} */
import { heroui } from "@heroui/react";
import typography from "@tailwindcss/typography";
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#C9B974", // nice yellow
        base: "#d3e3fd", // dark background also used for tooltips
        "base-dark": "#0D0F11",
        "base-secondary": "#fff", // lighter background
        "base-secondary-dark": "#000",
        danger: "#E76A5E",
        success: "#A5E75E",
        tertiary: "#fff", // gray, used for inputs
        "tertiary-dark": "#18181A",
        "tertiary-light": "#707A83", // lighter gray, used for borders and placeholder text
        "tertiary-light-dark": "#B7BDC2",
        content: "#F5F5F5", // light gray, used mostly for text
        "content-dark": "#ECEDEE",
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      defaultTheme: "dark",
      layout: {
        radius: {
          small: "5px",
          large: "20px",
        },
      },
      themes: {
        dark: {
          colors: {
            primary: "#4465DB",
          },
        },
      },
    }),
    typography,
  ],
};
