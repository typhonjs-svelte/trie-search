import { writable }        from '#svelte/store';

import { DynArrayReducer } from '#runtime/data/struct/store/reducer';

import type { TrieSearch } from '../TrieSearch';

export class TrieSearchQuery<T extends object> extends DynArrayReducer<T>
{
   readonly #data: T[] = [];

   readonly #stores;

   readonly #trieSearch: TrieSearch<T>;

   constructor(trieSearch?: TrieSearch<T>)
   {
      super();

      this.#trieSearch = trieSearch;

      this.#stores = {
         search: writable('')
      };

      super.setData(this.#data, true);
   }

   get stores() { return this.#stores; }
}