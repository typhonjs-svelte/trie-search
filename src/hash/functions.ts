import { isObject }  from '#runtime/util/object';

import type { Key }  from './types';

/**
 * Returns the value for a Key in the given item / object.
 *
 * @param {object}   item - The target item or partial item.
 *
 * @param {Key}      key - The Key to lookup in item.
 *
 * @returns {any} Value for key in item.
 */
export function getValueFromKey(item: object, key: Key): any
{
   if (!isObject(item)) { throw new Error(`getValueFromKey error: 'item' must be an object.`); }

   if (typeof key === 'string') { return item[key]; }

   if (!Array.isArray(key)) { return void 0; }

   if (key.length === 0) { return void 0; }

   // else assume key is an array.
   for (const k of key)
   {
      if (typeof k !== 'string') { return void 0; }

      if (item) { item = item[k]; }
      else { break; }
   }

   return item;
}
