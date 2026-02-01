# Visual Regression Testing Setup Guide

This guide explains how to set up visual regression testing for Storybook stories using Chromatic.

## Why Visual Regression Testing?

Visual regression tests automatically catch unintended visual changes in the UI:

- Detect CSS regressions across browsers
- Verify dark mode implementations
- Ensure animations render correctly
- Validate responsive layouts
- Prevent accidental visual breakages

## Chromatic Setup

[Chromatic](https://www.chromatic.com/) is the recommended tool for visual regression testing with Storybook.

### 1. Install Chromatic

```bash
pnpm add -D chromatic
```

### 2. Create Chromatic Project

1. Go to [chromatic.com](https://www.chromatic.com/)
2. Sign in with GitHub
3. Create a new project linked to this repository
4. Copy the project token provided

### 3. Add Scripts to package.json

```json
{
	"scripts": {
		"chromatic": "chromatic --project-token=<your-project-token>",
		"chromatic:ci": "chromatic --exit-zero-on-changes"
	}
}
```

**Security Note:** Store the project token as an environment variable in CI:

```json
{
	"scripts": {
		"chromatic": "chromatic",
		"chromatic:ci": "chromatic --exit-zero-on-changes"
	}
}
```

Then set `CHROMATIC_PROJECT_TOKEN` in your CI environment.

### 4. Add to CI Pipeline

#### GitHub Actions Example

Create `.github/workflows/chromatic.yml`:

```yaml
name: Chromatic

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  chromatic:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0 # Required for Chromatic

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22.19.0'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 10

      - name: Install dependencies
        run: pnpm install

      - name: Publish to Chromatic
        uses: chromaui/action@v1
        with:
          projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
          exitZeroOnChanges: true
```

### 5. First Run

```bash
pnpm run chromatic
```

This will:

1. Build your Storybook
2. Upload snapshots to Chromatic
3. Return a URL for review
4. Set baselines for future comparisons

### 6. Review Process

On subsequent runs:

1. Chromatic compares new snapshots to baselines
2. Detects visual changes
3. Creates a review link in PR comments
4. Requires approval to accept/reject changes

## Stories to Test

Focus on components with expandable navigation:

- **NavItem stories:**
  - Default
  - WithChildren
  - MixedNavigation
  - DarkMode
  - LongText
  - DeepNesting

- **NavSection stories:**
  - WithExpandableItems
  - DarkModeWithExpandable

- **Sidebar stories:**
  - WithExpandableNavigation

## Best Practices

### 1. Ignore Dynamic Content

For components with timestamps or random data:

```typescript
export const MyStory: Story = {
	parameters: {
		chromatic: {
			// Pause animations
			pauseAnimationAtEnd: true,
			// Disable for this story
			disableSnapshot: true,
			// Custom delay before snapshot
			delay: 300,
		},
	},
};
```

### 2. Test Interaction States

```typescript
import { userEvent, within } from '@storybook/testing-library';

export const ExpandedState: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const button = canvas.getByRole('button');

		// Expand the navigation
		await userEvent.click(button);
	},
};
```

### 3. Reduce Flakiness

```typescript
// Wait for fonts to load
export default {
	parameters: {
		chromatic: {
			delay: 500, // Wait 500ms before snapshot
		},
	},
} as Meta;
```

## Alternatives to Chromatic

### Percy

[Percy](https://percy.io/) is another popular option:

```bash
pnpm add -D @percy/cli @percy/storybook
```

```json
{
	"scripts": {
		"percy": "percy storybook http://localhost:6006"
	}
}
```

### Playwright Visual Comparisons

For E2E test visual regression:

```typescript
await expect(page).toHaveScreenshot('navigation-expanded.png');
```

## Cost Considerations

| Tool       | Free Tier               | Cost                  |
| ---------- | ----------------------- | --------------------- |
| Chromatic  | 5,000 snapshots/month   | $149/month for 35,000 |
| Percy      | 5,000 snapshots/month   | Contact for pricing   |
| Playwright | Unlimited (self-hosted) | Infrastructure cost   |

**Recommendation:** Start with Chromatic's free tier (5,000 snapshots is generous for most projects).

## Monitoring

Set up Slack/Discord notifications for visual changes:

1. Go to Chromatic project settings
2. Enable integrations
3. Add webhook URL for your chat platform

## Further Reading

- [Chromatic Documentation](https://www.chromatic.com/docs/)
- [Storybook Visual Testing](https://storybook.js.org/docs/react/writing-tests/visual-testing)
- [Component-Driven Development](https://www.componentdriven.org/)

---

**Status:** Not yet set up (documentation only)

**Next Steps:**

1. Create Chromatic account
2. Add project token to CI secrets
3. Run initial baseline
4. Add to PR workflow
