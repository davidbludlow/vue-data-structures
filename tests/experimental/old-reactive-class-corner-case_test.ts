// This test demonstrates the corner case where `aliasOfComputed` doesn't work.
// See brainstorm/rejected-idea-7-alias-of-computed.md for more details.

import { computed } from 'vue';
import { ReactiveClass } from '../../src/reactive-class.ts';

const oldAliasOfComputed = computed as <T>(fn: () => T) => T;

class MyClassWithReactiveClass extends ReactiveClass {
  foo = 3;

  doubleFoo = oldAliasOfComputed(() => this.foo * 2);

  get doubleFooAsAString() {
    return this.doubleFoo.toPrecision(4);
  }

  set doubleFooAsAString(value: string) {
    this.foo = Number(value) / 2;
  }
}

Deno.test('Old ReactiveClass fails with computed properties in getter/setter scenarios', () => {
  const myInstance = new MyClassWithReactiveClass();

  try {
    // This is where the old implementation would fail When Vue calls the getter
    // during the setter to get the old value, `this` is not reactive, so
    // `this.doubleFoo` is still a ref object instead of unwrapped
    myInstance.doubleFooAsAString = '10';

    // If we get here without error, then Vue has changed and maybe we can go
    // back to using `aliasOfComputed`
    throw new Error(
      'Expected this to fail, but it worked! Vue behavior may have changed.',
    );
  } catch (error) {
    // This is expected
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Verify it's the specific error we expect (trying to call toPrecision on a
    // ref object)
    if (errorMessage.includes('toPrecision')) {
      // This is the expected behavior
    } else {
      // Re-throw if it's a different error
      throw error;
    }
  }
});
