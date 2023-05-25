import {
   configDefaults,
   defineConfig } from 'vitest/config'

export default defineConfig({
   test: {
      exclude: [...configDefaults.exclude, 'packages/template/*'],
      include: ['./test/**/*.ts'],
      coverage: {
         exclude: ['test/**'],
         provider: 'c8',
         reporter: ['text', 'json', 'html']
      },
      reporters: ['default', 'html'],
      globals: true
   },
});