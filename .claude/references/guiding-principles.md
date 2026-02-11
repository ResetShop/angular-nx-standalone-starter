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
