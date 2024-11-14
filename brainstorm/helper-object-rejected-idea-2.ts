import { computed, reactive, ref, toRefs, watchEffect } from 'npm:vue';
import type { Reactive, ToRefs } from 'npm:vue';

// **** This idea was rejected because: ****
// - lets say your `foo` model type has a property `foo.bar` that is only
//   sometimes set. Let's say it is a flag. If you want to set
//   `fooHelperObject.bar = true` then it may or may not `foo.bar` to `true`
//   depending on if `foo` happened to have it already set when the
//   `fooHelperObject` was created. That is unacceptably inconsistent.

export function createHelperObjectProvider<
  TModel extends object,
  THelper extends object,
>(
  factory: (model: Reactive<TModel>) => THelper,
  // an alternative return type idea:
  // (model: TModel) =>
  //   & { readonly model: Reactive<TModel> }
  //   & Reactive<ToRefs<Reactive<TModel>> & THelper>
): (model: TModel) => Reactive<
  & { readonly model: Reactive<TModel> }
  & ToRefs<Reactive<TModel>>
  & THelper
> {
  // Do not worry about the performance of `WeakMap`. Vue already uses `WeakMap`
  // extremely frequently (like every time you use a reactive object).
  const cache = new WeakMap<Reactive<TModel>, Reactive<THelper>>();
  const ret = (model: TModel) => {
    /** `reactiveModel === model` will be true if `model` was already reactive.
     * (Vue 3 internally uses `WeakMap` to cache reactive `Proxy`s to make that
     * possible.) */
    const reactiveModel = reactive(model);
    // const cached = cache.get(reactiveModel);
    // if (cached) return cached;
    const skeletonOfHelper = factory(reactiveModel);
    // Calling `reactive()` on it will make it so you do not need to call
    // `.value` on the refs and computed. (See
    // https://vuejs.org/api/reactivity-core.html#reactive for proof of that.)
    const helper = reactive({
      get model() {
        return reactiveModel;
      },
      // put all of `model`'s properties into `helper`, for convenience.
      ...toRefs(reactiveModel),
      ...skeletonOfHelper,
    });
    cache.set(reactiveModel, helper);
    return helper;
  };
  return ret;
}

type Foo = {
  a: number;
};

const fooHelperObjectProvider = createHelperObjectProvider(
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

console.log('incrementing a');
fooHelperObject.a++;
await wait(); // watchEffect fires

console.log('incrementing b');
fooHelperObject.incrementB();
await wait(); // watchEffect fires

console.log('incrementing c (non-reactive)');
fooHelperObject.nonReactive.c++;
await wait(); // nothing happens
