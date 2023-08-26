/** creates an indexable list.
 *
 * An indexable list has the same properties/functions as a normal list, it also
 * has a function called `addIndex` which adds an index to the list. Every time
 * the list is updated, every registered index is also updated.
 */
export function createIndexableList<T>(list: T[] = []): IndexableList<T> {
