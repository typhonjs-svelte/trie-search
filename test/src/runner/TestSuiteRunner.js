import { TestsuiteRunner }    from '@typhonjs-build-test/testsuite-runner';

import * as HashArray         from './tests/hash/HashArray.js';
import * as TrieSearch        from './tests/trie/TrieSearch.js';

export default new TestsuiteRunner({
   HashArray,
   TrieSearch
});
