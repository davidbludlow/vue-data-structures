// This file was copied from
// https://github.com/davidbludlow/vue-data-structures/blob/main/src/use-cached-augmenting-wrappers.ts
// which had an MIT license, when it was copied.

import { type Reactive, reactive, type UnwrapNestedRefs } from 'vue';
import { useCachedWrappers } from './use-cached-wrappers.ts';

/** See
 * https://github.com/davidbludlow/vue-data-structures/#useCachedAugmentingWrappers
 * for an example. This function creates a cache-backed factory function for
 * data wrappers. This lets you wrap your `data` object with a vue-reactive
 * proxy that gives it superpowers such as computed values, methods, and other
 * additional properties you specify.
 *
 * Imagine `data` is some deserialized object. You will want to serialize it
 * again later, but you don't want to have to write a serialization function
 * beyond `JSON.serialize(data)`, so just keep `data` intact for serialization
 * later and wrap it with additional properties to help you use it conveniently.
 *
 * Name the returned value from this function something like `getFooWrapper`
 * (obviously replacing "Foo" with something else). `getFooWrapper` will return
 * the same data wrapper every time it is called with the same input `data`
 * object.
 *
 * I recommend calling the reactive proxy objects returned by `getFooWrapper`
 * something like `fooWrapper` (obviously replacing "foo"). `fooWrapper` will
 * have all the properties of `data` and all the properties of the object
 * returned from `wrapperDefinition`. `fooWrapper` will be reactive, so you can
 * use it in Vue's reactivity system.
 *
 * `wrapperDefinition` is a function for defining additional properties such as
 * computed properties, getters, setters, methods, and refs containing extra
 * state that you don't want serialized. `wrapperDefinition` can contain code
 * that looks just like the code for a Vue composable
 * (https://vuejs.org/guide/reusability/composables.html). Every property on the
 * object returned from `wrapperDefinition` will be available on the data
 * wrapper. If the object returned from `wrapperDefinition` has a property that
 * is the same as a property on `data`, then the property on the object returned
 * from `wrapperDefinition` will take precedence over `data`'s property. This
 * will let you essentially override properties on `data` with custom getters
 * and setters or read/writable computed properties.
 *
 * `data` may or may not have had vue's `reactive()` called on it. It doesn't
 * matter. `useCachedAugmentingWrappers` will make sure a reactive version of
 * `data` is passed to `wrapperDefinition`, so that `wrapperDefinition` can
 * create the additional properties. Then `useCachedAugmentingWrappers` will
 * call vue's `reactive()`, on the additional properties. That means that you
 * will not have to type `.value` on any of the properties on `fooWrapper`. (See
 * https://vuejs.org/api/reactivity-core.html#reactive for why that is.)
 *
 * This paragraph is only relevant if you have an `wrapperDefinition` with more
 * than one parameter: If `wrapperDefinition` has more than one parameter,
 * ensure you always call the function with the same `additionalParams` for a
 * given `data` object. Calling it with different `additionalParams` for the
 * same `data` will result in using the previously cached result, which can lead
 * to hard-to-debug issues. However, you may use the same `additionalParams` for
 * different `data` objects.
 */
export function useCachedAugmentingWrappers<
  TData extends UnwrapNestedRefs<object>,
  TAugmentedProperties extends object,
  TAdditionalParams extends any[],
>(
  wrapperDefinition: (
    data: TData,
    ...additionalParams: TAdditionalParams
  ) => TAugmentedProperties,
) {
  return useCachedWrappers(
    useAugmentingWrapperFactory<TData, TAugmentedProperties, TAdditionalParams>(
      wrapperDefinition,
    ),
  ) as (
    data: TData,
    ...additionalParams: TAdditionalParams
  ) => Reactive<TAugmentedProperties> & Omit<TData, keyof TAugmentedProperties>;
}

export function useAugmentingWrapperFactory<
  TData extends UnwrapNestedRefs<object>,
  TAugmentedProperties extends object,
  TAdditionalParams extends any[],
>(
  wrapperComposable: (
    data: TData,
    ...additionalParams: TAdditionalParams
  ) => TAugmentedProperties,
): (
  data: TData,
  ...additionalParams: TAdditionalParams
) => Reactive<TAugmentedProperties> & Omit<TData, keyof TAugmentedProperties> {
  return (data, ...additionalParams) => {
    /** `reactiveData === data` will be true if `data` was already reactive.
     * (Vue 3 internally uses `WeakMap` to cache reactive `Proxy`s to make that
     * possible.) */
    const reactiveData = reactive(data) as Reactive<TData>;
    const extensions = wrapperComposable(
      reactiveData as TData,
      ...additionalParams,
    ) as TAugmentedProperties;
    // The `reactive()` is to unwrap any vue `Ref`s, so that `.value` is not
    // needed.
    const reactiveExtensions = reactive(extensions);
    const proxy = new Proxy(reactiveData, {
      get(target, property) {
        if (property in extensions) {
          return reactiveExtensions[property];
        }
        return reactiveData[property];
      },
      set(target, property, value) {
        if (property in extensions) {
          return Reflect.set(
            reactiveExtensions,
            property,
            value,
            reactiveExtensions,
          );
        }
        return Reflect.set(reactiveData, property, value, reactiveData);
      },
      has(target, property) {
        return property in extensions || Reflect.has(target, property);
      },
    }) as unknown as
      & Reactive<TAugmentedProperties>
      & Omit<TData, keyof TAugmentedProperties>;
    return proxy;
  };
}
