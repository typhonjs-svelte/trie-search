import fs               from 'node:fs';
import { bench }        from 'vitest';

import { TrieSearch }   from '../../src';

import { default as TrieSearchOrig } from 'trie-search';


const jsonEnableData = fs.readFileSync('./test/fixture/enable1.txt', 'utf-8').split('\n').map(
 (word, i) => ({ k: word, i}));

const first3Data = JSON.parse(fs.readFileSync('./test/fixture/first3.json', 'utf-8'));

function printMemory()
{
   const used = process.memoryUsage();
   for (let key in used)
   {
      console.log(`${key} ${Math.round((used[key] / 1024 / 1024) * 100) / 100} MB`);
   }
}

// Remove `.skip` below to run the loading benchmark.  You may also comment out `printMemory` and other `console.log`
// statements as desired.
describe.skip('Loading', () =>
{
   let ts, tsOrig;

   bench('TrieSearch New', () =>
   {
      ts.add(jsonEnableData);
   },
   {
      setup: () =>
      {
         ts = new TrieSearch('k');

         global.gc();
         // printMemory();
         // printMemory();
      }
   });

   bench('TrieSearch Original', () =>
   {
      tsOrig.addAll(jsonEnableData);
   },
   {
      setup: () =>
      {
         tsOrig = new TrieSearchOrig('k');

         global.gc();
         // printMemory();
         // printMemory();
      }
   });
});

describe('Search', () =>
{
   let ts, tsOrig;

   let searchCount = 0;

   bench('TrieSearch New', () =>
   {
      for (const prefix of first3Data) { searchCount += ts.search(prefix).length; }
      // console.log(`!! TrieSearch New - searchCount: ${searchCount}`)
   },
   {
      setup: () =>
      {
         ts = new TrieSearch('k');
         searchCount = 0;

         global.gc();
         // printMemory();
         ts.add(jsonEnableData);
         // ts.addAll(jsonEnableData);
         // printMemory();
      }
   });

   bench('TrieSearch Original', () =>
   {
      for (const prefix of first3Data) { searchCount += tsOrig.search(prefix).length; }
      // console.log(`!! TrieSearch Original - searchCount: ${searchCount}`)
   },
   {
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