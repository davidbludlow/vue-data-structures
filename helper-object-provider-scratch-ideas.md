Alternate form of the representing types (though there are even more than this):

```ts
import type { UnwrapNestedRefs } from 'npm:vue';

export function createReactiveHelperObjectProvider<
  TModel extends object,
>(
  factory: (model: TModel) => object,
): (model: TModel) => UnwrapNestedRefs<ReturnType<typeof factory>> {
  const helperObjectProvider = createHelperObjectProvider((model: TModel) =>
    factory(reactive(model))
  );
  return (model: TModel) => reactive(helperObjectProvider(model));
}
```

### Year 2023 ideas:

if I do the composition api, then how do I deal with overriding just one property that is used as a helper for other things ?

I maybe make that property pass-in-able in the the composition function. That way behavior can be overridden.
