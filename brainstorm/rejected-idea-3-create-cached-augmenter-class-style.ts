import { assertEquals } from 'jsr:@std/assert';
import { computed, reactive, ref, watchEffect } from 'vue';
import { type Reactive } from 'vue';

/** **** This idea was rejected because: ****
 *
 * If you run this file with
 * ```
 * deno --watch --allow-env=NODE_ENV brainstorm/rejected-idea-3-create-cached-augmenter-class-style.ts
 * ```
 * you will see that the code execution will fail with the error:
 * ```
 * error: Uncaught (in promise) TypeError: Class constructor FooAugments cannot be invoked without 'new'
 *     augmentClass.apply(reactiveInstance, [model]);
 *                  ^
 * ```
 * I can't figure out how to get around that.
 */
export function createCachedAugmenterClassStyle<
  ModelType extends object,
  AugmentsClass extends new (...args: any[]) => any,
>(augmentClass: AugmentsClass): (
  model: ModelType,
) => Reactive<
  & InstanceType<AugmentsClass>
  & Omit<ModelType, keyof InstanceType<AugmentsClass>>
> {
  return createCachedAugmenter((model) => {
    // We want to return `new augmentClass(model)` but we can't do that
    // regularly because then the constructor function would be run with just
    // regular `this` as the `this`. We want the `this` during the constructor
    // function call to be `reactive(this)` instead. That way, if any computed
    // properties are initialized during the constructor, they will have access
    // to the reactive version of `this`.
    const instance = Object.create(augmentClass.prototype);
    const reactiveInstance = reactive(instance);
    // Call the constructor with the reactive instance as `this`
    // @ts-ignore
    augmentClass.apply(reactiveInstance, [model]);
    return reactiveInstance;
  });
}

type Foo = { a: number };

function wait() {
  return new Promise((resolve) => setTimeout(resolve));
}

class FooAugments {
  b = 100;
  readonly sum: number;

  constructor(private model: Foo) {
    this.sum = computed(() => model.a + this.b) as unknown as number;
  }

  incrementB() {
    this.b++;
  }

  logState() {
    return `a: ${this.model.a}, b: ${this.b}, sum: ${this.sum}`;
  }
}

const getAugmentedFoo = createCachedAugmenterClassStyle(FooAugments);
const exampleFoo = reactive<Foo>({ a: 10 });
const fooAugmented = getAugmentedFoo(exampleFoo);

let log = '';
watchEffect(() => {
  log = fooAugmented.logState();
});

await wait();
assertEquals(log, 'a: 10, b: 100, sum: 110');

fooAugmented.a++;
await wait();
assertEquals(log, 'a: 11, b: 100, sum: 111');

fooAugmented.b--;
await wait();
assertEquals(log, 'a: 11, b: 99, sum: 110');

fooAugmented.incrementB();
await wait();
assertEquals(log, 'a: 11, b: 100, sum: 111');

/** THIS FUNCTION ISN'T IMPORTANT, because the code execution will break before
 * it gets to this point. This function is the same as what is written elsewhere
 * in the codebase. */
function createCachedAugmenter<
  ModelType extends object,
  AugmentsType extends object,
>(augmentFactory: (model: Reactive<ModelType>) => AugmentsType): (
  model: ModelType,
) => Reactive<AugmentsType & Omit<ModelType, keyof AugmentsType>> {
  type AugmentedModelType = Reactive<
    AugmentsType & Omit<ModelType, keyof AugmentsType>
  >;
  // Do not worry about the performance of `WeakMap`. Vue already uses `WeakMap`
  // extremely frequently (like every time you use a reactive object).
  const cache = new WeakMap<Reactive<ModelType>, AugmentedModelType>();
  return (model: ModelType) => {
    /** `reactiveModel === model` will be true if `model` was already reactive.
     * (Vue 3 internally uses `WeakMap` to cache reactive `Proxy`s to make that
     * possible.) */
    const reactiveModel = reactive(model);
    const cached = cache.get(reactiveModel);
    if (cached) return cached;
    const augments = augmentFactory(reactiveModel) as AugmentsType;
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
