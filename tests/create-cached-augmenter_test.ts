import { assertEquals } from 'https://deno.land/std/testing/asserts.ts';
import { computed, type Reactive, reactive, ref, watchEffect } from 'vue';
import { createCachedAugmenter } from '../src/create-cached-augmenter.ts';

type Foo = { a: number };

function wait() {
  return new Promise((resolve) => setTimeout(resolve));
}

Deno.test('createCachedAugmenter should create augmented object with composition style', async () => {
  const getAugmentedFoo = createCachedAugmenter((model: Reactive<Foo>) => {
    const b = ref(100);
    const sum = computed(() => model.a + b.value);
    function incrementB() {
      b.value++;
    }
    function logState() {
      return `a: ${model.a}, b: ${b.value}, sum: ${sum.value}`;
    }
    return { b, sum, incrementB, logState };
  });

  const exampleFoo = { a: 10 };
  const fooAugmented = getAugmentedFoo(exampleFoo);

  let log = '';
  watchEffect(() => {
    log = fooAugmented.logState();
  });

  await wait();
  assertEquals(log, 'a: 10, b: 100, sum: 110');

  fooAugmented.a++;
  await wait();
  assertEquals(log, 'a: 11, b: 100, sum: 111');

  fooAugmented.b--;
  await wait();
  assertEquals(log, 'a: 11, b: 99, sum: 110');

  fooAugmented.incrementB();
  await wait();
  assertEquals(log, 'a: 11, b: 100, sum: 111');
});

Deno.test('createCachedAugmenter should create augmented object using class style', async () => {
  const getAugmentedFoo = createCachedAugmenter((model: Reactive<Foo>) => {
    return new FooAugments(model);
  });

  class FooAugments {
    b = 100;
    readonly sum: number;

    constructor(private model: Reactive<Foo>) {
      const reactiveThis = reactive(this);
      // COMPUTED NOT RECOMMENDED IN CLASS STYLE because this is too awkward.
      this.sum = computed(() => {
        // model will already be reactive, but `this` will not be, when the
        // constructor is running.
        return model.a + reactiveThis.b;
      }) as unknown as number;
    }

    incrementB() {
      this.b++;
    }

    logState() {
      return `a: ${this.model.a}, b: ${this.b}, sum: ${this.sum}`;
    }
  }

  const exampleFoo = { a: 10 };
  const fooAugmented = getAugmentedFoo(exampleFoo);

  let log = '';
  watchEffect(() => {
    log = fooAugmented.logState();
  });

  await wait();
  assertEquals(log, 'a: 10, b: 100, sum: 110');

  fooAugmented.a++;
  await wait();
  assertEquals(log, 'a: 11, b: 100, sum: 111');

  fooAugmented.b--;
  await wait();
  assertEquals(log, 'a: 11, b: 99, sum: 110');

  fooAugmented.incrementB();
  await wait();
  assertEquals(log, 'a: 11, b: 100, sum: 111');
});

Deno.test('createCachedAugmenter should handle additionalParams', async () => {
  const getAugmentedFoo = createCachedAugmenter(
    (model: Reactive<Foo>, additionalAddend: number) => {
      const b = ref(10);
      const sum = computed(() => model.a + b.value + additionalAddend);
      return { b, sum };
    },
  );

  const exampleFoo = { a: 1 };
  const fooAugmented = getAugmentedFoo(exampleFoo, 100);

  assertEquals(fooAugmented.sum, 111);
  fooAugmented.a++;
  assertEquals(fooAugmented.sum, 112);
  fooAugmented.b--;
  assertEquals(fooAugmented.sum, 111);
});

Deno.test('createCachedAugmenter should support iteration and JSON serialization', async () => {
  const getAugmentedFoo = createCachedAugmenter((model: Reactive<Foo>) => {
    const b = ref(100);
    const sum = computed(() => model.a + b.value);
    function incrementB() {
      b.value++;
    }
    function logState() {
      return `a: ${model.a}, b: ${b.value}, sum: ${sum.value}`;
    }
    return { b, sum, incrementB, logState };
  });

  const exampleFoo = { a: 10 };
  const fooAugmented = getAugmentedFoo(exampleFoo);

  // Test iterator
  const properties: string[] = [];
  for (const key in fooAugmented) {
    properties.push(key);
  }
  assertEquals(properties, ['a']);

  // Test JSON serialization
  const jsonString = JSON.stringify(fooAugmented);
  const parsedObject = JSON.parse(jsonString);
  assertEquals(parsedObject, { a: 10 });
});
