import {
   isIterable,
   isObject,
   klona }     from '#runtime/util/object';

import type {
   Key,
   KeyFields } from '../types';

/**
 * HashArray is a data structure that combines the best feature of a hash (O(1) retrieval) and an array
 * (length and ordering). Think of it as a super-lightweight, extensible, self-indexing set database in memory.
 *
 * @template T
 */
export class HashArray<T extends Object>
{
   readonly #keyFields: KeyFields;

   readonly #list: T[] = [];

   readonly #options: HashArrayOptions;

   readonly #map: Map<string, T[]> = new Map<string, T[]>();

   /**
    * @param {string | KeyFields} [keyFields] -
    *
    * @param {HashArrayOptions}   [options] - Options.
    */
   constructor(keyFields?: string | KeyFields, options?: HashArrayOptions)
   {
      this.#keyFields = Array.isArray(keyFields) ? keyFields : [keyFields];

      this.#options = Object.assign({}, { ignoreDuplicates: false }, options);
   }

   /**
    * @returns {KeyFields} A clone of the current key fields.
    */
   get keyFields(): KeyFields
   {
      return klona(this.#keyFields);
   }

   /**
    * @returns {number} The mapped size; number of keys in HashArray.
    */
   get size()
   {
      return this.#map.size;
   }

   /**
    * @returns {number} The flattened size; number of items in HashArray.
    */
   get sizeFlat()
   {
      return this.#list.length;
   }

   /**
    * @param {...T | Iterable<T>}  items - Items to add.
    *
    * @returns {HashArray<T>} This instance.
    */
   add(...items: (T | Iterable<T>)[]): this
   {
      for (let i = 0; i < items.length; i++)
      {
         const itemsEntry = items[i];

         if (isIterable(itemsEntry))
         {
            for (const item of itemsEntry) { this.#addOne(item); }
         }
         else
         {
            this.#addOne(itemsEntry);
         }
      }

      return this;
   }

   addDirect(key, items: T | Iterable<T>): this
   {
      const existingItems = this.#map.get(key);
      if (existingItems)
      {
         if (isIterable(items)) { existingItems.push(...items); }
         else { existingItems.push(items); }
      }
      else
      {
         if (isIterable(items)) { this.#map.set(key, [...items]); }
         else { this.#map.set(key, [items]); }
      }

      return this;
   }

   // -----------------------------------
   // Cloning
   // -----------------------------------

   /**
    * Clones this HashArray.
    *
    * @param {object}   [options] - Optional parameters.
    *
    * @param {boolean}  [options.items=true] - When false the items are not cloned / KeyFields are.
    */
   clone({ items = true }: { items?: boolean } = {}): HashArray<T>
   {
      const clone = new HashArray<T>(klona(this.#keyFields), this.#options);

      if (!items) { clone.add([...this.#list]); }

      return clone;
   }

   // -----------------------------------
   // Intersection, union, etc.
   // -----------------------------------

   /**
    * Returns the complement of this HashArray and a target HashArray.
    *
    * @param {HashArray<T>}   target - Another HashArray.
    *
    * @returns {HashArray<T>} Returns a new HashArray that contains the complement (difference) between this
    *          HashArray (A) and the target HashArray passed in (B). Returns A - B.
    */
   complement(target: HashArray<T>): HashArray<T>
   {
      if (!target || !(target instanceof HashArray)) { throw new TypeError(`'target' must be a HashArray.`); }

      const ret = this.clone();

      for (let i = this.#list.length; --i >= 0;)
      {
         if (!target.collides(this.#list[i])) { ret.add(this.#list[i]); }
      }

      return ret;
   }

   /**
    * Returns the intersection of this HashArray and a target HashArray.
    *
    * @param {HashArray<T>}   target - Another HashArray.
    *
    * @returns {HashArray<T>} Returns a new HashArray that contains the intersection between this (A) and the HashArray
    *          passed in (B). Returns A ^ B.
    */
   intersection(target: HashArray<T>): HashArray<T>
   {
      if (!target || !(target instanceof HashArray)) { throw new TypeError(`'target' must be a HashArray.`); }

      const result = this.clone();
      const allItems = this.clone().add(this.#list.concat(target.#list));

      for (let i = allItems.#list.length; --i >= 0;)
      {
         const item = allItems.#list[i];

         if (this.collides(item) && target.collides(item)) { result.add(item); }
      }

      return result;
   }

   /**
    * @param {number}   count - How many items to sample.
    *
    * @param {Key} [key] - The Key for item(s) to sample.
    *
    * @returns {T[]} Random subset of items.
    * @see http://en.wikipedia.org/wiki/Image_(mathematics)
    */
   sample(count: number, key?: Key): T[]
   {
      const image: T[] = key ? this.getAll(key) : this.#list;
      const result: T[] = [];

      for (const randNum of HashArray.#getUniqueRandomIntegers(count, 0, image.length - 1))
      {
         result.push(image[randNum]);
      }

      return result;
   }

   // -----------------------------------
   // Retrieval
   // -----------------------------------

   /**
    * Gets item(s) by the given key.
    *
    * @param {string}   key - The key for an item to retrieve.
    *
    * @returns {T | T[]} All items stored by the given key.
    */
   get(key: string): T | T[]
   {
      const items = this.#map.get(key);

      if (!items) { return; }

      return items.length === 1 ? items[0] : items;
   }

   /**
    * Gets all items stored by the given Key. You may pass `*` as a wildcard for all items.
    *
    * @param {Key}   key - The Key for item(s) to retrieve.
    *
    * @returns {T[]} All item(s) for the given Key.
    */
   getAll(key: Key): T[]
   {
      const keyIsArray = Array.isArray(key);

      if (key === '*' || (keyIsArray && key[0] === '*')) { return this.#list; }

      const results = new HashArray<T>(this.#keyFields);

      if (keyIsArray)
      {
         for (const index in key) { results.add(this.getAsArray(key[index])); }
      }
      else
      {
         results.add(this.getAsArray(key));
      }

      return results.#list;
   }

   /**
    * Gets item(s) by the given key always returning an array including an empty array when key is not in the HashArray.
    *
    * @param {string}   key - The key for item(s) to retrieve.
    *
    * @returns {T[]} All items for key or empty array.
    */
   getAsArray(key: string): T[]
   {
      return this.#map.get(key) ?? [];
   }

   // -----------------------------------
   // Peeking
   // -----------------------------------

   /**
    * Detects if the given item collides with an existing key / item pair.
    *
    * @param {Partial<T>}  item - A partial item to check for collision
    *
    * @returns {boolean} Is there a collision?
    */
   collides(item: Partial<T>): boolean
   {
      for (const key of this.#keyFields)
      {
         if (this.has(this.objectAt(item, key))) { return true; }
      }

      return false;
   }

   /**
    * Verifies if this HashArray has this key.
    *
    * @param {string}   key - The key to check.
    *
    * @returns {boolean} Whether this HashArray already has the given key.
    */
   has(key: string): boolean
   {
      return this.#map.has(key);
   }

   // -----------------------------------
   // Removal
   // -----------------------------------

   /**
    * Removes all items.
    *
    * @returns {HashArray<T>} This instance.
    */
   clear(): this
   {
      this.#map.clear();
      this.#list.length = 0;

      return this;
   }

   /**
    * Removes all item(s) given.
    *
    * @param {...T}  items - Items to remove.
    *
    * @returns {HashArray<T>} This instance.
    */
   remove(...items: T[]): this
   {
      let removed = false;

      // Iterate over each item.
      for (const item of items)
      {
         // Remove the item from the map.
         this.#removeItemFromMap(item);

         // Remove the item from the list.
         const indexInList = this.#list.indexOf(item);
         if (indexInList !== -1)
         {
            this.#list.splice(indexInList, 1);
            removed = true;
         }
      }

      return this;
   }

   /**
    * Remove item(s) associated with the given keys from the HashArray.
    *
    * @param {string[]} keys - Keys associated with the item(s) to be removed.
    *
    * @returns {HashArray<T>} This instance.
    */
   removeByKey(...keys: string[]): this
   {
      let removed = false;

      // Iterate over each provided key.
      for (const key of keys)
      {
         // Retrieve a shallow copy of the items associated with the key.
         const items = this.#map.get(key)?.slice();

         // If there are any items for the key...
         if (items)
         {
            removed = true;

            // Iterate over each item.
            for (const item of items)
            {
               // Remove the item from the associated keys in the map.
               this.#removeItemFromMap(item);

               // Remove the item from the list.
               this.#list.splice(this.#list.indexOf(item), 1);
            }
         }

         // Delete the key from the map.
         this.#map.delete(key);
      }

      return this;
   }

   /**
    * When treating HashArray as a cache removing the first item removes the oldest item.
    */
   removeFirst()
   {
      if (this.#list.length) { this.remove(this.#list[0]); }
   }

   /**
    * When treating HashArray as a cache removing the last item removes the newest item.
    */
   removeLast()
   {
      if (this.#list.length) { this.remove(this.#list[this.#list.length - 1]); }
   }

   // -----------------------------------
   // Utility
   // -----------------------------------

   /**
    * Returns the value for Key in the given item.
    *
    * @param {Partial<T>}  item - The target item or partial item.
    *
    * @param {Key}   key - The Key to lookup in item.
    *
    * @returns {any} Value for key in item.
    */
   objectAt(item: Partial<T>, key: Key): any
   {
      if (!isObject(item)) { throw new Error('Item must be an object.'); }

      if (typeof key === 'string') { return item[key]; }

      // else assume key is an array.
      for (const k of key)
      {
         if (item) { item = item[k]; }
         else { break; }
      }

      return item;
   }

   // -----------------------------------
   // Iteration
   // -----------------------------------

   /**
    * Iterates over all items retrieved by the given key invoking the callback function for each item.
    *
    * @param {Key}   key - The Key to retrieve items to iterate.
    *
    * @param {(T) => void)}   callback - A callback invoked for each item.
    *
    * @returns {HashArray<T>} This instance.
    */
   forEach(key: Key, callback: (T) => void): this
   {
      const items = this.getAll(key);

      items.forEach(callback);

      return this;
   }

   /**
    * Iterates over all items retrieved by the given key invoking the callback function for each item with the value
    * found by the `index` Key and the item itself.
    *
    * @param {Key}   key - The Key to retrieve item(s) to iterate.
    *
    * @param {Key}   index - A specific Key in each item to lookup.
    *
    * @param {(value: any, item: T) => void)}   callback - A callback invoked for each item with value of `index`
    *        and item.
    *
    * @returns {HashArray<T>} This instance.
    */
   forEachDeep(key: Key, index: Key, callback: (value: any, item: T) => void): this
   {
      const items = this.getAll(key);

      items.forEach((item) => callback(this.objectAt(item, index), item));

      return this;
   }

   /**
    * @returns {IterableIterator<[string, T[]]>} An entries iterator w/ key and all associated values.
    */
   entries(): IterableIterator<[string, T[]]>
   {
      return this.#map.entries();
   }

   /**
    * @returns {Generator<[string, T], void, unknown>} Generator of flattened entries.
    * @yields {[string, T]}
    */
   *entriesFlat(): IterableIterator<[string, T]>
   {
      for (const key of this.#map.keys())
      {
         const items = this.#map.get(key);
         for (const item of items) { yield [key, item]; }
      }
   }

   /**
    * @returns {IterableIterator<string>} A keys iterator.
    */
   keys(): IterableIterator<string>
   {
      return this.#map.keys();
   }

   /**
    * @returns {IterableIterator<T[]>} A values iterator / all items values grouped by key.
    */
   values(): IterableIterator<T[]>
   {
      return this.#map.values();
   }

   /**
    * @returns {IterableIterator<T>} A flat values iterator by default in order added.
    */
   valuesFlat(): IterableIterator<T>
   {
      return this.#list.values();
   }

   // -----------------------------------
   // Mathematical
   // -----------------------------------

   /**
    * Iterates deeply over items specified by `key` and `index` with an optional `weightKey` and calculates the
    * average value.
    *
    * @param {Key}   key - The Key to retrieve item(s) to iterate.
    *
    * @param {Key}   index - A specific Key in each item to lookup.
    *
    * @param {Key}   [weightKey] - A specific Key in each item to provide a weighting value.
    *
    * @returns {number} The average value for the given iteration.
    */
   average(key: Key, index: Key, weightKey?: Key): number
   {
      let ret = 0;
      let tot = 0;
      let weightsTotal = 0;

      if (weightKey !== void 0) { this.forEachDeep(key, weightKey, (value) => weightsTotal += value); }

      this.forEachDeep(key, index, (value, item) =>
      {
         if (weightKey !== void 0) { value *= (this.objectAt(item, weightKey) / weightsTotal); }

         ret += value;
         tot++;
      });

      return weightKey !== undefined ? ret : ret / tot;
   }

   /**
    * Iterates deeply over items specified by `key` and `index` with an optional `weightKey` and calculates the sum.
    *
    * @param {Key}   key - The Key to retrieve item(s) to iterate.
    *
    * @param {Key}   index - A specific Key in each item to lookup.
    *
    * @param {Key}   [weightKey] - A specific Key in each item to provide a weighting value.
    *
    * @returns {number} The sum for the given iteration.
    */
   sum(key: Key, index: Key, weightKey?: Key): number
   {
      let ret = 0;

      this.forEachDeep(key, index, (value, item) =>
      {
         if (weightKey !== void 0) { value *= this.objectAt(item, weightKey); }

         ret += value;
      });

      return ret;
   }

   // -----------------------------------
   // Filtering
   // -----------------------------------

   /**
    * Filters this HashArray returning a new HashArray with the items that pass the given filter test.
    *
    * @param {Key}   key - The Key to retrieve item(s) to iterate.
    *
    * @param {Key | ((T) => boolean)}  callbackOrIndex - A Key to lookup for filter inclusion or a callback function
    *        returning the filter result for the item.
    */
   filter(key: Key, callbackOrIndex: Key | ((T) => boolean)): HashArray<T>
   {
      const callback = typeof callbackOrIndex === 'function' ? callbackOrIndex : (item) =>
      {
         const val = this.objectAt(item, callbackOrIndex);
         return val !== void 0 && val !== false;
      };

      const ha = new HashArray<T>(klona(this.#keyFields));
      ha.add(this.getAll(key).filter(callback));

      return ha;
   }

   // Internal -------------------------------------------------------------------------------------------------------

   /**
    * Adds an item to this HashArray.
    *
    * @param {T}  item - Item to add.
    */
   #addOne(item: T)
   {
      let needsDupCheck = false;

      for (let key in this.#keyFields)
      {
         const keyFieldKey = this.#keyFields[key];

         const inst = this.objectAt(item, keyFieldKey);

         if (inst)
         {
            const items = this.#map.get(inst)

            if (items)
            {
               if (this.#options.ignoreDuplicates) { return; }

               if (items.indexOf(item) !== -1)
               {
                  // Cannot add the same item twice
                  needsDupCheck = true;
                  continue;
               }

               items.push(item);
            }
            else
            {
               this.#map.set(inst, [item]);
            }
         }
      }

      if (!needsDupCheck || this.#list.indexOf(item) === -1) { this.#list.push(item); }
   }

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

   /**
    * Remove an item from the associated keys in the map.
    *
    * @param {T}  item - The item to be removed.
    */
   #removeItemFromMap(item: T): void
   {
      // Iterate over each key field.
      for (const keyField of this.#keyFields)
      {
         // Get the key associated with the item.
         const key = this.objectAt(item, keyField);

         if (key)
         {
            // Get the items associated with the key.
            const itemsForKey = this.#map.get(key);

            // If there are no items associated with the key then continue iteration.
            if (!itemsForKey) { continue; }

            // Find the index of the item.
            const itemIndex = itemsForKey.indexOf(item);

            // If the item is found, remove it from the array.
            if (itemIndex !== -1) { itemsForKey.splice(itemIndex, 1); }

            // If there are no more items for the key, delete the key from the map.
            if (itemsForKey.length === 0) { this.#map.delete(key); }
         }
      }
   }
}

/**
 * Options for HashArray.
 */
export type HashArrayOptions = {
   /**
    * When true, any attempt to add items that collide with any items in the HashArray will be ignored.
    */
   ignoreDuplicates?: boolean;
}