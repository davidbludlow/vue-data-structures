import { computed, type Reactive, reactive, ref, watchEffect } from 'vue';
import { useCachedAugmentingWrappers } from '../src/use-cached-augmenting-wrappers.ts';

// This file shows examples of how to use `useCachedAugmentingWrappers()`. The
// easiest way to run this file is by running `npm i` then running
//
// `deno --watch --allow-env=NODE_ENV examples/use-cached-augmenting-wrappers-examples.ts`

type Foo = { a: number };
// -------------------------------- Example 1 --------------------------------
// using a style similar to a vue composable for the data wrappers
{
  console.log('Example 1');
  const getFooWrapper = useCachedAugmentingWrappers((foo: Foo) => {
    // Insert here code very similar to the code for a vue composable.
    //
    // (To see what a composable is, see
    // https://vuejs.org/guide/reusability/composables.html , though it isn't
    // exactly like that documentation and it fills a different purpose than the
    // composables in that documentation.)

    const b = ref(100);

    const sum = computed(() => {
      console.log('`sum` computed was triggered');
      return foo.a + b.value;
    });

    function incrementB() {
      b.value++;
    }

    function logState() {
      return `a: ${foo.a}, b: ${b.value}, sum: ${sum.value}`;
    }

    return {
      b,
      sum,
      incrementB,
      logState,
    };
  });

  const exampleFoo: Foo = { a: 10 };
  const fooWrapper = getFooWrapper(exampleFoo);
  console.log('initialize watchEffect');
  watchEffect(() => {
    console.log('watchEffect was triggered:', fooWrapper.logState());
  });
  await wait();

  console.log('incrementing a');
  fooWrapper.a++;
  await wait(); // watchEffect fires

  console.log('decrementing b');
  fooWrapper.b--;
  await wait(); // watchEffect fires

  console.log('incrementing b');
  fooWrapper.incrementB();
  await wait(); // watchEffect fires
}

// -------------------------------- Example 2 (harder way) --------------------------------
// Using a class style for the data wrappers. This is the harder way because of some gotchas.
{
  console.log('Example 2');
  const getFooWrapper = useCachedAugmentingWrappers((foo: Foo) => {
    return new FooAugments(foo);
  });

  class FooAugments {
    // `b` will be reactive because every instantiation of `FooAugments` will be
    // wrapped in a `reactive()` proxy by `useCachedAugmentingWrappers`.
    b = 100;
    readonly sum: number;

    constructor(private foo: Foo) {
      const reactiveThis = reactive(this);
      // COMPUTED NOT RECOMMENDED IN CLASS STYLE because this is too awkward.
      this.sum = computed(() => {
        console.log('`sum` computed was triggered');
        // `foo` will already be reactive, but `this` will not be, when the
        // constructor is running.
        return foo.a + reactiveThis.b;
        // The casting below looks like a lie, but it will be accurate in
        // practice because every instantiation of `FooAugments` will be wrapped
        // in a `reactive()` proxy, so all the `.value`s will be automatically
        // unwrapped. So we are not supposed to type `.value` on computed
        // properties.
      }) as unknown as number;
    }

    incrementB() {
      this.b++;
    }

    logState() {
      return `a: ${this.foo.a}, b: ${this.b}, sum: ${this.sum}`;
    }
  }

  // It works the same as in Example 1.

  const exampleFoo: Foo = { a: 10 };
  const fooWrapper = getFooWrapper(exampleFoo);
  console.log('initialize watchEffect');
  watchEffect(() => {
    console.log('watchEffect was triggered:', fooWrapper.logState());
  });
  await wait();

  console.log('incrementing a');
  fooWrapper.a++;
  await wait(); // watchEffect fires

  console.log('decrementing b');
  fooWrapper.b--;
  await wait(); // watchEffect fires

  console.log('incrementing b');
  fooWrapper.incrementB();
  await wait(); // watchEffect fires
}

async function wait() {
  await new Promise((resolve) => setTimeout(resolve));
  console.log('');
}
