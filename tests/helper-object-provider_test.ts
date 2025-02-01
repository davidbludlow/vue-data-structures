import { assertEquals } from 'https://deno.land/std@0.106.0/testing/asserts.ts';
import { computed, type Reactive, ref, watchEffect } from 'vue';
import { createHelperObjectProvider } from '../src/helper-object-provider.ts';

type Foo = { a: number };

const fooHelperObjectProvider = createHelperObjectProvider(
  (model: Reactive<Foo>) => {
    const nonReactive = {
      c: 1000,
    };

    const b = ref(100);

    const sum = computed(() => {
      return model.a + b.value + nonReactive.c;
    });

    function incrementB() {
      b.value++;
    }

    function logState() {
      return `a: ${model.a}, b: ${b.value}, c: ${nonReactive.c}, sum: ${sum.value}`;
    }

    return {
      get nonReactive() {
        return nonReactive;
      },
      model,
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

Deno.test('helper-object-provider test', async () => {
  const foo = { a: 10 };
  const fooHelperObject = fooHelperObjectProvider(foo);

  let watchEffectCount = 0;
  watchEffect(() => {
    watchEffectCount++;
    fooHelperObject.logState();
  });
  await wait();
  assertEquals(watchEffectCount, 1);

  fooHelperObject.incrementB();
  await wait();
  assertEquals(fooHelperObject.b, 101);
  assertEquals(fooHelperObject.sum, 1111);
  assertEquals(watchEffectCount, 2);

  fooHelperObject.nonReactive.c++;
  await wait();
  assertEquals(fooHelperObject.nonReactive.c, 1001);
  assertEquals(fooHelperObject.sum, 1111); // sum should not change
  assertEquals(watchEffectCount, 2);

  fooHelperObject.model.a++;
  await wait();
  assertEquals(fooHelperObject.model.a, 11);
  assertEquals(fooHelperObject.sum, 1113);
  assertEquals(watchEffectCount, 3);
});
