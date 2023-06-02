import { TrieSearch }      from '../../src';
import { TrieSearchQuery } from '../../src/query';

type Item = { id: number, value: string };
type Item2 = { key1: string, key2: string };
type ItemDeep = { key: string, child: Item2 };

describe('TrieSearchQuery', () =>
{
   describe('Basic Queries', () =>
   {
      const ts = new TrieSearch<Item>('id');
      const items = [
         { id: 1, value: '1'},
         { id: 2, value: '2'},
         { id: 3, value: '3'}
      ];

      ts.add(items);

      const tsq = new TrieSearchQuery<Item>(ts);

      it('Has data', () =>
      {
         assert.deepEqual([...tsq], []);

         tsq.query.set('1');

         assert.deepEqual([...tsq], [{ id: 1, value: '1' }]);

         tsq.query.set(['1', '2']);

         assert.deepEqual([...tsq], [{ id: 1, value: '1' }, { id: 2, value: '2' }]);
      });

      it('Receives notification', () =>
      {
         tsq.query.set('1');

         assert.deepEqual([...tsq], [{ id: 1, value: '1' }]);

         ts.add({ id: 11, value: '11' });

         assert.deepEqual([...tsq], [{ id: 1, value: '1' }, { id: 11, value: '11' }]);

         ts.clear();

         assert.deepEqual([...tsq], []);
      });
   })
});