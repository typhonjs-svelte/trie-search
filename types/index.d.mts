declare class HashArray {
    /**
     * @param {string | Array} keyFields -
     *
     * @param {(type: string, whatChanged: *) => void} [callback] -
     *
     * @param {HashArrayOptions}   [options] - Options.
     */
    constructor(keyFields: string | any[], callback?: (type: string, whatChanged: any) => void, options?: HashArrayOptions);
    get all(): any[];
    get keyFields(): any[];
    get map(): {};
    add(...args: any[]): HashArray;
    addAll(arr: any): HashArray;
    addMap(key: any, obj: any): HashArray;
    addOne(obj: any): void;
    /**
     * Returns a new HashArray that contains the complement (difference) between this hash array (A) and the hasharray
     * passed in (B). Returns A - B.
     */
    complement(other: any): HashArray;
    /**
     * Returns a new HashArray that contains the intersection between this (A) and the hasharray passed in (B).
     * Returns A ^ B.
     */
    intersection(other: any): HashArray;
    get(key: any): any;
    getAll(keys: any): any[];
    getAsArray(key: any): any;
    sample(count: any, keys: any): any[];
    has(key: any): any;
    collides(item: any): boolean;
    hasMultiple(key: any): boolean;
    removeByKey(...args: any[]): HashArray;
    remove(...args: any[]): HashArray;
    removeAll(): HashArray;
    objectAt(obj: any, path: any): any;
    forEach(keys: any, callback: any): HashArray;
    forEachDeep(keys: any, key: any, callback: any): HashArray;
    clone(callback: any, ignoreItems: any): HashArray;
    sum(keys: any, key: any, weightKey: any): number;
    average(keys: any, key: any, weightKey: any): number;
    filter(keys: any, callbackOrKey: any): HashArray;
    #private;
}
type HashArrayOptions = {
    /**
     * When true, any attempt to add items that collide with any items in the
     * HashArray will be ignored.
     */
    ignoreDuplicates?: boolean;
};

/**
 * @template T
 */
declare class TrieSearch<T> {
    static UNION_REDUCER(accumulator: any, phrase: any, matches: any, trie: any): any;
    /**
     * @param {Array} [keyFields] -
     *
     * @param {TrieSearchOptions} [options] - Options.
     */
    constructor(keyFields?: any[], options?: TrieSearchOptions);
    get cache(): HashArray;
    get keyFields(): any[];
    get root(): {};
    get size(): number;
    add(obj: any, customKeys: any): void;
    addFromObject(obj: any, valueField: any): void;
    addAll(arr: any, customKeys: any): void;
    clearCache(): void;
    getId(item: any): any;
    map(key: any, value: any): void;
    reset(): void;
    search(phrases: any, reducer: any, limit: any): any;
    #private;
}
type TrieSearchOptions = {
    /**
     * -
     */
    cache?: boolean;
    /**
     * -
     */
    expandRegexes?: [{
        regex: RegExp;
        alternate: string;
    }];
    /**
     * -
     */
    idFieldOrFunction?: string | (() => string);
    /**
     * -
     */
    ignoreCase?: boolean;
    /**
     * -
     */
    insertFullUnsplitKey?: boolean;
    /**
     * -
     */
    keepAll?: boolean;
    /**
     * -
     */
    keepAllKey?: string;
    /**
     * -
     */
    maxCacheSize?: number;
    /**
     * -
     */
    min?: number;
    /**
     * -
     */
    splitOnRegEx?: RegExp;
    /**
     * -
     */
    splitOnGetRegEx?: RegExp;
};

export { HashArray, HashArrayOptions, TrieSearch, TrieSearchOptions };
