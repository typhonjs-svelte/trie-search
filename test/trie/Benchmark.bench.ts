import fs               from 'node:fs';
import {bench, describe} from 'vitest';

import { TrieSearch }   from '../../src';

const jsonEnableData = fs.readFileSync('./test/fixture/enable1.txt', 'utf-8').split('\n').map(
 (word, i) => ({ k: word, i}));

const first3Data = JSON.parse(fs.readFileSync('./test/fixture/first3.json', 'utf-8'));

describe('Benchmarks', () =>
{
   describe('Loading', () =>
   {
      bench('Loading', () =>
      {
         const ts = new TrieSearch('k');
         ts.add(jsonEnableData);
      });
   });

   describe('Lookups', () => {
      let ts = new TrieSearch('k');


      bench('Loading', () => {
          for (const prefix of first3Data) {
             ts.search(prefix);
          }
       },
       {
          setup: () => {
             console.log('SETUP')
             ts.add(jsonEnableData);
          }
       });
   });
});