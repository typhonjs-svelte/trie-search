import { HashArray } from '../../src';
import {describe} from "vitest";

type Item = { key: string };
type Item2 = { key1: string, key2: string };
type ItemDeep = { key: string, child: Item2 };
type People = { firstName: string, lastName: string };
type DeepData = { type: string, data: { speed: number, weight: number, mobile?: boolean } };

describe('HashArray API Tests', () =>
{
   describe('General Tests', () =>
   {
      describe('New Construction', () =>
      {
         it('Should work', () =>
         {
            const ha = new HashArray(['key']);

            it('Should have a map with no keys.', () => assert.equal([...ha.keys()].length, 0));

            const ha2 = new HashArray('key');

            it('Should work with a single key not wrapped in an array.',
             () => assert.deepEqual(ha2.keyFields, ['key']));
         });
      });

      describe('Accessors', () =>
      {
         const keyFields = ['key', ['key', 'key2']];
         const ha = new HashArray<Item>(keyFields);
         const item: Item = { key: 'blah' };

         it('Should deepEqual keyFields', () => assert.deepEqual(ha.keyFields, keyFields));

         it('Should be a clone of keyFields', () => assert.notEqual(ha.keyFields, keyFields));

         it('Should have a size of 0.', () => assert.equal(ha.size, 0));

         it('Should have a sizeFlat of 0.', () => assert.equal(ha.sizeFlat, 0));

         it('Should have a size of 1.', () => {
            ha.add(item);
            ha.add({ key: 'blah' });
            assert.equal(ha.size, 1)
         });

         it('Should have a sizeFlat of 2.', () => assert.equal(ha.sizeFlat, 2));

         it('Should have a size of 1.', () => {
            ha.remove(item);
            assert.equal(ha.size, 1)
         });

         it('Should have a sizeFlat of 1.', () => assert.equal(ha.sizeFlat, 1));

         it('Should have a size of 0.', () => {
            ha.clear();
            assert.equal(ha.size, 0)
         });

         it('Should have a sizeFlat of 0.', () => assert.equal(ha.sizeFlat, 0));
      });

      describe('This Return Values', () =>
      {
         const ha = new HashArray<Item>('key');
         const item = { key: 'blah' };

         it('add(...) should return this', () => assert(ha.add(item) === ha));

         it('clear(...) should return this', () => assert(ha.clear() === ha));

         it('forEach(...) should return this', () => assert(ha.forEach('', () => void 0) === ha));

         it('forEachDeep(...) should return this', () => assert(ha.forEachDeep('', '', () => void 0) === ha));

         it('remove(...) should return this', () => assert(ha.remove(item) === ha));

         it('removeByKey(...) should return this', () => assert(ha.removeByKey('blah2') === ha));

         it('removeFirst() should return this', () => assert(ha.removeFirst() === ha));

         it('removeLast() should return this', () => assert(ha.removeLast() === ha));
      });
   });

   describe('Adding Items', () =>
   {
      describe('add(items)', () =>
      {
         describe('Should work with no items', () =>
         {
            const ha = new HashArray(['key']);
            it('Should have a single item.', () =>
            {
               ha.add();
               assert.equal(ha.sizeFlat, 0);
            });
         });

         describe('Should work with 1 item', () =>
         {
            const ha = new HashArray<Item>(['key']);
            const item = { key: 'whatever' };

            ha.add(item);

            it('Should have a single item.', () => assert.equal(ha.sizeFlat, 1));

            it(`Should map 'whatever' to that item.`, () => assert.equal(ha.get('whatever'), item));

            it(`Should not crash on the reserved keyword 'constructor'.`,
             () => assert.equal(ha.get('constructo'), void 0));

            it('Should return true to a collides for a similar object.',
             () => assert.equal(ha.collides({ key: 'whatever' }), true));

            it('Should return false to a collides for a non-similar object.',
             // @ts-expect-error
             () => assert.equal(ha.collides({ otherKey: 'whatever' }), false));
         });

         describe('Should work with 2 item and duplicate keys', () =>
         {
            const ha = new HashArray<Item2>(['key1', 'key2']);
            const item1 = {
               key1: 'whatever',
               key2: 'whatever'
            };
            const item2 = {
               key1: 'whatever',
               key2: 'whatever'
            };

            ha.add(item1, item2);

            it('Should have a 2 items.', () => assert.equal(ha.sizeFlat, 2));

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

         describe('Should work with 2 item and duplicate keys and options.ignoreDuplicates = true', () =>
         {
            const ha = new HashArray<Item2>(['key1', 'key2'], { ignoreDuplicates: true });
            const item1 = {
               key1: 'whatever1',
               key2: 'whatever2'
            };
            const item2 = {
               key1: 'whatever2',
               key2: 'whatever1'
            };

            ha.add(item1, item2);

            it('Should have a 1 item.', () => assert.equal(ha.sizeFlat, 1));

            it(`Should map 'whatever1' to item1 only (first inserted).`,
             () => assert.equal(ha.getAsArray('whatever1').length, 1));

            it(`Should map 'whatever2' to item1 only (first inserted).`,
             () => assert.equal(ha.getAsArray('whatever2').length, 1));
         });

         describe('Should not allow addition of same item twice.', () =>
         {
            const ha = new HashArray<Item>(['key']);
            const item = { key: 'whatever' };

            ha.add(item);
            ha.add(item);
            ha.add(item);
            ha.add(item);

            it('Should have a single item.', () => assert.equal(ha.sizeFlat, 1));

            it(`Should map 'whatever' to that item.`, () => assert.equal(ha.get('whatever'), item));
         });

         describe('Should work with 1 item and multiple keys and key depths.', () =>
         {
            const ha = new HashArray<ItemDeep>([
               'key', ['child', 'key1'],
               ['child', 'key2']
            ]);

            const item = {
               key: 'whatever',
               child: {
                  key1: 'deeeep',
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

         describe('Should work with > 1 item', () =>
         {
            const ha = new HashArray<Item>(['key']);
            const item1 = { key: 'whatever' };
            const item2 = { key: 'whatever2' };
            const item3 = { key: 'whatever3' };
            const item4 = { key: 'whatever3' };

            ha.add(item1, item2, item3, item4);

            it('Should have 3 items', () => assert.equal(ha.sizeFlat, 4));

            it(`Should map 'whatever' to item1`, () => assert.deepEqual(ha.get('whatever'), item1));

            it(`Should map 'whatever2' to item2`, () => assert.equal(ha.get('whatever2'), item2));

            it(`Should map 'whatever3' to item3`, () => assert.deepEqual(ha.get('whatever3'), [item3, item4]));
         });

         describe('Should not allow adding of duplicate objects (single key)', () =>
         {
            const ha = new HashArray<Item>('key');
            const item1 = { key: 'whatever' };
            const item2 = { key: 'whatever2' };
            const item3 = { key: 'whatever3' };

            ha.add(item1, item2, item3, item3);

            it('Length should be 3', () => assert(ha.sizeFlat === 3, `Length was not 3, was ${ha.sizeFlat}`));
         });

         describe('Should not allow adding of duplicate objects (multi key)', () =>
         {
            const ha = new HashArray<Partial<Item2>>(['key1', 'key2']);
            const item1 = { key1: 'whatever2', key2: 'whatever3' };
            const item2 = { key1: 'whatever2' };
            const item3 = { key1: 'whatever3' };

            ha.add(item1, item2, item3, item3);

            it('Length should be 3', () => assert(ha.sizeFlat === 3, `Length was not 3, was ${ha.sizeFlat}`));
         });
      });
   });

   describe('Cloning', () =>
   {
      describe('clone()', () =>
      {
         const keyFields = ['key', ['key1', 'key2']];
         const ha = new HashArray<Item>(keyFields);

         it('Should be different instance', () => {
            const haClone = ha.clone();
            assert.notEqual(ha, haClone, 'clone is same instance');
         });

         it('Should have same, but different instance of KeyFields', () => {
            const haClone = ha.clone();
            assert.notEqual(ha, haClone, 'clone is same instance');
         });

         it('Should have no items', () => {
            const haClone = ha.clone();
            assert.equal(haClone.sizeFlat, 0, 'there are items');
         });
      });

      describe('clone(CloneOps)', () =>
      {
         const ha = new HashArray<Item>('key');
         const item: Item = { key: 'what' }
         const item2: Item = { key: 'what2' }

         ha.add(item, item2);

         it('clone(HashArray.CloneOps.SHALLOW) should have items and they are same item instance', () => {
            const haClone = ha.clone(HashArray.CloneOps.SHALLOW);

            assert.equal(haClone.sizeFlat, 2);

            assert.equal(item, haClone.get('what'), 'item is not same instance');
            assert.equal(item2, haClone.get('what2'), 'item is not same instance');

            assert.deepEqual(item, haClone.get('what'), 'item does not deeply equal');
            assert.deepEqual(item2, haClone.get('what2'), 'item does not deeply equal');
         });

         it('clone(HashArray.CloneOps.DEEP) Should have items and they are cloned', () => {
            const haClone = ha.clone(HashArray.CloneOps.DEEP);

            assert.equal(haClone.sizeFlat, 2);

            assert.notEqual(item, haClone.get('what'), 'item is same instance');
            assert.notEqual(item2, haClone.get('what2'), 'item is same instance');

            assert.deepEqual(item, haClone.get('what'), 'item does not deeply equal');
            assert.deepEqual(item2, haClone.get('what2'), 'item does not deeply equal');
         });
      })

      describe('clone(CloneOps) w/ class instance', () =>
      {
         class Test {
            key: string;
            constructor(key) { this.key = key; }
            fooBar() {}
         }

         const ha = new HashArray<Test>('key');
         const item: Test = new Test('what');
         const item2: Test = new Test('what2');

         ha.add(item, item2);

         it('clone(HashArray.CloneOps.SHALLOW) should have items and they are same item instance', () => {
            const haClone = ha.clone(HashArray.CloneOps.SHALLOW);

            assert.equal(haClone.sizeFlat, 2);

            assert.equal(item, haClone.get('what'), 'item is not same instance');
            assert.equal(item2, haClone.get('what2'), 'item is not same instance');

            assert.deepEqual(item, haClone.get('what'), 'item does not deeply equal');
            assert.deepEqual(item2, haClone.get('what2'), 'item does not deeply equal');

            assert.instanceOf(haClone.get('what'), Test, 'not instanceof Test');
            assert.instanceOf(haClone.get('what2'), Test, 'not instanceof Test');

            assert.isFunction((haClone.get('what') as Test).fooBar, 'does not have fooBar method');
            assert.isFunction((haClone.get('what2') as Test).fooBar, 'does not have fooBar method');
         });

         it('clone(HashArray.CloneOps.DEEP) Should have items and they are cloned', () => {
            const haClone = ha.clone(HashArray.CloneOps.DEEP);

            assert.equal(haClone.sizeFlat, 2);

            assert.notEqual(item, haClone.get('what'), 'item is same instance');
            assert.notEqual(item2, haClone.get('what2'), 'item is same instance');

            assert.deepEqual(item, haClone.get('what'), 'item does not deeply equal');
            assert.deepEqual(item2, haClone.get('what2'), 'item does not deeply equal');

            assert.instanceOf(haClone.get('what'), Test, 'not instanceof Test');
            assert.instanceOf(haClone.get('what2'), Test, 'not instanceof Test');

            assert.isFunction((haClone.get('what') as Test).fooBar, 'does not have fooBar method');
            assert.isFunction((haClone.get('what2') as Test).fooBar, 'does not have fooBar method');
         });
      })
   });

   describe('Filtering Items', () =>
   {
      describe('filter(keys, callback)', () =>
      {
         describe('Should work and return new HashArray', () =>
         {
            const ha = new HashArray<DeepData>(['type']);

            const a = { type: 'airplane', data: { speed: 100, weight: 0.1, mobile: true } };
            const b = { type: 'airplane', data: { speed: 50, weight: 0.2, mobile: true } };
            const c = { type: 'airplane', data: { speed: 25, weight: 0.2, mobile: false } };
            const d = { type: 'boat', data: { speed: 10, weight: 0.2, mobile: true } };
            const e = { type: 'boat', data: { speed: 5, weight: 0.3, mobile: true } };

            ha.add(a, b, c, d, e);

            it('Should return a new HashArray',
             () => assert.instanceOf(ha.filter('*', (item) => item.data.speed === 100), HashArray));

            it('Should return a new HashArray with the right length of items',
             () => assert.equal(ha.filter('*', (item) => item.data.speed === 100).sizeFlat, 1));

            it('Should work with a key for the callback',
             () => assert.equal(ha.filter('airplane', ['data', 'mobile']).sizeFlat, 2));

            it('Should work with a key for the callback for a non-existent key',
             () => assert.equal(ha.filter('airplane', 'does not exist').sizeFlat, 0));
         });
      });
   });

   describe('Iterating Items', () =>
   {
      describe('forEach(keys, callback)', () =>
      {
         describe('Should work', () =>
         {
            const ha = new HashArray<DeepData>(['type']);

            const a = { type: 'airplane', data: { speed: 100, weight: 10000 } };
            const b = { type: 'airplane', data: { speed: 50, weight: 20000 } };
            const c = { type: 'airplane', data: { speed: 25, weight: 50000 } };
            const d = { type: 'boat', data: { speed: 10, weight: 100000 } };
            const e = { type: 'boat', data: { speed: 5, weight: 200000 } };

            ha.add(a, b, c, d, e);

            it('should work (sum airplane speed)', () =>
            {
               let s = 0;

               ha.forEach('airplane', (airplane) => s += airplane.data.speed);

               assert.equal(s, 175);
            });

            it('should work (sum boat speed).', () =>
            {
               let s = 0;

               ha.forEach(['boat'], (boat) => s += boat.data.speed);

               assert.equal(s, 15);
            });

            it('should work (sum boat and airplane speed).', () =>
            {
               let s = 0;

               ha.forEach(['airplane', 'boat'], (item) => s += item.data.speed);

               assert.equal(s, 190);
            });
         });
      });

      describe('forEachDeep(keys, index, callback)', () =>
      {
         describe('Should work', () =>
         {
            const ha = new HashArray<DeepData>(['type']);

            const a = { type: 'airplane', data: { speed: 100, weight: 10000 } };
            const b = { type: 'airplane', data: { speed: 50, weight: 20000 } };
            const c = { type: 'airplane', data: { speed: 25, weight: 50000 } };
            const d = { type: 'boat', data: { speed: 10, weight: 100000 } };
            const e = { type: 'boat', data: { speed: 5, weight: 200000 } };

            ha.add(a, b, c, d, e);

            it('Should work (sum airplane speed).', () =>
            {
               let s = 0;

               ha.forEachDeep('airplane', ['data', 'speed'], (speed) => s += speed);

               assert.equal(s, 175);
            });

            it('Should work (sum boat speed).', () =>
            {
               let s = 0;

               ha.forEachDeep(['boat'], ['data', 'speed'], (speed) => s += speed);

               assert.equal(s, 15);
            });

            it('Should work (sum boat and airplane speed).', () =>
            {
               let s = 0;

               ha.forEachDeep(['airplane', 'boat'], ['data', 'speed'], (speed) => s += speed);

               assert.equal(s, 190);
            });
         });
      });

      describe('entries()', () =>
      {
         describe('Should work', () =>
         {
            const ha = new HashArray<Item>(['key']);

            const items1: Item[] = [
               { key: 'what' },
               { key: 'what' },
               { key: 'what' },
            ];

            const items2: Item[] = [
               { key: 'what2' },
               { key: 'what2' },
               { key: 'what2' },
            ];

            ha.add(items1, items2);

            it('Should have two entries results', () =>
            {
               const results = [...ha.entries()]

               assert.equal(results.length, 2, 'does not have 2 entries');

               assert.equal(results[0][0], 'what', 'entry 1 does not have correct key');
               assert.deepEqual(results[0][1], items1, 'entry 1 does not have correct items');


               assert.equal(results[1][0], 'what2', 'entry 2 does not have correct key');
               assert.deepEqual(results[1][1], items2, 'entry 2 does not have correct items');
            })
         });
      });

      describe('entriesFlat()', () =>
      {
         describe('Should work', () =>
         {
            const ha = new HashArray<Item>(['key']);

            const items1: Item[] = [
               { key: 'what' },
               { key: 'what' },
               { key: 'what' },
            ];

            const items2: Item[] = [
               { key: 'what2' },
               { key: 'what2' },
               { key: 'what2' },
            ];

            ha.add(items1, items2);

            it('Should have six entries results', () =>
            {
               const results = [...ha.entriesFlat()]

               assert.equal(results.length, 6, 'does not have 6 entries');

               assert.equal(results[0][0], 'what', 'entry 1 does not have correct key');
               assert.deepEqual(results[0][1], items1[0], 'entry 1 does not have correct item');

               assert.equal(results[1][0], 'what', 'entry 2 does not have correct key');
               assert.deepEqual(results[1][1], items1[1], 'entry 2 does not have correct item');

               assert.equal(results[2][0], 'what', 'entry 3 does not have correct key');
               assert.deepEqual(results[2][1], items1[2], 'entry 3 does not have correct item');

               assert.equal(results[3][0], 'what2', 'entry 4 does not have correct key');
               assert.deepEqual(results[3][1], items2[0], 'entry 4 does not have correct item');

               assert.equal(results[4][0], 'what2', 'entry 5 does not have correct key');
               assert.deepEqual(results[4][1], items2[1], 'entry 5 does not have correct item');

               assert.equal(results[5][0], 'what2', 'entry 6 does not have correct key');
               assert.deepEqual(results[5][1], items2[2], 'entry 6 does not have correct item');
            })
         });
      });

      describe('entriesFlat()', () =>
      {
         describe('Should work', () =>
         {
            const ha = new HashArray<Item>(['key']);

            const items1: Item[] = [
               { key: 'what' },
               { key: 'what' },
               { key: 'what' },
            ];

            const items2: Item[] = [
               { key: 'what2' },
               { key: 'what2' },
               { key: 'what2' },
            ];

            ha.add(items1, items2);

            it('Should have six entries results', () =>
            {
               const results = [...ha.entriesFlat()]

               assert.equal(results.length, 6, 'does not have 6 entries');

               assert.equal(results[0][0], 'what', 'entry 1 does not have correct key');
               assert.deepEqual(results[0][1], items1[0], 'entry 1 does not have correct item');

               assert.equal(results[1][0], 'what', 'entry 2 does not have correct key');
               assert.deepEqual(results[1][1], items1[1], 'entry 2 does not have correct item');

               assert.equal(results[2][0], 'what', 'entry 3 does not have correct key');
               assert.deepEqual(results[2][1], items1[2], 'entry 3 does not have correct item');

               assert.equal(results[3][0], 'what2', 'entry 4 does not have correct key');
               assert.deepEqual(results[3][1], items2[0], 'entry 4 does not have correct item');

               assert.equal(results[4][0], 'what2', 'entry 5 does not have correct key');
               assert.deepEqual(results[4][1], items2[1], 'entry 5 does not have correct item');

               assert.equal(results[5][0], 'what2', 'entry 6 does not have correct key');
               assert.deepEqual(results[5][1], items2[2], 'entry 6 does not have correct item');
            })
         });
      });

      describe('values()', () =>
      {
         describe('Should work', () =>
         {
            const ha = new HashArray<Item>(['key']);

            const items1: Item[] = [
               { key: 'what' },
               { key: 'what' },
               { key: 'what' },
            ];

            const items2: Item[] = [
               { key: 'what2' },
               { key: 'what2' },
               { key: 'what2' },
            ];

            ha.add(items1, items2);

            it('Should have two values results', () =>
            {
               const results = [...ha.values()]

               assert.equal(results.length, 2, 'does not have 2 values results');

               assert.deepEqual(results[0], items1, 'value result 1 is not correct items');
               assert.deepEqual(results[1], items2, 'value result 2 is not correct items');
            })
         });
      });

      describe('valuesFlat()', () =>
      {
         describe('Should work', () =>
         {
            const ha = new HashArray<Item>(['key']);

            const items1: Item[] = [
               { key: 'what' },
               { key: 'what' },
               { key: 'what' },
            ];

            const items2: Item[] = [
               { key: 'what2' },
               { key: 'what2' },
               { key: 'what2' },
            ];

            ha.add(items1, items2);

            it('Should have six entries results', () =>
            {
               const results = [...ha.valuesFlat()]

               assert.equal(results.length, 6, 'does not have 6 items');

               assert.deepEqual(results[0], items1[0], 'value 1 is not correct item');
               assert.deepEqual(results[1], items1[1], 'value 2 is not correct item');
               assert.deepEqual(results[2], items1[2], 'value 3 is not correct item');
               assert.deepEqual(results[3], items2[0], 'value 4 is not correct item');
               assert.deepEqual(results[4], items2[1], 'value 5 is not correct item');
               assert.deepEqual(results[5], items2[2], 'value 6 is not correct item');
            })
         });
      });
   });

   describe('Removing Items', () =>
   {
      describe('clear()', () =>
      {
         describe('Should work', () =>
         {
            const ha = new HashArray<Item>(['key']);
            const item1 = { key: 'whatever' };
            const item2 = { key: 'whatever2' };
            const item3 = { key: 'whatever3' };

            ha.add(item1, item2, item3);

            ha.clear();

            it('Should have 0 items after clear()', () => assert.equal(ha.sizeFlat, 0));

            it('Should have a map with no keys.', () => assert.equal([...ha.keys()].length, 0));
         });
      });

      describe('removeByKeys(keys)', () =>
      {
         describe('Should work with no items', () =>
         {
            const ha = new HashArray<Item>(['key']);

            it('Should not throw', () =>
            {
               ha.removeByKey('whatever');
               assert.equal(ha.sizeFlat, 0)
            });
         });

         describe('Should work with 1 item', () =>
         {
            const ha = new HashArray<Item>(['key']);
            const item = { key: 'whatever' };

            ha.add(item);
            ha.removeByKey('whatever');

            it('Should have no items after remove by key', () => assert.equal(ha.sizeFlat, 0));

            it('Should have a map with no keys.', () => assert.equal([...ha.keys()].length, 0));
         });

         describe('Should work with 1 item and multiple key depths', () =>
         {
            const ha = new HashArray<ItemDeep>([
               ['child', 'key1'],
               ['child', 'key2'],
               'key'
            ]);

            const item = {
               key: 'whatever',
               child: {
                  key1: 'deeeeep',
                  key2: 'foobang'
               }
            };

            ha.add(item);

            ha.removeByKey('deeeeep');

            it('Should have no items after remove by key', () => assert.equal(ha.sizeFlat, 0));

            it('Should have a map with no keys.', () => assert.equal([...ha.keys()].length, 0));
         });

         describe('Should work with 4 items', () =>
         {
            const ha = new HashArray<Item>(['key']);
            const item1 = { key: 'whatever' };
            const item2 = { key: 'whatever2' };
            const item3 = { key: 'whatever3' };
            const item4 = { key: 'whatever3' };

            ha.add(item1, item2, item3, item4);

            ha.removeByKey('whatever3');

            it('Should have 2 items after remove by key', () => assert.equal(ha.sizeFlat, 2));

            it('Should have no key for removed item (has)', () => assert.equal(ha.has('whatever3'), false));

            it('Should have no key for removed item (get)', () => assert.equal(ha.get('whatever3'), void 0));

            it('Should have remaining two items by key', () =>
            {
               assert.equal(ha.get('whatever'), item1);
               assert.equal(ha.get('whatever2'), item2);
            });
         });
      });

      describe('remove(items)', () =>
      {
         describe('Should work with no items', () =>
         {
            const ha = new HashArray<Item>(['key']);
            const item = { key: 'whatever' };

            it('Should have not throw', () => {
               ha.remove(item);
               assert.equal(ha.sizeFlat, 0)
            });
         });

         describe('Should work with 1 item', () =>
         {
            const ha = new HashArray<Item>(['key']);
            const item = { key: 'whatever' };

            ha.add(item);

            ha.remove(item);

            it('Should have no items after remove', () => assert.equal(ha.sizeFlat, 0));

            it('Should have a map with no keys.', () => assert.equal([...ha.keys()].length, 0));
         });

         describe('Should work with 3 items', () =>
         {
            const ha = new HashArray<Item>(['key']);
            const item1 = { key: 'whatever' };
            const item2 = { key: 'whatever2' };
            const item3 = { key: 'whatever3' };

            ha.add(item1, item2, item3);

            ha.remove(item2);

            it('Should have 2 items after remove by key', () => assert.equal(ha.sizeFlat, 2));

            it('Should have no key for removed item (has)', () => assert.equal(ha.has('whatever2'), false));

            it('Should have no key for removed item (get)', () => assert.equal(ha.get('whatever2'), void 0));

            it('Should have remaining two items by key', () =>
            {
               assert.equal(ha.get('whatever'), item1);
               assert.equal(ha.get('whatever3'), item3);
            });
         });
      });

      describe('removeFirst()', () =>
      {
         describe('Should work with no items', () =>
         {
            const ha = new HashArray<Item>(['key']);

            it('Should not throw', () => {
               ha.removeFirst();
               assert.equal(ha.sizeFlat, 0)
            });
         });

         describe('Should work with 1 item', () =>
         {
            const ha = new HashArray<Item>(['key']);
            const item = { key: 'whatever' };

            ha.add(item);

            ha.removeFirst();

            it('Should have no items after remove', () => assert.equal(ha.sizeFlat, 0));
            it('Should have a map with no keys.', () => assert.equal([...ha.keys()].length, 0));
         });

         describe('Should work with 3 items', () =>
         {
            const ha = new HashArray<Item>(['key']);
            const item1 = { key: 'whatever' };
            const item2 = { key: 'whatever2' };
            const item3 = { key: 'whatever3' };

            ha.add(item1, item2, item3);

            ha.removeFirst();

            it('Should have 2 items after removal', () => assert.equal(ha.sizeFlat, 2));

            it('Should have no key for removed item (has)', () => assert.equal(ha.has('whatever'), false));

            it('Should have no key for removed item (get)', () => assert.equal(ha.get('whatever'), void 0));

            it('Should have remaining two items by key', () =>
            {
               assert.equal(ha.get('whatever2'), item2);
               assert.equal(ha.get('whatever3'), item3);
            });
         });
      });

      describe('removeLast()', () =>
      {
         describe('Should work with no items', () =>
         {
            const ha = new HashArray<Item>(['key']);

            it('Should not throw', () => {
               ha.removeLast();
               assert.equal(ha.sizeFlat, 0)
            });
         });

         describe('Should work with 1 item', () =>
         {
            const ha = new HashArray<Item>(['key']);
            const item = { key: 'whatever' };

            ha.add(item);

            ha.removeLast();

            it('Should have no items after removal', () => assert.equal(ha.sizeFlat, 0));
            it('Should have a map with no keys.', () => assert.equal([...ha.keys()].length, 0));
         });

         describe('Should work with 3 items', () =>
         {
            const ha = new HashArray<Item>(['key']);
            const item1 = { key: 'whatever' };
            const item2 = { key: 'whatever2' };
            const item3 = { key: 'whatever3' };

            ha.add(item1, item2, item3);

            ha.removeLast();

            it('Should have 2 items after removal', () => assert.equal(ha.sizeFlat, 2));

            it('Should have no key for removed item (has)', () => assert.equal(ha.has('whatever3'), false));

            it('Should have no key for removed item (get)', () => assert.equal(ha.get('whatever3'), void 0));

            it('Should have remaining two items by key', () =>
            {
               assert.equal(ha.get('whatever'), item1);
               assert.equal(ha.get('whatever2'), item2);
            });
         });
      });
   });

   describe('Retrieving Items', () =>
   {
      describe('get(key)', () =>
      {
         describe('Should work', () =>
         {
            const ha = new HashArray<People>(['firstName', 'lastName']);

            const person1 = { firstName: 'Victor', lastName: 'Victor' };
            const person2 = { firstName: 'Victor', lastName: 'Manning' };
            const person3 = { firstName: 'Manning', lastName: 'Victor' };
            const person4 = { firstName: 'John', lastName: 'Smith' };

            ha.add(person1, person2, person3, person4);

            it('Should retrieve only items for the keys requested without duplicates.', () =>
            {
               assert.equal((ha.get('Victor') as People[]).length, 3);
               assert.equal(ha.get('John'), person4);
            });
         });
      });

      describe('getAll(keys)', () =>
      {
         describe('Should work', () =>
         {
            const ha = new HashArray<People>(['firstName', 'lastName']);

            const person1 = { firstName: 'Victor', lastName: 'Victor' };
            const person2 = { firstName: 'Victor', lastName: 'Manning' };
            const person3 = { firstName: 'Manning', lastName: 'Victor' };
            const person4 = { firstName: 'John', lastName: 'Smith' };

            ha.add(person1, person2, person3, person4);

            it('Should retrieve only items for the keys requested without duplicates.', () =>
            {
               assert.equal(ha.getAll(['Victor', 'Smith']).length, 4);
               assert.equal(ha.getAll(['John', 'Smith']).length, 1);
               assert.equal(ha.getAll('John').length, 1);
            });

            it(`Should retrieve all items with '*'.`, () =>
            {
               assert.equal(ha.getAll('*').length, 4);
            });

            it(`Should retrieve all items with '[*]'.`, () =>
            {
               assert.equal(ha.getAll(['*']).length, 4);
            });

            it(`Should retrieve no results.`, () =>
            {
               assert.equal(ha.getAll(['bogus']).length, 0);
            });
         });
      });

      describe('getAsArray(key)', () =>
      {
         describe('Should work', () =>
         {
            const ha = new HashArray<People>(['firstName', 'lastName']);

            const person1 = { firstName: 'Victor', lastName: 'Victor' };
            const person2 = { firstName: 'Victor', lastName: 'Manning' };
            const person3 = { firstName: 'John', lastName: 'Smith' };

            ha.add(person1, person2, person3);

            it('Should retrieve always retrieve as an array.', () =>
            {
               assert.equal(ha.getAsArray('Victor').length, 2);
               assert.equal(ha.getAsArray('John').length, 1);
            });

            it(`Should retrieve no results.`, () =>
            {
               assert.equal(ha.getAsArray('bogus').length, 0);
            });
         });
      });

      describe('getAt(index)', () =>
      {
         describe('Should work', () =>
         {
            const ha = new HashArray<People>(['firstName', 'lastName']);

            const person1 = { firstName: 'Victor', lastName: 'Victor' };
            const person2 = { firstName: 'Victor', lastName: 'Manning' };
            const person3 = { firstName: 'John', lastName: 'Smith' };

            ha.add(person1, person2, person3);

            it('Should retrieve items by index.', () =>
            {
               assert.equal(ha.getAt(0), person1);
               assert.equal(ha.getAt(1), person2);
               assert.equal(ha.getAt(2), person3);
            });
         });
      });
   });

   describe('Set Operations', () =>
   {
      describe('intersection(HashArray)', () =>
      {
         describe('Should work with simple single-key HashArrays', () =>
         {
            const ha1 = new HashArray<Item>('key');
            const item1 = { key: 'whatever' };
            const item2 = { key: 'whatever2' };
            const item3 = { key: 'whatever3' };
            const item4 = { key: 'whatever4' };

            ha1.add(item1, item2, item3);

            const ha2 = ha1.clone();
            ha2.add(item1, item3, item4);

            const intersection = ha1.intersection(ha2);

            it('Unioned HashArray should contain item1 and item3 only', () =>
            {
               assert(intersection.sizeFlat === 2);
               assert(intersection.collides(item1));
               assert(!intersection.collides(item2));
               assert(intersection.collides(item3));
               assert(!intersection.collides(item4));
            });
         });

         describe('Should work with simple multi-key HashArrays', () =>
         {
            const ha1 = new HashArray<Partial<Item2>>(['key1', 'key2']);
            const item1 = { key1: 'whatever', key2: 'whatever4' };
            const item2 = { key1: 'whatever2' };
            const item3 = { key1: 'whatever3' };
            const item4 = { key1: 'whatever4' };

            ha1.add(item1, item2, item3);

            const ha2 = ha1.clone();
            ha2.add(item1, item3, item4);

            const intersection = ha1.intersection(ha2);

            it('Unioned HashArray should contain item1, item3, and item4 because of the extra key', () =>
            {
               assert(intersection.collides(item1), 'does not contain item1');
               assert(!intersection.collides(item2), 'does contain item2');
               assert(intersection.collides(item3), 'does not contain item3');
               assert(intersection.collides(item4), 'does not contain item4');
            });
         });
      });
   });

   describe('Utility', () =>
   {
      describe('objectAt(item, Key)', () =>
      {
         describe('Should work', () =>
         {
            const deeper = { deeper: 100 };
            const data = { key: { deep: deeper } };

            it(`Should retrieve 'deeper'`, () =>
            {
               assert.equal(HashArray.objectAt(data, ['key', 'deep']), deeper);
            });

            it('Should return undefined for no continuation in keys', () =>
            {
               assert.isUndefined(HashArray.objectAt(data, ['key', 'deep', 'deeper', 'foo', 'bar']));
            });

            it('Should return undefined for no keys', () =>
            {
               assert.isUndefined(HashArray.objectAt(data, void 0));
            });

            it('Should return undefined for no keys', () =>
            {
               assert.isUndefined(HashArray.objectAt(data, []));
            });

            it('Should return undefined for bad key', () =>
            {
               assert.isUndefined(HashArray.objectAt(data, ['key', null]));
            });

            it('Should return undefined for bad path', () =>
            {
               assert.isUndefined(HashArray.objectAt(data, 'bogus'));
               assert.isUndefined(HashArray.objectAt(data, ['bogus']));
               assert.isUndefined(HashArray.objectAt(data, ['key', 'bogus']));
               assert.isUndefined(HashArray.objectAt(data, ['key', 'deep', 'bogus']));
            });
         });
      });
   });
});
