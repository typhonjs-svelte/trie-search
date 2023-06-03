import type {
   Key,
   KeyFields,
   TrieSearchReducerData } from '.';

export interface ITrieSearchReducer<T extends object>
{
   get keyFields(): Key | KeyFields;

   get matches(): T[];

   /**
    * Defines a reducer function used to accumulate and reduce data found in searching.
    */
   reduce(data: TrieSearchReducerData<T>): void;

   reset(list: T[]): void;
}