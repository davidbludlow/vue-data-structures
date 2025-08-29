// This test demonstrates why the simple version of ReactiveClass doesn't work
// in all cases. It tests the old implementation to ensure we understand the
// corner case that required the current solution. See
// brainstorm/rejected-idea-7-alias-of-computed.md for more details.

import { computed, reactive } from 'vue';

// This is the old, simple version of ReactiveClass that had problems
class OldReactiveClass {
  constructor() {
    return reactive(this);
  }
}

const oldAliasOfComputed = computed as <T>(fn: () => T) => T;

class MyClassWithOldReactiveClass extends OldReactiveClass {
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
  const myInstance = new MyClassWithOldReactiveClass();

  try {
    // This is where the old implementation would fail When Vue calls the getter
    // during the setter to get the old value, `this` is not reactive, so
    // `this.doubleFoo` is still a ref object instead of unwrapped
    myInstance.doubleFooAsAString = '10';

    // If we get here without error, then Vue has changed and maybe we don't
    // need the complex constructor in `ReactiveClass` anymore
    throw new Error(
      'Expected this to fail with the old ReactiveClass implementation, but it worked! Vue behavior may have changed.',
    );
  } catch (error) {
    // This is expected - the old implementation should fail
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Verify it's the specific error we expect (trying to call toPrecision on a
    // ref object)
    if (
      errorMessage.includes('Cannot read properties of undefined') ||
      errorMessage.includes('undefined') ||
      errorMessage.includes('toPrecision')
    ) {
      // This is the expected behavior
    } else {
      // Re-throw if it's a different error
      throw error;
    }
  }
});
