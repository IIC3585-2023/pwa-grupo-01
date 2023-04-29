module.exports = {
  plugins: [require("prettier-plugin-tailwindcss")],
  printWidth: 120,
  overrides: [
    {
      files: ["*.html"],
      options: {
        printWidth: 180,
      },
    },
  ],
};
