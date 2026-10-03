import { createKnipConfig } from '@ankhorage/devtools/knip';

export default createKnipConfig({
  entry: [
    'src/api.ts',
    'paradox.config.ts',
    'eslint.config.mjs',
    'eslint.local.config.mjs',
    '.prettierrc.js',
    'prettier.local.config.js',
  ],
});
