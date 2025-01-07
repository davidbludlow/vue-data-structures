# vue-data-structures

Tools for conveniently/efficiently handling data in Vue.

## Installation

Currently, this project is not packaged. You can copy the desired files into your project.

## Usage

### create-cached-augmenter

This function creates a factory + cache function for augmented objects. It allows you to wrap an object with a Vue-reactive proxy that provides additional properties and methods.

#### Example

```typescript
import { createCachedAugmenter } from './src/create-cached-augmenter';

type Foo = { a: number };

const getAugmentedFoo = createCachedAugmenter((model: Foo) => {
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

const exampleFoo = reactive<Foo>({ a: 10 });
const fooAugmented = getAugmentedFoo(exampleFoo);
```

### helper-object-provider

This function creates a helper object provider that returns a helper object for a given model. If a helper object has already been created for that model, it returns the cached helper object.

#### Example

```typescript
import { createHelperObjectProvider } from './src/helper-object-provider';

type Foo = { a: number };

const fooHelperObjectProvider = createHelperObjectProvider((model: Foo) => {
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
const fooHelperObject = fooHelperObjectProvider(foo);
```

## Examples

You can find more examples in the `examples` directory.
