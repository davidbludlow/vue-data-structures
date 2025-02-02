# vue-data-structures

Tools for conveniently/efficiently handling data in Vue.

## Installation

Currently, this project is not packaged. You can copy the desired files into your project.

## Usage

### useCachedAugmentingWrappers()

This function creates a factory + cache function for data wrappers. It allows you to wrap an object with a Vue-reactive proxy that provides additional properties and methods.

#### Example

```typescript
import { computed, ref } from 'vue';
import { useCachedAugmentingWrappers } from './src/use-cached-augmenting-wrappers.ts';

type Foo = { a: number };

const getFooWrapper = useCachedAugmentingWrappers((foo: Foo) => {
  // code like a Vue composable

  const b = ref(100);
  const sum = computed(() => foo.a + b.value);

  return {
    b,
    sum,
    incrementB() {
      b.value++;
    },
    logState() {
      return `a: ${foo.a}, b: ${b.value}, sum: ${sum.value}`;
    },
  };
});

const foo = { a: 10 };
const fooWrapper = getFooWrapper(foo);

// As you can see below, `fooWrapper` has the properties of `foo` and the
// additional properties and methods defined in the factory function. `fooWrapper` is proxy wrapper
// for `foo`.

fooWrapper.a = 20; // same as `foo.a = 20` but reactive
fooWrapper.b--; // b = 99, no need to type `.value`
fooWrapper.incrementB(); // b = 100
fooWrapper.logState(); // "a: 20, b: 100, sum: 120"
fooWrapper.sum; // 120, no need to type `.value`
```

### useCachedWrappers()

This function creates a data wrapper provider that returns a data wrapper for a given data. If a data wrapper has already been created for that data, it returns the cached data wrapper.

#### Example

```typescript
import { computed, ref } from 'vue';
import { useCachedWrappers } from './src/use-cached-wrappers.ts';

type Foo = { a: number };

const getFooWrapper = useCachedWrappers((foo: Foo) => {
  // code like a Vue composable

  const b = ref(100);
  const sum = computed(() => foo.a + b.value);

  return {
    foo,
    b,
    sum,
    incrementB() {
      b.value++;
    },
    logState() {
      return `a: ${foo.a}, b: ${b.value}, sum: ${sum.value}`;
    },
  };
});

const foo = { a: 10 };
const fooWrapper = getFooWrapper(foo);

// if you don't want to type `.foo`, use `useCachedAugmentingWrappers()` instead of `useCachedWrappers()`
fooWrapper.foo.a = 20; // same as `foo.a = 20` but reactive
fooWrapper.b--; // b = 99, no need to type `.value`
fooWrapper.incrementB(); // b = 100
fooWrapper.logState(); // "a: 20, b: 100, sum: 120"
fooWrapper.sum; // 120, no need to type `.value`
```

## Examples

You can find more examples in the `examples` directory.

## Tips

- If you are doing `useCachedAugmentingWrappers(wrapperDefinition)` and `wrapperDefinition` has more than one parameter, then you must read the last paragraph of the documentation for `useCachedAugmentingWrappers()` in the source code.

## TypeScript Trouble Shooting

- If you are using Vue 2 you will need to rename `Reactive` to `UnwrapNestedRefs`.
- If you run into problems, this was tested with TypeScript 5.7.3, so try to use at least that version.
- TypeScript (TS) doesn't like infinitely recursive types being passed into Vue's `reactive()`. For example, if you have the type
  ```typescript
  type ParsedJson =
    | { [key: string]: ParsedJson }
    | ParsedJson[]
    | string
    | number
    | boolean
    | null;
  ```
  Then declaring a type like `type D = Reactive<ParsedJson>;` will make TS output an error that says, `Type instantiation is excessively deep and possibly infinite.` That is a problem because we use `reactive()` (which uses `Reactive`) a lot. If you find a better solution please make a pull request, but the best I have thought of is to do `type ParsedJson = any`. After all, `JSON.parse()` returns `any` anyway, so Microsoft probably came to the same conclusion.
- Using classes (harder way)
  - Using classes with these tools has some nasty gotchas. See the notes in Example 2 in [examples/use-cached-augmenting-wrappers-examples.ts]. It may be better to use the composable approach instead of the class approach, but it is still possible either way.
  - TS may complain if you have `private` properties in your class.

## Less Important Tips

- When writing a composable, if you use the `this` keyword, you are probably making a mistake. Using lambda functions can make TS remind you to not use `this`. Classes are different.
