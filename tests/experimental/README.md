# Experimental Tests

This folder contains test files that **do not test production code**. These are proof-of-concept implementations and tests for rejected or alternative ideas documented in the `brainstorm/` folder.

## Files:

- `alternate-reactive-class-decorator_test.ts` - Tests the decorator approach described in `brainstorm/alternate-idea-9-reactive-class-with-decorator.md`. This approach works but was rejected in favor of the simpler `computedAsAFunction` pattern.

- `old-reactive-class-corner-case_test.ts` - Demonstrates the original problem with `aliasOfComputed` that led to the exploration of alternative approaches.

These tests are kept for historical reference and to demonstrate that alternative approaches were properly evaluated before being rejected.
