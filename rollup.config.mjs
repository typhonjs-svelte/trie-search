import resolve          from '@rollup/plugin-node-resolve';
import replace          from '@rollup/plugin-replace';
import typescript       from '@rollup/plugin-typescript';
import { generateDTS }  from '@typhonjs-build-test/esm-d-ts';

// Produce sourcemaps or not.
const sourcemap = true;

/**
 * @type {import('@rollup/plugin-replace').RollupReplaceOptions}
 */
const replaceOptionsMain = {
   values: {
      // Local substitutions.
      '#runtime/data/struct/hash/array': '@typhonjs-svelte/trie-search/hash',
      '#runtime/data/struct/search/trie': '@typhonjs-svelte/trie-search',

      // Runtime / Svelte substitutions.
      '#runtime/data/struct/cache/quick-lru': 'quick-lru',
      '#runtime/svelte/store/reducer': '@typhonjs-svelte/dynamic-reducer',
      '#runtime/util/object': '@typhonjs-utils/object'
   },
   preventAssignment: true,
   delimiters: ['', '']
};

/**
 * @type {import('@rollup/plugin-replace').RollupReplaceOptions}
 */
const replaceOptionsTRL = {
   values: {
      // QuickLRU is a named export in TRL.
      'import QuickLRU': 'import { QuickLRU }',

      // Svelte is referenced by `imports` in TRL.
      "'svelte/store'": "'#svelte/store'"
   },
   preventAssignment: true,
   delimiters: ['', '']
};

const externalMain = [/@typhonjs*/g];
const externalTRL = [/#runtime\/*/g];

// esm-d-ts options for main distribution.
const dtsPluginOptionsMain = {
   dtsReplace: { ...replaceOptionsMain.values },
   importsExternal: true,
   rollupExternal: externalTRL
};

// esm-d-ts options for TRL distribution.
const dtsPluginOptionsTRL = {
   dtsReplace: { "'svelte/store'": "'#svelte/store'" },
};

/**
 * @returns {import('rollup').RollupOptions[]}
 */
export default () =>
{
   return [
      // Main Distribution -------------------------------------------------------------------------------------------
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
            replace(replaceOptionsMain),
            // resolve({ browser: true }),
            generateDTS.plugin(dtsPluginOptionsMain),
            typescript({ include: ['src/trie/**/*'] })
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
            replace(replaceOptionsMain),
            resolve({ browser: true }),                  // Resolving for svelte/store -> writable.
            generateDTS.plugin(dtsPluginOptionsMain),
            typescript({ include: ['src/query/**/*'] })
         ]
      },
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
            replace(replaceOptionsMain),
            // resolve({ browser: true }),
            generateDTS.plugin(dtsPluginOptionsMain),
            typescript({ include: ['src/hash/**/*'] })
         ]
      },

      // TRL Distribution --------------------------------------------------------------------------------------------
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
            replace(replaceOptionsTRL),
            generateDTS.plugin(dtsPluginOptionsTRL),
            typescript({ include: ['src/trie/**/*'] })
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
            replace(replaceOptionsTRL),
            generateDTS.plugin(dtsPluginOptionsTRL),
            typescript({ include: ['src/query/**/*'] })
         ]
      },
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
            generateDTS.plugin(dtsPluginOptionsTRL),
            typescript({ include: ['src/hash/**/*'] })
         ]
      }
   ];
};
