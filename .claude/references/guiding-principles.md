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

---

## Signals-First Async Operations (No Promises)

**Use `rxMethod` from `@ngrx/signals/rxjs-interop` for all async store operations. Never convert observables to promises.**

The Angular frontend is signals-first. `rxMethod` integrates naturally with `@ngrx/signals` stores — it accepts static values, signals, or observables as input, manages subscriptions via `DestroyRef`, and composes cleanly with RxJS operators for loading/error state management.

**References:** [NgRx RxJS integration guide](https://ngrx.io/guide/signals/rxjs-integration) | [rxMethod source](https://github.com/ngrx/platform/blob/main/modules/signals/rxjs-interop/src/rx-method.ts) | [rxMethod tests](https://github.com/ngrx/platform/blob/main/modules/signals/rxjs-interop/spec/rx-method.spec.ts)

**Do:**

- Use `rxMethod<T>(pipe(tap(...), switchMap(...), catchError(() => EMPTY)))` for API calls in stores
- Use computed signals + `withHooks.onInit` for reactive data fetching (pagination, search, filters)
- Use `tap` with `patchState` for state side effects; `catchError(() => EMPTY)` to swallow errors after handling
- Use `switchMap` as the default flattening operator (cancels stale requests)
- Reload the full list from the server after every mutation — no optimistic in-place updates
- Use per-operation structured error objects (`readError: { list, detail }`, `mutationError: { create, update, delete }`)
- Log errors via `console.error('[StoreName] methodName failed:', err)` in every error handler
- Derive values like `totalPages` as computed signals — never store them in state

**Don't:**

- Use `firstValueFrom`, `lastValueFrom`, or `toPromise` to convert observables to promises
- Use `async/await` in store methods that call API services
- Use `subscribe()` manually in stores — let `rxMethod` manage subscriptions
- Use optimistic in-place updates (e.g., `roles.map(r => r.id === id ? updated : r)`) — always reload from server
- Use a single `string | null` for error state — use per-operation typed error objects

**`rxMethod` invocation modes:**

- **Reactive** — pass a signal reference: `store.loadUsers(store.listParams)` — watches and re-fires on changes
- **Imperative** — pass the current value: `store.loadUsers(store.listParams())` — one-shot fetch

For explicit reloads, call `rxMethod` imperatively with the current signal value. **Never invent counter/trigger signals** (`reloadCounter`, `_reload`, `forceRefresh`) to force re-evaluation — they are unnecessary workarounds that pollute state.

**Practical test:** If a store method has `async` in its signature or imports `firstValueFrom`, it should be refactored to `rxMethod` with a pipe-based approach.
