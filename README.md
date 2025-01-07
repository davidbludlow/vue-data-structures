# vue-data-structures

Tools for conveniently/efficiently handling data in Vue.

## Installation

Currently, this project is not packaged. You can copy the desired files into your project.

## Usage

### create-cached-augmenter

This function creates a factory + cache function for augmented objects. It allows you to wrap an object with a Vue-reactive proxy that provides additional properties and methods. Those additional properties and helper methods are the "augments".

#### Example

```typescript
import { createCachedAugmenter } from './src/create-cached-augmenter.ts';
import { computed, ref } from 'vue';

type Foo = { a: number };

const getAugmentedFoo = createCachedAugmenter((model: Foo) => {
  // code like a vue composable

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

### helper-object-provider

This function creates a helper object provider that returns a helper object for a given model. If a helper object has already been created for that model, it returns the cached helper object.

#### Example

```typescript
import { createHelperObjectProvider } from './src/helper-object-provider.ts';
import { computed, ref } from 'vue';

type Foo = { a: number };

const fooHelperObjectProvider = createHelperObjectProvider((model: Foo) => {
  // code like a vue composable

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
