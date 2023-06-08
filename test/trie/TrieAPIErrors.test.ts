import { TrieSearch }   from '../../src';

describe(`TrieSearch - API Errors`, () =>
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

   describe('#validateOptions - throws on invalid options', () =>
   {
      it('maxCacheSize invalid', () =>
      {
         // @ts-expect-error
         expect(() => new TrieSearch('key', { maxCacheSize: false })).to.throw(TypeError,
          `TrieSearch error: 'options.maxCacheSize' must be an integer >= 0.`, 'did not throw');
      });

      it('maxCacheSize invalid', () =>
      {
         // @ts-expect-error
         expect(() => new TrieSearch('key', { tokenizer: false })).to.throw(TypeError,
          `TrieSearch error: 'options.tokenizer' is not a function.`, 'did not throw');
      });
   });

   describe('destroy()', () =>
   {
      const ts = new TrieSearch('key');
      ts.destroy();

      it('root accessor throws error',
       () => expect(() => ts.root).to.throw(Error, 'TrieSearch error: This instance has been destroyed.',
        'throws error'));

      it('add throws error',
       () => expect(() => ts.add({ key: 'val' })).to.throw(Error, 'TrieSearch error: This instance has been destroyed.',
        'throws error'));

      it('clear throws error',
       () => expect(() => ts.clear()).to.throw(Error, 'TrieSearch error: This instance has been destroyed.',
        'throws error'));

      it('map() throws error',
       () => expect(() => ts.map('key', { key: 'val' })).to.throw(Error,
        'TrieSearch error: This instance has been destroyed.', 'throws error'));
   });
});