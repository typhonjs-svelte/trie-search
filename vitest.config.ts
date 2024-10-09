import {
   configDefaults,
   defineConfig } from 'vitest/config'

export default defineConfig({
   test: {
      exclude: [...configDefaults.exclude],
      include: ['./test/**/*.test.ts'],
      coverage: {
         include: ['src/**'],
         exclude: ['test/**'],
         provider: 'v8',
         reporter: ['text', 'json', 'html']
      },
      poolOptions: {
         forks: {
            execArgv: ['--expose-gc'],
         },
      },
      reporters: ['default', 'html'],
      globals: true
   }
});