import { assertEquals, assertStrictEquals } from 'jsr:@std/assert';
import { isReactive, watchEffect } from 'vue';
import { computedAsAFunction, ReactiveClass } from '../src/reactive-class.ts';

Deno.test('ReactiveClass basic usage example', () => {
  class Example extends ReactiveClass {
    count = 5;

    getDouble = computedAsAFunction(() => this.count * 2);

    _getTriple = computedAsAFunction(() => this.count * 3);
    get triple() {
      return this._getTriple();
    }
    set triple(value: number) {
      this.count = value / 3;
    }
  }

  const instance = new Example();
  instance.count = 7;
  assertEquals(instance.getDouble(), 14);
  assertEquals(instance.triple, 21);

  instance.triple = 30;
  assertEquals(instance.count, 10);
  assertEquals(instance.getDouble(), 20);
});

class TestReactiveClass extends ReactiveClass {
  foo = 3;
  bar = 5;

  // Simple way - computed properties as functions
  getDoubleFoo = computedAsAFunction(() => this.foo * 2);
  getSumFooBar = computedAsAFunction(() => this.foo + this.bar);

  // Getter/setter way - for when you need property-like access
  _getTripleFoo = computedAsAFunction(() => this.foo * 3);
  get tripleFoo() {
    return this._getTripleFoo();
  }

  // Test getter/setter that might trigger the old reactivity issue
  get doubleFooAsString() {
    return this.getDoubleFoo().toPrecision(4);
  }
  set doubleFooAsString(value: string) {
    this.foo = Number(value) / 2;
  }

  // Regular method for testing
  regularMethod() {
    return `foo is ${this.foo}`;
  }

  // Method that logs state for watchEffect testing
  logState() {
    return `foo: ${this.foo}, bar: ${this.bar}, double: ${this.getDoubleFoo()}`;
  }
}

Deno.test('ReactiveClass with computedAsAFunction - reactivity on property change', () => {
  const instance = new TestReactiveClass();

  // Change foo and verify computed properties update
  instance.foo = 10;

  assertEquals(instance.foo, 10);
  assertEquals(instance.getDoubleFoo(), 20);
  assertEquals(instance.getSumFooBar(), 15); // 10 + 5
  assertEquals(instance.tripleFoo, 30); // 10 * 3
});

Deno.test('ReactiveClass with computedAsAFunction - reactivity on another property change', () => {
  const instance = new TestReactiveClass();

  // Change bar and verify computed properties update
  instance.bar = 7;

  assertEquals(instance.foo, 3);
  assertEquals(instance.bar, 7);
  assertEquals(instance.getDoubleFoo(), 6); // still 3 * 2
  assertEquals(instance.getSumFooBar(), 10); // 3 + 7
  assertEquals(instance.tripleFoo, 9); // still 3 * 3
});

Deno.test('ReactiveClass with computedAsAFunction - getter/setter reactivity (the critical test)', () => {
  const instance = new TestReactiveClass();

  // This tests the original issue where getter/setter access would fail
  // because `this` wasn't reactive during setter execution

  // Initial state
  assertEquals(instance.doubleFooAsString, '6.000');

  // Set via the setter - this now works with computedAsAFunction
  instance.doubleFooAsString = '30';

  // Verify the setter worked and computed properties updated
  assertEquals(instance.foo, 15); // 30 / 2
  assertEquals(instance.getDoubleFoo(), 30); // 15 * 2
  assertEquals(instance.doubleFooAsString, '30.00');
});

Deno.test('ReactiveClass with computedAsAFunction - complex getter/setter interactions', () => {
  const instance = new TestReactiveClass();

  // Test multiple getter/setter interactions
  instance.doubleFooAsString = '20';
  assertEquals(instance.foo, 10);
  assertEquals(instance.getDoubleFoo(), 20);
  assertEquals(instance.doubleFooAsString, '20.00');

  // Change the underlying property directly
  instance.foo = 8;
  assertEquals(instance.getDoubleFoo(), 16);
  assertEquals(instance.doubleFooAsString, '16.00');

  // Use setter again
  instance.doubleFooAsString = '40';
  assertEquals(instance.foo, 20);
  assertEquals(instance.getDoubleFoo(), 40);
  assertEquals(instance.doubleFooAsString, '40.00');
});

Deno.test('ReactiveClass with computedAsAFunction - TypeScript types', () => {
  const instance = new TestReactiveClass();

  // These tests verify that TypeScript sees the correct types
  // (the test will fail to compile if types are wrong)

  const fooValue: number = instance.foo;
  const doubleFooValue: number = instance.getDoubleFoo();
  const sumValue: number = instance.getSumFooBar();
  const stringValue: string = instance.doubleFooAsString;
  const tripleFooValue: number = instance.tripleFoo;

  // Use the values to avoid unused variable warnings
  assertEquals(typeof fooValue, 'number');
  assertEquals(typeof doubleFooValue, 'number');
  assertEquals(typeof sumValue, 'number');
  assertEquals(typeof stringValue, 'string');
  assertEquals(typeof tripleFooValue, 'number');
});

Deno.test('ReactiveClass with computedAsAFunction - computed properties are reactive to multiple dependencies', () => {
  const instance = new TestReactiveClass();

  // Test that computed properties react to changes in multiple dependencies
  assertEquals(instance.getSumFooBar(), 8); // 3 + 5

  // Change both dependencies
  instance.foo = 7;
  instance.bar = 3;

  assertEquals(instance.getSumFooBar(), 10); // 7 + 3
  assertEquals(instance.getDoubleFoo(), 14); // 7 * 2
});

Deno.test('ReactiveClass constructor returns reactive proxy', () => {
  const instance = new TestReactiveClass();

  // Test that the instance is actually reactive
  assertEquals(isReactive(instance), true);

  // Test that we can still access normal class functionality
  assertEquals(instance.regularMethod(), 'foo is 3');

  // Test that methods work after property changes
  instance.foo = 42;
  assertEquals(instance.regularMethod(), 'foo is 42');
});

Deno.test('computedAsAFunction caches results properly', () => {
  const instance = new TestReactiveClass();

  // Get the same computed value multiple times
  const result1 = instance.getDoubleFoo();
  const result2 = instance.getDoubleFoo();
  const result3 = instance.getDoubleFoo();

  // Should be the same reference (Vue computed caching)
  assertStrictEquals(result1, result2);
  assertStrictEquals(result2, result3);
  assertEquals(result1, 6);

  // After changing a dependency, should get a new computed value
  instance.foo = 10;
  const result4 = instance.getDoubleFoo();
  assertEquals(result4, 20);

  // Multiple calls after change should again be cached
  const result5 = instance.getDoubleFoo();
  assertStrictEquals(result4, result5);
});

function wait() {
  return new Promise((resolve) => setTimeout(resolve));
}

Deno.test('ReactiveClass works with watchEffect for async reactivity', async () => {
  const instance = new TestReactiveClass();

  let watchEffectCount = 0;
  let lastLog = '';

  watchEffect(() => {
    watchEffectCount++;
    lastLog = instance.logState();
  });

  // Wait for initial effect
  await wait();
  assertEquals(watchEffectCount, 1);
  assertEquals(lastLog, 'foo: 3, bar: 5, double: 6');

  // Change foo and verify watchEffect triggers
  instance.foo = 10;
  await wait();
  assertEquals(watchEffectCount, 2);
  assertEquals(lastLog, 'foo: 10, bar: 5, double: 20');

  // Change bar and verify watchEffect triggers
  instance.bar = 7;
  await wait();
  assertEquals(watchEffectCount, 3);
  assertEquals(lastLog, 'foo: 10, bar: 7, double: 20');
});

Deno.test('ReactiveClass JSON serialization behavior', () => {
  const instance = new TestReactiveClass();

  // Modify some values
  instance.foo = 42;
  instance.bar = 84;

  // Test JSON serialization
  const jsonString = JSON.stringify(instance);
  const parsed = JSON.parse(jsonString);

  // Should only include data properties, not computed functions or methods
  assertEquals(parsed.foo, 42);
  assertEquals(parsed.bar, 84);

  // Should not include computed functions or methods
  assertEquals(parsed.getDoubleFoo, undefined);
  assertEquals(parsed.getSumFooBar, undefined);
  assertEquals(parsed.regularMethod, undefined);
  assertEquals(parsed.logState, undefined);
});

Deno.test('ReactiveClass object iteration behavior', () => {
  const instance = new TestReactiveClass();

  // Test for...in iteration
  const iteratedKeys: string[] = [];
  for (const key in instance) {
    iteratedKeys.push(key);
  }

  // Should include data properties
  assertEquals(iteratedKeys.includes('foo'), true);
  assertEquals(iteratedKeys.includes('bar'), true);

  // Should include computed functions (they are enumerable class properties)
  assertEquals(iteratedKeys.includes('getDoubleFoo'), true);
  assertEquals(iteratedKeys.includes('getSumFooBar'), true);

  // Should not include methods
  assertEquals(iteratedKeys.includes('regularMethod'), false);
});

Deno.test('ReactiveClass efficient reactivity - no unnecessary recomputations', async () => {
  const instance = new TestReactiveClass();

  let computationCount = 0;
  let lastResult = '';

  // Create a computed that tracks how many times it runs
  watchEffect(() => {
    computationCount++;
    lastResult = `${instance.getDoubleFoo()} + ${instance.getSumFooBar()}`;
  });

  await wait();
  assertEquals(computationCount, 1);
  assertEquals(lastResult, '6 + 8');

  // Change foo - should trigger one recomputation
  instance.foo = 5;
  await wait();
  assertEquals(computationCount, 2);
  assertEquals(lastResult, '10 + 10');

  // Access computed values multiple times - should not trigger recomputation
  const double1 = instance.getDoubleFoo();
  const double2 = instance.getDoubleFoo();
  const sum1 = instance.getSumFooBar();
  const sum2 = instance.getSumFooBar();
  await wait();
  assertEquals(computationCount, 2); // Should stay the same
  assertEquals(double1, double2);
  assertEquals(sum1, sum2);
});
