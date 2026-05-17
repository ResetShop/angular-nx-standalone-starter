import parser from '@typescript-eslint/parser'
import { RuleTester } from 'eslint'
import { describe, it } from 'vitest'
import rule from './storybook-source-state.js'

// Bind Vitest's runner — RuleTester defaults to Mocha-style globals which Vitest does not provide.
RuleTester.describe = describe
RuleTester.it = it
RuleTester.itOnly = it.only

const ruleTester = new RuleTester({ languageOptions: { parser } })

const storiesFilename = 'example.stories.ts'

const validInlineDefault = `
const x = {};
export default {
	component: x,
	parameters: {
		docs: {
			canvas: {
				sourceState: 'shown',
			},
		},
	},
};
`

const validVariableDefault = `
const x = {};
const meta = {
	component: x,
	parameters: {
		docs: {
			canvas: {
				sourceState: 'shown',
			},
		},
	},
};
export default meta;
`

const nonStoriesFile = `
export default {
	component: {},
	// No parameters block — must NOT report when the file path is not a *.stories.ts.
};
`

const missingParameters = `
const x = {};
export default {
	component: x,
};
`

const missingDocs = `
const x = {};
export default {
	component: x,
	parameters: {},
};
`

const missingCanvas = `
const x = {};
export default {
	component: x,
	parameters: {
		docs: {
			description: { component: 'desc' },
		},
	},
};
`

const missingSourceState = `
const x = {};
export default {
	component: x,
	parameters: {
		docs: {
			canvas: {},
		},
	},
};
`

const wrongSourceState = `
const x = {};
export default {
	component: x,
	parameters: {
		docs: {
			canvas: {
				sourceState: 'hidden',
			},
		},
	},
};
`

ruleTester.run('storybook-source-state', rule, {
	valid: [
		{
			name: 'inline object default export with sourceState: shown',
			filename: storiesFilename,
			code: validInlineDefault,
		},
		{
			name: 'variable-referenced default export with sourceState: shown',
			filename: storiesFilename,
			code: validVariableDefault,
		},
		{ name: 'non-stories file is ignored entirely', filename: 'not-a-story.ts', code: nonStoriesFile },
	],
	invalid: [
		{
			name: 'meta is missing parameters block',
			filename: storiesFilename,
			code: missingParameters,
			errors: [{ messageId: 'missingParameters' }],
		},
		{
			name: 'parameters is missing docs key',
			filename: storiesFilename,
			code: missingDocs,
			errors: [{ messageId: 'missingDocs' }],
		},
		{
			name: 'docs is missing canvas key',
			filename: storiesFilename,
			code: missingCanvas,
			errors: [{ messageId: 'missingCanvas' }],
		},
		{
			name: 'canvas is missing sourceState key',
			filename: storiesFilename,
			code: missingSourceState,
			errors: [{ messageId: 'missingSourceState' }],
		},
		{
			name: 'sourceState is not "shown"',
			filename: storiesFilename,
			code: wrongSourceState,
			errors: [{ messageId: 'wrongSourceState' }],
		},
	],
})
