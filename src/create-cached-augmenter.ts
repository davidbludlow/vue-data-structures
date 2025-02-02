// This file was copied from
// https://github.com/davidbludlow/vue-data-structures/blob/main/src/create-cached-augmenter.ts
// which had an MIT license, when it was copied.

import { type Reactive, reactive } from 'vue';

/** See
 * https://github.com/davidbludlow/vue-data-structures/#createCachedAugmenter
 * for an example. This function creates a cache-backed factory function for
 * augmented objects. This lets you wrap your `model` object with a vue-reactive
 * proxy that gives it superpowers such as computed values, methods, and other
 * additional properties you specify as augments.
 *
 * Imagine `model` is some deserialized object. You will want to serialize it
 * again later, but you don't want to have to write a serialization function
 * beyond `JSON.serialize(model)`, so just keep `model` intact for serialization
 * later and wrap it with augments to help you use it conveniently.
 *
 * Name the returned value from this function something like `getAugmentedFoo`
 * (obviously replacing "Foo" with something else). `getAugmentedFoo` will
 * return the same augmented reactive proxy every time it is called with the
 * same input `model` object.
 *
 * I recommend calling the reactive proxy objects returned by `getAugmentedFoo`
 * something like `fooAugmented` (obviously replacing "foo"). `fooAugmented`
 * will have all the properties of `model` and all the properties of the of the
 * object returned from `augmentFactory`. `fooAugmented` will be reactive, so
 * you can use it in Vue's reactivity system.
 *
 * `augmentFactory` is a factory function for creating augments such as computed
 * properties, getters, setters, methods, and refs containing extra state that
 * you don't want serialized. `augmentFactory` can instantiate a custom class
 * you make or, more likely, contain code that looks just like the code for a
 * vue composable (https://vuejs.org/guide/reusability/composables.html). Every
 * property on the object returned from `augmentFactory` will be available on
 * the augmented reactive proxy. If the object returned from `augmentFactory`
 * (the "augments object") has a property that is the same as a property on
 * `model`, then the property on the augments object will take precedence over
 * the `model`'s property. This will let you essentially override properties on
 * `model` with custom getters and setters or read/writable computed properties.
 *
 * `model` may or may not have had vue's `reactive()` called on it. It doesn't
 * matter. `createCachedAugmenter` will make sure a reactive version of `model`
 * is passed to `augmentFactory`, so that `augmentFactory` can create the
 * augments object. Then `createCachedAugmenter` will call vue's `reactive()`,
 * on the augments object. That means that you will not have to type `.value` on
 * any of the properties on `fooAugmented`. (See
 * https://vuejs.org/api/reactivity-core.html#reactive for why that is.)
 *
 * This paragraph is only relevant if you have an `augmentFactory` with more
 * than one parameter: If you make an `augmentFactory` that has an
 * `additionalParams` then you must take care that you never call the function
 * with a different `additionalParams` for a given `model` or you will suffer
 * the wrath of many hours of hard debugging. I repeat, if you called the
 * function with `exampleModel` and `exampleAdditionalParams` then you must
 * never call it again with `exampleModel` and `example2additionalParams2`, or
 * else you will just get the previously cached result that doesn't use
 * `example2additionalParams2` at all. But you may use the same
 * `additionalParams` for different `model`s. */
export function createCachedAugmenter<
  ModelType extends object,
  AugmentsType extends object,
  AdditionalParamsType extends any[],
>(
  augmentFactory: (
    model: Reactive<ModelType>,
    ...additionalParams: AdditionalParamsType
  ) => AugmentsType,
): (
  model: ModelType | Reactive<ModelType>,
  ...additionalParams: AdditionalParamsType
) => Reactive<AugmentsType & Omit<ModelType, keyof AugmentsType>> {
  type AugmentedModelType = Reactive<
    AugmentsType & Omit<ModelType, keyof AugmentsType>
  >;
  // Do not worry about the performance of `WeakMap`. Vue already uses `WeakMap`
  // extremely frequently (like every time you use a reactive object).
  const cache = new WeakMap<Reactive<ModelType>, AugmentedModelType>();
  return (model, ...additionalParams) => {
    /** `reactiveModel === model` will be true if `model` was already reactive.
     * (Vue 3 internally uses `WeakMap` to cache reactive `Proxy`s to make that
     * possible.) */
    const reactiveModel = reactive(model) as Reactive<ModelType>;
    const cached = cache.get(reactiveModel);
    if (cached) return cached;
    const augments = augmentFactory(
      reactiveModel,
      ...additionalParams,
    ) as AugmentsType;
    // The `reactive()` is to unwrap any vue `Ref`s, so that `.value` is not
    // needed.
    const reactiveAugments = reactive(augments);
    const proxy = new Proxy(reactiveModel, {
      get(target, property) {
        if (property in augments) {
          return reactiveAugments[property];
        }
        return reactiveModel[property];
      },
      set(target, property, value) {
        if (property in augments) {
          return Reflect.set(
            reactiveAugments,
            property,
            value,
            reactiveAugments,
          );
        }
        return Reflect.set(reactiveModel, property, value, reactiveModel);
      },
      has(target, property) {
        return property in augments || Reflect.has(target, property);
      },
    }) as unknown as AugmentedModelType;
    cache.set(reactiveModel, proxy);
    return proxy;
  };
}
