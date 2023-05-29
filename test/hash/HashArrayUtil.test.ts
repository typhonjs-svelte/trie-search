import {
   HashArray,
   HashArrayUtil } from '../../src';

type Item = { key: string };
type Item2 = { key1: string, key2: string };
type DeepData = { type: string, data: { speed: number, weight: number, mobile?: boolean } };

describe('HashArray Extras', () =>
{
   describe('Mathematical Operations', () =>
   {
      describe('average(keys, index, weightKey', () =>
      {
         describe('Should work', () =>
         {
            const ha = new HashArray<DeepData>(['type']);

            const a = { type: 'airplane', data: { speed: 100, weight: 0.1 } };
            const b = { type: 'airplane', data: { speed: 50, weight: 0.2 } };
            const c = { type: 'airplane', data: { speed: 25, weight: 0.2 } };
            const d = { type: 'boat', data: { speed: 10, weight: 0.2 } };
            const e = { type: 'boat', data: { speed: 5, weight: 0.3 } };

            ha.add(a, b, c, d, e);

            it('Should work (average airplane speed).',
             () => assert.equal(HashArrayUtil.average(ha, 'airplane', ['data', 'speed']), 175 / 3));

            it('Should work (average boat speed).',
             () => assert.equal(HashArrayUtil.average(ha, ['boat'], ['data', 'speed']), 15 / 2));

            it('Should work (average airplane and boat speed).',
             () => assert.equal(HashArrayUtil.average(ha, ['airplane', 'boat'], ['data', 'speed']), 190 / 5));

            it('Should work with weighted average === 1.0.',
             () => assert.equal(HashArrayUtil.average(ha, ['airplane', 'boat'], ['data', 'speed'], ['data', 'weight']),
              28.5));

            it('Should work with weighted average !== 1.0.', () =>
            {
               a.data.weight = 1.1;
               assert.equal(HashArrayUtil.average(ha, ['airplane', 'boat'], ['data', 'speed'], ['data', 'weight']),
                64.25);
            });
         });
      });

      describe('sum(keys, index, weightKey)', () =>
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

            it('Should work (sum airplane speed).',
             () => assert.equal(HashArrayUtil.sum(ha, 'airplane', ['data', 'speed']), 175));

            it('Should work (sum boat speed).',
             () => assert.equal(HashArrayUtil.sum(ha, ['boat'], ['data', 'speed']), 15));

            it('Should work (sum airplane and boat speed).',
             () => assert.equal(HashArrayUtil.sum(ha, ['airplane', 'boat'], ['data', 'speed']), 190));

            it('Should work with weighted sums.',
             () => assert.equal(HashArrayUtil.sum(ha, 'boat', ['data', 'speed'], ['data', 'weight']),
              (10 * 100000) + (5 * 200000)));
         });
      });
   });

   describe('Set Operations', () =>
   {
      describe('difference(HashArray, HashArray)', () =>
      {
         const ha1 = new HashArray<Partial<Item2>>(['key1', 'key2']);
         const item1 = { key1: 'whatever', key2: 'whatever4' };
         const item2 = { key1: 'whatever2' };
         const item3 = { key1: 'whatever3' };
         const item4 = { key1: 'whatever4' };

         // Contains keys ['whatever', 'whatever2', 'whatever3', 'whatever4']
         ha1.add(item1, item2, item3, item4);

         const ha2 = ha1.clone();

         // Contains keys ['whatever', 'whatever3', 'whatever4']
         ha2.add(item1, item3);

         // SHOULD contain keys ['whatever2'] for item2 only.
         const difference = HashArrayUtil.difference(ha1, ha2);

         it('Difference HashArray should contain item2 only', () =>
         {
            assert(!difference.collides(item1), 'does contain item1');
            assert(difference.collides(item2), 'does not contain item2');
            assert(!difference.collides(item3), 'does contain item3');
            assert(!difference.collides(item4), 'does contain item4');
         });
      });
   });

   describe('Retrieval Operations', () =>
   {
      describe('sample()', () =>
      {
         const ha = new HashArray<Item>('key');

         const itemSet = new Set([
            { key: 'blah' },
            { key: 'blah' },
            { key: 'blah' },
            { key: 'blah' },
            { key: 'blah2' },
            { key: 'blah2' },
            { key: 'blah2' },
            { key: 'blah2' },
         ])

         ha.add(itemSet);

         it('Should contain 4 sample items', () =>
         {
            const results = HashArrayUtil.sample(ha, 4);

            assert.equal(results.length, 4);

            for (const item of results) { assert.isTrue(itemSet.has(item), 'item not from itemSet'); }
         });

         it(`Should contain 2 sample items w/ 'blah' key`, () =>
         {
            const results = HashArrayUtil.sample(ha, 2, 'blah');

            assert.equal(results.length, 2);

            for (const item of results)
            {
               assert.isTrue(itemSet.has(item), 'item not from itemSet');
               assert.equal(item.key, 'blah');
            }
         });
      });
   });
});