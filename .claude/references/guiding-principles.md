<!-- Source: CLAUDE.md | Last updated: 2026-02-09 -->

# Guiding Principles

## YAGNI (You Aren't Gonna Need It)

**Add functionality only when it's actually needed, not for hypothetical future use.**

**Do:**

- Implement exactly what the current requirement demands
- Delete unused code, parameters, and abstractions
- Question every "what if we need this later?" addition

**Don't:**

- Add parameters "for flexibility"
- Create abstract classes for single implementations
- Build configuration options nobody requested
- Add extension points "just in case"

**Practical test:** If you can't name a concrete, current use case for something, don't build it.

---

## KISS (Keep It Simple, Stupid)

**Prefer simple solutions over clever ones. Complexity is a cost, not a feature.**

**Do:**

- Choose the straightforward approach first
- Use standard library functions over custom implementations
- Write code that junior developers can understand
- Refactor when complexity grows

**Don't:**

- Over-abstract prematurely
- Use design patterns just to use them
- Optimize before measuring
- Add layers without clear purpose

**Practical test:** Can you explain what this code does in one sentence? If not, simplify.

---

## RxJS Operator Discipline

**Use operators for their intended purpose. Side effects belong in `tap`, transformations belong in `map`.**

`map` is a pure-transformation operator — it receives a value and returns a new value. Placing side effects (state mutations, logging, DOM manipulation) inside `map` creates a hidden dependency on subscription timing. If the stream is later multicasted, replayed, or composed with a non-subscribing operator, the side effect either fires multiple times or not at all.

**Do:**

- Use `tap` for side effects: state patches, store updates, logging, analytics
- Use `map` exclusively for value transformations: reshaping data, mapping DTOs to domain models
- When both are needed, chain them separately: `map(transform)` then `tap(sideEffect)`

**Don't:**

- Embed `patchState`, `setState`, `dispatch`, or any mutation inside `map`
- Perform logging or analytics tracking inside `map`
- Call methods with side effects (HTTP calls, navigation) inside `map`

```typescript
// ✅ Correct — transformation and side effect separated
return api.getData().pipe(
	map((response) => mapResponseToModel(response)),
	tap((model) => patchState(store, { data: model })),
);

// ❌ Incorrect — side effect hidden inside pure operator
return api.getData().pipe(
	map((response) => {
		const model = mapResponseToModel(response);
		patchState(store, { data: model }); // side effect in map!
		return model;
	}),
);
```

**Practical test:** If you removed the `subscribe()` call, would the operator still make sense? `map` should — it's just a data transformation. `tap` shouldn't — that's how you know the side effect is in the right place.
