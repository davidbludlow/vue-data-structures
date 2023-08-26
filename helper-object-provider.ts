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
