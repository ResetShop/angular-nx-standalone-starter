export default {
	printWidth: 120,
	singleQuote: true,
	useTabs: true,
	tabWidth: 2,
	semi: false,
	bracketSpacing: true,
	arrowParens: 'always',
	plugins: ['prettier-plugin-organize-attributes', 'prettier-plugin-organize-imports', 'prettier-plugin-tailwindcss'],
	attributeGroups: ['$ANGULAR_OUTPUT', '$ANGULAR_TWO_WAY_BINDING', '$ANGULAR_INPUT', '$ANGULAR_STRUCTURAL_DIRECTIVE'],
	htmlWhitespaceSensitivity: 'ignore',
}
