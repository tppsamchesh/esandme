import type { Config } from "tailwindcss";

export default {
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#FDFAF7",
          primary: "#8BA888",
          secondary: "#C4A882",
          text: "#1C1C1C",
        },
      },
      keyframes: {
        "announcement-marquee": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "announcement-marquee":
          "announcement-marquee 28s linear infinite",
      },
    },
  },
} satisfies Config;
