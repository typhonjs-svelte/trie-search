import { TrieSearch }      from '../../src/trie';
import { TrieSearchQuery } from '../../src/query';

describe(`TrieSearchQuery - API Errors`, () =>
{
   describe('constructor - throws on invalid options', () =>
   {
      const ts = new TrieSearch();

      it(`'trieSearch' is not an instance of TrieSearch`, () =>
      {
         // @ts-expect-error
         expect(() => new TrieSearchQuery()).to.throw(TypeError,
          `TrieSearchQuery error: 'trieSearch' must be an instance of TrieSearch.`, 'did not throw');
      });

      it(`'options' is not an object`, () =>
      {
         // @ts-expect-error
         expect(() => new TrieSearchQuery(ts, false)).to.throw(TypeError,
          `TrieSearchQuery error: 'options' must be an object.`, 'did not throw');
      });

      it(`'options.trieReducer' is not an instance of ITrieSearchReducer`, () =>
      {
         // @ts-expect-error
         expect(() => new TrieSearchQuery(ts, {trieReducer: false})).to.throw(TypeError,
          `TrieSearchQuery error: 'options.trieReducer' must implement ITrieSearchReducer.`, 'did not throw');
      });

      it(`'options.trieReducer' is not an instance of ITrieSearchReducer`, () =>
      {
         // @ts-expect-error
         expect(() => new TrieSearchQuery(ts, {trieReducer: false})).to.throw(TypeError,
          `TrieSearchQuery error: 'options.trieReducer' must implement ITrieSearchReducer.`, 'did not throw');
      });

      it(`'options.limit' is not a number`, () =>
      {
         // @ts-expect-error
         expect(() => new TrieSearchQuery(ts, {limit: 'bad'})).to.throw(TypeError,
          `TrieSearchQuery error: 'options.limit' must be an integer >= 0.`, 'did not throw');
      });

      it(`'options.limit' is not a number`, () =>
      {
         // @ts-expect-error
         expect(() => new TrieSearchQuery(ts, {limit: 'bad'})).to.throw(TypeError,
          `TrieSearchQuery error: 'options.limit' must be an integer >= 0.`, 'did not throw');
      });

      it(`'options.limit' is less than '0'`, () =>
      {
         expect(() => new TrieSearchQuery(ts, {limit: -1})).to.throw(TypeError,
          `TrieSearchQuery error: 'options.limit' must be an integer >= 0.`, 'did not throw');
      });
   });

   describe('accessors - throws on invalid options', () =>
   {
      const ts = new TrieSearch();
      const tsq = new TrieSearchQuery(ts);

      it(`'options.trieReducer' is not an instance of ITrieSearchReducer`, () =>
      {
         // @ts-expect-error
         expect(() => tsq.trieReducer = false).to.throw(TypeError,
          `TrieSearchQuery.set error: 'trieReducer' must implement ITrieSearchReducer.`, 'did not throw');
      });
   });
});