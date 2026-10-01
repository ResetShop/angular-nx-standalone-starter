import { Component, computed, inject, signal } from '@angular/core'
import { form, required, schema, FormField as SignalFormField } from '@angular/forms/signals'
import { PageShell } from '@components/page-shell/page-shell'
import type { CashReportRequest } from '@contracts/report/cash-report.types'
import { toCashReportCsv } from '@domain/report/cash-report.csv'
import { formatReportDateTime, formatReportDay } from '@domain/report/cash-report.format'
import type { CashReportEntry, CashReportGroup } from '@domain/report/cash-report.interface'
import { AppTranslation } from '@providers/i18n/app-translation'
import type { AppTranslationKey } from '@providers/i18n/app-translations'
import { TranslatePipe } from '@resetshop/angular-core/i18n/translate.pipe'
import { Translation } from '@resetshop/angular-core/i18n/translation'
import { Alert, AlertDescription } from '@resetshop/ui/alert/alert'
import { Button } from '@resetshop/ui/button/button'
import { DataTable } from '@resetshop/ui/data-table/data-table'
import { DataTableCellDef } from '@resetshop/ui/data-table/data-table-cell-def'
import { FormField } from '@resetshop/ui/form-field/form-field'
import { Select } from '@resetshop/ui/select/select'
import type { SelectOption } from '@resetshop/ui/select/select-option'
import { Spinner } from '@resetshop/ui/spinner/spinner'
import { CashReportStore } from '@store/cash-report/cash-report.store'
import { OfficeBranchStore } from '@store/office-branch/office-branch.store'
import type { ColumnDef } from '@tanstack/angular-table'
import { downloadCsv } from './download-csv'

interface CashReportFilterForm {
	startDate: string
	endDate: string
	/** Branch id as text, or `'all'` to report every branch. */
	branchId: string
}

/**
 * Cash report: pick a period and branch, generate the report and review the totals, the
 * breakdowns by concept and payment method and every movement, which can also be exported as CSV.
 */
@Component({
	selector: 'app-cash-report',
	imports: [
		Alert,
		AlertDescription,
		Button,
		DataTable,
		DataTableCellDef,
		FormField,
		PageShell,
		Select,
		SignalFormField,
		Spinner,
		TranslatePipe,
	],
	template: `
		<app-page-shell [loading]="false" [title]="'REPORTS.CASH.TITLE' | translate">
			<p pageDescription>{{ 'REPORTS.CASH.DESCRIPTION' | translate }}</p>

			<form (submit)="onGenerate($event)" class="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<app-form-field [label]="'REPORTS.CASH.FILTERS.FROM' | translate">
					<input [formField]="filterForm.startDate" type="date" />
				</app-form-field>
				<app-form-field [label]="'REPORTS.CASH.FILTERS.TO' | translate">
					<input [formField]="filterForm.endDate" type="date" />
				</app-form-field>
				<app-form-field [label]="'REPORTS.CASH.FILTERS.BRANCH' | translate">
					<app-select [formField]="filterForm.branchId" [options]="branchOptions()" />
				</app-form-field>
				<div class="flex gap-3">
					<button [disabled]="!canGenerate()" appButton type="submit">
						{{ 'REPORTS.CASH.FILTERS.GENERATE' | translate }}
					</button>
					@if (store.entries().length > 0) {
						<button (click)="exportCsv()" appButton variant="outline" type="button">
							{{ 'REPORTS.CASH.EXPORT' | translate }}
						</button>
					}
				</div>
			</form>

			@if (isRangeInvalid()) {
				<p role="alert" class="text-destructive text-sm">{{ 'REPORTS.CASH.FILTERS.INVALID_RANGE' | translate }}</p>
			}

			@if (store.readError().list; as error) {
				<div appAlert variant="destructive">
					<p appAlertDescription>{{ error }}</p>
				</div>
			}

			@if (store.isLoadingList()) {
				<div class="text-muted-foreground flex items-center justify-center gap-2 py-16" role="status">
					<app-spinner class="size-5" />
					{{ 'COMMON.LOADING' | translate }}
				</div>
			} @else if (!store.hasGenerated()) {
				@if (!store.hasReadError()) {
					<p class="text-muted-foreground" data-testid="report-prompt">{{ 'REPORTS.CASH.PROMPT' | translate }}</p>
				}
			} @else if (store.entries().length === 0) {
				<p class="text-muted-foreground" data-testid="report-empty">{{ 'REPORTS.CASH.NO_RESULTS' | translate }}</p>
			} @else {
				<section aria-labelledby="cash-summary-title" class="space-y-4">
					<h2 id="cash-summary-title" class="text-foreground text-lg font-semibold">
						{{ 'REPORTS.CASH.SUMMARY.TITLE' | translate }}
					</h2>
					<dl class="grid grid-cols-1 gap-4 sm:grid-cols-3">
						<div class="border-border bg-card rounded-lg border p-4">
							<dt class="text-muted-foreground text-sm">{{ 'REPORTS.CASH.SUMMARY.INCOME' | translate }}</dt>
							<dd class="text-foreground text-xl font-semibold" data-testid="total-income">
								{{ formatMoney(store.summary().totals.income) }}
							</dd>
						</div>
						<div class="border-border bg-card rounded-lg border p-4">
							<dt class="text-muted-foreground text-sm">{{ 'REPORTS.CASH.SUMMARY.EXPENSE' | translate }}</dt>
							<dd class="text-foreground text-xl font-semibold" data-testid="total-expense">
								{{ formatMoney(store.summary().totals.expense) }}
							</dd>
						</div>
						<div class="border-border bg-card rounded-lg border p-4">
							<dt class="text-muted-foreground text-sm">{{ 'REPORTS.CASH.SUMMARY.BALANCE' | translate }}</dt>
							<dd class="text-foreground text-xl font-semibold" data-testid="total-balance">
								{{ formatMoney(store.summary().totals.balance) }}
							</dd>
						</div>
					</dl>

					<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
						<app-data-table
							[columns]="conceptGroupColumns()"
							[data]="byConcept()"
							[caption]="'REPORTS.CASH.SUMMARY.BY_CONCEPT' | translate"
						>
							<ng-template appDataTableCellDef="income" let-value>{{ formatMoney(value) }}</ng-template>
							<ng-template appDataTableCellDef="expense" let-value>{{ formatMoney(value) }}</ng-template>
							<ng-template appDataTableCellDef="balance" let-value>{{ formatMoney(value) }}</ng-template>
						</app-data-table>
						<app-data-table
							[columns]="paymentMethodGroupColumns()"
							[data]="byPaymentMethod()"
							[caption]="'REPORTS.CASH.SUMMARY.BY_PAYMENT_METHOD' | translate"
						>
							<ng-template appDataTableCellDef="income" let-value>{{ formatMoney(value) }}</ng-template>
							<ng-template appDataTableCellDef="expense" let-value>{{ formatMoney(value) }}</ng-template>
							<ng-template appDataTableCellDef="balance" let-value>{{ formatMoney(value) }}</ng-template>
						</app-data-table>
					</div>
				</section>

				<section aria-labelledby="cash-movements-title" class="space-y-4">
					<h2 id="cash-movements-title" class="text-foreground text-lg font-semibold">
						{{ 'REPORTS.CASH.TABLE.TITLE' | translate }}
					</h2>
					<app-data-table
						[columns]="entryColumns()"
						[data]="store.entries()"
						[caption]="'REPORTS.CASH.TABLE.CAPTION' | translate"
					>
						<ng-template appDataTableCellDef="income" let-value>{{ formatMoney(value) }}</ng-template>
						<ng-template appDataTableCellDef="expense" let-value>{{ formatMoney(value) }}</ng-template>
						<ng-template appDataTableCellDef="balance" let-value>{{ formatMoney(value) }}</ng-template>
					</app-data-table>
				</section>
			}
		</app-page-shell>
	`,
})
export default class CashReport {
	protected readonly store = inject(CashReportStore)
	private readonly officeBranchStore = inject(OfficeBranchStore)
	private readonly translation = inject(AppTranslation)
	private readonly languageTranslation = inject(Translation)

	private readonly filterModel = signal<CashReportFilterForm>({
		startDate: formatReportDay(new Date()),
		endDate: formatReportDay(new Date()),
		branchId: 'all',
	})
	protected readonly filterForm = form(
		this.filterModel,
		schema<CashReportFilterForm>((filter) => {
			required(filter.startDate)
			required(filter.endDate)
		}),
	)

	/** `yyyy-MM-dd` strings order like the dates they stand for, so they compare directly. */
	// The branches feed the branch filter and today's report is generated as soon as the page is created.
	private readonly loadBranchesRequest = this.officeBranchStore.loadBranches()
	private readonly initialReportRequest = this.generate()

	protected readonly isRangeInvalid = computed(() => {
		const { startDate, endDate } = this.filterModel()
		return startDate !== '' && endDate !== '' && endDate < startDate
	})
	protected readonly canGenerate = computed(
		() => this.filterForm().valid() && !this.isRangeInvalid() && !this.store.isLoadingList(),
	)

	protected readonly branchOptions = computed<SelectOption[]>(() => [
		{ value: 'all', label: this.translation.instant('REPORTS.CASH.FILTERS.ALL_BRANCHES') },
		...this.officeBranchStore.branches().map((branch) => ({ value: String(branch.id), label: branch.name })),
	])

	protected readonly entryColumns = computed((): ColumnDef<CashReportEntry, unknown>[] => {
		return [
			{ accessorKey: 'id', header: this.text('REPORTS.CASH.TABLE.HEADER.ID') },
			{
				id: 'date',
				header: this.text('REPORTS.CASH.TABLE.HEADER.DATE'),
				accessorFn: (entry) => formatReportDateTime(entry.date),
			},
			{ accessorKey: 'branchName', header: this.text('REPORTS.CASH.TABLE.HEADER.BRANCH') },
			{ accessorKey: 'conceptName', header: this.text('REPORTS.CASH.TABLE.HEADER.CONCEPT') },
			{ accessorKey: 'subconceptName', header: this.text('REPORTS.CASH.TABLE.HEADER.SUBCONCEPT') },
			{ accessorKey: 'note', header: this.text('REPORTS.CASH.TABLE.HEADER.NOTE') },
			{ accessorKey: 'paymentMethodName', header: this.text('REPORTS.CASH.TABLE.HEADER.PAYMENT_METHOD') },
			{ accessorKey: 'income', header: this.text('REPORTS.CASH.TABLE.HEADER.INCOME') },
			{ accessorKey: 'expense', header: this.text('REPORTS.CASH.TABLE.HEADER.EXPENSE') },
			{ accessorKey: 'balance', header: this.text('REPORTS.CASH.TABLE.HEADER.BALANCE') },
			{ accessorKey: 'createdBy', header: this.text('REPORTS.CASH.TABLE.HEADER.CREATED_BY') },
		]
	})

	protected readonly byConcept = computed(() => [...this.store.summary().byConcept])
	protected readonly byPaymentMethod = computed(() => [...this.store.summary().byPaymentMethod])
	protected readonly conceptGroupColumns = computed(() =>
		this.groupColumns(this.translation.instant('REPORTS.CASH.SUMMARY.CONCEPT')),
	)
	protected readonly paymentMethodGroupColumns = computed(() =>
		this.groupColumns(this.translation.instant('REPORTS.CASH.SUMMARY.PAYMENT_METHOD')),
	)

	protected onGenerate(event: Event): void {
		event.preventDefault()
		if (this.canGenerate()) {
			this.generate()
		}
	}

	protected exportCsv(): void {
		const request = this.store.request()
		if (!request) return

		const csv = toCashReportCsv(this.store.entries(), {
			id: this.text('REPORTS.CASH.TABLE.HEADER.ID'),
			date: this.text('REPORTS.CASH.TABLE.HEADER.DATE'),
			branch: this.text('REPORTS.CASH.TABLE.HEADER.BRANCH'),
			concept: this.text('REPORTS.CASH.TABLE.HEADER.CONCEPT'),
			subconcept: this.text('REPORTS.CASH.TABLE.HEADER.SUBCONCEPT'),
			note: this.text('REPORTS.CASH.TABLE.HEADER.NOTE'),
			paymentMethod: this.text('REPORTS.CASH.TABLE.HEADER.PAYMENT_METHOD'),
			income: this.text('REPORTS.CASH.TABLE.HEADER.INCOME'),
			expense: this.text('REPORTS.CASH.TABLE.HEADER.EXPENSE'),
			balance: this.text('REPORTS.CASH.TABLE.HEADER.BALANCE'),
			createdBy: this.text('REPORTS.CASH.TABLE.HEADER.CREATED_BY'),
		})
		const fileName = this.translation
			.instant('REPORTS.CASH.EXPORT_FILE_NAME')
			.replace('{from}', request.startDate)
			.replace('{to}', request.endDate)
		downloadCsv(fileName, csv)
	}

	protected formatMoney(amount: unknown): string {
		const locale = this.languageTranslation.currentLanguage() === 'es' ? 'es-AR' : 'en-US'
		return new Intl.NumberFormat(locale, { style: 'currency', currency: 'ARS' }).format(Number(amount))
	}

	private generate(): void {
		const { startDate, endDate, branchId } = this.filterModel()
		const request: CashReportRequest = {
			startDate,
			endDate,
			...(branchId === 'all' ? {} : { branchId: Number(branchId) }),
		}
		this.store.generate(request)
	}

	private text(key: AppTranslationKey): string {
		return this.translation.instant(key)
	}

	private groupColumns(labelHeader: string): ColumnDef<CashReportGroup, unknown>[] {
		return [
			{ accessorKey: 'label', header: labelHeader },
			{ accessorKey: 'count', header: this.text('REPORTS.CASH.SUMMARY.MOVEMENTS') },
			{
				accessorKey: 'income',
				header: this.text('REPORTS.CASH.TABLE.HEADER.INCOME'),
			},
			{
				accessorKey: 'expense',
				header: this.text('REPORTS.CASH.TABLE.HEADER.EXPENSE'),
			},
			{
				accessorKey: 'balance',
				header: this.text('REPORTS.CASH.TABLE.HEADER.BALANCE'),
			},
		]
	}
}
