import {
   TrieSearch,
   UnionReducer }          from '../../src/trie';

import { TrieSearchQuery } from '../../src/query';

describe(`TrieSearchQuery - General Tests`, () =>
{
   describe('constructor / accessor - fuzzing', () =>
   {
      const ts = new TrieSearch();

      it(`get 'limit' returns Writable`, () =>
      {
         const tsq = new TrieSearchQuery(ts);

         assert.isObject(tsq.limit, 'not writable');
         assert.isFunction(tsq.limit.set, 'not writable');
      });

      it(`get 'trieReducer' from ctor options / accessed via getter`, () =>
      {
         const tsq = new TrieSearchQuery(ts, { trieReducer: new UnionReducer('key') });

         assert.instanceOf(tsq.trieReducer, UnionReducer, 'not set');
      });

      it(`get 'trieSearch' from accessor after destroyed`, () =>
      {
         const tsq = new TrieSearchQuery(ts);
         ts.destroy();
         assert.isUndefined(tsq.trieSearch, 'invalid reference');
      });

      it(`set 'trieReducer' / accessed via getter`, () =>
      {
         const tsq = new TrieSearchQuery(ts);

         tsq.trieReducer = new UnionReducer('key');

         assert.instanceOf(tsq.trieReducer, UnionReducer, 'not set');
      });
   });
});