// This file was copied from
// https://github.com/davidbludlow/vue-data-structures/blob/main/helper-object-provider.ts
// which had an MIT license, when it was copied.

import { type Reactive, reactive } from 'npm:vue';

/** Creates helper object provider. When run, a helper object provider will
 * create a helper object for a given `model` object, or, if a helper object has
 * already been created for that `model` then it will return the previously
 * created helper object. `model` should be the information that needs
 * serialization only. `factory` should be a function to create new helper
 * objects. */
export function createHelperObjectProvider<
  TModel extends object,
  THelper extends object,
>(
  factory: (model: Reactive<TModel>) => THelper,
): (model: TModel) => Reactive<THelper> {
  // Do not worry about the performance of `WeakMap`. Vue already uses `WeakMap`
  // extremely frequently (like every time you use a reactive object).
  const cache = new WeakMap<
    Reactive<TModel>,
    Reactive<THelper>
  >();
  return (model: TModel): Reactive<THelper> => {
    /** `reactiveModel === model` will be true if `model` was already reactive.
     * (Vue 3 internally uses `WeakMap` to cache reactive `Proxy`s to make that
     * possible.) */
    const reactiveModel = reactive(model);
    const cached = cache.get(reactiveModel);
    if (cached) return cached;
    // Calling `reactive()` on it will make it so you do not need to call
    // `.value` on the refs and computed. (See
    // https://vuejs.org/api/reactivity-core.html#reactive for proof of that.)
    const helper = reactive(factory(reactiveModel));
    cache.set(reactiveModel, helper);
    return helper;
  };
}
