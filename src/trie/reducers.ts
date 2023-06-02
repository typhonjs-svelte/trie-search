export function unionReducer<T extends object>(accumulator: T[], phrase: string, matches: T[], indexField: string): T[]
{
   if (accumulator === void 0) { return matches; }

   const map = {};
   const maxLength = Math.max(accumulator.length, matches.length);
   const results = [];

   let i, id;
   let l = 0;

   // One loop, O(N) for max length of accumulator or matches.
   for (i = 0; i < maxLength; i++)
   {
      if (i < accumulator.length)
      {
         id = accumulator[i][indexField];
         map[id] = map[id] ? map[id] : 0;
         map[id]++;

         if (map[id] === 2) { results[l++] = accumulator[i]; }
      }

      if (i < matches.length)
      {
         id = matches[i][indexField];
         map[id] = map[id] ? map[id] : 0;
         map[id]++;

         if (map[id] === 2) { results[l++] = matches[i]; }
      }
   }

   return results;
}