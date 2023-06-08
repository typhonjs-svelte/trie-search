import {KeyFields} from "../../hash";

/**
 * Defines the trie data structure. The `value` key is a specific list of items; all other string keys may refer to
 * another TrieNode.
 */
export type TrieNode<T extends object> = {
   [K in string]?: TrieNode<T>;
} & {
   value?: T[];
};

/**
 * Data provided when reducing a batch of matches.
 */
export type TrieSearchReducerData<T> = {
   /**
    * The phrase after {@link TrieSearchOptions.ignoreCase} applied.
    */
   ignoreCasePhrase: string;

   /**
    * The current phrase index.
    */
   index: number;

   /**
    * Matches found from the current phrase.
    */
   matches: T[];

   /**
    * The original phrase.
    */
   phrase: string;

   /**
    * The split words from the phrase.
    */
   words: string[];
}

/**
 * Data provided when resetting reducers.
 */
export type TrieSearchReducerResetData<T> = {
   /**
    * Clone of key fields from host TrieSearch instance.
    */
   keyFields: KeyFields;

   /**
    * The output results array from {@link TrieSearch.search}.
    */
   list: T[];

   /**
    * Clone of options from host TrieSearch instance.
    */
   options: TrieSearchOptions;

   /**
    * The phrases being searched; not lowercase if {@link TrieSearchOptions.ignoreCase} is true.
    */
   phrases: string | Iterable<string>;
}

/**
 * Options for TrieSearch.
 */
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
    * Default: false
    */
   insertFullUnsplitKey?: boolean;

   /**
    * The max cache size before removing entries in a LRU manner; default: 64.
    */
   maxCacheSize?: number;

   /**
    * The size of the prefix for keys; minimum length of a key to store and search. By default, this is 1, but you
    * might improve performance by using 2 or 3.
    */
   min?: number;

   /**
    * How phrases are split on search; default: `/\s/g`. By default, this is any whitespace. Set to `false` if you have
    * whitespace in your keys! Set it to something else to split along other boundaries.
    */
   splitOnRegEx?: RegExp | false;

   /**
    * How phrases are split on retrieval / get; default: `/\s/g`.
    */
   splitOnGetRegEx?: RegExp | false;

   /**
    * Provide a custom tokenizer that is used to split keys.
    */
   tokenizer?: (str: string) => IterableIterator<string>
}