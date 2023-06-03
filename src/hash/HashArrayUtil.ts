import { getKeyValue }  from './functions';
import { HashArray }    from './HashArray';

import type { Key }     from './types';

/**
 * Provides extra examples of how various additional operations can be added on top of HashArray. These operations
 * are not included with HashArray to keep it lean and mean for {@link TrieSearch}. By all means though extend
 * HashArray and add the operations that you need.
 *
 * There are tests for all operations below in `./test/hash/HAExtra.test.ts`.
 */
export class HashArrayUtil
{
   // ----------------------------------------------------------------------------------------------------------------
   // Mathematical Operations
   // ----------------------------------------------------------------------------------------------------------------

   /**
    * Iterates deeply over items specified by `key` and `index` with an optional `weightKey` and calculates the
    * average value.
    *
    * @template T
    *
    * @param {HashArray<T>} source - Source HashArray.
    *
    * @param {Key}   key - The Key to retrieve item(s) to iterate.
    *
    * @param {Key}   index - A specific Key in each item to lookup.
    *
    * @param {Key}   [weightKey] - A specific Key in each item to provide a weighting value.
    *
    * @returns {number} The average value for the given iteration.
    */
   static average<T extends object>(source: HashArray<T>, key: Key, index: Key, weightKey?: Key): number
   {
      let ret = 0;
      let tot = 0;
      let weightsTotal = 0;

      if (weightKey !== void 0) { source.forEachDeep(key, weightKey, (value) => weightsTotal += value); }

      source.forEachDeep(key, index, (value, item) =>
      {
         if (weightKey !== void 0) { value *= (getKeyValue(item, weightKey) / weightsTotal); }

         ret += value;
         tot++;
      });

      return weightKey !== undefined ? ret : ret / tot;
   }

   /**
    * Iterates deeply over items specified by `key` and `index` with an optional `weightKey` and calculates the sum.
    *
    * @template T
    *
    * @param {HashArray<T>}   source - Source HashArray.
    *
    * @param {Key}   key - The Key to retrieve item(s) to iterate.
    *
    * @param {Key}   index - A specific Key in each item to lookup.
    *
    * @param {Key}   [weightKey] - A specific Key in each item to provide a weighting value.
    *
    * @returns {number} The sum for the given iteration.
    */
   static sum<T extends object>(source: HashArray<T>, key: Key, index: Key, weightKey?: Key): number
   {
      let ret = 0;

      source.forEachDeep(key, index, (value, item) =>
      {
         if (weightKey !== void 0) { value *= getKeyValue(item, weightKey); }

         ret += value;
      });

      return ret;
   }

   // ----------------------------------------------------------------------------------------------------------------
   // Set Operations
   // ----------------------------------------------------------------------------------------------------------------

   /**
    * Returns the difference of this HashArray and a target HashArray. If no output HashArray is provided the source
    * is cloned.
    *
    * @template T
    *
    * @param {HashArray<T>}   source - Source HashArray.
    *
    * @param {HashArray<T>}   target - Target HashArray.
    *
    * @param {HashArray<T>}   output - Optional output HashArray.
    *
    * @returns {HashArray<T>} Returns a new HashArray that contains the difference between source (A) and target (B)
    *          HashArrays. Returns A - B.
    */
   static difference<T extends object>(source: HashArray<T>, target: HashArray<T>, output?: HashArray<T>): HashArray<T>
   {
      const result = output ? output : source.clone();

      for (const item of source.valuesFlat())
      {
         if (!target.collides(item)) { result.add(item); }
      }

      return result;
   }

   /**
    * @template T
    *
    * @param {HashArray<T>} source - Source HashArray.
    *
    * @param {number}   count - How many items to sample.
    *
    * @param {Key} [key] - The Key for item(s) to sample.
    *
    * @returns {T[]} Random subset of items.
    * @see http://en.wikipedia.org/wiki/Image_(mathematics)
    */
   static sample<T extends object>(source: HashArray<T>, count: number, key?: Key): T[]
   {
      const image: T[] = key ? source.getAll(key) : [...source.valuesFlat()];
      const result: T[] = [];

      for (const randNum of this.#getUniqueRandomIntegers(count, 0, image.length - 1))
      {
         result.push(image[randNum]);
      }

      return result;
   }

   // Internal -------------------------------------------------------------------------------------------------------

   /**
    * @param {number}   count - Target count for length of returned results.
    *
    * @param {number}   min - Minimum index.
    *
    * @param {number}   max - Maximum index.
    *
    * @returns {Set<number>} An unique Set of random numbers between min & max; length is the minimum between count and
    *          range of min / max.
    */
   static #getUniqueRandomIntegers(count: number, min: number, max: number): Set<number>
   {
      const set = new Set<number>();

      count = Math.min(Math.max(max - min, 1), count);

      while (set.size < count)
      {
         const r = Math.floor(min + (Math.random() * (max + 1)));
         set.add(r);
      }

      return set;
   }
}