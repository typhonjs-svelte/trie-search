import fs               from 'node:fs';
import { bench }        from 'vitest';

import { TrieSearch }   from '../../src';

import { default as TrieSearchOrig } from 'trie-search';

// Load JSON Data ----------------------------------------------------------------------------------------------------

const jsonEnableData = fs.readFileSync('./test/fixture/enable1.txt', 'utf-8').split('\n').map(
 (word, i) => ({ k: word, i}));

const jsonEnableFirst3Data = JSON.parse(fs.readFileSync('./test/fixture/enable1_first3.json',
 'utf-8'));


const jsonSentenceRaw = JSON.parse(fs.readFileSync('./test/fixture/sentences.json', 'utf-8'));
const jsonSentenceData = jsonSentenceRaw.sentences.map((sentence, i) => ({ k: sentence, i }))

// Test Options ------------------------------------------------------------------------------------------------------

// Test Categories
const loading = false;        // Loading data tests.
const stress = true;          // Stress testing.

// Test types
const enable1 = false;        // Enable1 tests.

const sentences = true;       // Sentence tests.
const sentenceRepeat = 100;   // Repeat count for sentence tests.

// Tests -------------------------------------------------------------------------------------------------------------

// Loading Tests -----------------------------------------------------------------------------------------------------

describe.skipIf(!loading || !enable1)('Loading Enable1', () =>
{
   let ts, tsOrig;

   bench('TrieSearch New', () =>
   {
      ts.add(jsonEnableData);
   },
   {
      setup: () =>
      {
         global.gc();
         ts = new TrieSearch('k');
      }
   });

   bench('TrieSearch Original', () =>
   {
      tsOrig.addAll(jsonEnableData);
   },
   {
      setup: () =>
      {
         global.gc();
         tsOrig = new TrieSearchOrig('k');
      }
   });
});

describe.skipIf(!loading || !sentences)('Loading Sentences', () =>
{
   let ts, tsOrig;

   bench('TrieSearch New', () =>
   {
      ts.add(jsonSentenceData);
   },
   {
      setup: () =>
      {
         global.gc();
         ts = new TrieSearch('k');
      }
   });

   bench('TrieSearch Original', () =>
   {
      tsOrig.addAll(jsonSentenceData);
   },
   {
      setup: () =>
      {
         global.gc();
         tsOrig = new TrieSearchOrig('k');
      }
   });
});

// Stress Tests ------------------------------------------------------------------------------------------------------

describe.skipIf(!stress || !enable1)('Search Enable1', () =>
{
   let ts, tsOrig;

   let searchCount = 0;

   bench('TrieSearch New', () =>
   {
      for (const prefix of jsonEnableFirst3Data) { searchCount += ts.search(prefix).length; }
      // console.log(`!! TrieSearch New - searchCount: ${searchCount}`)
   },
   {
      // iterations: 50,

      setup: () =>
      {
         ts = new TrieSearch('k');
         searchCount = 0;

         global.gc();
         // printMemory();
         ts.add(jsonEnableData);
         // printMemory();
      }
   });

   bench('TrieSearch Original', () =>
   {
      for (const prefix of jsonEnableFirst3Data) { searchCount += tsOrig.search(prefix).length; }
      // console.log(`!! TrieSearch Original - searchCount: ${searchCount}`)
   },
   {
      // iterations: 50,

      setup: () =>
      {
         tsOrig = new TrieSearchOrig('k');
         searchCount = 0;

         global.gc();
         // printMemory();
         tsOrig.addAll(jsonEnableData);
         // printMemory();
      }
   });
});

describe.skipIf(!stress || !sentences)('Search Sentences', () =>
{
   let ts, tsOrig;

   let searchCount = 0;

   bench('TrieSearch New', () =>
   {
      searchCount += searchCoordinated(ts, sentenceRepeat, searchCount);
      searchCount += searchUncoordinated(ts, sentenceRepeat, searchCount);

      // console.log(`!! TrieSearch New - searchCount: ${searchCount}`)
   },
   {
      // iterations: 50,

      setup: () =>
      {
         ts = new TrieSearch('k');
         searchCount = 0;

         global.gc();
         // printMemory();
         ts.add(jsonSentenceData);
         // printMemory();
      }
   });

   bench('TrieSearch Original', () =>
   {
      searchCount += searchCoordinated(tsOrig, sentenceRepeat, searchCount);
      searchCount += searchUncoordinated(tsOrig, sentenceRepeat, searchCount);

      // console.log(`!! TrieSearch Original - searchCount: ${searchCount}`)
   },
   {
      // iterations: 50,

      setup: () =>
      {
         tsOrig = new TrieSearchOrig('k');
         searchCount = 0;

         global.gc();
         // printMemory();
         tsOrig.addAll(jsonSentenceData);
         // printMemory();
      }
   });
});

// Utility Functions -------------------------------------------------------------------------------------------------

/**
 * Tests a loop of 50 three word phrases adding a word to each phrase separated by a space. The word / phrase data
 * is coordinated and the words in each phrase appear in a specific sentence.
 *
 * @param {TrieSearch}  ts - TrieSearch instance
 *
 * @param {number}      repeat - Number of repeat loops.
 *
 * @param {number}      searchCount - Running search result count.
 */
function searchCoordinated(ts, repeat: number = 100, searchCount: number)
{
   for (let i = 0; i < repeat; i++)
   {
      for (const phrase of jsonSentenceRaw.phrasesCoordinated)
      {
         let search = '';

         for (const part of phrase)
         {
            search += `${part} `
            searchCount += ts.search(search).length;
         }
      }
   }

   return searchCount;
}

/**
 * Tests a loop of 50 three word phrases adding a word to each phrase separated by a space. The word / phrase data
 * is uncoordinated and the words in each phrase may appear in any sentence.
 *
 * @param {TrieSearch}  ts - TrieSearch instance
 *
 * @param {number}      repeat - Number of repeat loops.
 *
 * @param {number}      searchCount - Running search result count.
 */
function searchUncoordinated(ts, repeat: number = 100, searchCount: number)
{
   for (let i = 0; i < repeat; i++)
   {
      for (const phrase of jsonSentenceRaw.phrasesUncoordinated)
      {
         let search = '';

         for (const part of phrase)
         {
            search += `${part} `
            searchCount += ts.search(search).length;
         }
      }
   }

   return searchCount;
}

/**
 * Utility function to print current memory.
 */
function printMemory()
{
   const used = process.memoryUsage();
   for (let key in used)
   {
      console.log(`${key} ${Math.round((used[key] / 1024 / 1024) * 100) / 100} MB`);
   }
}
