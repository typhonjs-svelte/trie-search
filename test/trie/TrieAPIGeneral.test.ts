/**
 * Provides general API testing / fuzzing to hit all code paths. The main API functionality testing is in
 * `TrieSearch.test.ts`.
 */

import { TrieSearch }   from '../../src';

describe('TrieSearch - General tests', () =>
{
   describe('new TrieSearch(keyFields) should work', () =>
   {
      it('should set keyfields (1)', () =>
      {
         const ts = new TrieSearch(['key']);
         expect(ts.keyFields.length).to.equal(1);
      });

      it('should set keyfields (2)', () =>
      {
         const ts = new TrieSearch('key');
         expect(ts.keyFields.length).to.equal(1);
      });
   });

   describe('destroy() / size accessor should work', () =>
   {
      const ts = new TrieSearch(['key']);

      ts.add({ key: 'test' });

      it('size accessor should be `4`', () => expect(ts.size).to.equal(4));

      it('destroy() should reset data', () =>
      {
         ts.destroy();

         expect(ts.isDestroyed).to.be.true;
         expect(ts.size).to.equal(0);
      });
   });

   describe('Hit all branches / argument guards', () =>
   {
      const ts = new TrieSearch('key');

      it('empty add() has no effect', () =>
      {
         expect(ts.size).to.equal(0);
         ts.add();
         expect(ts.size).to.equal(0);
      });

      it('add(item) w/ missing key is ignored', () =>
      {
         expect(ts.size).to.equal(0);
         ts.add({ bad: 'key' });
         expect(ts.size).to.equal(0);
      });

      it('empty search() has no effect', () =>
      {
         expect(ts.size).to.equal(0);

         // @ts-expect-error
         expect(ts.search()).to.deep.equal([]);
      });
   });

   describe('This Return Values', () =>
   {
      const ts = new TrieSearch('key');

      it('add(...) should return this', () => expect(ts.add({ key: 'test' })).to.equal(ts));

      it('clear(...) should return this', () => expect(ts.clear()).to.equal(ts));

      it('map(...) should return this', () => expect(ts.map('key', { key: 'val' })).to.equal(ts));

      it('destroy(...) should return this', () => expect(ts.destroy()).to.equal(ts));
   });

   describe('Subscriber callbacks', () =>
   {
      const ts = new TrieSearch('key');

      let i = 0;

      ts.subscribe(({ action, trieSearch }) =>
      {
         switch(i++)
         {
            case 0:
               it('subscribe(...) should fire event', () =>
               {
                  expect(action).to.equal('subscribe');
                  expect(trieSearch).to.equal(ts);
               });
               break;

            case 1:
               it('add(...) should fire event', () =>
               {
                  expect(action).to.equal('add');
                  expect(trieSearch).to.equal(ts);
               });
               break;

            case 2:
               it('clear(...) should fire event', () =>
               {
                  expect(action).to.equal('clear');
                  expect(trieSearch).to.equal(ts);
               });
               break;

            case 3:
               it('destroy(...) should fire event', () =>
               {
                  expect(action).to.equal('destroy');
                  expect(trieSearch).to.equal(ts);
               });
               break;
         }
      });

      // The following will fire events. --------------------------------------------------------------------------

      ts.add({ key: 'test' });

      ts.clear();

      ts.destroy();
   });

   describe('search(...) should work with a custom reducer w/ no keyFields returned', () =>
   {
      const ts = new TrieSearch('key');

      const item = { key: 'A key' };

      ts.add(item);

      class CustomReducer<T extends object>
      {
         #accumulator: T[]

         // This is what we are testing to hit the branch in TrieSearch when keyFields is undefined.
         get keyFields() { return void 0; }

         get matches() { return this.#accumulator; }

         reduce({ matches })
         {
            this.#accumulator = this.#accumulator ?? matches;
         }

         reset()
         {
            this.#accumulator = void 0;
         }
      }

      it(`search('key', [reducer])`, () =>
      {
         const result = ts.search('key', { reducer: new CustomReducer() });

         expect(result).to.deep.equal([item]);
      });
   });
});
