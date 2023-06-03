import type { ITrieSearchReducer } from '#runtime/data/struct/search/trie';

/**
 * Options for TrieSearchQuery.
 */
export type TrieSearchQueryOptions<T extends object> = {
   /**
    * The initial limit on search results.
    */
   limit?: number;

   /**
    * An initial trie reducer instance to set.
    */
   trieReducer?: ITrieSearchReducer<T>
}