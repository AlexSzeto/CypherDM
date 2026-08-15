import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'server',
          include: ['server/**/*.test.mjs'],
          environment: 'node',
        },
      },
      {
        test: {
          name: 'client',
          include: ['public/js/**/*.test.mjs', 'public/js/**/*.vitest.mjs'],
          environment: 'happy-dom',
        },
      },
      {
        test: {
          name: 'scripts',
          include: ['scripts/**/*.test.mjs'],
          environment: 'node',
        },
      },
    ],
  },
})
