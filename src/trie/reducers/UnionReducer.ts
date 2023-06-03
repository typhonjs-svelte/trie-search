import { getKeyValue }     from '#runtime/data/struct/hash/array';

import type {
   Key,
   ITrieSearchReducer,
   TrieSearchReducerData } from '../types';

/**
 * Provides an ITrieSearchReducer implementation to accumulate a union / `AND` of matches across all phrases provided in
 * a search query. This reducer should only be used when there are multiple phrases in a query.
 */
export class UnionReducer<T extends object> implements ITrieSearchReducer<T>
{
   readonly #indexField: Key;

   #accumulator: T[];

   constructor(indexField: Key)
   {
      this.#indexField = indexField;
   }

   get keyFields() { return this.#indexField; }

   get matches() { return this.#accumulator; }

   reduce({ matches }: TrieSearchReducerData<T>)
   {
      if (this.#accumulator === void 0)
      {
         this.#accumulator = matches;
         return;
      }

      const map = {};
      const maxLength = Math.max(this.#accumulator.length, matches.length);
      const results = [];

      let i, id;
      let l = 0;

      // One loop, O(N) for max length of accumulator or matches.
      for (i = 0; i < maxLength; i++)
      {
         if (i < this.#accumulator.length)
         {
            id = getKeyValue(this.#accumulator[i], this.#indexField);
            map[id] = map[id] ? map[id] : 0;
            map[id]++;

            if (map[id] === 2) { results[l++] = this.#accumulator[i]; }
         }

         if (i < matches.length)
         {
            id = getKeyValue(matches[i], this.#indexField);
            map[id] = map[id] ? map[id] : 0;
            map[id]++;

            if (map[id] === 2) { results[l++] = matches[i]; }
         }
      }

      this.#accumulator = results;
   }

   reset()
   {
      this.#accumulator = void 0;
   }
}