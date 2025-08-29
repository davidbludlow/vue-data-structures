// This file was copied from
// https://github.com/davidbludlow/vue-data-structures/blob/main/src/reactive-class.ts
// which had an MIT license, when it was copied.

import { computed, isRef, reactive } from 'vue';

/** Extend this class to make your class reactive. The entire source code of
 * `ReactiveClass` is:
 * ```ts
 * import { reactive } from 'vue';
 *
 * export class ReactiveClass {
 *   constructor() {
 *     return reactive(this);
 *   }
 * }
 * ```
 * Warnings:
 * - Do not use `computed()`, instead use `aliasOfComputed()` to get proper
 *   TypeScript types
 * - Do not bother using `ref()` instead just set the value directly on `this`.
 *   The reason is same as for Bullet Point #1, which is that `reactive()` will
 *   unwrap refs. So if you put a ref or regular computed on a `ReactiveClass`
 *   then TypeScript will insist you need to type `.value`, but you don't need
 *   to. In fact, you will probably get runtime errors if you do.
 * - Does't work with Vue 2.
 */
export class ReactiveClass {
  constructor() {
    // Turn the `aliasOfComputed` properties into getters, because, even though
    // most of the time all the nested refs would be unwrapped anyway, there are
    // still some corner cases.
    for (const [key, value] of Object.entries(this)) {
      if (isRef(value)) {
        Object.defineProperty(this, key, {
          get: () => value.value,
          set: (newValue) => {
            value.value = newValue;
          },
        });
      }
    }

    return reactive(this);
  }
}

export const aliasOfComputed = computed as <T>(fn: () => T) => T;
