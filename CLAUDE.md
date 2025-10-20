<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
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

# Testing Guidelines

- **ALWAYS use Angular Testing Library** (`@testing-library/angular`) for writing unit tests in Angular components.
- Import `render` and `screen` from `@testing-library/angular`
- Use Testing Library queries (`screen.getByRole`, `screen.getByText`, etc.) instead of native element queries
- Follow Testing Library best practices: test user behavior, not implementation details
- Never use `ComponentFixture`, `TestBed.createComponent()`, or `fixture.nativeElement` directly
- Example pattern:

```typescript
import { render, screen } from '@testing-library/angular';

it('should render button', async () => {
	await render(`<button appButton>Click me</button>`, {
		imports: [Button],
	});

	const button = screen.getByRole('button', { name: /click me/i });
	expect(button).toBeInTheDocument();
});
```
