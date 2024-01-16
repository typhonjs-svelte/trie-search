import QuickLRU                  from '#runtime/data/struct/cache/quick-lru';

import {
   isIterable,
   isObject,
   klona }                       from '#runtime/util/object';

import {
   getValueFromKey,
   HashArray }                   from '#runtime/data/struct/hash/array';

import type {
   ITrieSearchReducer,
   Key,
   KeyFields,
   TrieNode,
   TrieSearchOptions,
   TrieSearchSubscribeHandler }  from './types';

/**
 * A Trie is a data structure designed for quick reTRIEval of objects by string search. This was designed for use with
 * a type-ahead search (e.g. like a dropdown) but could be used in a variety of situations.
 *
 * This data structure indexes sentences / words to objects for searching by full or partial matches. So you can map
 * 'hello' to an Object, and then search by 'hel', 'hell', or 'hello' and get the Object or an Array of all objects
 * that match.
 *
 * By default, sentences / words are split along whitespace boundaries. For example, if your inserted mapping is
 * 'the quick brown fox', this object will be searchable by 'the', 'quick', 'brown', or 'fox' or any of their partials
 * like 'qui' or 'qu' or 'fo'. Boundaries can be customized using the `splitOnRegEx` option.
 *
 * By default, the trie-search is internationalized for a common set of vowels in the ASCII set. So if you insert 'ö',
 * then searching on 'o' will return that result. You can customize this by providing your own `expandRegexes` object.
 *
 * @template T
 */
export class TrieSearch<T extends object>
{
   /**
    * Provides a LRU cache for recent search queries. Caches all items matched per phrase.
    */
   readonly #cachePhrase: QuickLRU<string, { matches: T[], words: string[] }>;

   /**
    * Caches the object associated with a given word in `#findNode`.
    */
   readonly #cacheWord: QuickLRU<string, object>;

   /**
    * A single string or an array of strings / arrays representing what fields on added objects are to be used as keys
    * for the trie search / HashArray.
    */
   readonly #keyFields: KeyFields;

   /**
    * A clone of `#keyFields` returned from {@link TrieSearch.keyFields} and also sent to any reducer in
    * {@link TrieSearch.search}.
    */
   readonly #keyFieldsClone: KeyFields;

   /**
    * Stores whether this instance has been destroyed.
    */
   #isDestroyed: boolean = false;

   /**
    * Stores the TrieSearch options.
    */
   readonly #options: TrieSearchOptions;

   /**
    * A clone of `#options` sent to any reducer in {@link TrieSearch.search}.
    */
   readonly #optionsClone: TrieSearchOptions;

   /**
    * Number of nodes in the trie data structure.
    */
   #size: number;

   /**
    * Stores the trie data structure.
    */
   #root: TrieNode<T>;

   /**
    * Stores the subscriber handlers registered through {@link TrieSearch.subscribe}.
    */
   // readonly #subscribers: (({ action: 'add' | 'clear' | 'destroy', trieSearch: TrieSearch<T> | undefined) => unknown)[] = [];
   readonly #subscribers: TrieSearchSubscribeHandler<T>[] = [];

   /**
    * @param {string | KeyFields} [keyFields] - A single string or an array of strings / arrays representing what
    * fields on added objects are to be used as keys for the trie search / HashArray.
    *
    * @param {TrieSearchOptions} [options] - Options.
    */
   constructor(keyFields?: string | KeyFields, options?: TrieSearchOptions)
   {
      this.#keyFields = keyFields ? (Array.isArray(keyFields) ? keyFields : [keyFields]) : [];

      this.#keyFieldsClone = klona(this.#keyFields);

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

      TrieSearch.#validateOptions(this.#options);

      this.#optionsClone = klona(this.#options);

      this.#root = {};
      this.#size = 0;

      if (this.#options.cache)
      {
         this.#cachePhrase = new QuickLRU<string, { matches: T[], words: string[] }>(
          { maxSize: this.#options.maxCacheSize });

         this.#cacheWord = new QuickLRU<string, object>({ maxSize: this.#options.maxCacheSize });
      }
   }

   /**
    * @returns {boolean} Whether this TrieSearch instance has been destroyed.
    */
   get isDestroyed(): boolean
   {
      return this.#isDestroyed;
   }

   /**
    * @returns {KeyFields} A clone of the current key fields.
    */
   get keyFields(): KeyFields
   {
      return this.#keyFieldsClone;
   }

   /**
    * @returns {TrieNode<T>} The root trie node.
    */
   get root(): TrieNode<T>
   {
      if (this.#isDestroyed) { throw new Error('TrieSearch error: This instance has been destroyed.'); }

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
    * Add items or list of items to the TrieSearch instance.
    *
    * @param {...(T | Iterable<T>)}  items - Items to add.
    */
   add(...items: (T | Iterable<T>)[]): this
   {
      if (items.length === 0) { return; }

      if (this.#isDestroyed) { throw new Error('TrieSearch error: This instance has been destroyed.'); }

      // Only need to clear the phrase cache.
      if (this.#cachePhrase?.size) { this.#cachePhrase.clear(); }

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

      // Notify subscribers; IE TrieSearchQuery instances.
      if (this.#subscribers.length)
      {
         for (let i = 0; i < this.#subscribers.length; i++)
         {
            this.#subscribers[i]({ action: 'add', trieSearch: this });
         }
      }

      return this;
   }

   /**
    * Clears all items.
    *
    * @returns {TrieSearch<T>} This instance.
    */
   clear(): this
   {
      if (this.#isDestroyed) { throw new Error('TrieSearch error: This instance has been destroyed.'); }

      this.#root = {};
      this.#size = 0;

      this.#cachePhrase?.clear();
      this.#cacheWord?.clear();

      // Notify subscribers; IE TrieSearchQuery instances.
      if (this.#subscribers.length)
      {
         for (let i = 0; i < this.#subscribers.length; i++)
         {
            this.#subscribers[i]({ action: 'clear', trieSearch: this });
         }
      }

      return this;
   }

   /**
    * Destroys this TrieSearch instance. Removing all data and preventing new data from being added. Any subscribers
    * are notified with an undefined argument in the callback signaling that the associated instance is destroyed.
    */
   destroy(): this
   {
      this.#isDestroyed = true;
      this.#root = {};
      this.#size = 0;

      this.#cachePhrase?.clear();
      this.#cacheWord?.clear();

      // Notify subscribers; IE TrieSearchQuery instances.
      if (this.#subscribers.length)
      {
         for (let i = 0; i < this.#subscribers.length; i++)
         {
            this.#subscribers[i]({ action: 'destroy', trieSearch: this });
         }
      }

      this.#subscribers.length = 0;

      return this;
   }

   /**
    * Directly maps an item to the given key.
    *
    * @param {string}   key - The key to store the item.
    *
    * @param {T}        value - The item to store.
    */
   map(key: string, value: T): this
   {
      if (this.#isDestroyed) { throw new Error('TrieSearch error: This instance has been destroyed.'); }

      if (this.#options.splitOnRegEx && this.#options.splitOnRegEx.test(key))
      {
         const words = key.split(this.#options.splitOnRegEx);
         const emptySplitMatch = words.filter((p) => { return TrieSearch.#REGEX_IS_WHITESPACE.test(p); });
         const selfMatch = words.filter((p) => { return p === key; });
         const selfIsOnlyMatch = selfMatch.length + emptySplitMatch.length === words.length;

         // There is an edge case that a RegEx with a positive lookahead like `/?=[A-Z]/` split on capital letters for
         // a camelcase sentence will then match again when we call map, creating an infinite stack loop.
         if (!selfIsOnlyMatch)
         {
            for (let i = 0, l = words.length; i < l; i++)
            {
               if (!TrieSearch.#REGEX_IS_WHITESPACE.test(words[i])) { this.map(words[i], value); }
            }

            // Only insert full unsplit phrase if this option is true; continues with rest of `map` method.
            if (!this.#options.insertFullUnsplitKey) { return; }
         }
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

      // Ensure that a token was generated otherwise discard setting value as key is likely less than `min` option.
      if (node !== this.#root)
      {
         node['value'] = node['value'] ?? [];
         node['value'].push(value);
      }

      return this;
   }

   /**
    * Performs a search of the trie data structure with the given phrases. By default, each phrase is split by
    * {@link TrieSearchOptions.splitOnGetRegEx} and matches found for each word resulting in a `OR` lookup. You may
    * provide a `reducer` function to change the behavior
    *
    * @param {string | Iterable<string>}  phrases - The phrases to parse and search in the trie data structure.
    *
    * @param {object}   [options] - Search Options.
    *
    * @param {ITrieSearchReducer<T>}  [options.reducer] - A trie reducer instance to apply to this search.
    *
    * @param {number}   [options.limit] - The limit for search results returned.
    *
    * @param {T[]}      [options.list=[]] - An external array to use for storing search results.
    *
    * @returns {T[]} Found matches.
    */
   search(phrases: string | Iterable<string>, { reducer, limit, list = [] }:
    { reducer?: ITrieSearchReducer<T>, limit?: number, list?: T[] } = {}): T[]
   {
      if (phrases === void 0) { return list; }

      if (limit !== void 0 && (!Number.isInteger(limit) || limit < 0))
      {
         throw new TypeError(`TrieSearch.search error: 'limit' is not an integer >= 0.`);
      }

      let haKeyFields: Key | KeyFields = this.#keyFields;

      // Reset reducer and retrieve potentially more specific KeyFields.
      if (reducer)
      {
         reducer.reset({ keyFields: this.#keyFieldsClone, list, options: this.#optionsClone, phrases });

         haKeyFields = reducer.keyFields ?? haKeyFields;
      }

      if (typeof phrases === 'string')
      {
         const ignoreCasePhrase = this.#options.ignoreCase ? phrases.toLowerCase() : phrases;

         let matchesAndWords: { matches: T[], words: string[] };

         let cachedMatches: { matches: T[], words: string[] };

         if (this.#cachePhrase && (cachedMatches = this.#cachePhrase.get(
          TrieSearch.#getCacheKey(ignoreCasePhrase, limit))))
         {
            matchesAndWords = cachedMatches;
         }
         else
         {
            matchesAndWords = this.#getImpl(ignoreCasePhrase, limit, haKeyFields);
         }

         if (reducer)
         {
            reducer.reduce({ ignoreCasePhrase, index: 0, ...matchesAndWords, phrase: phrases });
         }
         else
         {
            new HashArray<T>(haKeyFields, { list }).add(matchesAndWords.matches);
         }
      }
      else if (isIterable(phrases))
      {
         let resultsHA: HashArray<T>;

         let index = 0;

         for (const phrase of phrases)
         {
            const ignoreCasePhrase = this.#options.ignoreCase ? phrase.toLowerCase() : phrase;

            let matchesAndWords: { matches: T[], words: string[] };

            let cachedMatches: { matches: T[], words: string[] };

            if (this.#cachePhrase && (cachedMatches = this.#cachePhrase.get(
             TrieSearch.#getCacheKey(ignoreCasePhrase, limit))))
            {
               matchesAndWords = cachedMatches;
            }
            else
            {
               matchesAndWords = this.#getImpl(ignoreCasePhrase, limit, haKeyFields);
            }

            if (reducer)
            {
               reducer.reduce({ ignoreCasePhrase, index: index++, ...matchesAndWords, phrase });
            }
            else
            {
               resultsHA = resultsHA ? resultsHA.add(matchesAndWords.matches) :
                new HashArray<T>(haKeyFields, { list }).add(matchesAndWords.matches);
            }
         }
      }

      return reducer ? reducer.matches : list;
   }

   // Readable store implementation ----------------------------------------------------------------------------------

   /**
    * Subscribe for change notification on add / clear / destroy.
    *
    * Note: There is no data defined regarding what changed only that one of three actions occurred. This TrieSearch
    * instance is sent as the only argument. When it is undefined this signals that the TrieSearch instance has been
    * destroyed.
    *
    * @param {(trieSearch: TrieSearch<T> | undefined) => unknown} handler - Callback function that is invoked on
    * changes (add / clear / destroy).
    *
    * @returns {() => void} Unsubscribe function.
    */
   subscribe(handler: TrieSearchSubscribeHandler<T>): () => void
   {
      this.#subscribers.push(handler);

      handler({ action: 'subscribe', trieSearch: this });

      // Return unsubscribe function.
      /* c8 ignore next 5 */
      return () =>
      {
         const index = this.#subscribers.findIndex((sub) => sub === handler);
         if (index >= 0) { this.#subscribers.splice(index, 1); }
      };
   }

   // Internal -------------------------------------------------------------------------------------------------------

   static #MAX_CACHE_SIZE = 64;

   static #REGEX_IS_WHITESPACE = /^\s*$/;

   static #DEFAULT_INTERNATIONALIZE_EXPAND_REGEXES = [
      { regex: /[åäàáâãæ]/ig, alternate: 'a' },
      { regex: /[èéêë]/ig, alternate: 'e' },
      { regex: /[ìíîï]/ig, alternate: 'i' },
      { regex: /[òóôõö]/ig, alternate: 'o' },
      { regex: /[ùúûü]/ig, alternate: 'u' },
      { regex: /æ/ig, alternate: 'ae' }
   ];

   #addOne(item: T)
   {
      if (!isObject(item)) { throw new TypeError(`TrieSearch.add error: The add method only accepts objects.`); }

      for (const key of this.#keyFields)
      {
         let val = Array.isArray(key) ? getValueFromKey(item, key) : item[key];

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
    * @returns {IterableIterator<string>}  Always returns an array even if no matches.
    * @yields {string}
    */
   static *#expandString(value: string, options: TrieSearchOptions): IterableIterator<string>
   {
      yield value;

      if (options.expandRegexes && options.expandRegexes.length)
      {
         for (let i = 0; i < options.expandRegexes.length; i++)
         {
            const er = options.expandRegexes[i];
            let match: RegExpExecArray;

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
   #findNode(key: string)
   {
      if (this.#cacheWord?.has(key)) { return this.#cacheWord.get(key); }

      let node = this.#root;
      for (const token of this.#keyTokenizer(key))
      {
         if (!node) { return void 0; }
         node = node[token];
      }

      this.#cacheWord?.set(key, node);

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
    * @param {Key | KeyFields} haKeyFields -
    *
    * @returns {{ matches: T[], words: string[] }} An array of items found from `phrase`.
    */
   #getImpl(phrase: string, limit: number, haKeyFields: Key | KeyFields): { matches: T[], words: string[] }
   {
      const words = this.#options.splitOnGetRegEx ? phrase.split(this.#options.splitOnGetRegEx) : [phrase];

      let ret = void 0;

      // Note: HashArray has solid encapsulation; to not make a copy of the resulting backing list one can pass in
      // a list in the constructor or clone method. In the performance critical block below `matchesList` will contain
      // the final value to return after the loop completes.

      let matchesList: T[], node: TrieNode<T>;

      for (const word of words)
      {
         if (this.#options.min && word.length < this.#options.min) { continue; }

         const temp = new HashArray<T>(haKeyFields, { list: matchesList = [] });

         if ((node = this.#findNode(word))) { aggregate(node, temp); }

         ret = ret ? ret.intersection(temp, ret.clone({ options: { list: matchesList = [] }})) : temp;
      }

      const matches: T[] = ret ? matchesList : [];

      this.#cachePhrase?.set(TrieSearch.#getCacheKey(phrase, limit), { matches, words });

      return { matches, words };

      function aggregate(node: TrieNode<T>, ha: HashArray<T>)
      {
         if (limit !== void 0 && ha.sizeFlat >= limit) { return; }

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
            if (limit !== void 0 && ha.sizeFlat >= limit) { return; }
            if (k !== 'value') { aggregate(node[k], ha); }
         }
      }
   }

   /**
    * Splits the given key by a minimum prefix followed by remaining characters as tokens.
    *
    * Note: An external tokenizer may be set in options to replace the internal / ASCII tokenizer. An external
    * tokenizer must be a function that takes a string and returns an {@link IterableIterator<string>}.
    *
    * @param {string}   key - A key to split.
    *
    * @returns {IterableIterator<string>} A generator that yields each character or prefix from the key as a token.
    * @yields {string}
    */
   *#keyTokenizer(key: string): IterableIterator<string>
   {
      if (this.#options.tokenizer)
      {
         const extTokenizer = this.#options.tokenizer(key);

         // Only process this block if there is a min size > 1.
         if (this.#options.min && this.#options.min > 1)
         {
            let buffer = '';
            let i = 0;

            for (; i < this.#options.min; i++)
            {
               const next = extTokenizer.next();

               // Tokens ended before `min` length.
               if (next.done) { return; }

               buffer += next.value;
            }

            yield buffer;
         }

         // Finish yielding rest of tokens.
         for (const token of extTokenizer) { yield token; }
      }
      else
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
   static #replaceStringAt(target: string, index: number, replacement: string): string
   {
      return target.substring(0, index) + replacement + target.substring(index + replacement.length);
   }

   /**
    * Validate options
    *
    * @param {TrieSearchOptions} options - Options to validate.
    */
   static #validateOptions(options: TrieSearchOptions)
   {
      if (options.maxCacheSize !== void 0 && (!Number.isInteger(options.maxCacheSize) || options.maxCacheSize < 0))
      {
         throw new TypeError(`TrieSearch error: 'options.maxCacheSize' must be an integer >= 0.`);
      }

      if (options.tokenizer !== void 0 && typeof options.tokenizer !== 'function')
      {
         throw new TypeError(`TrieSearch error: 'options.tokenizer' is not a function.`);
      }
   }
}