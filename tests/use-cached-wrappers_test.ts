import { assertEquals } from 'https://deno.land/std@0.106.0/testing/asserts.ts';
import { computed, ref, watchEffect } from 'vue';
import { useCachedWrappers } from '../src/use-cached-wrappers.ts';

type Foo = { a: number };

const getFooWrapper = useCachedWrappers(
  (foo: Foo) => {
    const nonReactive = {
      c: 1000,
    };

    const b = ref(100);

    const sum = computed(() => {
      return foo.a + b.value + nonReactive.c;
    });

    function incrementB() {
      b.value++;
    }

    function logState() {
      return `a: ${foo.a}, b: ${b.value}, c: ${nonReactive.c}, sum: ${sum.value}`;
    }

    return {
      get nonReactive() {
        return nonReactive;
      },
      foo,
      b,
      sum,
      incrementB,
      logState,
    };
  },
);

async function wait() {
  await new Promise((resolve) => setTimeout(resolve));
}

Deno.test('useCachedWrappers test', async () => {
  const foo = { a: 10 };
  const fooWrapper = getFooWrapper(foo);

  let watchEffectCount = 0;
  watchEffect(() => {
    watchEffectCount++;
    fooWrapper.logState();
  });
  await wait();
  assertEquals(watchEffectCount, 1);

  fooWrapper.incrementB();
  await wait();
  assertEquals(fooWrapper.b, 101);
  assertEquals(fooWrapper.sum, 1111);
  assertEquals(watchEffectCount, 2);

  fooWrapper.nonReactive.c++;
  await wait();
  assertEquals(fooWrapper.nonReactive.c, 1001);
  assertEquals(fooWrapper.sum, 1111); // sum should not change
  assertEquals(watchEffectCount, 2);

  fooWrapper.foo.a++;
  await wait();
  assertEquals(fooWrapper.foo.a, 11);
  assertEquals(fooWrapper.sum, 1113);
  assertEquals(watchEffectCount, 3);
});
