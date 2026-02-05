# Code Review Report

**Branch:** `140-remove-vi-mock-vi-fn-usage`
**Date:** 2026-02-05
**Reviewer:** Claude Opus 4.5 (code-reviewer agent)

## Summary

This review covers changes that replace all `vi.fn()` usages with a custom `fn()` function from `container.mock.ts`. The changes include:

1. Modified `container.mock.ts` to use a regular function instead of an arrow function for `fn()` to preserve `this` context
2. Updated 5 test files to use the custom `fn()` implementation
3. Added ESLint rules to enforce the ban on `vi.mock()` and `vi.fn()`

All CI checks pass successfully (stylelint, lint, test, build, storybook:build).

---

## Prioritized Issues

### Critical Issues (Must Fix)

| #   | File | Line | Issue                    | Fix | Addressed |
| --- | ---- | ---- | ------------------------ | --- | --------- |
| -   | -    | -    | No critical issues found | -   | -         |

---

### Warnings (Should Fix)

| #   | File                                                       | Line          | Issue                                                                                                                                                                | Recommendation                                                                                                                                                            | Addressed |
| --- | ---------------------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 1   | `src/api/container.mock.ts`                                | 52            | Type assertion `as MockFn<TArgs, TReturn>` bypasses type safety. The function is assigned properties after creation, which TypeScript cannot verify at compile time. | Consider restructuring to create the object with all properties upfront, or document why the type assertion is necessary with a comment explaining the runtime guarantee. | [ ]       |
| 2   | `src/app/components/confirm-dialog/confirm-dialog.spec.ts` | 11-22         | `mockDialog()` function modifies global HTMLDialogElement prototype. This creates potential test isolation issues if not properly cleaned up.                        | Add an afterEach hook that restores the original HTMLDialogElement methods to ensure test isolation. Consider using a more localized mocking approach.                    | [ ]       |
| 3   | `src/app/components/drawer/drawer.spec.ts`                 | 11-23         | Same global prototype modification issue as #2                                                                                                                       | Same recommendation as #2                                                                                                                                                 | [ ]       |
| 4   | `src/app/components/confirm-dialog/confirm-dialog.spec.ts` | 135, 152, 170 | Using `.calls.length` with `.toBeGreaterThan(0)` is less precise than checking exact call count                                                                      | Use `.toEqual(1)` or `.toHaveLength(1)` for more precise assertions that catch unexpected multiple calls                                                                  | [ ]       |
| 5   | `src/app/components/drawer/drawer.spec.ts`                 | 163, 196      | Same imprecise assertion issue as #4                                                                                                                                 | Same recommendation as #4                                                                                                                                                 | [ ]       |

---

### Suggestions (Nice to Have)

| #   | File                                               | Line   | Suggestion                                                                                                                                                                                                                                                         | Addressed |
| --- | -------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| 6   | `src/api/container.mock.ts`                        | 47-92  | The `fn()` function is well-designed, but lacks runtime validation that the mock is being used correctly (e.g., calling mockReturnValue after mockImplementation could be confusing). Consider adding development-mode warnings if conflicting methods are called. | [ ]       |
| 7   | `src/api/container.mock.ts`                        | 32, 90 | The `mockRegistry` uses a Set but stores different generic types of `MockFn`. Consider if there's value in tracking mock metadata (creation location, type info) for better debugging. Current approach is pragmatic and sufficient.                               | [ ]       |
| 8   | `src/app/store/auth/auth.store.spec.ts`            | 29-34  | The mock object structure is defined inline with explicit property types. While correct, it's verbose. Consider extracting a type `type AuthApiMock = { [K in keyof AuthApiService]: MockFn<...> }` to reduce duplication if this pattern repeats.                 | [ ]       |
| 9   | `src/app/components/data-table/data-table.spec.ts` | 146    | Type annotation `fn<[{ id: string; direction: string }], void>()` could use a named interface for better readability. Extract to `interface SortChangeEvent { id: string; direction: string }` and use `fn<[SortChangeEvent], void>()`                             | [ ]       |

---

## Verification Results

| Command                   | Result |
| ------------------------- | ------ |
| `npm run test`            | PASS   |
| `npm run lint`            | PASS   |
| `npm run stylelint`       | PASS   |
| `npm run build`           | PASS   |
| `npm run storybook:build` | PASS   |

---

## Architecture and Design Quality

### SOLID Principles - PASS

- **Single Responsibility (SRP)** - Each function and class has a clear, single purpose
- **Open/Closed (OCP)** - The `MockFn` interface allows extension through method chaining
- **Liskov Substitution (LSP)** - Not directly applicable to these changes
- **Interface Segregation (ISP)** - The `MockFn` interface is cohesive
- **Dependency Inversion (DIP)** - Tests depend on the `MockFn` abstraction rather than Vitest-specific implementations

### CUPID Principles - PASS

- **Composable** - The `fn()` function composes well with the rest of the testing infrastructure
- **Unix Philosophy** - Does one thing well: creates framework-agnostic mock functions
- **Predictable** - The API mirrors familiar mocking libraries
- **Idiomatic** - Follows TypeScript and testing library conventions
- **Domain-Based** - Uses testing domain language (mock, spy, calls)

### YAGNI / KISS - PASS

- The implementation is straightforward and doesn't add unnecessary features
- The regular function instead of arrow function is justified by the need to preserve `this` context

### Hard Constraints - PASS

- Function length <= 50 lines
- File length <= 500 lines
- Cyclomatic complexity <= 10
- Nesting depth <= 3 levels
- No barrel imports/exports
- No untyped `any`
- No `// @ts-ignore`
- No `console.log`
- Proper use of `type` keyword for type-only imports

---

## Positive Observations

1. **Excellent type safety** - The generic `MockFn<TArgs, TReturn>` provides strong typing for mock functions
2. **Framework independence** - Moving away from `vi.fn()` reduces coupling to Vitest
3. **Consistent API** - The custom `fn()` implementation provides a familiar API similar to Jest/Vitest
4. **Good documentation** - JSDoc comments explain the purpose and usage of functions
5. **Proper cleanup** - Use of `clearAllMocks()` in `beforeEach` ensures test isolation
6. **ESLint enforcement** - Adding rules to prevent future usage of `vi.fn()` ensures consistency
7. **Context preservation** - The switch from arrow function to regular function correctly handles `this` binding

---

## Verdict

**APPROVED WITH COMMENTS**

The code changes are well-executed and achieve the goal of removing Vitest-specific mocking in favor of a custom, framework-agnostic solution. All tests pass, and the implementation follows project guidelines.

The warnings identified are minor issues around test isolation (global prototype modification) and assertion precision that should be addressed to improve test reliability. The suggestions are optional improvements.

---

## Recommendations for Next Steps

1. **Address Warning #2 and #3** - Add cleanup for HTMLDialogElement prototype modifications to ensure test isolation
2. **Address Warning #4 and #5** - Use precise assertion counts instead of `.toBeGreaterThan(0)`
3. **Consider Suggestion #6** - Add development-mode warnings for conflicting mock configurations
4. **Consider Suggestion #9** - Extract inline types for better readability
