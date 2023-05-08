module.exports = {
  plugins: [require("prettier-plugin-tailwindcss")],
  printWidth: 140,
  overrides: [
    {
      files: ["*.html"],
      options: {
        printWidth: 180,
      },
    },
  ],
};
