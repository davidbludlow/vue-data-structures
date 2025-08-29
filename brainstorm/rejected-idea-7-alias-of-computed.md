# `aliasOfComputed` (Previously Failed Idea - Now Solved!)

**UPDATE: This issue has been resolved!** The problem described below has been solved by converting `aliasOfComputed` properties into getters/setters in the `ReactiveClass` constructor.

---

`ReactiveClass` used to have a problem with something called `aliasOfComputed`. The original implementation looked like this:

````ts
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
````

`aliasOfComputed` worked in most cases. Unfortunately it didn't work in this case: If there is a setter on a `ReactiveClass` subclass, then during the runtime of the setter, vue will call the corresponding getter for that property. Vue does this to get the `oldValue` of the property before the setting happens. Unfortunately, when vue calls the getter then, it does so with a non-reactive `this`. Having `this` sometimes be reactive and sometimes not means you can't use `aliasOfComputed` reliably. For example, lets say you have

```ts
import { aliasOfComputed, ReactiveClass } from '../src/reactive-class';

class MyClass extends ReactiveClass {
  foo = 3;

  doubleFoo = aliasOfComputed(() => this.foo * 2);

  get doubleFooAsAString() {
    return this.doubleFoo.toPrecision(4);
  }
  set doubleFooAsAString(value) {
    this.foo = Number(value) / 2;
  }
}
```

When you call `myInstance.doubleFooAsAString = 10`, then vue will call the getter for `doubleFooAsAString` to get the old value. When it does that, `this` inside the getter is not reactive, so `this.doubleFoo` is still a ref object instead of being unwrapped to its value, causing methods like `.toPrecision()` to fail.

## Solution

This problem has been solved! The current implementation of `ReactiveClass` converts `aliasOfComputed` properties (which are computed refs) into proper getters and setters during construction:

```ts
constructor() {
  // Turn the `aliasOfComputed` properties into getters, because reactive()
  // doesn't unwrap refs in all cases (specifically when getters are called
  // during setters to get old values).
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
```

This ensures that `aliasOfComputed` properties work correctly even when getters are called during setters, because the getter now directly accesses `value.value` rather than relying on Vue's ref unwrapping behavior.

You can see this problem demonstrated in the test file: [`tests/old-reactive-class-corner-case_test.ts`](../tests/old-reactive-class-corner-case_test.ts)
