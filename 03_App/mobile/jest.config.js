/**
 * Unit tests for pure-TypeScript modules (epub core: CFI, selector, refcodes, geometry).
 * Runs in node — no React Native runtime. Babel (babel-preset-expo) handles TypeScript.
 */
module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};
