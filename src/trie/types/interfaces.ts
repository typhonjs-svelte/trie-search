import type {
   Key,
   KeyFields,
   TrieSearchReducerData,
   TrieSearchReducerResetData } from '.';

/**
 * Provides an interface for all reducers.
 *
 * @template T
 */
export interface ITrieSearchReducer<T extends object>
{
   /**
    * @return {Key | KeyFields} Any associated key fields to limit match intersection / HashArray in
    * `TrieSearch.#getImpl`.
    */
   get keyFields(): Key | KeyFields | undefined;

   /**
    * @returns {T[]} The matches after reducing.
    */
   get matches(): T[];

   /**
    * Defines a reducer function used to accumulate and reduce data found in searching.
    *
    * @param {TrieSearchReducerData<T>} data - The data to be reduced.
    */
   reduce(data: TrieSearchReducerData<T>): void;

   /**
    * Resets any state of the reducer. This is invoked at the beginning of {@link TrieSearch.search}.
    *
    * @param {TrieSearchReducerResetData<T>} data - The reset data.
    */
   reset(data: TrieSearchReducerResetData<T>): void;
}