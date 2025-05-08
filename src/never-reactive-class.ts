// This file was copied from
// https://github.com/davidbludlow/vue-data-structures/blob/main/src/never-reactive-class.ts
// which had an MIT license, when it was copied.

import { RawSymbol } from '@vue/reactivity';
import { toRaw } from 'vue';

/** Extend this class to make it so a reactive proxy will never be made for
 * instances of your class. The entire source code of `NeverReactiveClass` is:
 * ```ts
 * export class NeverReactiveClass {
 *   // This is only here to make TypeScript happy
 *   [RawSymbol] = true as const;
 *
 *   constructor() {
 *     toRaw(this);
 *   }
 * }
 * ```
 */
export class NeverReactiveClass {
  // This is only here to make TypeScript happy
  [RawSymbol] = true as const;

  constructor() {
    toRaw(this);
  }
}
