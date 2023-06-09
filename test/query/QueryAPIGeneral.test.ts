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

   describe('Invalid store updates - no errors', () =>
   {
      const ts = new TrieSearch();
      const tsq = new TrieSearchQuery(ts);

      it(`'limit' reset to undefined after bad data`, () =>
      {
         tsq.limit.set(10);

         let i = 0;

         // Should be updated by undefined via next statement.
         // Counter takes into consideration initial subscription callback and set(false); next should be undefined.
         const unsubscribe = tsq.limit.subscribe((value) =>
         {
            if (i++ > 1) { assert.isUndefined(value); }
         });

         // @ts-expect-error
         tsq.limit.set(false);

         unsubscribe();
      });

      it(`'limit' reset to undefined after bad number data`, () =>
      {
         tsq.limit.set(10);

         let i = 0;

         // Should be updated by undefined via next statement.
         // Counter takes into consideration initial subscription callback and set(-1); next should be undefined.
         const unsubscribe = tsq.limit.subscribe((value) =>
         {
            if (i++ > 1) { assert.isUndefined(value); }
         });

         tsq.limit.set(-1);

         unsubscribe();
      });

      it(`'query' bad data`, () =>
      {
         let i = 0;

         const unsubscribe = tsq.query.subscribe((value) =>
         {
            if (i++ > 1) { assert.isUndefined(value); }
         });

         // @ts-expect-error
         tsq.query.set(false);

         unsubscribe();
      });

      it(`'query' set after destroyed`, () =>
      {
         ts.destroy();

         tsq.query.set('test');

         assert.isTrue(tsq.isDestroyed, 'query not destroyed');
      });
   });
});