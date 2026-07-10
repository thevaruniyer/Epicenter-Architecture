/**
 * Shared ESLint base config for the Epicenter monorepo.
 * Package-level configs extend this. Kept intentionally minimal at bootstrap;
 * rules are tightened as real code lands in later stages.
 */
module.exports = {
  root: false,
  env: {
    es2022: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
  },
  extends: ["eslint:recommended"],
  ignorePatterns: ["dist/", "build/", ".next/", "node_modules/"],
};
