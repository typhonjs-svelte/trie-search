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
    has(key: any): boolean;
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

export { HashArray, HashArrayOptions };
