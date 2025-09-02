# Constructor Ref Conversion (Failed Idea)

This was an attempt to fix the `aliasOfComputed` issue described in [rejected-idea-7-alias-of-computed.md](./rejected-idea-7-alias-of-computed.md) by converting refs to getter/setters in the `ReactiveClass` constructor.

## The Approach

The idea was to add a for loop in the `ReactiveClass` constructor that would iterate over all properties on `this`, find any refs (including those created by `aliasOfComputed`), and convert them to getter/setters that automatically unwrap the ref value:

```ts
export class ReactiveClass {
  constructor() {
    // Attempt to convert aliasOfComputed refs to getter/setters
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
}

export const aliasOfComputed = computed as <T>(fn: () => T) => T;
```

## Why It Failed

The fundamental issue is **timing**. In JavaScript classes:

1. The constructor body runs first
2. Class field initializers run after the constructor completes

Since `aliasOfComputed` properties are defined as class field initializers:

```ts
class TestReactiveClass extends ReactiveClass {
  foo = 3;
  bar = 5;

  // These run AFTER the constructor
  doubleFoo = aliasOfComputed(() => this.foo * 2);
  sumFooBar = aliasOfComputed(() => this.foo + this.bar);
}
```

The for loop in the constructor runs before these properties exist, so it finds nothing to convert.

## Test Evidence

If you were to test this approach with code like:

```ts
class TestReactiveClass extends ReactiveClass {
  foo = 3;
  doubleFoo = aliasOfComputed(() => this.foo * 2);

  get doubleFooAsString() {
    return this.doubleFoo.toPrecision(4);
  }

  set doubleFooAsString(value: string) {
    this.foo = Number(value) / 2;
  }
}

const instance = new TestReactiveClass();
instance.doubleFooAsString = '30'; // This would fail
```

You would get `TypeError: this.doubleFoo.toPrecision is not a function` because `this.doubleFoo` is still a ref object (not unwrapped to its value) when accessed in the getter during setter operations.
