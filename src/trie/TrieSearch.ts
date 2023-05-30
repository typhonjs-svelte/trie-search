import QuickLRU            from '#runtime/data/struct/cache/quick-lru';

import {
   isIterable,
   isObject,
   klona }                 from '#runtime/util/object';

import { HashArray }       from '../hash';

import type { KeyFields }  from '../types';

import type {
   TrieReducerFn,
   TrieSearchOptions }     from "./types";

/**
 * @template T
 */
export class TrieSearch<T extends object>
{
   readonly #cachePhrase: QuickLRU<string, T[]>;

   readonly #cacheWord: QuickLRU<string, object>;

   readonly #keyFields: KeyFields;

   readonly #indexField: string[];

   readonly #options: TrieSearchOptions;

   #root;

   #size: number;

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

      // if (this.#options.cache) { this.#cachePhrase = new HashArray('key'); }
      if (this.#options.cache)
      {
         this.#cachePhrase = new QuickLRU<string, T[]>({ maxSize: this.#options.maxCacheSize });
         this.#cacheWord = new QuickLRU<string, object>({ maxSize: 512 }); // TODO Make configurable
      }
   }

   get cache(): Map<string, T[]>
   {
      return this.#cachePhrase;
   }

   get keyFields(): KeyFields
   {
      return klona(this.#keyFields);
   }

   get root()
   {
      return this.#root;
   }

   /**
    * @returns {number} Number of nodes in the trie data structure.
    */
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

   clear(): this
   {
      this.#root = {};
      this.#size = 0;

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

      // TODO: Do we need to clear caches on add?
      if (this.#options.cache)
      {
         this.#cachePhrase.clear();
         this.#cacheWord.clear();
      }

      if (this.#options.ignoreCase) { key = key.toLowerCase(); }

      let node = this.#root;
      for (const token of this.#keyTokenizer(key))
      {
         if (!node[token])
         {
            this.#size++;
            node[token] = {};
         }
         node = node[token];
      }

      node['value'] = node['value'] ?? [];
      node['value'].push(value);

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
   search(phrases: string | Iterable<string>, { reducer, limit }: { reducer?: TrieReducerFn<T>, limit?: number } = {})
   {
      const haKeyFields = this.#indexField ? this.#indexField : this.#keyFields;

      let accumulator = void 0;

      if (reducer && !this.#indexField)
      {
         throw new Error(`TrieSearch.search error: To use a reducer you must specify the 'indexField' option.`);
      }

      const list: T[] = [];

      if (isIterable(phrases))
      {
         let resultsHA: HashArray<T>;

         for (const phrase of phrases)
         {
            const matches = this.#getImpl(phrase, limit);

            if (reducer)
            {
               accumulator = reducer(accumulator, phrase, matches, this.#indexField[0]);
            }
            else
            {
               resultsHA = resultsHA ? resultsHA.add(matches) : new HashArray<T>(haKeyFields, { list }).add(matches);
            }
         }
      }
      else
      {
         const matches = this.#getImpl(phrases, limit);

         if (reducer)
         {
            accumulator = reducer(accumulator, phrases, matches, this.#indexField[0]);
         }
         else
         {
            new HashArray<T>(haKeyFields, { list }).add(matches);
         }
      }

      return !reducer ? list : accumulator;
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

         for (const expandedValue of TrieSearch.#expandString(val, this.#options)) { this.map(expandedValue, item); }
      }
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
    * @param {TrieSearchOptions} options - TrieSearch options.
    *
    * @returns {Generator<string>}  Always returns an array even if no matches.
    * @yields {string}
    */
   static *#expandString(value: string, options): Generator<string>
   {
      yield value;

      if (options.expandRegexes && options.expandRegexes.length)
      {
         for (let i = 0; i < options.expandRegexes.length; i++)
         {
            const er = options.expandRegexes[i];
            let match;

            while ((match = er.regex.exec(value)) !== null)
            {
               const alternateValue = TrieSearch.#replaceStringAt(value, match.index, er.alternate);
               yield alternateValue;
            }
         }
      }
   }

   /**
    * Finds the node in the trie data by a depth first algorithm by the given key. Uses a larger LRU cache. The key is
    * tokenized into fragments.
    *
    * @param {string}   key - A key to find in trie data.
    */
   #findNode(key)
   {
      if (this.#cacheWord.has(key)) { return this.#cacheWord.get(key); }

      let node = this.#root;
      for (const token of this.#keyTokenizer(key))
      {
         if (!node) { return void 0; }
         node = node[token];
      }

      this.#cacheWord.set(key, node);

      return node;
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

      if (this.#options.cache && (c = this.#cachePhrase.get(TrieSearch.#getCacheKey(phrase, limit)))) { return c; }

      let ret = void 0;

      const haKeyFields = this.#indexField ? this.#indexField : this.#keyFields;
      const words = this.#options.splitOnGetRegEx ? phrase.split(this.#options.splitOnGetRegEx) : [phrase];

      // Note: HashArray has solid encapsulation; to not make a copy of the resulting backing list one can pass in
      // a list in the constructor or clone method. In the performance critical block below `resultList` will contain
      // the final value to return after the loop completes.

      let resultList;

      for (const word of words)
      {
         if (this.#options.min && word.length < this.#options.min) { continue; }

         const temp = new HashArray<T>(haKeyFields, { list: resultList = [] });

         if ((node = this.#findNode(word))) { aggregate(node, temp); }

         ret = ret ? ret.intersection(temp, ret.clone({ options: { list: resultList = [] }})) : temp;
      }

      const results: T[] = ret ? resultList : [];

      if (this.#options.cache) { this.#cachePhrase.set(TrieSearch.#getCacheKey(phrase, limit), results); }

      return results

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
    * Splits the given key by a minimum prefix followed by remaining characters as tokens.
    *
    * @param {string}   key - A key to split.
    *
    * @returns {Generator<string>} A generator that yields each character or prefix from the key as a token.
    * @yields {string}
    */
   *#keyTokenizer(key): Generator<string>
   {
      if (this.#options.min && this.#options.min > 1)
      {
         if (key.length < this.#options.min) { return; }

         yield key.substring(0, this.#options.min);

         for (let i = this.#options.min; i < key.length; i++) { yield key[i]; }
      }
      else
      {
         for (let i = 0; i < key.length; i++) { yield key[i]; }
      }
   }

   /**
    * Replaces a portion of a string with a new value.
    *
    * @param {string}   target - The target string.
    *
    * @param {number}   index - Index for replacement.
    *
    * @param {string}   replacement - The replacement string.
    *
    * @returns {string} The target string w/ replacement.
    */
   static #replaceStringAt(target: string, index: number, replacement: string)
   {
      return target.substring(0, index) + replacement + target.substring(index + replacement.length);
   }
}