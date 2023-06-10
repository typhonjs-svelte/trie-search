import { getValueFromKey }           from '#runtime/data/struct/hash/array';

import type {
   Key,
   ITrieSearchReducer,
   TrieSearchReducerData,
   TrieSearchReducerResetData }  from '../types';

/**
 * Provides an ITrieSearchReducer implementation to accumulate a union / `AND` of matches across all phrases provided in
 * a search query.
 *
 * @template T
 */
export class UnionReducer<T extends object> implements ITrieSearchReducer<T>
{
   /**
    * Provides a lookup key for unique values in items being reduced.
    */
   readonly #indexField: Key;

   /**
    * Stores the accumulation results after each batch of matches is processed.
    */
   #accumulator: T[];

   /**
    * Stores the main list from {@link TrieSearch.search} method which is set on `reset`.
    */
   #list: T[];

   /**
    * With each batch of matches stores the accumulation keys.
    */
   #set: Set<any> = new Set<any>();

   constructor(indexField: Key)
   {
      this.#indexField = indexField;
   }

   /**
    * @returns {Key | KeyFields | undefined} Returns the index field key.
    */
   get keyFields() { return this.#indexField; }

   /**
    * @returns {T[]} Returns the union of all matches.
    */
   get matches()
   {
      // Push results into the main list.
      const matches = this.#list;
      matches.push(...this.#accumulator);

      // Remove unused references.
      this.#accumulator = void 0;
      this.#list = void 0;

      return matches;
   }

   /**
    * Accumulates and reduces each batch of matches for one or more phrases.
    *
    * @param {T[]}   matches - Matches of current iteration / batch.
    */
   reduce({ matches }: TrieSearchReducerData<T>)
   {
      // In the first iteration simply set matches to the accumulator returning immediately.
      if (this.#accumulator === void 0)
      {
         this.#accumulator = matches;
         return;
      }

      const results = [];

      // Add accumulator keys to Set.
      for (let i = this.#accumulator.length; --i >= 0;)
      {
         this.#set.add(getValueFromKey(this.#accumulator[i], this.#indexField))
      }

      // Iterate through current matches and only add to results if the index field is in accumulated Set.
      for (let i = 0; i < matches.length; i++)
      {
         if (this.#set.has(getValueFromKey(matches[i], this.#indexField))) { results.push(matches[i]); }
      }

      this.#accumulator = results;
      this.#set.clear();
   }

   /**
    * Reset state.
    *
    * @param {T[]}   list - The main output list from {@link TrieSearch.search}.
    */
   reset({ list }: TrieSearchReducerResetData<T>)
   {
      this.#list = list;

      this.#accumulator = void 0;
   }
}
