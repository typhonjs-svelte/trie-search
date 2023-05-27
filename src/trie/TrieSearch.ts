import {
   isIterable, isObject,
   klona
} from '#runtime/util/object';

import { HashArray } from '../hash/HashArray';

import type {
   Key,
   KeyFields }       from '../types';

export type TrieCacheEntry<T> = {
   key: string;
   value: T[]
}

/**
 * @template T
 */
export class TrieSearch<T extends object>
{
   readonly #cache: HashArray<TrieCacheEntry<T>>;

   readonly #keyFields: KeyFields;

   #indexField: string[];

   readonly #options;

   #root;

   #size;

   /**
    * @param {Array} [keyFields] -
    *
    * @param {TrieSearchOptions} [options] - Options.
    */
   constructor(keyFields?: string | KeyFields, options?: TrieSearchOptions)
   {
      this.#keyFields = keyFields ? (Array.isArray(keyFields) ? keyFields : [keyFields]) : [];

      // Note: idFieldOrFunction not set / undefined default.
      this.#options = Object.assign({}, {
         cache: true,
         expandRegexes: TrieSearch.#DEFAULT_INTERNATIONALIZE_EXPAND_REGEXES,
         ignoreCase: true,
         insertFullUnsplitKey: false,
         maxCacheSize: TrieSearch.#MAX_CACHE_SIZE,
         min: 1,
         splitOnRegEx: /\s/g,
      }, options);

      // Fallback to `splitOnRegEx` if `splitOnGetRegEx` not defined.
      this.#options.splitOnGetRegEx = options?.splitOnGetRegEx ?? this.#options.splitOnRegEx;

      if (typeof options?.indexField === 'string') { this.#indexField = [options.indexField]; }

      this.#root = {};
      this.#size = 0;

      if (this.#options.cache) { this.#cache = new HashArray('key'); }
   }

   get cache(): HashArray<TrieCacheEntry<T>>
   {
      return this.#cache;
   }

   get keyFields(): KeyFields
   {
      return klona(this.#keyFields);
   }

   get root()
   {
      return this.#root;
   }

   get size(): number
   {
      return this.#size;
   }

   /**
    * @param {...(T | Iterable<T>)}  items - Items to add.
    */
   add(...items: (T | Iterable<T>)[]): this
   {
      if (items.length === 0) { return; }

      if (this.#options.cache) { this.cache.clear(); }

      for (const itemOrList of items)
      {
         if (isIterable(itemOrList))
         {
            for (const item of itemOrList) { this.#addOne(item); }
         }
         else
         {
            this.#addOne(itemOrList);
         }
      }

      return this;
   }

   map(key: string, value: T): this
   {
      if (this.#options.splitOnRegEx && this.#options.splitOnRegEx.test(key))
      {
         const phrases = key.split(this.#options.splitOnRegEx);
         const emptySplitMatch = phrases.filter((p) => { return TrieSearch.#REGEX_IS_WHITESPACE.test(p); });
         const selfMatch = phrases.filter((p) => { return p === key; });
         const selfIsOnlyMatch = selfMatch.length + emptySplitMatch.length === phrases.length;

         // There is an edge case that a RegEx with a positive lookahead like:
         //  /?=[A-Z]/ // Split on capital letters for a camelcase sentence
         // Will then match again when we call map, creating an infinite stack loop.
         if (!selfIsOnlyMatch)
         {
            for (let i = 0, l = phrases.length; i < l; i++)
            {
               if (!TrieSearch.#REGEX_IS_WHITESPACE.test(phrases[i])) { this.map(phrases[i], value); }
            }

            if (!this.#options.insertFullUnsplitKey) { return; }
         }
      }

      if (this.#options.cache) { this.#cache.clear(); }

      if (this.#options.ignoreCase) { key = key.toLowerCase(); }

      const keyArr = this.#keyToArr(key);
      const self = this;

      insert(keyArr, value, this.#root);

      function insert(keyArr, value, node)
      {
         if (keyArr.length === 0)
         {
            node['value'] = node['value'] ?? [];
            node['value'].push(value);
            return;
         }

         const k = keyArr.shift();

         if (!node[k]) { self.#size++; }

         node[k] = node[k] ?? {};

         insert(keyArr, value, node[k]);
      }

      return this;
   }

   clear(): this
   {
      this.#root = {};
      this.#size = 0;

      return this;
   }

   /**
    * @param {string | Iterable<string>}  phrases -
    *
    * @param {object} [options] - Search Options.
    *
    * @param {TrieReducerFn<T>}  [options.reducer] -
    *
    * @param {number}            [options.limit] -
    *
    * @returns {T[]} Found matches.
    */
   search(phrases, { reducer, limit }: { reducer?: TrieReducerFn<T>, limit?: number } = {})
   {
      const haKeyFields = this.#indexField ? this.#indexField : this.#keyFields;
      let ret = void 0;
      let accumulator = void 0;

      if (reducer && !this.#indexField)
      {
         throw new Error(`TrieSearch.search error: To use a reducer you must specify the 'indexField' option.`);
      }

      phrases = Array.isArray(phrases) ? phrases : [phrases];

      for (let i = 0, l = phrases.length; i < l; i++)
      {
         const matches = this.#getImpl(phrases[i], limit);

         if (reducer)
         {
            accumulator = reducer(accumulator, phrases[i], matches, this.#indexField[0]);
         }
         else
         {
            ret = ret ? ret.add(matches) : new HashArray(haKeyFields).add(matches);
         }
      }

      // TODO pass back iterator? Could make further sorting harder.
      return !reducer ? [...ret.valuesFlat()] : accumulator;
   }

   static UNION_REDUCER(accumulator, phrase, matches, indexField)
   {
      if (accumulator === void 0) { return matches; }

      const map = {};
      const maxLength = Math.max(accumulator.length, matches.length);
      const results = [];

      let i, id;
      let l = 0;

      // One loop, O(N) for max length of accumulator or matches.
      for (i = 0; i < maxLength; i++)
      {
         if (i < accumulator.length)
         {
            id = accumulator[i][indexField];
            map[id] = map[id] ? map[id] : 0;
            map[id]++;

            if (map[id] === 2) { results[l++] = accumulator[i]; }
         }

         if (i < matches.length)
         {
            id = matches[i][indexField];
            map[id] = map[id] ? map[id] : 0;
            map[id]++;

            if (map[id] === 2) { results[l++] = matches[i]; }
         }
      }

      return results;
   }

   // Internal -------------------------------------------------------------------------------------------------------

   static #MAX_CACHE_SIZE = 64;

   static #REGEX_IS_WHITESPACE = /^[\s]*$/;

   static #DEFAULT_INTERNATIONALIZE_EXPAND_REGEXES = [
      { regex: /[åäàáâãæ]/ig, alternate: 'a' },
      { regex: /[èéêë]/ig, alternate: 'e' },
      { regex: /[ìíîï]/ig, alternate: 'i' },
      { regex: /[òóôõö]/ig, alternate: 'o' },
      { regex: /[ùúûü]/ig, alternate: 'u' },
      { regex: /[æ]/ig, alternate: 'ae' }
   ];

   #addOne(item: T)
   {
      if (!isObject(item)) { throw new TypeError(`TrieSearch.add error: The add method only accepts objects.`); }

      for (const key of this.#keyFields)
      {
         let val = Array.isArray(key) ? HashArray.objectAt(item, key) : item[key];

         if (!val) { continue; }

         val = val.toString();

         const expandedValues = this.#expandString(val);

         for (let v = 0; v < expandedValues.length; v++) { this.map(expandedValues[v], item); }
      }
   }

   /**
    * Cleans the cache by a simple FIFO method; first in / first out removing entries until `maxCacheSize` is reached.
    */
   #cleanCache()
   {
      while (this.#cache.sizeFlat > this.#options.maxCacheSize) { this.#cache.removeFirst(); }
   }

   /**
    * By default, using the options.expandRegexes, given a string like 'ö är bra', this will expand it to:
    *
    * ['ö är bra', 'o är bra', 'ö ar bra', 'o ar bra']
    *
    * By default, this was built to allow for internationalization, but it could be also be expanded to
    * allow for word alternates, etc. like spelling alternates ('teh' and 'the').
    *
    * This is used for insertion! This should not be used for lookup since if a person explicitly types
    * 'ä' they probably do not want to see all results for 'a'.
    *
    * @param {string}   value The string to find alternates for.
    *
    * @returns {string[]}  Always returns an array even if no matches.
    */
   #expandString(value: string): string[]
   {
      const values = [value];

      if (this.#options.expandRegexes && this.#options.expandRegexes.length)
      {
         for (let i = 0; i < this.#options.expandRegexes.length; i++)
         {
            const er = this.#options.expandRegexes[i];
            let match;

            while ((match = er.regex.exec(value)) !== null)
            {
               const alternateValue = TrieSearch.#replaceCharAt(value, match.index, er.alternate);
               values.push(alternateValue);
            }
         }
      }

      return values;
   }

   #findNode(key)
   {
      return f(this.#keyToArr(key), this.#root);

      function f(keyArr: string[], node)
      {
         if (!node) { return void 0; }
         if (keyArr.length === 0) { return node; }

         const k = keyArr.shift();
         return f(keyArr, node[k]);
      }
   }

   /**
    * @param {string}   phrase -
    *
    * @param {number}   [limit] -
    *
    * @returns {string} A cache key.
    */
   static #getCacheKey(phrase: string, limit?: number): string
   {
      return limit ? `${phrase}_${limit}` : phrase;
   }

   /**
    * @param {string}   phrase -
    *
    * @param {number}   limit -
    *
    * @returns {T[]} An array of items found from `phrase`.
    */
   #getImpl(phrase: string, limit: number): T[]
   {
      phrase = this.#options.ignoreCase ? phrase.toLowerCase() : phrase;

      let c, node;

      if (this.#options.cache && (c = this.#cache.get(TrieSearch.#getCacheKey(phrase, limit)))) { return c.value; }

      let ret = void 0;

      const haKeyFields = this.#indexField ? this.#indexField : this.#keyFields;
      const words = this.#options.splitOnGetRegEx ? phrase.split(this.#options.splitOnGetRegEx) : [phrase];

      for (let l = words.length, w = 0; w < l; w++)
      {
         if (this.#options.min && words[w].length < this.#options.min) { continue; }

         const temp = new HashArray(haKeyFields);

         if ((node = this.#findNode(words[w]))) { aggregate(node, temp); }

         ret = ret ? ret.intersection(temp) : temp;
      }

      const v: T[] = ret ? [...ret.valuesFlat()] : [];

      if (this.#options.cache)
      {
         const cacheKey = TrieSearch.#getCacheKey(phrase, limit);
         this.#cache.add({ key: cacheKey, value: v });
         this.#cleanCache();
      }

      return v;

      function aggregate(node, ha)
      {
         if (limit && ha.sizeFlat === limit) { return; }

         if (node.value && node.value.length)
         {
            if (!limit || (ha.sizeFlat + node.value.length) < limit)
            {
               ha.add(node.value);
            }
            else
            {
               // Limit is less than the number of entries in the node.value + ha combined
               ha.add(node.value.slice(0, limit - ha.sizeFlat));
               return;
            }
         }

         for (const k in node)
         {
            if (limit && ha.sizeFlat === limit) { return; }
            if (k !== 'value') { aggregate(node[k], ha); }
         }
      }
   }

   /**
    * Splits the given key by a minimum prefix followed by remaining characters.
    *
    * @param {string}   key - A key to split.
    *
    * @returns {string[]} Array of split key with prefix / first entry set to `min` option.
    */
   #keyToArr(key): string[]
   {
      let keyArr;

      if (this.#options.min && this.#options.min > 1)
      {
         if (key.length < this.#options.min) { return []; }

         keyArr = [key.substring(0, this.#options.min)];
         keyArr = keyArr.concat(key.substring(this.#options.min).split(''));
      }
      else
      {
         keyArr = key.split('');
      }

      return keyArr;
   }

   /**
    * @param {string}   target - The target string.
    *
    * @param {number}   index - Index for replacement.
    *
    * @param {string}   replacement - The replacement string.
    *
    * @returns {string} The target string w/ replacement.
    */
   static #replaceCharAt(target: string, index: number, replacement: string)
   {
      return target.substring(0, index) + replacement + target.substring(index + replacement.length);
   }
}

export type TrieSearchOptions = {
   /**
    * Is caching enabled; default: true.
    */
   cache?: boolean;

   /**
    * By default, this is set to an array of international vowels expansions, allowing searches for vowels like 'a' to
    * return matches on 'å' or 'ä' etc. Set this to an empty array / `[]` if you want to disable it. See the top of
    * `src/trie/TrieSearch.js` file for examples.
    */
   expandRegexes?: [{ regex: RegExp, alternate: string }];

   /**
    * Ignores case in lookups; default: true.
    */
   ignoreCase?: boolean;

   /**
    * If specified, determines which rows are unique when using search(); default: undefined.
    */
   indexField?: string;

   /**
    * Default: false
    */
   insertFullUnsplitKey?: boolean;

   /**
    * The max cache size before removing entries in a FIFO manner; default: 64.
    */
   maxCacheSize?: number;

   /**
    * The size of the prefix for keys; Minimum length of a key to store and search. By default, this is 1, but you
    * might improve performance by using 2 or 3.
    */
   min?: number;

   /**
    * How phrases are split on search: default: `/\s/g`. By default, this is any whitespace. Set to `false` if you have
    * whitespace in your keys! Set it something else to split along other boundaries.
    */
   splitOnRegEx?: RegExp | false;

   /**
    * How phrases are split on retrieval / get: default: `/\s/g`.
    */
   splitOnGetRegEx?: RegExp | false;
}

export type TrieReducerFn<T extends object> =
 (accumulator: T[], phrase: string, matches: T[], indexField: string) => T[];