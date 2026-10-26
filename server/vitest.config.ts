import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
    testTimeout: 60_000,
    // The first run downloads the mongod binary (~600 MB) before the suite can
    // start; allow enough time for a slow connection.
    hookTimeout: 600_000,
    pool: 'forks',
    poolOptions: {
      forks: { singleFork: true },
    },
  },
})
