// This file was copied from
// https://github.com/davidbludlow/vue-data-structures/blob/main/src/never-reactive-class.ts
// which had an MIT license, when it was copied.

import { RawSymbol } from '@vue/reactivity';
import { toRaw } from 'vue';

/** Extend this class to make instances of your class shallowly never-reactive.
 *
 * The entire source code of `NeverReactiveClass` is:
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
 *
 * You store data on it that uses `reactive`, `ref`, and `computed` and have
 * reactivity that way. */
export class NeverReactiveClass {
  // This is only here to make TypeScript happy
  [RawSymbol] = true as const;

  constructor() {
    toRaw(this);
  }
}
