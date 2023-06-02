import type { TrieReducerFn } from '#runtime/data/struct/search/trie';

/**
 * Options for TrieSearchQuery.
 */
export type TrieSearchQueryOptions<T extends object> = {
   /**
    * The initial limit on search results.
    */
   limit?: number;

   /**
    * An initial trie reducer function to set.
    */
   trieReducer?: TrieReducerFn<T>
}