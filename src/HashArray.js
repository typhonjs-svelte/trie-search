export class HashArray
{
   /** @type {(type: string, whatChanged: *) => void} */
   #callback;

   #keyFields;

   #list = [];

   /** @type {HashArrayOptions} */
   #options;

   #map = {};

   /**
    * @param {string | Array} keyFields -
    *
    * @param {(type: string, whatChanged: *) => void} [callback] -
    *
    * @param {HashArrayOptions}   [options] - Options.
    */
   constructor(keyFields, callback, options)
   {
      keyFields = Array.isArray(keyFields) ? keyFields : [keyFields];

      this.#callback = callback;

      this.#keyFields = keyFields;

      this.#options = Object.assign({}, { ignoreDuplicates: false }, options);

      if (callback) { callback('construct'); }
   }

   static #getUniqueRandomIntegers(count, min, max)
   {
      const map = {};
      const res = [];

      count = Math.min(Math.max(max - min, 1), count);

      while (res.length < count)
      {
         const r = Math.floor(min + (Math.random() * (max + 1)));

         if (map[r]) { continue; }

         map[r] = true;
         res.push(r);
      }

      return res;
   }

   get all()
   {
      return this.#list;
   }

   get keyFields()
   {
      return this.#keyFields;
   }

   get map()
   {
      return this.#map;
   }

   add(...args)
   {
      for (let i = 0; i < args.length; i++) { this.addOne(args[i]); }

      if (this.#callback) { this.#callback('add', args); }

      return this;
   }

   addAll(arr)
   {
      if (arr.length < 100)
      {
         this.add(...arr);
      }
      else
      {
         for (let i = 0; i < arr.length; i++) { this.add(arr[i]); }
      }

      return this;
   }

   addMap(key, obj)
   {
      this.#map[key] = obj;

      if (this.#callback) { this.#callback('addMap', { key, obj }); }

      return this;
   }

   addOne(obj)
   {
      let needsDupCheck = false;

      for (let key in this.#keyFields)
      {
         key = this.#keyFields[key];

         const inst = this.objectAt(obj, key);

         if (inst)
         {
            if (this.has(inst))
            {
               if (this.#options.ignoreDuplicates)
               {
                  return;
               }

               if (this.#map[inst].indexOf(obj) !== -1)
               {
                  // Cannot add the same item twice
                  needsDupCheck = true;
                  continue;
               }

               this.#map[inst].push(obj);
            }
            else
            {
               this.#map[inst] = [obj];
            }
         }
      }

      if (!needsDupCheck || this.#list.indexOf(obj) === -1) { this.#list.push(obj); }
   }

   // -----------------------------------
   // Intersection, union, etc.
   // -----------------------------------

   /**
    * Returns a new HashArray that contains the complement (difference) between this hash array (A) and the hasharray
    * passed in (B). Returns A - B.
    */
   complement(other)
   {
      if (!other || !(other instanceof HashArray))
      {
         throw new TypeError('Cannot HashArray.complement() on a non-hasharray object. You passed in: ', other);
      }

      const ret = this.clone(null, true);

      for (let i = this.#list.length; --i >= 0;)
      {
         if (!other.collides(this.#list[i])) { ret.add(this.#list[i]); }
      }

      return ret;
   }

   /**
    * Returns a new HashArray that contains the intersection between this (A) and the hasharray passed in (B).
    * Returns A ^ B.
    */
   intersection(other)
   {
      if (!other || !(other instanceof HashArray))
      {
         throw new TypeError('Cannot HashArray.intersection() on a non-hasharray object. You passed in: ', other);
      }

      const ret = this.clone(null, true);
      const allItems = this.clone(null, true).addAll(this.#list.concat(other.#list));

      for (let i = allItems.#list.length; --i >= 0;)
      {
         const item = allItems.#list[i];

         if (this.collides(item) && other.collides(item)) { ret.add(item); }
      }

      return ret;
   }

   // -----------------------------------
   // Retrieval
   // -----------------------------------

   get(key)
   {
      if (!this.has(key)) { return; }

      return (!Array.isArray(this.#map[key]) || this.#map[key].length !== 1) ? this.#map[key] : this.#map[key][0];
   }

   getAll(keys)
   {
      keys = Array.isArray(keys) ? keys : [keys];

      if (keys[0] === '*') { return this.#list; }

      const res = new HashArray(this.#keyFields);

      for (const key in keys) { res.add(...this.getAsArray(keys[key])); }

      return res.#list;
   }

   getAsArray(key)
   {
      return this.#map[key] ?? [];
   }

   sample(count, keys)
   {
      // http://en.wikipedia.org/wiki/Image_(mathematics)
      const image = keys ? this.getAll(keys) : this.#list;
      const res = [];

      const rand = HashArray.#getUniqueRandomIntegers(count, 0, image.length - 1);

      for (let i = rand.length; --i >= 0;) { res.push(image[rand[i]]); }

      return res;
   }

   // -----------------------------------
   // Peeking
   // -----------------------------------

   has(key)
   {
      return Object.prototype.hasOwnProperty.call(this.#map, key);
   }

   collides(item)
   {
      for (const k in this.#keyFields)
      {
         if (this.has(this.objectAt(item, this.#keyFields[k]))) { return true; }
      }

      return false;
   }

   hasMultiple(key)
   {
      return Array.isArray(this.#map[key]);
   }

   // -----------------------------------
   // Removal
   // -----------------------------------

   removeByKey(...args)
   {
      let removed = [];

      for (let i = args.length; --i >= 0;)
      {
         const key = args[i];
         const items = this.#map[key].concat();

         if (items)
         {
            removed = removed.concat(items);

            for (const j in items)
            {
               const item = items[j];

               for (const ix in this.#keyFields)
               {
                  const key2 = this.objectAt(item, this.#keyFields[ix]);

                  if (key2 && this.has(key2))
                  {
                     const ix = this.#map[key2].indexOf(item);

                     if (ix !== -1) { this.#map[key2].splice(ix, 1); }

                     if (this.#map[key2].length === 0) { delete this.#map[key2]; }
                  }
               }

               this.#list.splice(this.#list.indexOf(item), 1);
            }
         }
         delete this.#map[key];
      }

      if (this.#callback) { this.#callback('removeByKey', removed); }

      return this;
   }

   remove(...args)
   {
      for (let i = args.length; --i >= 0;)
      {
         const item = args[i];

         for (const ix in this.#keyFields)
         {
            const key = this.objectAt(item, this.#keyFields[ix]);

            if (key)
            {
               const ix = this.#map[key].indexOf(item);
               if (ix !== -1)
               {
                  this.#map[key].splice(ix, 1);
               }
               else
               {
                  throw new Error(`HashArray: attempting to remove an object that was never added; key: ${key}`);
               }

               if (this.#map[key].length === 0) { delete this.#map[key]; }
            }
         }

         const ix = this.#list.indexOf(item);

         if (ix !== -1)
         {
            this.#list.splice(ix, 1);
         }
         else
         {
            throw new Error(
             'HashArray: attempting to remove an object that was never added; could not find index for key.');
         }
      }

      if (this.#callback) { this.#callback('remove', args); }

      return this;
   }

   removeAll()
   {
      const old = [...this.#list];
      this.#map = {};
      this.#list = [];

      if (this.#callback) { this.#callback('remove', old); }

      return this;
   }

   // -----------------------------------
   // Utility
   // -----------------------------------

   objectAt(obj, path)
   {
      if (typeof path === 'string') { return obj[path]; }

      const dup = path.concat();

      // else assume array.
      while (dup.length && obj) { obj = obj[dup.shift()]; }

      return obj;
   }

   // -----------------------------------
   // Iteration
   // -----------------------------------

   forEach(keys, callback)
   {
      keys = Array.isArray(keys) ? keys : [keys];

      const objs = this.getAll(keys);

      objs.forEach(callback);

      return this;
   }

   forEachDeep(keys, key, callback)
   {
      keys = Array.isArray(keys) ? keys : [keys];

      const objs = this.getAll(keys);

      objs.forEach((item) => callback(this.objectAt(item, key), item));

      return this;
   }

   // -----------------------------------
   // Cloning
   // -----------------------------------

   clone(callback, ignoreItems)
   {
      const n = new HashArray([...this.#keyFields], callback ? callback : this.#callback);

      if (!ignoreItems) { n.add([...this.#list]); }

      return n;
   }

   // -----------------------------------
   // Mathematical
   // -----------------------------------

   sum(keys, key, weightKey)
   {
      let ret = 0;

      this.forEachDeep(keys, key, (value, item) =>
      {
         if (weightKey !== void 0) { value *= this.objectAt(item, weightKey); }

         ret += value;
      });

      return ret;
   }

   average(keys, key, weightKey)
   {
      let ret = 0;
      let tot = 0;
      let weightsTotal = 0;

      if (weightKey !== void 0) { this.forEachDeep(keys, weightKey, (value) => weightsTotal += value); }

      this.forEachDeep(keys, key, (value, item) =>
      {
         if (weightKey !== void 0) { value *= (this.objectAt(item, weightKey) / weightsTotal); }

         ret += value;
         tot++;
      });

      return weightKey !== undefined ? ret : ret / tot;
   }

   // -----------------------------------
   // Filtering
   // -----------------------------------

   filter(keys, callbackOrKey)
   {
      const callback = typeof callbackOrKey === 'function' ? callbackOrKey : (item) =>
      {
         const val = this.objectAt(item, callbackOrKey);
         return val !== void 0 && val !== false;
      };

      const ha = new HashArray([...this.#keyFields]);
      ha.addAll(this.getAll(keys).filter(callback));

      return ha;
   }
}

/**
 * @typedef {object} HashArrayOptions
 *
 * @property {boolean} [ignoreDuplicates=false] When true, any attempt to add items that collide with any items in the
 *           HashArray will be ignored.
 */