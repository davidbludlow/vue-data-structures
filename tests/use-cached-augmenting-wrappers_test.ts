import { assertEquals } from 'https://deno.land/std/testing/asserts.ts';
import { computed, reactive, ref, watchEffect } from 'vue';
import {
  useAugmentingWrapperFactory,
  useCachedAugmentingWrappers,
} from '../src/use-cached-augmenting-wrappers.ts';

type Foo = { a: number };

function wait() {
  return new Promise((resolve) => setTimeout(resolve));
}

Deno.test('useCachedAugmentingWrappers should create data wrapper with composition style', async () => {
  const getFooWrapper = useCachedAugmentingWrappers((foo: Foo) => {
    const b = ref(100);
    const sum = computed(() => foo.a + b.value);
    function incrementB() {
      b.value++;
    }
    function logState() {
      return `a: ${foo.a}, b: ${b.value}, sum: ${sum.value}`;
    }
    return { b, sum, incrementB, logState };
  });

  const exampleFoo = { a: 10 };
  const fooWrapper = getFooWrapper(exampleFoo);

  let log = '';
  watchEffect(() => {
    log = fooWrapper.logState();
  });

  await wait();
  assertEquals(log, 'a: 10, b: 100, sum: 110');

  fooWrapper.a++;
  await wait();
  assertEquals(log, 'a: 11, b: 100, sum: 111');

  fooWrapper.b--;
  await wait();
  assertEquals(log, 'a: 11, b: 99, sum: 110');

  fooWrapper.incrementB();
  await wait();
  assertEquals(log, 'a: 11, b: 100, sum: 111');
});

Deno.test('useCachedAugmentingWrappers should create data wrapper using class style', async () => {
  const getFooWrapper = useCachedAugmentingWrappers((foo: Foo) => {
    return new FooAugments(foo);
  });

  class FooAugments {
    b = 100;
    readonly sum: number;

    constructor(private foo: Foo) {
      const reactiveThis = reactive(this);
      // COMPUTED NOT RECOMMENDED IN CLASS STYLE because this is too awkward.
      this.sum = computed(() => {
        // foo will already be reactive, but `this` will not be, when the
        // constructor is running.
        return foo.a + reactiveThis.b;
      }) as unknown as number;
    }

    incrementB() {
      this.b++;
    }

    logState() {
      return `a: ${this.foo.a}, b: ${this.b}, sum: ${this.sum}`;
    }
  }

  const exampleFoo = { a: 10 };
  const fooWrapper = getFooWrapper(exampleFoo);

  let log = '';
  watchEffect(() => {
    log = fooWrapper.logState();
  });

  await wait();
  assertEquals(log, 'a: 10, b: 100, sum: 110');

  fooWrapper.a++;
  await wait();
  assertEquals(log, 'a: 11, b: 100, sum: 111');

  fooWrapper.b--;
  await wait();
  assertEquals(log, 'a: 11, b: 99, sum: 110');

  fooWrapper.incrementB();
  await wait();
  assertEquals(log, 'a: 11, b: 100, sum: 111');
});

// Deno.test('useCachedAugmentingWrappers should handle additionalParams', async () => {
//   const getFooWrapper = useCachedAugmentingWrappers(
//     (foo: Foo, additionalAddend: number) => {
//       const b = ref(10);
//       const sum = computed(() => foo.a + b.value + additionalAddend);
//       return { b, sum };
//     },
//   );

//   const exampleFoo = { a: 1 };
//   const fooWrapper = getFooWrapper(exampleFoo, 100);

//   assertEquals(fooWrapper.sum, 111);
//   fooWrapper.a++;
//   assertEquals(fooWrapper.sum, 112);
//   fooWrapper.b--;
//   assertEquals(fooWrapper.sum, 111);
// });

Deno.test('useAugmentingWrapperFactory makes a factory that makes objects that `reactive()` would detect as already being reactive', async () => {
  const getFooWrapper = useAugmentingWrapperFactory(
    (foo: Foo) => {
      const b = ref(100);
      return { b };
    },
  );
  const fooWrapper = getFooWrapper({ a: 10 });
  const reactiveFooWrapper = reactive(fooWrapper);
  // Note that `reactiveFooWrapper` is not actually the type of reactive
  // `Proxy` that `reactive()` usually returns. But `reactive()` will naturally
  // be fooled into thinking it is, so `reactive()` will return the input object
  // unchanged. Don't worry. The object will still act reactively.
  assertEquals(reactiveFooWrapper, fooWrapper);
});

Deno.test('useCachedAugmentingWrappers should support iteration and JSON serialization', async () => {
  const getFooWrapper = useCachedAugmentingWrappers((foo: Foo) => {
    const b = ref(100);
    const sum = computed(() => foo.a + b.value);
    function incrementB() {
      b.value++;
    }
    function logState() {
      return `a: ${foo.a}, b: ${b.value}, sum: ${sum.value}`;
    }
    return { b, sum, incrementB, logState };
  });

  const exampleFoo = { a: 10 };
  const fooWrapper = getFooWrapper(exampleFoo);

  // Test iterator
  const properties: string[] = [];
  for (const key in fooWrapper) {
    properties.push(key);
  }
  assertEquals(properties, ['a']);

  // Test JSON serialization
  const jsonString = JSON.stringify(fooWrapper);
  const parsedObject = JSON.parse(jsonString);
  assertEquals(parsedObject, { a: 10 });
});
