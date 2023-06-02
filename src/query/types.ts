import type { TrieReducerFn } from '#runtime/data/struct/search/trie';

export type TrieSearchQueryOptions<T extends object> = {
   limit?: number;

   trieReducer?: TrieReducerFn<T>
}