import { getTemplateParserServices } from '@angular-eslint/utils';

/** @type {import('eslint').Rule.RuleModule} */
export default {
	meta: {
		type: 'problem',
		docs: {
			description: 'Disallow unsupported elements projected into app-form-field',
		},
		schema: [],
		messages: {
			unsupportedElement:
				'<{{ element }}> is not a supported form control for <app-form-field>. Allowed: {{ allowed }}.',
			multipleChildren: '<app-form-field> accepts a single projected element. Found {{ count }} direct children.',
		},
	},
	create(context) {
		const parserServices = getTemplateParserServices(context);

		return {
			'Element[name="app-form-field"]'(node) {
				const allowedChildren = ['input', 'select', 'textarea'];
				const elementChildren = node.children.filter((child) => child.type === 'Element');

				if (elementChildren.length > 1) {
					context.report({
						loc: parserServices.convertNodeSourceSpanToLoc(node.sourceSpan),
						messageId: 'multipleChildren',
						data: { count: String(elementChildren.length) },
					});
					return;
				}

				for (const child of elementChildren) {
					if (!allowedChildren.includes(child.name.toLowerCase())) {
						context.report({
							loc: parserServices.convertNodeSourceSpanToLoc(child.sourceSpan),
							messageId: 'unsupportedElement',
							data: {
								element: child.name,
								allowed: allowedChildren.join(', '),
							},
						});
					}
				}
			},
		};
	},
};
