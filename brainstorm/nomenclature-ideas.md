use StudentWork objects as an example type of model for this doc

- const getAugmentedStudentWork = createCashedAugmenter(augmentFactory);
  - const augmentedStudentWork = getAugmentedStudentWork(model);
- const retrieveAugmentedStudentWork = ...
- What I did in my old job
  - const studentWorkViewModelProvider = new StudentWorkViewModelProvider(factoryFunction);
    - studentWorkViewModelProvider.get(model)
- const getStudentWorkHelperObject = createStudentWorkHelperObjectProvider(factoryFunction);
  - const studentWorkHelperObject = getStudentWorkHelperObject(model);
