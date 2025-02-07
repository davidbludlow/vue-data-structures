// This idea still needs work and maybe it will only work for Vue 2. When I
// briefly, not-thoroughly tested it in a large project it worked except it spat
// out warnings in the console. Perhaps the warnings could be gotten rid of by
// setting the prototype of the constructor to something weird or using a Proxy?

// import Vue from 'vue';
// import { reactive } from 'vue';
// import { Component } from 'vue-class-component';
// import { useCachedWrappers } from '../src/use-cached-wrappers';

// export const ReactiveClass = (class ReactiveClass {
//   constructor() {
//     return reactive(this);
//   }
// }) as unknown as typeof Vue;

// type Foo = { a: number; b: string };

// @Component
// class FooWrapper extends ReactiveClass {
//   constructor(public foo: Foo) {
//     super();
//   }

//   get toJson() {
//     return JSON.stringify(this.foo);
//   }
// }

// const getFooWrapper = useCachedWrappers((foo: Foo) => new FooWrapper(foo));
