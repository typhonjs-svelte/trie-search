import replace       from '@rollup/plugin-replace';
import typescript    from '@rollup/plugin-typescript';
import dts           from 'rollup-plugin-dts';

// Produce sourcemaps or not.
const sourcemap = true;

/**
 * @type {import('@rollup/plugin-replace').RollupReplaceOptions}
 */
const replaceOptions = {
   values: {
      // Local substitutions.
      "#runtime/data/struct/hash/array": "@typhonjs-svelte/trie-search/hash",
      '#runtime/data/struct/search/trie': '@typhonjs-svelte/trie-search',

      // Runtime / Svelte substitutions.
      '#runtime/data/struct/cache/quick-lru': 'quick-lru',
      '#runtime/data/struct/store/reducer': '@typhonjs-svelte/dynamic-reducer',
      '#runtime/util/object': '@typhonjs-utils/object',
      '#svelte/store': 'svelte/store'
   },
   preventAssignment: true,
   delimiters: ['', '']
};

const externalMain = [/@typhonjs-svelte\/trie-search\/*/g];
const externalTRL = [/#runtime\/*/g];

/**
 * @returns {import('rollup').RollupOptions[]}
 */
export default () =>
{
   return [
      // Main Distribution -------------------------------------------------------------------------------------------
      {
         input: 'src/hash/index.ts',
         external: externalMain,
         output: [{
            file: './dist/hash/index.js',
            format: 'es',
            generatedCode: { constBindings: true },
            sourcemap,
         }],
         plugins: [
            replace(replaceOptions),
            // resolve({ browser: true }),
            typescript({ include: ['src/hash/**/*'] })
         ]
      },
      {
         input: 'src/query/index.ts',
         external: externalMain,
         output: [{
            file: './dist/query/index.js',
            format: 'es',
            generatedCode: { constBindings: true },
            sourcemap,
         }],
         plugins: [
            replace(replaceOptions),
            // resolve({ browser: true }),
            typescript({ include: ['src/query/**/*'] })
         ]
      },
      {
         input: 'src/trie/index.ts',
         external: externalMain,
         output: [{
            file: './dist/trie/index.js',
            format: 'es',
            generatedCode: { constBindings: true },
            sourcemap,
         }],
         plugins: [
            replace(replaceOptions),
            // resolve({ browser: true }),
            typescript({ include: ['src/trie/**/*'] })
         ]
      },

      // Main Distribution Bundled TS Declarations -------------------------------------------------------------------
      {
         input: 'src/hash/index.ts',
         external: externalMain,
         output: [{
            file: `./dist/hash/index.d.ts`,
            format: 'es',
            generatedCode: { constBindings: true },
            sourcemap: false
         }],
         plugins: [
            replace(replaceOptions),
            dts()
         ]
      },
      {
         input: 'src/query/index.ts',
         external: externalMain,
         output: [{
            file: `./dist/query/index.d.ts`,
            format: 'es',
            generatedCode: { constBindings: true },
            sourcemap: false
         }],
         plugins: [
            replace(replaceOptions),
            dts()
         ]
      },
      {   // This bundle is for bundled types.
         input: 'src/trie/index.ts',
         external: externalMain,
         output: [{
            file: `./dist/trie/index.d.ts`,
            format: 'es',
            generatedCode: { constBindings: true },
            sourcemap: false
         }],
         plugins: [
            replace(replaceOptions),
            dts()
         ]
      },


      // TRL Distribution --------------------------------------------------------------------------------------------
      {
         input: 'src/hash/index.ts',
         external: externalTRL,
         output: [{
            file: './dist-trl/hash/index.js',
            format: 'es',
            generatedCode: { constBindings: true },
            sourcemap,
         }],
         plugins: [
            typescript({ include: ['src/hash/**/*'] })
         ]
      },
      {
         input: 'src/query/index.ts',
         external: externalTRL,
         output: [{
            file: './dist-trl/query/index.js',
            format: 'es',
            generatedCode: { constBindings: true },
            sourcemap,
         }],
         plugins: [
            typescript({ include: ['src/query/**/*'] })
         ]
      },
      {
         input: 'src/trie/index.ts',
         external: externalTRL,
         output: [{
            file: './dist-trl/trie/index.js',
            format: 'es',
            generatedCode: { constBindings: true },
            sourcemap,
         }],
         plugins: [
            typescript({ include: ['src/trie/**/*'] })
         ]
      },

      // TRL Distribution Bundled TS Declarations --------------------------------------------------------------------
      {
         input: 'src/hash/index.ts',
         external: externalTRL,
         output: [{
            file: `./dist-trl/hash/index.d.ts`,
            format: 'es',
            generatedCode: { constBindings: true },
            sourcemap: false
         }],
         plugins: [
            dts()
         ]
      },
      {
         input: 'src/query/index.ts',
         external: externalTRL,
         output: [{
            file: `./dist-trl/query/index.d.ts`,
            format: 'es',
            generatedCode: { constBindings: true },
            sourcemap: false
         }],
         plugins: [
            dts()
         ]
      },
      {   // This bundle is for bundled types.
         input: 'src/trie/index.ts',
         external: externalTRL,
         output: [{
            file: `./dist-trl/trie/index.d.ts`,
            format: 'es',
            generatedCode: { constBindings: true },
            sourcemap: false
         }],
         plugins: [
            dts()
         ]
      }
   ];
};
