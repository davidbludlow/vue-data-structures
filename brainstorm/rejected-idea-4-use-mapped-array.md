As of Vue 3.5, I don't think this would do any good. https://github.com/vuejs/core/pull/10397 (which was one of the big changes in Vue 3.5) made it so that accessing just one of the elements in a reactive array will cause a dependency on the entire array. Therefore this idea wouldn't do any good, anyway.

```ts
import { type Reactive, reactive, type UnwrapNestedRefs } from 'vue';

/**
 * Creates a proxy for a reactive array that transforms elements using a factory function when accessed.
 * This function is designed to be used with `useCachedWrappers` for efficient element transformation.
 *
 * @param reactiveArray The input reactive array
 * @param indexPropertyName Optional property name to store the array index on each returned object
 * @param factory A function to transform array elements
 * @returns A proxy that behaves like the original array but returns transformed elements
 *
 * @example
 * const items = reactive([{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }]);
 * const wrapItem = useCachedWrappers((item) => ({
 *   item,
 *   displayName: computed(() => `Display: ${item.name}`)
 * }));
 * const wrappedItems = useMappedArray(items, wrapItem);
 *
 * console.log(wrappedItems[0].displayName); // "Display: Item 1"
 * console.log(wrappedItems.length); // 2
 */
export function useMappedArray<T extends UnwrapNestedRefs<any>, R>(
  reactiveArray: Reactive<T[]>,
  indexPropertyName: undefined | keyof R,
  factory: (item: T) => R,
): R[] {
  return new Proxy(reactive(reactiveArray), {
    get(target, prop, receiver) {
      if (prop === Symbol.iterator) {
        return function* () {
          const length = target.length;
          for (let i = 0; i < length; i++) {
            const dataElement = target[i];
            const result = factory(dataElement as T);
            if (indexPropertyName) {
              (result[indexPropertyName] as number) = i;
            }
            yield result;
          }
        };
      }
      // If accessing an integer index, apply the factory function
      if (typeof prop === 'string' && /^\d+$/.test(prop)) {
        const index = parseInt(prop);
        const dataElement = target[index];
        if (dataElement !== undefined) {
          const result = factory(dataElement as T);
          if (indexPropertyName) {
            (result[indexPropertyName] as number) = index;
          }
          return result;
        } else return undefined;
      }

      // For all other properties (length, array methods, etc.), return the original
      return Reflect.get(target, prop, receiver);
    },
  }) as R[];
}
```

## Tests

```ts
import { assertEquals, assertStrictEquals } from 'jsr:@std/assert';
import { computed, reactive } from 'vue';
import { useCachedWrappers } from '../src/use-cached-wrappers.ts';
import { useMappedArray } from '../src/use-mapped-array.ts';

Deno.test('useMappedArray - basic transformation', () => {
  // Setup
  const originalArray = reactive([
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' },
    { id: 3, name: 'Item 3' },
  ]);

  const factory = (item: { id: number; name: string }) => ({
    original: item,
    upper: item.name.toUpperCase(),
  });

  // Execute
  const mapped = useMappedArray(originalArray, undefined, factory);

  // Verify
  assertEquals(mapped.length, 3);
  assertEquals(mapped[0].upper, 'ITEM 1');
  assertEquals(mapped[1].upper, 'ITEM 2');
  assertEquals(mapped[2].upper, 'ITEM 3');
  assertEquals(mapped[0].original.id, 1);
  assertEquals(mapped[1].original.id, 2);
});

Deno.test('useMappedArray - preserves array methods', () => {
  // Setup
  const originalArray = reactive([1, 2, 3]);
  const factory = (num: number) => ({ value: num, doubled: num * 2 });

  // Execute
  const mapped = useMappedArray(originalArray, undefined, factory);

  // Verify
  assertEquals(mapped.length, 3);

  // Test map method
  const results = Array.prototype.map.call(mapped, (item: any) => item.doubled);
  assertEquals(results, [2, 4, 6]);

  // Test filter method
  const filtered = Array.prototype.filter.call(
    mapped,
    (item: any) => item.value > 1,
  );
  assertEquals(filtered.length, 2);
});

Deno.test('useMappedArray - reactive to array changes', () => {
  // Setup
  const originalArray = reactive([{ id: 1, name: 'Item 1' }]);
  const factory = (item: { id: number; name: string }) => ({
    id: item.id,
    displayName: item.name.toUpperCase(),
  });

  // Execute
  const mapped = useMappedArray(originalArray, undefined, factory);

  // Initial verification
  assertEquals(mapped.length, 1);
  assertEquals(mapped[0].displayName, 'ITEM 1');

  // Push a new item
  originalArray.push({ id: 2, name: 'Item 2' });
  assertEquals(mapped.length, 2);
  assertEquals(mapped[1].displayName, 'ITEM 2');

  // Modify an item
  originalArray[0].name = 'Updated Item';
  assertEquals(mapped[0].displayName, 'UPDATED ITEM');

  // Pop an item
  originalArray.pop();
  assertEquals(mapped.length, 1);
});

Deno.test('useMappedArray - integration with useCachedWrappers', () => {
  // Setup
  const originalArray = reactive([
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' },
  ]);

  // Create factory with cached wrappers
  const createWrapper = useCachedWrappers((
    item: { id: number; name: string },
  ) => ({
    id: item.id,
    name: item.name,
    displayName: computed(() => `Display: ${item.name}`),
  }));

  // Execute
  const mapped = useMappedArray(originalArray, undefined, createWrapper);

  // Verify
  assertEquals(mapped[0].displayName, 'Display: Item 1');
  assertEquals(mapped[1].displayName, 'Display: Item 2');

  // Verify caching - same instance is returned for same data
  const wrapper1 = createWrapper(originalArray[0]);
  const wrapper2 = createWrapper(originalArray[0]);
  assertStrictEquals(wrapper1, wrapper2);

  // Check that mapped array uses the cached wrappers
  assertStrictEquals(mapped[0], wrapper1);
});

Deno.test('useMappedArray - out of bounds access', () => {
  // Setup
  const originalArray = reactive([{ id: 1 }]);
  const factory = (item: { id: number }) => ({ value: item.id * 10 });

  // Execute
  const mapped = useMappedArray(originalArray, undefined, factory);

  // Verify
  assertEquals(mapped.length, 1);
  assertEquals(mapped[0].value, 10);
  assertEquals(mapped[1], undefined);
  assertEquals(mapped[-1], undefined);
});

Deno.test('useMappedArray - complex reactive updates', () => {
  // Setup
  const originalArray = reactive([
    { id: 1, count: 0 },
    { id: 2, count: 5 },
  ]);

  const factory = (item: { id: number; count: number }) =>
    reactive({
      id: item.id,
      count: item.count,
      isPositive: computed(() => item.count > 0),
      increment: () => {
        item.count++;
      },
    });

  // Execute
  const mapped = useMappedArray(originalArray, undefined, factory);

  // Initial state
  assertEquals(mapped[0].isPositive, false);
  assertEquals(mapped[1].isPositive, true);

  // Update through wrapped method
  mapped[0].increment();
  assertEquals(mapped[0].count, 1);
  assertEquals(mapped[0].isPositive, true);

  // Update through original array
  originalArray[1].count = 0;
  assertEquals(mapped[1].count, 0);
  assertEquals(mapped[1].isPositive, false);
});

Deno.test('useMappedArray - with indexPropertyName', () => {
  // Setup
  const originalArray = reactive([
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' },
    { id: 3, name: 'Item 3' },
  ]);

  const factory = (item: { id: number; name: string }) => ({
    original: item,
    upper: item.name.toUpperCase(),
    index: -1,
  });

  // Execute
  const mapped = useMappedArray(originalArray, 'index', factory);

  // Verify
  assertEquals(mapped.length, 3);
  assertEquals(mapped[0].upper, 'ITEM 1');
  assertEquals(mapped[0].index, 0);
  assertEquals(mapped[1].upper, 'ITEM 2');
  assertEquals(mapped[1].index, 1);
  assertEquals(mapped[2].upper, 'ITEM 3');
  assertEquals(mapped[2].index, 2);

  // Verify index updates when array changes
  originalArray.shift();
  assertEquals(mapped[0].original.id, 2);
  assertEquals(mapped[0].index, 0);
  assertEquals(mapped[1].original.id, 3);
  assertEquals(mapped[1].index, 1);
});
```
