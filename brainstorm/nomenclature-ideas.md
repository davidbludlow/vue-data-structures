use StudentWork objects as an example type of model for this doc

- const getAugmentedStudentWork = createCashedAugmenter(augmentFactory);
  - const augmentedStudentWork = getAugmentedStudentWork(model);
  - const studentWorkAugmented = getAugmentedStudentWork(model);
- const retrieveAugmentedStudentWork = ...
- What I did in my old job
  - const studentWorkViewModelProvider = new StudentWorkViewModelProvider(factoryFunction);
    - studentWorkViewModelProvider.get(model)
- const getStudentWorkHelperObject = createStudentWorkHelperObjectProvider(factoryFunction);
  - const studentWorkHelperObject = getStudentWorkHelperObject(model);
- const getStudentWorkWrapper = createWrapperCache(enhancementFactory); // or enhancementComposable or additionsFactory or additionalPropertiesFactory or extraPropertiesFactory or extrasFactory or extrasComposable or composable or extensionsComposable or extensionsFactory or wrapperEnhancementFactory or enhancementComposableFunction or wrapperExtrasComposable or wrapperExtrasFactory or wrapperExtensionsComposable or wrapperExtensionsFactory
  - const studentWorkWrapper = getStudentWorkWrapper(model);
- const getStudentWorkModelWrapper = createModelWrapperCache(wrapperExtrasComposable);
  - const studentWorkModelWrapper = getStudentWorkModelWrapper(model);
- const getStudentWorkWrapper = useCachedWrappers(wrapperFactory);
- const getStudentWorkWrapper = useCachedAugmentingWrappers(wrapperFactory);
