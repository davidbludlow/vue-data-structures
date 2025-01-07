import { createCachedAugmenter } from './create-cached-augmenter.ts';
import { computed, reactive, ref, watchEffect } from 'vue';
import { assertEquals } from 'https://deno.land/std/testing/asserts.ts';

type Foo = { a: number };

function wait() {
  return new Promise((resolve) => setTimeout(resolve));
}

Deno.test('createCachedAugmenter should create augmented object with composition style', async () => {
  const getAugmentedFoo = createCachedAugmenter((model: Foo) => {
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

  const exampleFoo = reactive<Foo>({ a: 10 });
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
  const getAugmentedFoo = createCachedAugmenter((model: Foo) => {
    return new FooAugments(model);
  });

  class FooAugments {
    b = 100;
    readonly sum: number;

    constructor(private model: Foo) {
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

  const exampleFoo = reactive<Foo>({ a: 10 });
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
