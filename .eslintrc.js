module.exports = {
  root: true,
  parser: "typescript",
  extends: ["@react-native-community", "prettier"],
  plugins: ["prettier"],
  rules: {
    "prettier/prettier": "error"
  }
};

// module.exports = {
//   root: true,
//   parser: "@typescript-eslint/parser",
//   extends: ["@react-native-community", "prettier"],
//   plugins: ["prettier", "@typescript-eslint/eslint-plugin"],
//   rules: {
//     "prettier/prettier": "error"
//   }
// };
