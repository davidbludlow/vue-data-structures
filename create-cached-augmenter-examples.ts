import { computed, reactive, ref, watchEffect } from 'vue';
import { createCachedAugmenter } from './create-cached-augmenter';

type Foo = { a: number };

const getAugmentedFoo = createCachedAugmenter((model: Foo) => {
  const nonReactive = {
    // This is a non-reactive property. But it is still be publicly accessible.
    c: 1000,
  };

  // code very similar to the code for a vue composable (sometimes called a
  // mixin). (See https://vuejs.org/guide/reusability/composables.html , though
  // it isn't exactly like that and it fills a different purpose than that.)

  const b = ref(100);

  const sum = computed(() => {
    console.log('`sum` computed was triggered');
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

console.log('incrementing b');
fooAugmented.incrementB();
await wait(); // watchEffect fires

console.log('incrementing c (non-reactive)');
fooAugmented.nonReactive.c++;
await wait(); // nothing happens

console.log('b is', fooAugmented.b);
console.log('decrementing b');
fooAugmented.b--;
await wait(); // watchEffect fires

async function wait() {
  await new Promise((resolve) => setTimeout(resolve));
  console.log('');
}
