/**
 * Options for HashArray.
 */
export type HashArrayOptions<T> = {
   /**
    * When true, any attempt to add items that collide with any items in the HashArray will be ignored.
    */
   ignoreDuplicates?: boolean;

   /**
    * An external array that is used for the list backing this HashArray allowing any owner direct access to the list.
    */
   list?: T[];
};

/**
 * A single key entry defined as a direct key / single string or array of strings for deep lookups.
 */
export type Key = string | string[];

/**
 * A single string or an array of strings / arrays representing what fields on added objects are to be used as keys for
 * the trie search / HashArray.
 */
export type KeyFields = Key[];