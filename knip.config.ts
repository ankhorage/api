import { createKnipConfig } from "@ankhorage/devtools/knip";

export default createKnipConfig({
  entry: [
    "src/api.ts",
    "examples/**/*.ts",
    "paradox.config.ts",
    "eslint.config.mjs",
  ],
});
