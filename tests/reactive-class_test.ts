import { assertEquals } from 'jsr:@std/assert';
import { computedAsAFunction, ReactiveClass } from '../src/reactive-class.ts';

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
}

Deno.test('ReactiveClass with computedAsAFunction - initial values', () => {
  const instance = new TestReactiveClass();

  assertEquals(instance.foo, 3);
  assertEquals(instance.bar, 5);
  assertEquals(instance.getDoubleFoo(), 6);
  assertEquals(instance.getSumFooBar(), 8);
  assertEquals(instance.tripleFoo, 9);
});

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
