import { computed, ref, watchEffect } from 'npm:vue';
import { createReactiveHelperObjectProvider } from './helper-object-provider.ts';

type Foo = {
  a: number;
};

const fooHelperObjectProvider = createReactiveHelperObjectProvider(
  (model: Foo) => {
    const nonReactive = {
      // This is a non-reactive property. But it is still be publicly accessible.
      c: 1000,
    };

    // code very similar to the code for a vue composable (sometimes called a
    // mixin). (See https://vuejs.org/guide/reusability/composables.html , though
    // it isn't exactly like that and if fills a different purpose than that.)

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
  console.log('');
}

const foo = { a: 10 };
const fooHelperObject = fooHelperObjectProvider(foo);

console.log('initialize watchEffect');
watchEffect(() => {
  console.log('watchEffect was triggered:', fooHelperObject.logState());
});
await wait();

console.log('incrementing b');
fooHelperObject.incrementB();
await wait(); // watchEffect fires

console.log('incrementing c');
fooHelperObject.nonReactive.c++;
await wait(); // nothing

console.log('nothing happened because c is not reactive.');
console.log(
  "If we forcibly call logState(), we see the change in c, but we will not see a change in `sum`, because that is a computed property, and changing non-reactive stuff doesn't trigger recalculation.",
  fooHelperObject.logState(),
);
await wait(); // nothing

console.log('incrementing a');
fooHelperObject.model.a++;
await wait(); // watchEffect fires