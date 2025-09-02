# Reactive Class with Decorator (Working but Not Recommended)

This approach successfully solves the `aliasOfComputed` issue described in [rejected-idea-7-alias-of-computed.md](./rejected-idea-7-alias-of-computed.md) and [rejected-idea-8-constructor-ref-conversion.md](./rejected-idea-8-constructor-ref-conversion.md), but we decided not to use it as our primary solution.

## The Working Approach

The solution involves a `@reactiveClass` decorator combined with extending `ReactiveClass`:

```ts
@reactiveClass
class TestReactiveClass extends ReactiveClass {
  foo = 3;
  bar = 5;

  // Test computed properties
  doubleFoo = aliasOfComputed(() => this.foo * 2);
  sumFooBar = aliasOfComputed(() => this.foo + this.bar);

  // Getter/setter that works correctly
  get doubleFooAsString() {
    return this.doubleFoo.toPrecision(4);
  }

  set doubleFooAsString(value: string) {
    this.foo = Number(value) / 2;
  }
}
```

This approach works by:

1. Using the decorator to extend the base class correctly
2. Using `toRaw()` to avoid double-wrapping issues
3. Converting refs to getter/setters at the right timing (after class field initialization)

## Why We're Not Using This

While this solution works perfectly and all tests pass (see [`tests/experimental/alternate-reactive-class-decorator_test.ts`](../tests/experimental/alternate-reactive-class-decorator_test.ts)), we decided against it because:

1. **Complexity** - Requires understanding decorators and their interaction with class inheritance
2. **Syntax overhead** - Requires both `@reactiveClass` decorator AND `extends ReactiveClass`
3. **TypeScript configuration** - Decorators may require additional TypeScript setup

## Our Chosen Solution

Instead, we're using a simpler approach that requires no decorators:

```ts
export class ReactiveClass {
  constructor() {
    return reactive(this);
  }
}

export const computedAsAFunction = (fn) => {
  const computedRef = computed(fn);
  return () => computedRef.value;
};

class Foo extends ReactiveClass {
  foo = 4;
  _getTripleFoo = computedAsAFunction(() => this.foo * 3);

  get tripleFoo() {
    return this._getTripleFoo();
  }

  set tripleFoo(value) {
    this.foo = value / 3;
  }
}
```

This approach is:

- Simpler to understand
- Requires no decorators
- Has clearer separation between the computed function and the getter/setter
- Works reliably without timing issues
