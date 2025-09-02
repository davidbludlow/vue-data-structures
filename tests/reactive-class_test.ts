import { assertEquals } from 'https://deno.land/std/assert/assert_equals.ts';
import { aliasOfComputed, ReactiveClass } from '../src/reactive-class.ts';

class TestReactiveClass extends ReactiveClass {
  foo = 3;
  bar = 5;

  // Test computed properties
  doubleFoo = aliasOfComputed(() => this.foo * 2);
  sumFooBar = aliasOfComputed(() => this.foo + this.bar);

  // Test getter/setter that might trigger the old reactivity issue
  get doubleFooAsString() {
    return this.doubleFoo.toString();
  }

  set doubleFooAsString(value: string) {
    this.foo = Number(value) / 2;
  }
}

Deno.test('ReactiveClass with aliasOfComputed - initial values', () => {
  const instance = new TestReactiveClass();

  assertEquals(instance.foo, 3);
  assertEquals(instance.bar, 5);
  assertEquals(instance.doubleFoo, 6);
  assertEquals(instance.sumFooBar, 8);
});

Deno.test('ReactiveClass with aliasOfComputed - reactivity on property change', () => {
  const instance = new TestReactiveClass();

  // Change foo and verify computed properties update
  instance.foo = 10;

  assertEquals(instance.foo, 10);
  assertEquals(instance.doubleFoo, 20);
  assertEquals(instance.sumFooBar, 15); // 10 + 5
});

Deno.test('ReactiveClass with aliasOfComputed - reactivity on another property change', () => {
  const instance = new TestReactiveClass();

  // Change bar and verify computed properties update
  instance.bar = 7;

  assertEquals(instance.foo, 3);
  assertEquals(instance.bar, 7);
  assertEquals(instance.doubleFoo, 6); // still 3 * 2
  assertEquals(instance.sumFooBar, 10); // 3 + 7
});

Deno.test('ReactiveClass with aliasOfComputed - getter/setter reactivity (the critical test)', () => {
  const instance = new TestReactiveClass();

  // This tests the original issue where getter/setter access would fail
  // because `this` wasn't reactive during setter execution

  // Initial state
  assertEquals(instance.doubleFooAsString, '6');

  // Set via the setter - this used to fail with aliasOfComputed
  instance.doubleFooAsString = '30';

  // Verify the setter worked and computed properties updated
  assertEquals(instance.foo, 15); // 30 / 2
  assertEquals(instance.doubleFoo, 30); // 15 * 2
  assertEquals(instance.doubleFooAsString, '30');
});

Deno.test('ReactiveClass with aliasOfComputed - complex getter/setter interactions', () => {
  const instance = new TestReactiveClass();

  // Test multiple getter/setter interactions
  instance.doubleFooAsString = '20';
  assertEquals(instance.foo, 10);
  assertEquals(instance.doubleFoo, 20);
  assertEquals(instance.doubleFooAsString, '20');

  // Change the underlying property directly
  instance.foo = 8;
  assertEquals(instance.doubleFoo, 16);
  assertEquals(instance.doubleFooAsString, '16');

  // Use setter again
  instance.doubleFooAsString = '40';
  assertEquals(instance.foo, 20);
  assertEquals(instance.doubleFoo, 40);
  assertEquals(instance.doubleFooAsString, '40');
});

Deno.test('ReactiveClass with aliasOfComputed - TypeScript types', () => {
  const instance = new TestReactiveClass();

  // These tests verify that TypeScript sees the correct types
  // (the test will fail to compile if types are wrong)

  const fooValue: number = instance.foo;
  const doubleFooValue: number = instance.doubleFoo;
  const sumValue: number = instance.sumFooBar;
  const stringValue: string = instance.doubleFooAsString;

  // Use the values to avoid unused variable warnings
  assertEquals(typeof fooValue, 'number');
  assertEquals(typeof doubleFooValue, 'number');
  assertEquals(typeof sumValue, 'number');
  assertEquals(typeof stringValue, 'string');
});

Deno.test('ReactiveClass with aliasOfComputed - computed properties are reactive to multiple dependencies', () => {
  const instance = new TestReactiveClass();

  // Test that computed properties react to changes in multiple dependencies
  assertEquals(instance.sumFooBar, 8); // 3 + 5

  // Change both dependencies
  instance.foo = 7;
  instance.bar = 3;

  assertEquals(instance.sumFooBar, 10); // 7 + 3
  assertEquals(instance.doubleFoo, 14); // 7 * 2
});
