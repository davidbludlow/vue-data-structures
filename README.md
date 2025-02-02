# vue-data-structures

Tools for conveniently/efficiently handling data in Vue.

## Installation

Currently, this project is not packaged. You can copy the desired files into your project.

## Usage

### createCachedAugmenter()

This function creates a factory + cache function for augmented objects. It allows you to wrap an object with a Vue-reactive proxy that provides additional properties and methods. Those additional properties and helper methods are the "augments".

#### Example

```typescript
import { computed, ref } from 'vue';
import { createCachedAugmenter } from './src/create-cached-augmenter.ts';

type Foo = { a: number };

const getAugmentedFoo = createCachedAugmenter((model: Foo) => {
  // code like a Vue composable

  const b = ref(100);
  const sum = computed(() => model.a + b.value);

  return {
    b,
    sum,
    incrementB() {
      b.value++;
    },
    logState() {
      return `a: ${model.a}, b: ${b.value}, sum: ${sum.value}`;
    },
  };
});

const foo = { a: 10 };
const fooAugmented = getAugmentedFoo(foo);

// As you can see below, `fooAugmented` has the properties of `foo` and the
// augments defined in the factory function. `fooAugmented` is proxy wrapper
// for `foo`.

fooAugmented.a = 20; // same as `foo.a = 20` but reactive
fooAugmented.b--; // b = 99, no need to type `.value`
fooAugmented.incrementB(); // b = 100
fooAugmented.logState(); // "a: 20, b: 100, sum: 120"
fooAugmented.sum; // 120, no need to type `.value`
```

### helperObjectProvider()

This function creates a helper object provider that returns a helper object for a given model. If a helper object has already been created for that model, it returns the cached helper object.

#### Example

```typescript
import { computed, ref } from 'vue';
import { createHelperObjectProvider } from './src/helper-object-provider.ts';

type Foo = { a: number };

const fooHelperObjectProvider = createHelperObjectProvider((model: Foo) => {
  // code like a Vue composable

  const b = ref(100);
  const sum = computed(() => model.a + b.value);

  return {
    model,
    b,
    sum,
    incrementB() {
      b.value++;
    },
    logState() {
      return `a: ${model.a}, b: ${b.value}, sum: ${sum.value}`;
    },
  };
});

const foo = { a: 10 };
const fooHelperObject = fooHelperObjectProvider(foo);

// if you don't want to type `.model`, use `createCachedAugmenter()` instead of `createHelperObjectProvider()`
fooHelperObject.model.a = 20; // same as `foo.a = 20` but reactive
fooHelperObject.b--; // b = 99, no need to type `.value`
fooHelperObject.incrementB(); // b = 100
fooHelperObject.logState(); // "a: 20, b: 100, sum: 120"
fooHelperObject.sum; // 120, no need to type `.value`
```

## Examples

You can find more examples in the `examples` directory.

## Tips

- If you are doing `createCachedAugmenter(augmentFactory)` and `augmentFactory` has more than one parameter, then you must read the last paragraph of the documentation for `createCachedAugmenter()` in the source code.

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
  - Using classes with these tools has some nasty gotchas. See the notes in Example 2 in [examples/create-cached-augmenter-examples.ts]. It may be better to use the composable approach instead of the class approach, but it is still possible either way.
  - TS may complain if you have `private` properties in your class.

## Less Important Tips

- When writing a composable, if you use the `this` keyword, you are probably making a mistake. Using lambda functions can make TS remind you to not use `this`. Classes are different.
