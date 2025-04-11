// This file was copied from
// https://github.com/davidbludlow/vue-data-structures/blob/main/src/use-mapped-array.ts
// which had an MIT license, when it was copied.

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
