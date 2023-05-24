/**
 * @param {object}                        opts - Test options
 *
 * @param {import('../../../../../types')}   opts.Module - Module to test
 *
 * @param {object}                        opts.chai - Chai
 */
export function run({ Module, chai })
{
   const { assert } = chai;

   const { HashArray } = Module;

   describe('HashArray', () =>
   {
      describe('new HashArray(keys) should work', () =>
      {
         const ha = new HashArray(['key'], (type) =>
         {
            it(`Should callback with 'construct'`, () => assert.equal(type, 'construct'));
         });

         it('Should have a all.length of 0.', () => assert.equal(ha.all.length, 0));

         it('Should have a map with no keys.', () =>
         {
            for (const key in ha.map) { assert.equal(true, false); } // eslint-disable-line no-unused-vars
         });

         const ha2 = new HashArray('key');

         it('should work with a single key not wrapped in an array.', () => assert.deepEqual(ha2.keyFields, ['key']));
      });

      describe('add(items) should work with 1 item', () =>
      {
         const ha = new HashArray(['key']);
         const item = { key: 'whatever' };

         ha.callback = (type, what) =>
         {
            it(`Should have a 'add' callback.`, () =>
            {
               assert.equal(type, 'add');
               assert.strictEqual(what[0], item);
            });
         };

         ha.add(item);

         it('Should have a single item.', () => assert.equal(ha.all.length, 1));

         it(`Should map 'whatever' to that item.`, () => assert.equal(ha.get('whatever'), item));

         it(`Should not crash on the reserved keyword 'constructor'.`,
          () => assert.equal(ha.get('constructo'), void 0));

         it('Should return true to a collides for a similar object.',
          () => assert.equal(ha.collides({ key: 'whatever' }), true));

         it('Should return false to a collides for a non-similar object.',
          () => assert.equal(ha.collides({ otherKey: 'whatever' }), false));
      });

      describe('add(items) should work with 2 item and duplicate keys', () =>
      {
         const ha = new HashArray(['key1', 'key2']);
         const item1 = {
            key1: 'whatever',
            key2: 'whatever'
         };
         const item2 = {
            key1: 'whatever',
            key2: 'whatever'
         };

         ha.add(item1, item2);

         it('Should have a 2 items.', () => assert.equal(ha.all.length, 2));

         it(`Should map 'whatever' to both items in proper order.`, () =>
         {
            assert.equal(ha.getAsArray('whatever')[0], item1);
            assert.equal(ha.getAsArray('whatever')[1], item2);
         });

         it('Should return true to a collides for a similar object.', () =>
         {
            assert.equal(ha.collides({ key1: 'whatever' }), true);
            assert.equal(ha.collides({ key2: 'whatever' }), true);
         });
      });

      describe('add(items) should work with 2 item and duplicate keys and options.ignoreDuplicates = true', () =>
      {
         const ha = new HashArray(['key1', 'key2'], void 0, { ignoreDuplicates: true });
         const item1 = {
            key1: 'whatever1',
            key2: 'whatever2'
         };
         const item2 = {
            key1: 'whatever2',
            key2: 'whatever1'
         };

         ha.add(item1, item2);

         it('Should have a 1 item.', () => assert.equal(ha.all.length, 1));

         it(`Should map 'whatever1' to item1 only (first inserted).`,
          () => assert.equal(ha.getAsArray('whatever1').length, 1));

         it(`Should map 'whatever2' to item1 only (first inserted).`,
          () => assert.equal(ha.getAsArray('whatever2').length, 1));
      });

      describe('add(items) should not allow addition of same item twice.', () =>
      {
         const ha = new HashArray(['key']);
         const item = { key: 'whatever' };

         ha.add(item);
         ha.add(item);
         ha.add(item);
         ha.add(item);

         it('Should have a single item.', () => assert.equal(ha.all.length, 1));

         it(`Should map 'whatever' to that item.`, () => assert.equal(ha.get('whatever'), item));
      });

      describe('add(items) should work with 1 item and multiple keys and key depths.', () =>
      {
         const ha = new HashArray([
            'key', ['child', 'key'],
            ['child', 'key2']
         ]);

         const item = {
            key: 'whatever',
            child: {
               key: 'deeeep',
               key2: 'sup'
            }
         };

         ha.add(item);

         it(`Should map 'deeeep' to that item.`, () => assert.equal(ha.get('deeeep'), item));

         it('Should have the item be the same for all key lookups', () =>
         {
            assert.equal(ha.get('deeeep'), ha.get('sup'));
            assert.equal(ha.get('sup'), ha.get('whatever'));
         });
      });

      describe('add(items) should work with > 1 item', () =>
      {
         const ha = new HashArray(['key']);
         const item1 = { key: 'whatever' };
         const item2 = { key: 'whatever2' };
         const item3 = { key: 'whatever3' };
         const item4 = { key: 'whatever3' };

         ha.callback = (type, what) =>
         {
            it(`Should have a 'add' callback.`, () =>
            {
               assert.equal(type, 'add');
               assert.strictEqual(what[0], item1);
               assert.strictEqual(what[1], item2);
               assert.strictEqual(what[2], item3);
               assert.strictEqual(what[3], item4);
            });
         };

         ha.add(item1, item2, item3, item4);

         it('Should have 3 items', () => assert.equal(ha.all.length, 4));

         it(`Should map 'whatever' to item1`, () => assert.deepEqual(ha.get('whatever'), item1));

         it(`Should map 'whatever2' to item2`, () => assert.equal(ha.get('whatever2'), item2));

         it(`Should map 'whatever3' to item3`, () => assert.deepEqual(ha.get('whatever3'), [item3, item4]));
      });

      describe('removeByKey(keys) should work with 1 item', () =>
      {
         const ha = new HashArray(['key']);
         const item = { key: 'whatever' };

         ha.add(item);
         ha.removeByKey('whatever');

         it('Should have no items after remove by key', () => assert.equal(ha.all.length, 0));

         it('Should have a map with no keys.', () =>
         {
            for (const key in ha.map) { assert.equal(key, void 0); }
         });
      });

      describe('removeByKey(keys) should work with 1 item and multiple key depths', () =>
      {
         const ha = new HashArray([
            ['child', 'key'],
            ['child', 'key2'],
            'key'
         ]);

         const item = {
            key: 'whatever',
            child: {
               key: 'deeeeep',
               key2: 'foobang'
            }
         };

         ha.add(item);

         ha.removeByKey('deeeeep');

         it('Should have no items after remove by key', () => assert.equal(ha.all.length, 0));

         it('Should have a map with no keys.', () =>
         {
            for (const key in ha.map) { assert.equal(key, void 0); }
         });
      });

      describe('removeByKey(keys) should work with 4 items', () =>
      {
         const ha = new HashArray(['key']);
         const item1 = { key: 'whatever' };
         const item2 = { key: 'whatever2' };
         const item3 = { key: 'whatever3' };
         const item4 = { key: 'whatever3' };

         console.log('START');

         ha.add(item1, item2, item3, item4);

         ha.callback = (type, what) =>
         {
            it(`Should have a 'removeByKey' callback.`, () =>
            {
               assert.equal(type, 'removeByKey');
               assert.strictEqual(what[0], item3);
               assert.strictEqual(what[1], item4);
            });
         };

         ha.removeByKey('whatever3');

         it('Should have 2 items after remove by key', () => assert.equal(ha.all.length, 2));

         it('Should have no key for removed item (has)', () => assert.equal(ha.has('whatever3'), false));

         it('Should have no key for removed item (get)', () => assert.equal(ha.get('whatever3'), void 0));

         it('Should have remaining two items by key', () =>
         {
            assert.equal(ha.get('whatever'), item1);
            assert.equal(ha.get('whatever2'), item2);
         });
      });

      describe('remove(items) should work with 1 item', () =>
      {
         const ha = new HashArray(['key']);
         const item = { key: 'whatever' };

         ha.add(item);

         ha.callback = (type, what) =>
         {
            it(`Should have a 'remove' callback.`, () =>
            {
               assert.equal(type, 'remove');
               assert.strictEqual(what[0], item);
            });
         };

         ha.remove(item);

         it('Should have no items after remove', () => assert.equal(ha.all.length, 0));

         it('Should have a map with no keys.', () =>
         {
            for (const key in ha.map) { assert.equal(key, void 0); }
         });
      });

      describe('remove(items) should work with 3 items', () =>
      {
         const ha = new HashArray(['key']);
         const item1 = { key: 'whatever' };
         const item2 = { key: 'whatever2' };
         const item3 = { key: 'whatever3' };

         ha.add(item1, item2, item3);

         ha.callback = (type, what) =>
         {
            it(`Should have a 'remove' callback.`, () =>
            {
               assert.equal(type, 'remove');
               assert.strictEqual(what[0], item2);
            });
         };

         ha.remove(item2);

         it('Should have 2 items after remove by key', () => assert.equal(ha.all.length, 2));

         it('Should have no key for removed item (has)', () => assert.equal(ha.has('whatever2'), false));

         it('Should have no key for removed item (get)', () => assert.equal(ha.get('whatever2'), void 0));

         it('Should have remaining two items by key', () =>
         {
            assert.equal(ha.get('whatever'), item1);
            assert.equal(ha.get('whatever3'), item3);
         });
      });

      describe('removeAll() should work', () =>
      {
         const ha = new HashArray(['key']);
         const item1 = { key: 'whatever' };
         const item2 = { key: 'whatever2' };
         const item3 = { key: 'whatever3' };

         ha.add(item1, item2, item3);

         ha.callback = (type, what) =>
         {
            it(`Should have a 'remove' callback.`, () =>
            {
               assert.equal(type, 'remove');
               assert.strictEqual(what[0], item1);
               assert.strictEqual(what[1], item2);
               assert.strictEqual(what[2], item3);
            });

            it('Should have 0 items after removeAll', () => assert.equal(ha.all.length, 0));

            it('Should have a map with no keys.', () =>
            {
               for (const key in ha.map) { assert.equal(key, void 0); }
            });
         };
         ha.removeAll();
      });

      describe('removeAll() should work', () =>
      {
         const ha = new HashArray(['key']);
         const item1 = { key: 'whatever' };
         const item2 = { key: 'whatever2' };
         const item3 = { key: 'whatever3' };

         ha.add(item1, item2, item3);

         ha.callback = (type, what) =>
         {
            it(`Should have a 'remove' callback.`, () =>
            {
               assert.equal(type, 'remove');
               assert.strictEqual(what[0], item1);
               assert.strictEqual(what[1], item2);
               assert.strictEqual(what[2], item3);
            });

            it('Should have 0 items after removeAll', () => assert.equal(ha.all.length, 0));

            it('Should have a map with no keys.', () =>
            {
               for (const key in ha.map) { assert.equal(key, void 0); }
            });
         };
         ha.removeAll();
      });

      describe('add should not allow adding of duplicate objects (single key)', () =>
      {
         const ha = new HashArray('key');
         const item1 = { key: 'whatever' };
         const item2 = { key: 'whatever2' };
         const item3 = { key: 'whatever3' };

         ha.add(item1, item2, item3, item3);

         it('Length should be 3', () => assert(ha.all.length === 3, `Length was not 3, was ${ha.all.length}`));
      });

      describe('add should not allow adding of duplicate objects (multi key)', () =>
      {
         const ha = new HashArray(['key1', 'key2']);
         const item1 = { key1: 'whatever2', key2: 'whatever3' };
         const item2 = { key1: 'whatever2' };
         const item3 = { key1: 'whatever3' };

         ha.add(item1, item2, item3, item3);

         it('Length should be 3', () => assert(ha.all.length === 3, `Length was not 3, was ${ha.all.length}`));
      });

      describe('intersection(ha) should work with simple single-key hasharrays', () =>
      {
         const ha1 = new HashArray('key');
         const item1 = { key: 'whatever' };
         const item2 = { key: 'whatever2' };
         const item3 = { key: 'whatever3' };
         const item4 = { key: 'whatever4' };

         ha1.add(item1, item2, item3);

         const ha2 = ha1.clone(null, true);
         ha2.add(item1, item3, item4);

         const intersection = ha1.intersection(ha2);

         it('Unioned hasharray should contain item1 and item3 only', () =>
         {
            assert(intersection.all.length === 2);
            assert(intersection.collides(item1));
            assert(!intersection.collides(item2));
            assert(intersection.collides(item3));
            assert(!intersection.collides(item4));
         });
      });

      describe('intersection(ha) should work with simple multi-key hasharrays', () =>
      {
         const ha1 = new HashArray(['key1', 'key2']);
         const item1 = { key1: 'whatever', key2: 'whatever4' };
         const item2 = { key1: 'whatever2' };
         const item3 = { key1: 'whatever3' };
         const item4 = { key1: 'whatever4' };

         ha1.add(item1, item2, item3);

         const ha2 = ha1.clone(null, true);
         ha2.add(item1, item3, item4);

         const intersection = ha1.intersection(ha2);

         it('Unioned hasharray should contain item1, item3, and item4 because of the extra key', () =>
         {
            assert(intersection.collides(item1), 'does not contain item1');
            assert(!intersection.collides(item2), 'does contain item2');
            assert(intersection.collides(item3), 'does not contain item3');
            assert(intersection.collides(item4), 'does not contain item4');
         });
      });

      describe('complement(ha) should work with simple multi-key hasharrays', () =>
      {
         const ha1 = new HashArray(['key1', 'key2']);
         const item1 = { key1: 'whatever', key2: 'whatever4' };
         const item2 = { key1: 'whatever2' };
         const item3 = { key1: 'whatever3' };
         const item4 = { key1: 'whatever4' };

         // Contains keys ['whatever', 'whatever2', 'whatever3', 'whatever4']
         ha1.add(item1, item2, item3, item4);

         const ha2 = ha1.clone(null, true);

         // Contains keys ['whatever', 'whatever3', 'whatever4']
         ha2.add(item1, item3);

         // SHOULD contain keys ['whatever2'] for item2 only.
         const complement = ha1.complement(ha2);

         it('Complemented hasharray should contain item2 only', () =>
         {
            assert(!complement.collides(item1), 'does contain item1');
            assert(complement.collides(item2), 'does not contain item2');
            assert(!complement.collides(item3), 'does contain item3');
            assert(!complement.collides(item4), 'does contain item4');
         });
      });

      describe('getAll(keys) should work', () =>
      {
         const ha = new HashArray(['firstName', 'lastName']);

         const person1 = { firstName: 'Victor', lastName: 'Victor' };
         const person2 = { firstName: 'Victor', lastName: 'Manning' };
         const person3 = { firstName: 'Manning', lastName: 'Victor' };
         const person4 = { firstName: 'John', lastName: 'Smith' };

         ha.add(person1, person2, person3, person4);

         it('Should retrieve only items for the keys requested without duplicates.', () =>
         {
            assert.equal(ha.getAll(['Victor', 'Smith']).length, 4);
            assert.equal(ha.getAll(['John', 'Smith']).length, 1);
         });
      });

      describe('forEach(keys, callback) should work', () =>
      {
         const ha = new HashArray(['type']);

         const a = { type: 'airplane', data: { speed: 100, weight: 10000 } };
         const b = { type: 'airplane', data: { speed: 50, weight: 20000 } };
         const c = { type: 'airplane', data: { speed: 25, weight: 50000 } };
         const d = { type: 'boat', data: { speed: 10, weight: 100000 } };
         const e = { type: 'boat', data: { speed: 5, weight: 200000 } };

         ha.add(a, b, c, d, e);

         it('should work.', () =>
         {
            let s = 0;

            ha.forEach('airplane', (airplane) => s += airplane.data.speed);

            assert.equal(s, 175);
         });

         it('should work (speed test boats).', () =>
         {
            let s = 0;

            ha.forEach(['boat'], (item) => s += item.data.speed);

            assert.equal(s, 15);
         });

         it('should work (speed test all).', () =>
         {
            let s = 0;

            ha.forEach(['airplane', 'boat'], (item) => s += item.data.speed);

            assert.equal(s, 190);
         });
      });

      describe('forEachDeep(keys, key, callback) should work', () =>
      {
         const ha = new HashArray(['type']);

         const a = { type: 'airplane', data: { speed: 100, weight: 10000 } };
         const b = { type: 'airplane', data: { speed: 50, weight: 20000 } };
         const c = { type: 'airplane', data: { speed: 25, weight: 50000 } };
         const d = { type: 'boat', data: { speed: 10, weight: 100000 } };
         const e = { type: 'boat', data: { speed: 5, weight: 200000 } };

         ha.add(a, b, c, d, e);

         it('should work (speed test airplanes).', () =>
         {
            let s = 0;

            ha.forEachDeep('airplane', ['data', 'speed'], (speed) => s += speed);

            assert.equal(s, 175);
         });

         it('should work (speed test boats).', () =>
         {
            let s = 0;

            ha.forEachDeep(['boat'], ['data', 'speed'], (speed) => s += speed);

            assert.equal(s, 15);
         });

         it('should work (speed test all).', () =>
         {
            let s = 0;

            ha.forEachDeep(['airplane', 'boat'], ['data', 'speed'], (speed) => s += speed);

            assert.equal(s, 190);
         });
      });

      describe('sum(keys, key) should work', () =>
      {
         const ha = new HashArray(['type']);

         const a = { type: 'airplane', data: { speed: 100, weight: 10000 } };
         const b = { type: 'airplane', data: { speed: 50, weight: 20000 } };
         const c = { type: 'airplane', data: { speed: 25, weight: 50000 } };
         const d = { type: 'boat', data: { speed: 10, weight: 100000 } };
         const e = { type: 'boat', data: { speed: 5, weight: 200000 } };

         ha.add(a, b, c, d, e);

         it('should work (speed test airplanes).', () => assert.equal(ha.sum('airplane', ['data', 'speed']), 175));

         it('should work (speed test boats).', () => assert.equal(ha.sum(['boat'], ['data', 'speed']), 15));

         it('should work (speed test all).', () => assert.equal(ha.sum(['airplane', 'boat'], ['data', 'speed']), 190));

         it('should work with weighted sums.',
          () => assert.equal(ha.sum('boat', ['data', 'speed'], ['data', 'weight']), (10 * 100000) + (5 * 200000)));
      });

      describe('average(keys, key, weight) should work', () =>
      {
         const ha = new HashArray(['type']);

         const a = { type: 'airplane', data: { speed: 100, weight: 0.1 } };
         const b = { type: 'airplane', data: { speed: 50, weight: 0.2 } };
         const c = { type: 'airplane', data: { speed: 25, weight: 0.2 } };
         const d = { type: 'boat', data: { speed: 10, weight: 0.2 } };
         const e = { type: 'boat', data: { speed: 5, weight: 0.3 } };

         ha.add(a, b, c, d, e);

         it('should work (speed test airplanes).',
          () => assert.equal(ha.average('airplane', ['data', 'speed']), 175 / 3));

         it('should work (speed test boats).', () => assert.equal(ha.average(['boat'], ['data', 'speed']), 15 / 2));

         it('should work (speed test all).',
          () => assert.equal(ha.average(['airplane', 'boat'], ['data', 'speed']), 190 / 5));

         it('should work with weighted average == 1.0.',
          () => assert.equal(ha.average(['airplane', 'boat'], ['data', 'speed'], ['data', 'weight']), 28.5));

         it('should work with weighted average != 1.0.', () =>
         {
            a.data.weight = 1.1;
            assert.equal(ha.average(['airplane', 'boat'], ['data', 'speed'], ['data', 'weight']), 64.25);
         });
      });

      describe('filter(keys, callback) should work and return new HashArray', () =>
      {
         const ha = new HashArray(['type']);

         const a = { type: 'airplane', data: { speed: 100, weight: 0.1, mobile: true } };
         const b = { type: 'airplane', data: { speed: 50, weight: 0.2, mobile: true } };
         const c = { type: 'airplane', data: { speed: 25, weight: 0.2, mobile: false } };
         const d = { type: 'boat', data: { speed: 10, weight: 0.2, mobile: true } };
         const e = { type: 'boat', data: { speed: 5, weight: 0.3, mobile: true } };

         ha.add(a, b, c, d, e);

         it('should return a new HashArray', () =>
         {
            assert.instanceOf(ha.filter('*', (item) => item.data.speed === 100), HashArray);
         });

         it('should return a new HashArray with the right length of items', () =>
         {
            assert.equal(ha.filter('*', (item) => item.data.speed === 100).all.length, 1);
         });

         it('should work with a key for the callback',
          () => assert.equal(ha.filter('airplane', ['data', 'mobile']).all.length, 2));

         it('should work with a key for the callback for a non-existent key',
          () => assert.equal(ha.filter('airplane', 'does not exist').all.length, 0));
      });

      describe('methods without a standard return should return this.', () =>
      {
         const ha = new HashArray('type');
         const item = { type: 'blah' };

         it('add(...) should return this', () => assert(ha.add(item) === ha));

         it('addAll(...) should return this', () => assert(ha.addAll([{ type: 'blah2' }]) === ha));

         it('remove(...) should return this', () => assert(ha.remove(item) === ha));

         it('removeByKey(...) should return this', () => assert(ha.removeByKey('blah2') === ha));
      });
   });
}
