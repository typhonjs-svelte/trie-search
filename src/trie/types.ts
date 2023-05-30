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
    * The max cache size before removing entries in a LRU manner; default: 64.
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

   /**
    * Provide a custom tokenizer that is used to split keys.
    */
   tokenizer?: (str) => IterableIterator<string>
}

export type TrieReducerFn<T extends object> =
 (accumulator: T[], phrase: string, matches: T[], indexField: string) => T[];