import parser from '@angular-eslint/template-parser';
import { RuleTester } from 'eslint';
import rule from './form-field-allowed-content.eslint-rule.js';

const ruleTester = new RuleTester({ languageOptions: { parser } });

ruleTester.run('form-field-allowed-content', rule, {
	valid: [
		{
			name: 'single input with [formField]',
			code: '<app-form-field [label]="\'Email\'"><input [formField]="field" type="email" /></app-form-field>',
		},
		{
			name: 'single select with [formField]',
			code: '<app-form-field [label]="\'Country\'"><select [formField]="field"></select></app-form-field>',
		},
		{
			name: 'single textarea with [formField]',
			code: '<app-form-field [label]="\'Bio\'"><textarea [formField]="field"></textarea></app-form-field>',
		},
		{
			name: 'single checkbox with [formField]',
			code: '<app-form-field [label]="\'Terms\'"><input [formField]="field" type="checkbox" /></app-form-field>',
		},
		{
			name: 'custom component with [formField]',
			code: '<app-form-field [label]="\'Permissions\'"><app-permission-selector [formField]="field" [groups]="groups"></app-permission-selector></app-form-field>',
		},
		{
			name: 'empty app-form-field',
			code: '<app-form-field [label]="\'Empty\'"></app-form-field>',
		},
	],
	invalid: [
		{
			name: 'multiple children',
			code: '<app-form-field [label]="\'Multi\'"><input [formField]="a" /><input [formField]="b" /></app-form-field>',
			errors: [{ messageId: 'multipleChildren' }],
		},
		{
			name: 'unsupported element',
			code: '<app-form-field [label]="\'Bad\'"><span>text</span></app-form-field>',
			errors: [{ messageId: 'unsupportedElement' }],
		},
		{
			name: 'input without [formField] directive',
			code: '<app-form-field [label]="\'No Directive\'"><input type="text" /></app-form-field>',
			errors: [{ messageId: 'missingDirective' }],
		},
		{
			name: 'select without [formField] directive',
			code: '<app-form-field [label]="\'No Directive\'"><select></select></app-form-field>',
			errors: [{ messageId: 'missingDirective' }],
		},
		{
			name: 'textarea without [formField] directive',
			code: '<app-form-field [label]="\'No Directive\'"><textarea></textarea></app-form-field>',
			errors: [{ messageId: 'missingDirective' }],
		},
	],
});
