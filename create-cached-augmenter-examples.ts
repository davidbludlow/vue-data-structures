import { computed, reactive, ref, watch, watchEffect } from 'vue';
import { createCachedAugmenter } from './create-cached-augmenter.ts';

// This file shows examples of how to use `createCachedAugmenter()`. The easiest
// way to run this file is by running `npm i` then running
//
// `deno --watch --allow-env=NODE_ENV create-cached-augmenter-examples.ts`

// -------------------------------- Example 1 --------------------------------
type Foo = { a: number };
{
  console.log('Example 1');
  const getAugmentedFoo = createCachedAugmenter((model: Foo) => {
    // Insert here code very similar to the code for a vue composable.
    //
    // (To see what a composable is, see
    // https://vuejs.org/guide/reusability/composables.html , though it isn't
    // exactly like that documentation and it fills a different purpose than the
    // composables in that documentation.)

    const b = ref(100);

    const sum = computed(() => {
      console.log('`sum` computed was triggered');
      return model.a + b.value;
    });

    function incrementB() {
      b.value++;
    }

    function logState() {
      return `a: ${model.a}, b: ${b.value}, sum: ${sum.value}`;
    }

    return {
      b,
      sum,
      incrementB,
      logState,
    };
  });

  const exampleFoo = reactive<Foo>({ a: 10 });
  const fooAugmented = getAugmentedFoo(exampleFoo);
  console.log('initialize watchEffect');
  watchEffect(() => {
    console.log('watchEffect was triggered:', fooAugmented.logState());
  });
  await wait();

  console.log('incrementing a');
  fooAugmented.a++;
  await wait(); // watchEffect fires

  console.log('decrementing b');
  fooAugmented.b--;
  await wait(); // watchEffect fires

  console.log('incrementing b');
  fooAugmented.incrementB();
  await wait(); // watchEffect fires
}

async function wait() {
  await new Promise((resolve) => setTimeout(resolve));
  console.log('');
}
