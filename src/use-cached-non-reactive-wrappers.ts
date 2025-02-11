// This file was copied from
// https://github.com/davidbludlow/vue-data-structures/blob/main/src/use-cached-non-reactive-wrappers.ts
// which had an MIT license, when it was copied.

/** Most of the time, in a Vue program, do not use this and use
 * `useCachedWrappers` instead.
 *
 * Creates a non-reactive data wrapper provider. When run, a data wrapper
 * provider will create a data wrapper for a given `data` object, or, if a data
 * wrapper has already been created for that `data` then it will return the
 * previously created data wrapper. `data` should be the information that needs
 * serialization only. `factory` should be a function to create new data
 * wrappers.
 *
 * This is just like
 * https://github.com/davidbludlow/vue-data-structures/#useCachedWrappers except
 * that it is very slightly faster by skipping Vue reactivity. */
export function useCachedNonReactiveWrappers<
  TData extends object,
  TWrapper extends object,
  TAdditionalParams extends any[],
>(
  factory: (data: TData, ...additionalParams: TAdditionalParams) => TWrapper,
): (data: TData, ...additionalParams: TAdditionalParams) => TWrapper {
  const cache = new WeakMap<TData, TWrapper>();
  return (data: TData, ...additionalParams: TAdditionalParams): TWrapper => {
    const cached = cache.get(data);
    if (cached) return cached;
    const wrapper = factory(data, ...additionalParams);
    cache.set(data, wrapper);
    return wrapper;
  };
}
