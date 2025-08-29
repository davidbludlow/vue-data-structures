// This file was copied from
// https://github.com/davidbludlow/vue-data-structures/blob/main/src/reactive-class.ts
// which had an MIT license, when it was copied.

import { computed, isRef, reactive } from 'vue';

/** Extend this class to make your class reactive.
 *
 * Warnings:
 * - Do not use `computed()`, instead use `aliasOfComputed()` to get proper
 *   TypeScript types
 * - Do not bother using `ref()` instead just set the value directly on `this`.
 *   The reason is same as for Bullet Point #1, which is that `reactive()` will
 *   unwrap refs. So if you put a ref or regular computed on a `ReactiveClass`
 *   then TypeScript will insist you need to type `.value`, but you don't need
 *   to. In fact, you will probably get runtime errors if you do.
 * - Probably does't work with Vue 2.
 */
export class ReactiveClass {
  constructor() {
    // In 99% of cases you will not need this for loop. See
    // https://github.com/davidbludlow/vue-data-structures/blob/main/brainstorm/rejected-idea-7-alias-of-computed.md
    // for an explanation of why this is needed. This will take all the
    // `aliasOfComputed` (and other refs, but that isn't important) and will
    // turn them into getter/setters. This normally isn't needed because `this`
    // is normally reactive and reactive things automatically unwrap refs.
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
