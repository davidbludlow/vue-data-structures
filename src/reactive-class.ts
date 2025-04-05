// This file was copied from
// https://github.com/davidbludlow/vue-data-structures/blob/main/src/reactive-class.ts
// which had an MIT license, when it was copied.

import { computed, reactive } from 'vue';

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
 * - Do not use `computed()`, instead use `aliasOfComputed()`
 * - Do not use `ref()` instead just set the value directly on `this`. The
 *   reason is same as for Bullet Point #1, which is that `reactive()` will
 *   unwrap refs. So if you put a ref or regular computed on a `ReactiveClass`
 *   then TypeScript will insist you need to type `.value`, but you don't need
 *   to. In fact, you will probably get runtime errors if you do.
 * - Does't work with Vue 2.
 */
export class ReactiveClass {
  constructor() {
    return reactive(this);
  }
}

export const aliasOfComputed = computed as <T>(fn: () => T) => T;
