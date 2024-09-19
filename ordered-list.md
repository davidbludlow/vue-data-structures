# Ideas

- Idea 1 (I like Idea 2 better, or maybe we can offer both)
  - When I do it I think that there should be 3 parts:
    1. A TS library that doesn't use vue that interfaces with the storage/network-communications strategy
    2. A vue reactive array that listens adjusts according to events emitted from the TS library. Except for the ones that have "add" in the name, the events should be able to be called just the id of the object. 
    - The events are:
      - moveToIndex
      - remove
      - addAtIndex
        - Todo: Would it be more simple if we just had an `add` and then used moveToIndex? Any advantages to having addAtIndex?
      - Todo: Maybe not needed events: (Investigate if there would be any benefits of not just always using addAtIndex or moveToIndex according to vue reactivity's quirks)
        - addToEnd
        - moveToEnd
      - We do not need addToBeginning or moveToBeginning because it is easy to detect an addAtIndex with an index of 0.
        - Todo: investigate if array.unshift is more efficient than array.splice(0, 0, ...).
    - It communicates back to the TS library with the following events:
      - addAtIndex
      - remove
      - move
        - Todo: can use the same interface as the `sortablejs` package's `onEnd` event... whatever that is? maybe it is just `{oldIndex: number, newIndex: number}`?
    3. A vue reactive map of id to object? Maybe this is part of `IndexedList`?
  - Even though I will probably decide on an algorithm that will probably boil down to sorting objects by some sort of `order` property. Keeping this separation of concerns will probably be a good idea.
- Idea 2
  - Like Idea 1 except split Part 1 (the TS library) into 2 parts:
    1. A TS library that doesn't use vue that interfaces with the storage/network-communications strategy to set an `order` property on a set of objects.
    2. A TS library that doesn't use vue that generates the events that I described.
  - Investigate if adding bulk add or bulk remove or bulk move events would be beneficial for the vue reactivity.

# Vue reactivity research ideas:

- Make tests that test wether doing certain things fires more or less watchers.
- ask gpt
- I can generate a battery of tests to test the efficiency of different vue array manipulation strategies based on the time it takes to run the manipulations.

# Other

- Don't forget to throw an error if, when the user of this library specifies the name of the property that should be used as an id, the user picks `"__proto__"` or `"constructor"`?
