```ts
import { assertEquals } from 'jsr:@std/assert';
import { computed, reactive, ref } from 'vue';

/**
 * Creates a reactive getter property, backed by a computed. The returned object can be spread into an object literal to add the getter to the object literal.
 *
 * @param name - The property name for the getter
 * @param fn - The function to compute the value
 * @returns An object with a getter property that can be spread into an object literal
 */
export const computedGetter = <K extends string, T>(
  name: K,
  fn: () => T,
): Record<K, T> => {
  const computedRef = computed(fn);
  return {
    get [name]() {
      return computedRef.value;
    },
  } as Record<K, T>;
};

const useTestReactiveComposable = () => {
  const foo = ref(3);
  const bar = ref(5);

  return reactive({
    foo,
    bar,
    ...computedGetter('doubleFoo', () => foo.value * 2),
    ...computedGetter('sumFooBar', () => foo.value + bar.value),

    // Test getter/setter that might trigger the old reactivity issue
    get doubleFooAsString() {
      return this.doubleFoo.toString();
    },

    set doubleFooAsString(value: string) {
      foo.value = Number(value) / 2;
    },
  });
};

Deno.test('ReactiveClass with aliasOfComputed - initial values', () => {
  const instance = useTestReactiveComposable();

  assertEquals(instance.foo, 3);
  assertEquals(instance.bar, 5);
  assertEquals(instance.doubleFoo, 6);
  assertEquals(instance.sumFooBar, 8);
});

Deno.test('ReactiveClass with aliasOfComputed - reactivity on property change', () => {
  const instance = useTestReactiveComposable();

  // Change foo and verify computed properties update
  instance.foo = 10;

  assertEquals(instance.foo, 10);

  // *********************FAILS HERE*********************
  assertEquals(instance.doubleFoo, 20);
  assertEquals(instance.sumFooBar, 15); // 10 + 5
});
```
