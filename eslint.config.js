import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

export default [
  {
    ignores: ["dist/**", "node_modules/**", "output/**", ".pptx-build/**", ".wrangler/**", "tmp/**"],
  },
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: "latest", sourceType: "module" },
    },
    plugins: { "@typescript-eslint": tsPlugin },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-constant-binary-expression": "error",
      "no-duplicate-imports": "error",
    },
  },
  {
    files: ["public/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        clearTimeout: "readonly",
        document: "readonly",
        fetch: "readonly",
        FormData: "readonly",
        setTimeout: "readonly",
        URLSearchParams: "readonly",
        window: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-constant-binary-expression": "error",
    },
  },
];
