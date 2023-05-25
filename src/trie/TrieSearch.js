import { HashArray } from '../hash/HashArray';

// import {
//    Key,
//    KeyFields }       from '../types';

/**
 * @template T
 */
export class TrieSearch
{
   /** @type {HashArray} */
   #cache;

   #keyFields;

   /** @type {HashArray} */
   #indexed;

   #options;

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
      return this.#keyFields;
   }

   get root()
   {
      return this.#root;
   }

   get size()
   {
      return this.#size;
   }

   add(obj, customKeys)
   {
      if (this.#options.cache) { this.clearCache(); }

      // Someone might have called add via an array forEach where the second param is a number
      if (typeof customKeys === 'number') { customKeys = void 0; }

      const keyFields = customKeys || this.#keyFields;

      for (const k in keyFields)
      {
         const key = keyFields[k];
         let val = Array.isArray(key) ? TrieSearch.#deepLookup(obj, key) : obj[key];

         if (!val) { continue; }

         val = val.toString();

         const expandedValues = this.#expandString(val);

         for (let v = 0; v < expandedValues.length; v++)
         {
            this.map(expandedValues[v], obj);
         }
      }
   }

   addFromObject(obj, valueField)
   {
      if (this.#options.cache) { this.clearCache(); }

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

   clearCache()
   {
      this.#cache = new HashArray('key');
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

      if (this.#options.cache) { this.clearCache(); }

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
            ret = ret ? ret.addAll(matches) : new HashArray(haKeyFields).addAll(matches);
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
   static #deepLookup(obj, keys)
   {
      return keys.length === 1 ? obj[keys[0]] : this.#deepLookup(obj[keys[0]], keys.slice(1, keys.length));
   }

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
    * @returns {Array} Always returns an array even if no matches.
    */
   #expandString(value)
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

   static #getCacheKey(phrase, limit)
   {
      let cacheKey = phrase;

      if (limit) { cacheKey = `${phrase}_${limit}`; }

      return cacheKey;
   }

   #getImpl(phrase, limit)
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

      const v = ret ? [...ret.valuesFlat()] : [];

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
               ha.addAll(node.value);
            }
            else
            {
               // Limit is less than the number of entries in the node.value + ha combined
               ha.addAll(node.value.slice(0, limit - ha.sizeFlat));
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

   #keyToArr(key)
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
    * @param {string}   target -
    *
    * @param {number}   index -
    *
    * @param {string}   replacement -
    *
    * @returns {string}
    */
   static #replaceCharAt(target, index, replacement)
   {
      return target.substring(0, index) + replacement + target.substring(index + replacement.length);
   }
}

/**
 * @typedef {object} TrieSearchOptions
 *
 * @property {boolean} [cache=true] -
 *
 * @property {[{ regex: RegExp, alternate: string }]} [expandRegexes] -
 *
 * @property {string | (() => string)} [idFieldOrFunction] -
 *
 * @property {boolean} [ignoreCase=true] -
 *
 * @property {boolean} [insertFullUnsplitKey=false] -
 *
 * @property {boolean} [keepAll=false] -
 *
 * @property {string} [keepAllKey='id'] -
 *
 * @property {number} [maxCacheSize=64] -
 *
 * @property {number} [min=1] -
 *
 * @property {RegExp} [splitOnRegEx=/\s/g] -
 *
 * @property {RegExp} [splitOnGetRegEx=/\s/g] -
 */
