// Flat ESLint config. Lints the TypeScript source and tests plus the small
// Node build scripts. Formatting is owned by Prettier, so eslint-config-prettier
// is applied last to switch off any stylistic rules that would fight it.
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default tseslint.config(
  { ignores: ["dist/", "coverage/", "node_modules/", ".agents/", ".claude/"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // Browser + extension code and its tests.
    files: ["src/**/*.ts", "tests/**/*.ts"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  {
    // Node build/tooling scripts.
    files: ["scripts/**/*.mjs", "*.mjs", "*.js"],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  prettier,
);
