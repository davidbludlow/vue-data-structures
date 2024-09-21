// This file was copied from
// https://github.com/davidbludlow/vue-data-structures/blob/main/helper-object-provider.ts
// which had an MIT license, when it was copied.

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
  factory: (model: TModel) => THelper,
): (model: TModel) => THelper {
  const cache = new WeakMap<TModel, THelper>();
  return (model: TModel): THelper => {
    const cached = cache.get(model);
    if (cached) return cached;
    const helper = factory(model);
    cache.set(model, helper);
    return helper;
  };
}

// ideas:

// if I do the composition api, then how do I deal with overriding just one property that is used as a helper for other things ?

//   I maybe make that property pass-in-able in the the composition function. That way behavior can be overridden.
