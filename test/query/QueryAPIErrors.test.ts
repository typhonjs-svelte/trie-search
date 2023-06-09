import { TrieSearch }      from '../../src/trie';
import { TrieSearchQuery } from '../../src/query';

describe(`TrieSearchQuery - API Errors`, () =>
{
   describe('#addOne - throws on invalid object', () =>
   {
      it('invalid add of non-object', () =>
      {
         // @ts-expect-error
         expect(() => new TrieSearch().add(false)).to.throw(TypeError,
          `TrieSearch.add error: The add method only accepts objects.`, 'did not throw');
      });
   });
});