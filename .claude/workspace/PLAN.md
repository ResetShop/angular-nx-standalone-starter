# Plan: Improve Claude Code Documentation and Agent Setup (#142)

## Steps

1. **Fix code-reviewer.md constraint values** — Function length ≤ 50, file length ≤ 500
2. **Add cross-reference link in DEPENDENCY_INJECTION.md** — Link to CLAUDE.md Testing Guidelines
3. **Create .claude/workspace/ and update .gitignore** — Ephemeral agent output directory
4. **Extract CLAUDE.md sections into .claude/references/** — 7 reference files
5. **Slim CLAUDE.md with pointers to references** — Target ~400 lines
6. **Create 7 agent files + update code-reviewer** — Specialized agents with reference loading
7. **Add Development Workflow section to CLAUDE.md** — Agent orchestration table
8. **Verification** — npm run ci, code-reviewer, line count check
