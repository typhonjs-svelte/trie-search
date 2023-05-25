/**
 * A single key entry defined as a direct key / single string or array of strings for deep lookups.
 */
export type Key = string | string[]

/**
 * A single string or an array of strings / arrays representing what fields on added objects are to be used as keys for
 * the trie search / HashArray.
 */
export type KeyFields = Key[];