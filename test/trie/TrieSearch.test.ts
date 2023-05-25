import { TrieSearch } from '../../src';

describe('TrieSearch', () =>
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

   describe('map(key, value) and search(str) should work', () =>
   {
      it('should be able to call map() and search()', () =>
      {
         const ts = new TrieSearch();

         ts.map('hello', 'world');

         expect(ts.search('hel').length).to.equal(1);
         expect(ts.search('hell').length).to.equal(1);
         expect(ts.search('hello').length).to.equal(1);
         expect(ts.search('hel')[0]).to.equal('world');
      });
   });

   describe('add(...) and search(...) should work for a single item', () =>
   {
      const ts = new TrieSearch('key');
      const item = { key: 'blah' };

      ts.add(item);

      it(`add('blah') should build map of nodes`, () =>
      {
         expect(ts.root['b']).to.exist;
         expect(ts.root['b']['l']).to.exist;
         expect(ts.root['b']['l']['a']).to.exist;
         expect(ts.root['b']['l']['a']['h']).to.exist;
      });

      it(`search('blah') for each subkey should work`, () =>
      {
         expect(ts.search('b')[0]).to.equal(item);
         expect(ts.search('bl')[0]).to.equal(item);
         expect(ts.search('bla')[0]).to.equal(item);
         expect(ts.search('blah')[0]).to.equal(item);
         expect(ts.search('blab')[0]).to.be.undefined;
         expect(ts.search('nope')[0]).to.be.undefined;
      });
   });

   describe('TrieSearch::addAll(...)should work for an array', () =>
   {
      const ts = new TrieSearch('key');
      const items = [{ key: 'addendum' }, { key: 'banana' }, { key: 'cat' }];

      ts.addAll(items);

      it(`search('blah') for each subkey should work`, () =>
      {
         expect(ts.search('b')[0]).to.equal(items[1]);
         expect(ts.search('ba')[0]).to.equal(items[1]);
         expect(ts.search('ban')[0]).to.equal(items[1]);
         expect(ts.search('bana')[0]).to.equal(items[1]);
         expect(ts.search('banan')[0]).to.equal(items[1]);
         expect(ts.search('banana')[0]).to.equal(items[1]);

         expect(ts.search('a')[0]).to.equal(items[0]);
         expect(ts.search('ad')[0]).to.equal(items[0]);
         expect(ts.search('add')[0]).to.equal(items[0]);
         expect(ts.search('adde')[0]).to.equal(items[0]);
         expect(ts.search('adden')[0]).to.equal(items[0]);
         expect(ts.search('addend')[0]).to.equal(items[0]);
         expect(ts.search('addendu')[0]).to.equal(items[0]);
         expect(ts.search('addendum')[0]).to.equal(items[0]);

         expect(ts.search('c')[0]).to.equal(items[2]);
         expect(ts.search('ca')[0]).to.equal(items[2]);
         expect(ts.search('cat')[0]).to.equal(items[2]);
      });
   });

   describe('add(...) and search(...) should work for a single item with a numeric key', () =>
   {
      const ts = new TrieSearch('key');
      const item = { key: 1234567890 };

      ts.add(item);

      it(`add('1234567890') should build map of nodes`, () =>
      {
         expect(ts.root['1']).to.exist;
         expect(ts.root['1']['2']).to.exist;
         expect(ts.root['1']['2']['3']).to.exist;
         expect(ts.root['1']['2']['3']['4']).to.exist;
      });

      it(`search('1234567890') for each sub-key should work`, () =>
      {
         expect(ts.search('1')[0]).to.equal(item);
         expect(ts.search('12')[0]).to.equal(item);
         expect(ts.search('123')[0]).to.equal(item);
         expect(ts.search('1234')[0]).to.equal(item);
         expect(ts.search('12345')[0]).to.equal(item);
         expect(ts.search('123456')[0]).to.equal(item);
         expect(ts.search('1234567')[0]).to.equal(item);
         expect(ts.search('12345678')[0]).to.equal(item);
         expect(ts.search('123456789')[0]).to.equal(item);
         expect(ts.search('1234567890')[0]).to.equal(item);
         expect(ts.search('nope').length).equal(0);
      });
   });

   describe('add(...) and search(...) should work for a single item with no split and whitespace', () =>
   {
      // When we specify FALSE for splitOnRegEx, we are saying we do not want to split any of the values before mapping
      // not even on any whitespace

      const ts = new TrieSearch('key', { splitOnRegEx: false });
      const item = { key: 'hello world' };

      ts.add(item);

      it(`add('hello world') should build map of nodes`, () =>
      {
         expect(ts.root.h.e.l.l.o).to.exist;
         expect(ts.root.h.e.l.l.o[' ']).to.exist;
         expect(ts.root.h.e.l.l.o[' '].w.o.r.l.d).to.exist;
      });

      it(`search('hello world') for each subkey should work`, () =>
      {
         expect(ts.search('h')[0]).to.equal(item);
         expect(ts.search('he')[0]).to.equal(item);
         expect(ts.search('hel')[0]).to.equal(item);
         expect(ts.search('hell')[0]).to.equal(item);
         expect(ts.search('hello')[0]).to.equal(item);
         expect(ts.search('hello ')[0]).to.equal(item);
         expect(ts.search('hello w')[0]).to.equal(item);
         expect(ts.search('hello wo')[0]).to.equal(item);
         expect(ts.search('hello wor')[0]).to.equal(item);
         expect(ts.search('hello worl')[0]).to.equal(item);
         expect(ts.search('hello world')[0]).to.equal(item);
         expect(ts.search('nope').length).to.equal(0);
      });
   });

   describe('search(...) should work for multiple keys and union the result', () =>
   {
      const ts = new TrieSearch('key', { min: 2 });
      const item1 = { key: 'the quick brown fox' };
      const item2 = { key: 'the quick brown' };
      const item3 = { key: 'the quick fox' };
      const item4 = { key: 'the fox' };

      ts.add(item1);
      ts.add(item2);
      ts.add(item3);
      ts.add(item4);

      it(`search('the quick') should return all entries`, () => expect(ts.search('the quick').length).to.equal(3));

      it(`search('the brown') should return 2 entries`, () => expect(ts.search('the brown').length).to.equal(2));

      it(`search('the fox') should return 3 entries`, () => expect(ts.search('the fox').length).to.equal(3));

      it(`search('fox brown') should return 1 entry`, () => expect(ts.search('fox brown').length).to.equal(1));

      it(`search('brown fox') should return 1 entry`, () => expect(ts.search('brown fox').length).to.equal(1));

      it(`search('brown f') should return 2 entry, ignoring the shortness of the second word`,
       () => expect(ts.search('brown f').length).to.equal(2));

      it(`search('br f') should return 1 entry, ignoring the shortness of the second word`,
       () => expect(ts.search('br f').length).to.equal(2));

      it(`search('qui b c d e f g h') should return 3 entries, ignoring the shortness of all subsequent words, ` +
       'because the minimum length has not been met for them',
       () => expect(ts.search('qui b c d e f g h').length).to.equal(3));
   });

   describe('search(...) should work for array of phrases', () =>
   {
      const ts = new TrieSearch('key', { min: 2 });
      const item1 = { key: 'the quick brown fox' };
      const item2 = { key: 'the quick brown' };
      const item3 = { key: 'the quick fox' };
      const item4 = { key: 'the fox' };

      ts.add(item1);
      ts.add(item2);
      ts.add(item3);
      ts.add(item4);

      it(`search(['the brown', 'quick']) should return 3 entries`,
       () => expect(ts.search(['the brown', 'quick']).length).to.equal(3));
   });

   describe('search(...) should work with cache==true and maxCacheSize == X', () =>
   {
      const ts = new TrieSearch('key', { min: 2, maxCacheSize: 2 });
      const item1 = { key: 'the quick brown fox' };
      const item2 = { key: 'the quick brown' };
      const item3 = { key: 'the quick fox' };
      const item4 = { key: 'the fox' };

      ts.add(item1);
      ts.add(item2);
      ts.add(item3);
      ts.add(item4);

      it('cache size should increment appropriately and cap at maxCacheSize.', () =>
      {
         const f1 = ts.search('the brown');

         expect(ts.cache.sizeFlat).to.equal(1);
         expect(ts.cache.sizeFlat).to.equal(1);

         ts.search('the quick');

         expect(ts.cache.sizeFlat).to.equal(2);

         ts.search('the fox');

         expect(ts.cache.sizeFlat).to.equal(2);

         const f2 = ts.search('the brown'); // This should return different array.

         expect(f1).to.not.equal(f2);
      });
   });

   describe('search(...) should work for multiple keys and union the result with an indexField', () =>
   {
      const ts = new TrieSearch(['key', 'key2'], { min: 2, indexField: 'ix' });
      const item1 = { key: 'the quick brown fox', key2: 'jumped', ix: 1 };
      const item2 = { key: 'the quick brown', key2: 'jumped', ix: 2 };
      const item3 = { key: 'the quick fox', key2: 'brown', ix: 3 };
      const item4 = { key: 'the fox', key2: 'quick brown', ix: 4 };

      ts.add(item1);
      ts.add(item2);
      ts.add(item3);
      ts.add(item4);

      it(`search('the quick') should return all entries`, () => expect(ts.search('the quick').length).to.equal(4));

      it(`search('the brown') should return all entries`, () => expect(ts.search('the brown').length).to.equal(4));

      it(`search('the fox') should return 3 entries`, () => expect(ts.search('the fox').length).to.equal(3));

      it(`search('fox brown') should return 3 entries`, () => expect(ts.search('fox brown').length).to.equal(3));

      it(`search('brown fox') should return 3 entries`, () => expect(ts.search('brown fox').length).to.equal(3));

      it(`search('brown z') should return all entries`, () => expect(ts.search('brown z').length).to.equal(4));

      it(`search('br f') should return all entries`, () => expect(ts.search('br f').length).to.equal(4));

      it(`search('jum b c d e f g h') should return 2 entries, ignoring the shortness of all subsequent words`,
       () => expect(ts.search('jum b c d e f g h').length).to.equal(2));
   });

   describe('search(...) should work for a deep key combined with a non-deep key', () =>
   {
      const ts = new TrieSearch(['key', ['key2', 'key3']], { min: 2, indexField: 'ix' });
      const item1 = { key: 'the quick brown fox', key2: { key3: 'jumped' }, ix: 1 };
      const item2 = { key: 'the quick brown', key2: { key3: 'jumped' }, ix: 2 };
      const item3 = { key: 'the quick fox', key2: { key3: 'brown' }, ix: 3 };
      const item4 = { key: 'the fox', key2: { key3: 'quick brown' }, ix: 4 };

      ts.add(item1);
      ts.add(item2);
      ts.add(item3);
      ts.add(item4);

      it(`search('the quick') should return all 4 entries`,
       () => expect(ts.search('the quick').length).to.equal(4));

      it(`search('the brown') should return all 4 entries`,
       () => expect(ts.search('the brown').length).to.equal(4));

      it(`search('the fox') should return 3 entries`, () => expect(ts.search('the fox').length).to.equal(3));

      it(`search('fox brown') should return 3 entries`, () => expect(ts.search('fox brown').length).to.equal(3));

      it(`search('brown fox') should return 3 entries`, () => expect(ts.search('brown fox').length).to.equal(3));

      it(`search('brown z') should return 4 entries`, () => expect(ts.search('brown z').length).to.equal(4));

      it(`search('br f') should return all entries`, () => expect(ts.search('br f').length).to.equal(4));

      it(`search('jum b c d e f g h') should return 2 entries, ignoring the shortness of all subsequent words`,
       () => expect(ts.search('jum b c d e f g h').length).to.equal(2));
   });

   describe('add(...) and search(...) should work for a single item with multiple sub-phrases', () =>
   {
      const ts = new TrieSearch('key');
      const item = { key: 'blah whatever yeah man' };

      ts.add(item);

      it(`add('blah') should build map of nodes`, () =>
      {
         expect(ts.root['b']).to.exist;
         expect(ts.root['b']['l']).to.exist;
         expect(ts.root['b']['l']['a']).to.exist;
         expect(ts.root['b']['l']['a']['h']).to.exist;
      });

      it(`search('blah') and search('whatever') for each subkey should work`, () =>
      {
         expect(ts.search('b')[0]).to.equal(item);
         expect(ts.search('bl')[0]).to.equal(item);
         expect(ts.search('bla')[0]).to.equal(item);
         expect(ts.search('blah')[0]).to.equal(item);
      });

      it(`search('whatever') for each subkey should work`, () =>
      {
         expect(ts.search('w')[0]).to.equal(item);
         expect(ts.search('wh')[0]).to.equal(item);
         expect(ts.search('whatever')[0]).to.equal(item);
      });

      it(`search('yeah') for each subkey should work`, () =>
      {
         expect(ts.search('y')[0]).to.equal(item);
         expect(ts.search('ye')[0]).to.equal(item);
         expect(ts.search('yea')[0]).to.equal(item);
         expect(ts.search('yeah')[0]).to.equal(item);
      });

      it(`search('man') for each subkey should work`, () =>
      {
         expect(ts.search('m')[0]).to.equal(item);
         expect(ts.search('ma')[0]).to.equal(item);
         expect(ts.search('man')[0]).to.equal(item);
      });
   });

   describe('TrieSearch::add(...) and TrieSearch::search(...) should work for multiple items', () =>
   {
      const ts = new TrieSearch('key');
      const item1 = { key: 'I am item1!' };
      const item2 = { key: 'I am item2!' };

      ts.add(item1);
      ts.add(item2);

      it('add(item1) and add(item2) should build map of nodes', () =>
      {
         expect(ts.root['i']).to.exist;
         expect(ts.root['a']['m']).to.exist;
         expect(ts.root['i']['t']['e']['m']['1']).to.exist;
         expect(ts.root['i']['t']['e']['m']['2']).to.exist;
      });

      it(`search('i') should return 2 items`, () =>
      {
         expect(ts.search('i').length).to.equal(2);
         expect(ts.search('item').length).to.equal(2);
      });

      it(`search('item1') and search('item2') should return 1 item`, () =>
      {
         expect(ts.search('item1').length).to.equal(1);
         expect(ts.search('item2').length).to.equal(1);
      });
   });

   describe('add(...) and search(...) should work with options.min', () =>
   {
      const ts = new TrieSearch('key', { min: 2 });
      const item1 = { key: 'I am item1!' };
      const item2 = { key: 'I am item2!' };

      ts.add(item1);
      ts.add(item2);

      it('add(item1) and add(item2) should build map of nodes', () =>
      {
         expect(ts.root['i']).to.be.undefined;
         expect(ts.root['am']).to.exist;
         expect(ts.root['it']['e']['m']['1']).to.exist;
         expect(ts.root['it']['e']['m']['2']).to.exist;
      });

      it(`search('i') should return 0 items`, () =>
      {
         expect(ts.search('i').length).to.equal(0);
         expect(ts.search('item').length).to.equal(2);
      });

      it(`search('item') should return 2 items`, () => expect(ts.search('item').length).to.equal(2));

      it(`search('item1') and search('item2') should return 1 item`, () =>
      {
         expect(ts.search('item1').length).to.equal(1);
         expect(ts.search('item2').length).to.equal(1);
      });
   });

   describe('add(...) and search(...) should work with customKeys', () =>
   {
      const ts = new TrieSearch('key', { min: 2 });
      const item1 = { customKey1: 'I am item1!', customKey2: '123' };
      const item2 = { customKey1: 'I am item2!', customKey2: '456' };

      ts.add(item1, ['customKey1']);
      ts.add(item2, ['customKey1', 'customKey2']);

      it('add(item1) and add(item2) should build map of nodes', () =>
      {
         expect(ts.root['i']).to.be.undefined;
         expect(ts.root['am']).to.exist;

         expect(ts.root['it']['e']['m']['1']).to.exist;
         expect(ts.root['it']['e']['m']['2']).to.exist;

         expect(ts.root['12']).to.be.undefined;
         expect(ts.root['45']['6']).to.exist;
      });

      it(`search('i') should return 0 items`, () =>
      {
         expect(ts.search('i').length).to.equal(0);
         expect(ts.search('item').length).to.equal(2);
      });

      it(`search('123') should return 0 items`, () => expect(ts.search('123').length).to.equal(0));

      it(`search('45') should return 1 items`, () => expect(ts.search('456').length).to.equal(1));
   });

   describe('search(...) should work with a custom reducer and accumulator', () =>
   {
      const ts = new TrieSearch('key', { min: 2, idFieldOrFunction: 'key' });
      const item1 = { key: 'I am red robin!' };
      const item2 = { key: 'I am red cockatiel!' };
      const item3 = { key: 'I am green cardinal!' };
      const item4 = { key: 'I am green owl!' };
      const item5 = { key: 'robin cockatiel cardinal owl!' };

      ts.add(item1);
      ts.add(item2);
      ts.add(item3);
      ts.add(item4);
      ts.add(item5);

      it(`search('robin', [reducer])`, () =>
      {
         const result = ts.search('robin', (_accumulator, phrase, phraseMatches, trie) =>
         {
            expect(_accumulator).to.be.undefined;
            expect(phrase).to.equal('robin');
            expect(phraseMatches.length).to.equal(2);
            expect(phraseMatches[0]).to.equal(item5);
            expect(phraseMatches[1]).to.equal(item1);
            expect(trie).to.equal(ts);

            _accumulator = _accumulator || [];
            _accumulator.push(phraseMatches[1]);
            _accumulator.push(phraseMatches[0]);

            return _accumulator;
         });

         expect(result.length).to.equal(2);
         expect(result[0]).to.equal(item1);
         expect(result[1]).to.equal(item5);
      });

      it(`search(['red', 'robin'], TrieSearch.UNION_REDUCER)`, () =>
      {
         const result = ts.search(['red', 'robin'], TrieSearch.UNION_REDUCER);

         expect(result.length).not.to.equal(0);
         expect(result[0]).to.equal(item1);
      });

      it(`search(['green'], TrieSearch.UNION_REDUCER)`, () =>
      {
         const result = ts.search(['green'], TrieSearch.UNION_REDUCER);

         expect(result.length).to.equal(2);
         expect(result[0]).to.equal(item3);
         expect(result[1]).to.equal(item4);
      });

      it(`search('green', TrieSearch.UNION_REDUCER)`, () =>
      {
         const result = ts.search('green', TrieSearch.UNION_REDUCER);

         expect(result.length).to.equal(2);
         expect(result[0]).to.equal(item3);
         expect(result[1]).to.equal(item4);
      });

      it(`search('blue', TrieSearch.UNION_REDUCER)`, () =>
      {
         const result = ts.search('blue', TrieSearch.UNION_REDUCER);

         expect(result.length).to.equal(0);
      });

      it(`search('am', TrieSearch.UNION_REDUCER)`, () =>
      {
         const result = ts.search('am', TrieSearch.UNION_REDUCER);

         expect(result.length).to.equal(4);
      });

      it(`search(['owl', 'card', 'cock', 'rob'], TrieSearch.UNION_REDUCER)`, () =>
      {
         const result = ts.search(['owl', 'card', 'cock', 'rob'], TrieSearch.UNION_REDUCER);

         expect(result.length).to.equal(1);
      });

      it(`search(['owl', 'card', 'cock', 'rob', 'fubar'], TrieSearch.UNION_REDUCER)`, () =>
      {
         const result = ts.search(['owl', 'card', 'cock', 'rob', 'fubar'], TrieSearch.UNION_REDUCER);

         expect(result.length).to.equal(0);
      });
   });

   describe('search(...) with internationalization turned on (default) should work', () =>
   {
      const as = 'åäàáâã'.split('');
      const es = 'èéêë'.split('');
      const is = 'ìíîï'.split('');
      const os = 'òóôõö'.split('');
      const us = 'ùúûü'.split('');
      const aes = 'æ'.split('');

      const ts = new TrieSearch('key');
      const As_items =  as.map((letter) => ({ key: letter, arr: as }));
      const Es_items =  es.map((letter) => ({ key: letter, arr: es }));
      const Is_items =  is.map((letter) => ({ key: letter, arr: is }));
      const Os_items =  os.map((letter) => ({ key: letter, arr: os }));
      const Us_items =  us.map((letter) => ({ key: letter, arr: us }));
      const AEs_items = aes.map((letter) => ({ key: letter, arr: aes }));

      ts.addAll(As_items);
      ts.addAll(Es_items);
      ts.addAll(Is_items);
      ts.addAll(Os_items);
      ts.addAll(Us_items);
      ts.addAll(AEs_items);

      it(`Should return international items for 'a' -> any of '${as}'`, () =>
      {
         const items = ts.search('a');

         // Note this will include overlap with the ae!
         expect(items.length).to.equal(7);

         items.forEach((i) => expect(i.arr === as || i.arr === aes).to.be.ok);
      });

      it(`Should return international items for 'e' -> any of '${es}'`, () =>
      {
         const items = ts.search('e');

         expect(items.length).to.equal(4);

         items.forEach((i) => expect(i.arr).to.equal(es));
      });

      it(`Should return international items for 'i' -> any of '${is}'`, () =>
      {
         const items = ts.search('i');

         expect(items.length).to.equal(4);

         items.forEach((i) => expect(i.arr).to.equal(is));
      });

      it(`Should return international items for 'o' -> any of '${os}'`, () =>
      {
         const items = ts.search('o');

         expect(items.length).to.equal(5);

         items.forEach((i) => expect(i.arr).to.equal(os));
      });

      it(`Should return international items for 'u' -> any of '${us}'`, () =>
      {
         const items = ts.search('u');

         expect(items.length).to.equal(4);

         items.forEach((i) => expect(i.arr).to.equal(us));
      });

      it(`Should return international items for Swedish as an example with ''godis på sötdag är bra''`, () =>
      {
         const swedishSentence = { key: 'godis på sötdag är bra' };

         ts.add(swedishSentence);

         expect(ts.search('pa').length).to.equal(1);
         expect(ts.search('sot').length).to.equal(1);
         expect(ts.search('ar').length).to.equal(1);
      });
   });

   describe('TrieSearch::map(...) works with RegEx with positive lookahead (e.g. split on capital letters)', () =>
   {
      it('should not error', () =>
      {
         expect(() =>
         {
            const ts = new TrieSearch('key', { splitOnRegEx: /([.\-\s']|(?=[A-Z]))/, splitOnGetRegEx: false });
            const item = { someValue: 12345 };

            ts.map('This IsSome.Phrase-Whatever', item);
         }).to.not.throw();
      });

      it('should match capital letter breaks', () =>
      {
         const ts = new TrieSearch('key', {
            splitOnRegEx: /([.\-\s'_]|(?=[A-Z]))/,
            splitOnGetRegEx: false,
            insertFullUnsplitKey: true
         });

         const item = { someValue: 12345 };
         const item2 = { someValue: 67890 };

         ts.map(`It'sOnlyA_Flesh Wound`, item);
         ts.map('WhatIsYourFavoriteColor', item2);

         expect(ts.search('It')[0]).to.equal(item);
         expect(ts.search('s')[0]).to.equal(item);
         expect(ts.search('Only')[0]).to.equal(item);
         expect(ts.search('A')[0]).to.equal(item);
         expect(ts.search('Flesh')[0]).to.equal(item);
         expect(ts.search('Wound')[0]).to.equal(item);
         expect(ts.search(`It'sOnlyA_Flesh Wound`)[0]).to.equal(item);

         expect(ts.search('What')[0]).to.equal(item2);
         expect(ts.search('Is')[0]).to.equal(item2);
         expect(ts.search('Your')[0]).to.equal(item2);
         expect(ts.search('Fav')[0]).to.equal(item2);
         expect(ts.search('Favorite')[0]).to.equal(item2);
         expect(ts.search('Color')[0]).to.equal(item2);
         expect(ts.search('WhatIsYourFavoriteColor')[0]).to.equal(item2);
      });

      it('should match capital letter breaks', () =>
      {
         const ts = new TrieSearch('someValue', { splitOnRegEx: /([.\-\s'_]|(?=[A-Z]))/, splitOnGetRegEx: /[\s]/ });
         const item2 = { someValue: 67890 };

         ts.map('WhatIsYourFavoriteColor', item2);

         expect(ts.search('What Is')[0]).to.equal(item2);
         expect(ts.search('Color Favorite')[0]).to.equal(item2);
      });

      it('should split on various other word breaks', () =>
      {
         const ts = new TrieSearch('someValue', { splitOnRegEx: /[\s/()]/ });
         const item = { someValue: 12345 };
         const item2 = { someValue: 67890 };

         ts.map('Hello/World', item);
         ts.map(`What's(Up)`, item2);

         expect(ts.search('Hello')[0]).to.equal(item);
         expect(ts.search('Up')[0]).to.equal(item2);
         expect(ts.search('Up')[0]).to.equal(item2);
      });
   });

   describe('search(...) should work with limits', () =>
   {
      // NOTE: Cache is set to true since caching also needs to be tested
      const ts = new TrieSearch(null, { cache: true });
      const obj = {
         a: ['data'],
         ab: ['data'],
         abc: ['data'],
         abcd: ['data'],
         abcde: ['data'],
         abcdef: ['data'],
      };

      ts.addFromObject(obj);

      it('Get with limits and get without limits should work properly', () =>
      {
         const getWithoutLimit = ts.search('a');
         expect(getWithoutLimit.length).to.equal(6);

         const getWithLimitResp = ts.search('a', null, 4);
         expect(getWithLimitResp.length).to.equal(4);
      });

      it('Failure case with limits should work properly', () =>
      {
         const getWithLimit = ts.search('b', null, 4);
         expect(getWithLimit.length).to.equal(0);
      });

      it('A bigger limit value than the actual amount of data must work properly', () =>
      {
         const getWithLimit = ts.search('a', null, 100);
         expect(getWithLimit.length).to.equal(6);
      });
   });
});
