# AI Agent Guidelines

> **Note:** This file is a standard AI-agent instruction file (`AGENTS.md`) auto-managed by the **Nx MCP server** between the `nx configuration` markers below. It provides Nx-specific guidelines for AI tools.
>
> For **Claude Code specialized agents** (code-reviewer, security-auditor, test-generator, etc.), see [`.claude/agents/`](.claude/agents/).

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

## Running Tasks

**CRITICAL: Always use `npm run <task>` for these task executions in this project.**

- ✅ `npm run ci` - Run all CI checks locally
- ✅ `npm run build` - Build the project
- ✅ `npm run dev` - Start dev server
- ✅ `npm run lint` - Run linting
- ✅ `npm run stylelint` - Run style linting
- ✅ `npm run test` - Run tests
- ✅ `npm run test:e2e` - Run e2e tests
- ❌ `nx test`, `nx run` - Do NOT use direct nx commands
- ❌ `npm test --`, `npm exec nx test` - Do NOT construct variants

For other task executions relative to Nx itself, you can run nx commands.

**Before running ANY command, check `.claude/settings.local.json` for the exact allowed patterns.**

## Nx MCP Tools

- You have access to the Nx MCP server and its tools, use them to help the user
- When answering questions about the repository, use the `nx_workspace` tool first to gain an understanding of the workspace architecture where applicable.
- When working in individual projects, use the `nx_project_details` mcp tool to analyze and understand the specific project structure and dependencies
- For questions around nx configuration, best practices or if you're unsure, use the `nx_docs` tool to get relevant, up-to-date docs. Always use this instead of assuming things about nx configuration
- If the user needs help with an Nx configuration or project graph error, use the `nx_workspace` tool to get any errors

# CI Error Guidelines

If the user wants help with fixing an error in their CI pipeline, use the following flow:

- Retrieve the list of current CI Pipeline Executions (CIPEs) using the `nx_cloud_cipe_details` tool
- If there are any errors, use the `nx_cloud_fix_cipe_failure` tool to retrieve the logs for a specific task
- Use the task logs to see what's wrong and help the user fix their problem. Use the appropriate tools if necessary
- Make sure that the problem is fixed by running the task that you passed into the `nx_cloud_fix_cipe_failure` tool

<!-- nx configuration end-->
