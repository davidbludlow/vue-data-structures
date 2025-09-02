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
 * - For computed properties, use `computedAsAFunction()` instead of
 *   `computed()`. This avoids problems where `this.computedThing` will
 *   sometimes be an unwrapped value and sometimes be a computed ref. (See
 *   https://github.com/davidbludlow/vue-data-structures/blob/main/brainstorm/rejected-idea-7-alias-of-computed.md
 *   for more details.)
 * - Do not use `ref()` - instead just set the value directly on `this`. The
 *   reason is that `reactive()` will unwrap refs, but TypeScript will still
 *   expect you to use `.value`, leading to type mismatches.
 * - Doesn't work with Vue 2.
 * - Don't use private properties (`#` or `private` keyword). If you do, then
 *   there will be problems where `new ReactiveFoo()` will not have the same
 *   TypeScript type as `reactive(new ReactiveFoo())`.
 */
export class ReactiveClass {
  constructor() {
    return reactive(this);
  }
}

/**
 * Creates a computed function that can be called reliably in any context.
 *
 * Use this instead of `computed()` when you need computed values in
 * getter/setter scenarios or other contexts where `this` might not be reactive.
 *
 * @example
 * ```ts
 * class MyClass extends ReactiveClass {
 *   foo = 4;
 *
 *   // Simple way
 *   getDoubleFoo = computedAsAFunction(() => this.foo * 2);
 *
 *   // Getter/setter way
 *   _getTripleFoo = computedAsAFunction(() => this.foo * 3);
 *   get tripleFoo() {
 *     return this._getTripleFoo();
 *   }
 *   set tripleFoo(value) {
 *     this.foo = value / 3;
 *   }
 * }
 * ```
 */
export const computedAsAFunction = <T>(fn: () => T) => {
  const computedRef = computed(fn);
  return () => computedRef.value;
};
