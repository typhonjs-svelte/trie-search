import { HashArray } from '../../src';

describe('HashArray API Errors', () =>
{
   describe('Throws', () =>
   {
      describe('constructor(KeyField, options)', () =>
      {
         it('keyFields not a string or array', () =>
         {
            expect(() => new HashArray(null)).to.throw(
             `HashArray.construct error: 'keyFields' is not a string or array.`);
         });

         it('options is not an object', () =>
         {
            expect(() => new HashArray('key', null)).to.throw(
             `HashArray.construct error: 'options' is not an object.`);
         });
      });

      describe('intersection(HashArray)', () =>
      {
         it('target is not a HashArray', () =>
         {
            expect(() => new HashArray().intersection(null)).to.throw(
             `HashArray.intersection error: 'target' must be a HashArray.`);
         })
      });

      describe('objectAt(object, Key)', () =>
      {
         it('object is not an object', () =>
         {
            expect(() => HashArray.objectAt(null, 'key')).to.throw(
             `HashArray.objectAt error: 'item' must be an object.`);
         })
      });
   });
});