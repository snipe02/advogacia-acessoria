tailwind.config = {
  theme: {
    extend: {
      colors: {
        navy: "#0A1F44",
        gold: "#C59B56",
        lightGray: "#F8F9FA",
      },
      fontFamily: {
        serif: ['"Playfair Display"', "serif"],
        sans: ['"Inter"', "sans-serif"],
      },
      animation: {
        "fade-in-up": "fadeInUp .8s ease-out forwards",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
};