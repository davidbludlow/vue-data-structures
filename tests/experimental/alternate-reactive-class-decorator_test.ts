import { assertEquals } from 'jsr:@std/assert';
import { computed, isRef, reactive, toRaw } from 'vue';

// This is the decorator solution that works but we decided not to use.
// This test file demonstrates the working implementation described in:
// ../../brainstorm/alternate-idea-9-reactive-class-with-decorator.md
//
// NOTE: This does NOT test production code - it's a proof-of-concept
// for an alternative approach we decided against.

function reactiveClass<T extends new (...args: any[]) => any>(
  BaseClass: T,
): T {
  return class extends BaseClass {
    constructor(...args: any[]) {
      // Call the original constructor to initialize properties
      super(...args);

      const rawThis = toRaw(this);

      // Now process any refs (including aliasOfComputed) after everything is set up
      for (const [key, value] of Object.entries(rawThis)) {
        if (isRef(value)) {
          Object.defineProperty(rawThis, key, {
            get: () => value.value,
            set: (newValue) => {
              value.value = newValue;
            },
          });
        }
      }
    }
  } as T;
}

class ReactiveClass {
  constructor() {
    return reactive(this);
  }
}

const aliasOfComputed = computed as <T>(fn: () => T) => T;

@reactiveClass
class TestReactiveClass extends ReactiveClass {
  foo = 3;
  bar = 5;

  // Test computed properties
  doubleFoo = aliasOfComputed(() => this.foo * 2);
  sumFooBar = aliasOfComputed(() => this.foo + this.bar);

  // Test getter/setter that might trigger the old reactivity issue
  get doubleFooAsString() {
    return this.doubleFoo.toPrecision(4);
  }

  set doubleFooAsString(value: string) {
    this.foo = Number(value) / 2;
  }
}

Deno.test('Decorator ReactiveClass - initial values', () => {
  const instance = new TestReactiveClass();

  assertEquals(instance.foo, 3);
  assertEquals(instance.bar, 5);
  assertEquals(instance.doubleFoo, 6);
  assertEquals(instance.sumFooBar, 8);
});

Deno.test('Decorator ReactiveClass - reactivity on property change', () => {
  const instance = new TestReactiveClass();

  // Change foo and verify computed properties update
  instance.foo = 10;

  assertEquals(instance.foo, 10);
  assertEquals(instance.doubleFoo, 20);
  assertEquals(instance.sumFooBar, 15); // 10 + 5
});

Deno.test('Decorator ReactiveClass - getter/setter reactivity (the critical test)', () => {
  const instance = new TestReactiveClass();

  // This tests the original issue where getter/setter access would fail
  // because `this` wasn't reactive during setter execution

  // Initial state
  assertEquals(instance.doubleFooAsString, '6.000');

  // Set via the setter - this used to fail with aliasOfComputed
  instance.doubleFooAsString = '30';

  // Verify the setter worked and computed properties updated
  assertEquals(instance.foo, 15); // 30 / 2
  assertEquals(instance.doubleFoo, 30); // 15 * 2
  assertEquals(instance.doubleFooAsString, '30.00');
});

Deno.test('Decorator ReactiveClass - complex getter/setter interactions', () => {
  const instance = new TestReactiveClass();

  // Test multiple getter/setter interactions
  instance.doubleFooAsString = '20';
  assertEquals(instance.foo, 10);
  assertEquals(instance.doubleFoo, 20);
  assertEquals(instance.doubleFooAsString, '20.00');

  // Change the underlying property directly
  instance.foo = 8;
  assertEquals(instance.doubleFoo, 16);
  assertEquals(instance.doubleFooAsString, '16.00');

  // Use setter again
  instance.doubleFooAsString = '40';
  assertEquals(instance.foo, 20);
  assertEquals(instance.doubleFoo, 40);
  assertEquals(instance.doubleFooAsString, '40.00');
});
