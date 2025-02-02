import { computed, type Reactive, ref, watchEffect } from 'vue';
import { useCachedWrappers } from '../src/use-cached-wrappers.ts';

// This file shows examples of how to use `useCachedWrappers()`. The
// easiest way to run this file is by running `npm i` then running
//
// `deno --watch --allow-env=NODE_ENV examples/use-cached-wrappers-examples.ts`

type Foo = { a: number };

const getFooWrapper = useCachedWrappers(
  (foo: Foo) => {
    const nonReactive = {
      // This is a non-reactive property, but it is still publicly accessible.
      c: 1000,
    };

    // code very similar to the code for a vue composable (sometimes called a
    // mixin). (See https://vuejs.org/guide/reusability/composables.html ,
    // though it isn't exactly like that and if fills a different purpose than
    // that.)

    const b = ref(100);

    const sum = computed(() => {
      console.log('`sum` computed was triggered');
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
  console.log('');
}

const foo: Foo = { a: 10 };
const fooWrapper = getFooWrapper(foo);

console.log('initialize watchEffect');
watchEffect(() => {
  console.log('watchEffect was triggered:', fooWrapper.logState());
});
await wait();

console.log('incrementing b');
fooWrapper.incrementB();
await wait(); // watchEffect fires

console.log('incrementing c (non-reactive)');
fooWrapper.nonReactive.c++;
await wait(); // nothing happens

console.log('incrementing a');
fooWrapper.foo.a++;
await wait(); // watchEffect fires
