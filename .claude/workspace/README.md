# Claude Code Workspace

This directory contains **ephemeral agent output** generated during Claude Code sessions.

## Contents

| File             | Purpose                                                  |
| ---------------- | -------------------------------------------------------- |
| `CODE_REVIEW.md` | Latest code review report from the `code-reviewer` agent |
| `PLAN.md`        | Current implementation plan (used during plan mode)      |

## Rules

- Files in this directory are **gitignored** (except this README)
- They are overwritten each session — do not rely on persistence across conversations
- The canonical project guidelines live in `CLAUDE.md` and `.claude/references/`
