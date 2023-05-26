import { klona }     from '#runtime/util/object';

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
export class TrieSearch<T extends Object>
{
   readonly #cache: HashArray<TrieCacheEntry<T>>;

   readonly #keyFields: KeyFields;

   readonly #indexed: HashArray<T>;

   readonly #options;

   #root;

   #size;

   /**
    * @param {Array} [keyFields] -
    *
    * @param {TrieSearchOptions} [options] - Options.
    */
   constructor(keyFields, options)
   {
      // Note: idFieldOrFunction not set / undefined default.
      this.#options = Object.assign({}, {
         cache: true,
         expandRegexes: TrieSearch.#DEFAULT_INTERNATIONALIZE_EXPAND_REGEXES,
         ignoreCase: true,
         insertFullUnsplitKey: false,
         keepAll: false,
         keepAllKey: 'id',
         maxCacheSize: TrieSearch.#MAX_CACHE_SIZE,
         min: 1,
         splitOnRegEx: /\s/g,
      }, options);

      // Fallback to `splitOnRegEx` if `splitOnGetRegEx` not defined.
      this.#options.splitOnGetRegEx = options?.splitOnGetRegEx ?? this.#options.splitOnRegEx;

      this.#keyFields = keyFields ? (Array.isArray(keyFields) ? keyFields : [keyFields]) : [];
      this.#root = {};
      this.#size = 0;

      if (this.#options.cache) { this.#cache = new HashArray('key'); }
   }

   get cache()
   {
      return this.#cache;
   }

   get keyFields()
   {
      return klona(this.#keyFields);
   }

   get root()
   {
      return this.#root;
   }

   get size()
   {
      return this.#size;
   }

   /**
    *
    * @param {T}  item -
    *
    * @param {KeyFields}   customKeys -
    */
   add(item: T, customKeys?: KeyFields): this
   {
      if (this.#options.cache) { this.cache.clear(); }

      // Someone might have called add via an array forEach where the second param is a number
      if (typeof customKeys === 'number') { customKeys = void 0; }

      const keyFields = customKeys ?? this.#keyFields;

      for (const key of keyFields)
      {
         let val = Array.isArray(key) ? TrieSearch.#deepLookup(item, key) : item[key];

         if (!val) { continue; }

         val = val.toString();

         const expandedValues = this.#expandString(val);

         for (let v = 0; v < expandedValues.length; v++)
         {
            this.map(expandedValues[v], item);
         }
      }

      return this;
   }

   addFromObject(obj, valueField)
   {
      if (this.#options.cache) { this.#cache.clear(); }

      valueField = valueField ?? 'value';

      if (this.#keyFields.indexOf('_key_') === -1) { this.#keyFields.push('_key_'); }

      for (const key in obj)
      {
         const o = { _key_: key };
         o[valueField] = obj[key];
         this.add(o);
      }
   }

   addAll(arr, customKeys)
   {
      for (let i = 0; i < arr.length; i++) { this.add(arr[i], customKeys); }
   }

   getId(item)
   {
      return typeof this.#options.idFieldOrFunction === 'function' ? this.#options.idFieldOrFunction(item) :
       item[this.#options.idFieldOrFunction];
   }

   map(key, value)
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

      if (this.#options.keepAll)
      {
         this.#indexed = this.#indexed ?? new HashArray([this.#options.keepAllKey]);
         this.#indexed.add(value);
      }

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
   }

   reset()
   {
      this.#root = {};
      this.#size = 0;
   }

   /**
    * @param {string | Iterable<string>}  phrases -
    *
    * @param reducer
    *
    * @param {number}   limit -
    */
   search(phrases, reducer, limit)
   {
      const haKeyFields = this.#options.indexField ? [this.#options.indexField] : this.#keyFields;
      let ret = void 0;
      let accumulator = void 0;

      if (reducer && !this.#options.idFieldOrFunction)
      {
         throw new Error(`To use the accumulator you must specify the 'idFieldOrFunction' option.`);
      }

      phrases = Array.isArray(phrases) ? phrases : [phrases];

      for (let i = 0, l = phrases.length; i < l; i++)
      {
         const matches = this.#getImpl(phrases[i], limit);

         if (reducer)
         {
            accumulator = reducer(accumulator, phrases[i], matches, this);
         }
         else
         {
            ret = ret ? ret.add(matches) : new HashArray(haKeyFields).add(matches);
         }
      }

      // TODO pass back iterator? Could make further sorting harder.
      return !reducer ? [...ret.valuesFlat()] : accumulator;
   }

   static UNION_REDUCER(accumulator, phrase, matches, trie)
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
            id = trie.getId(accumulator[i]);
            map[id] = map[id] ? map[id] : 0;
            map[id]++;

            if (map[id] === 2) { results[l++] = accumulator[i]; }
         }

         if (i < matches.length)
         {
            id = trie.getId(matches[i]);
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

   /**
    * Cleans the cache by a simple FIFO method; first in / first out removing entries until `maxCacheSize` is reached.
    */
   #cleanCache()
   {
      while (this.#cache.sizeFlat > this.#options.maxCacheSize) { this.#cache.removeFirst(); }
   }

   /**
    * Given an array of keys iterate through the item to find the value referenced.
    *
    * @param {T}  item -
    *
    * @param {string[]} keys -
    */
   static #deepLookup<T>(item: T, keys: string[]): any
   {
      if (keys.length === 1) { return item[keys[0]]; }

      let current = item[keys[0]];

      for (let i = 1; i < keys.length; i++) { current = current[keys[i]]; }

      return current;
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

      function f(keyArr, node)
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

      const haKeyFields = this.#options.indexField ? [this.#options.indexField] : this.#keyFields;
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
    * Honestly, this conflicts a bit with `indexField`. I need to fix that. This is only used when using the
    * UNION_REDUCER, explained in the Examples.
    */
   idFieldOrFunction?: string | (() => string);

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
    * Default: false
    */
   keepAll?: boolean;

   /**
    * Default: 'id'
    */
   keepAllKey?: string;

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
   splitOnRegEx?: RegExp;

   /**
    * How phrases are split on retrieval / get: default: `/\s/g`.
    */
   splitOnGetRegEx?: RegExp;
}