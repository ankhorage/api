import { defineParadoxConfig } from '@ankhorage/paradox';

export default defineParadoxConfig({
  mode: 'write',
  docs: {
    title: '@ankhorage/api',
    description: 'Framework-neutral executable API runtime for Ankhorage.',
  },
  package: {
    root: '.',
    entrypoints: ['src/api.ts'],
  },
  output: { dir: './paradox' },
});
