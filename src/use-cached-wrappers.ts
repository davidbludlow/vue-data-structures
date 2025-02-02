// This file was copied from
// https://github.com/davidbludlow/vue-data-structures/blob/main/src/use-cached-wrappers.ts
// which had an MIT license, when it was copied.

import { type Reactive, reactive, type UnwrapNestedRefs } from 'vue';

/** Creates data wrapper provider. When run, a data wrapper provider will create
 * a data wrapper for a given `data` object, or, if a data wrapper has already
 * been created for that `data` then it will return the previously created data
 * wrapper. `data` should be the information that needs serialization only.
 * `factory` should be a function to create new data wrappers.
 *
 * See https://github.com/davidbludlow/vue-data-structures/#useCachedWrappers
 * for more information. */
export function useCachedWrappers<
  TData extends UnwrapNestedRefs<object>,
  TWrapper extends object,
>(
  factory: (data: TData) => TWrapper,
): (data: TData) => Reactive<TWrapper> {
  // Do not worry about the performance of `WeakMap`. Vue already uses `WeakMap`
  // extremely frequently (like every time you use a reactive object).
  const cache = new WeakMap<TData, Reactive<TWrapper>>();
  return (data: TData): Reactive<TWrapper> => {
    /** `reactiveData === data` will be true if `data` was already reactive.
     * (Vue 3 internally uses `WeakMap` to cache reactive `Proxy`s to make that
     * possible.) */
    const reactiveData = reactive(data) as TData;
    const cached = cache.get(reactiveData);
    if (cached) return cached;
    const factoryOutput = factory(reactiveData);
    // Calling `reactive()` on it will make it so you do not need to call
    // `.value` on the refs and computed. (See
    // https://vuejs.org/api/reactivity-core.html#reactive for proof of that.)
    // BTW, `wrapper === factoryOutput` will already be true if you used
    // `createAugmentingWrapperFactory()` to create `factory`.
    const wrapper = reactive(factoryOutput);
    cache.set(reactiveData, wrapper);
    return wrapper;
  };
}
