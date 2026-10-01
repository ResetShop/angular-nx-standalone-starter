import { TestBed } from '@angular/core/testing'
import type { CashTransactionQuery } from '@contracts/cash/cash-transaction.types'
import type { CashTransactionDraft } from '@domain/cash/cash-request.mapper'
import { CashConceptApi } from '@providers/cash-concept/cash-concept.interface'
import { CashApi } from '@providers/cash/cash.interface'
import {
	createMockCashTransactionDto,
	createMockConceptDto,
	createMockPaymentMethodDto,
} from '@providers/cash/cash.mock'
import { mockBranch, provideCashTestEnvironment, signInAndAssignBranch } from '@providers/cash/cash.testing'
import { PaymentMethodApi } from '@providers/payment-method/payment-method.interface'
import { clearAllMocks, fn, type MockFn, spyOn } from '@resetshop/util/test-utils'
import { OfficeBranchStore } from '@store/office-branch/office-branch.store'
import { startOfDay } from 'date-fns'
import { NEVER, of, throwError } from 'rxjs'
import { CashStore } from './cash.store'

describe('CashStore', () => {
	let store: InstanceType<typeof CashStore>
	let cashApiMock: Record<keyof CashApi, MockFn>
	let conceptApiMock: Record<keyof CashConceptApi, MockFn>
	let paymentMethodApiMock: Record<keyof PaymentMethodApi, MockFn>

	const parentConcept = createMockConceptDto({ id: 1, description: 'Ventas', parent: null })
	const conceptTree = [{ ...parentConcept, children: [createMockConceptDto({ id: 11, parent: parentConcept })] }]

	const draft: CashTransactionDraft = {
		concept: conceptTree[0].children[0],
		note: 'Venta de mostrador',
		date: new Date('2026-03-04T15:30:00.000Z'),
		payments: [
			{
				amount: 1500,
				paymentMethod: { id: 1, description: 'Efectivo', allowsInstallments: false, installments: [] },
			},
		],
	}

	function lastQuery(): CashTransactionQuery {
		return cashApiMock.getAll.calls.at(-1)?.[0] as CashTransactionQuery
	}

	function setupStore({ signedIn = true }: { signedIn?: boolean } = {}): void {
		TestBed.configureTestingModule({
			providers: [
				CashStore,
				...provideCashTestEnvironment({
					cashApi: cashApiMock,
					conceptApi: conceptApiMock,
					paymentMethodApi: paymentMethodApiMock,
				}),
			],
		})
		if (signedIn) signInAndAssignBranch()
		store = TestBed.inject(CashStore)
		TestBed.tick()
	}

	beforeEach(() => {
		clearAllMocks()
		localStorage.clear()
		spyOn(console, 'error')

		cashApiMock = {
			getAll: fn(),
			getById: fn(),
			create: fn(),
			update: fn(),
			remove: fn(),
			open: fn(),
			close: fn(),
		}
		conceptApiMock = { getAll: fn(), create: fn(), update: fn(), enable: fn(), disable: fn() }
		paymentMethodApiMock = { getAll: fn() }

		cashApiMock.getAll.mockReturnValue(of([]))
		conceptApiMock.getAll.mockReturnValue(of(conceptTree))
		paymentMethodApiMock.getAll.mockReturnValue(of([createMockPaymentMethodDto()]))
	})

	describe('initial load', () => {
		it('should load the transactions of today for the assigned branch', () => {
			setupStore()

			const today = startOfDay(new Date())
			expect(lastQuery()).toEqual({ from: today, to: today, branchId: mockBranch.id })
		})

		it('should expose loading while the list is pending', () => {
			cashApiMock.getAll.mockReturnValue(NEVER)
			setupStore()

			expect(store.isLoadingList()).toBe(true)
			expect(store.isAnyLoading()).toBe(true)
		})

		it('should map the wire transactions to domain transactions', () => {
			cashApiMock.getAll.mockReturnValue(
				of([createMockCashTransactionDto({ id: 7, amount: '2500.50', date: '2026-03-04T15:30:00.000Z' })]),
			)
			setupStore()

			expect(store.transactions()).toHaveLength(1)
			expect(store.transactions()[0].amount).toBe(2500.5)
			expect(store.transactions()[0].date).toEqual(new Date('2026-03-04T15:30:00.000Z'))
			expect(store.isLoadingList()).toBe(false)
		})

		it('should load the concept tree and keep only the assignable concepts for pickers', () => {
			setupStore()

			expect(store.concepts()).toEqual(conceptTree)
			expect(store.assignableConcepts().map((concept) => concept.id)).toEqual([1])
		})

		it('should load the payment methods with parsed interest rates', () => {
			paymentMethodApiMock.getAll.mockReturnValue(
				of([
					createMockPaymentMethodDto({
						id: 6,
						allowsInstallments: true,
						installments: [
							{ installments: 1, interestRate: '0.05' },
							{ installments: 3, interestRate: '0.12' },
						],
					}),
				]),
			)
			setupStore()

			expect(store.paymentMethods()[0].installments[1].interestRate).toBe(0.12)
		})

		it('should query without a branch when none is assigned', () => {
			setupStore({ signedIn: false })

			expect(lastQuery().branchId).toBeUndefined()
		})
	})

	describe('read errors', () => {
		it('should report a list failure', () => {
			cashApiMock.getAll.mockReturnValue(throwError(() => new Error('boom')))
			setupStore()

			expect(store.readError().list).toBe('The transactions could not be loaded.')
			expect(store.hasReadError()).toBe(true)
			expect(store.isLoadingList()).toBe(false)
		})

		it('should report a concepts failure', () => {
			conceptApiMock.getAll.mockReturnValue(throwError(() => new Error('boom')))
			setupStore()

			expect(store.readError().concepts).toBe('The transaction concepts could not be loaded.')
			expect(store.isLoadingConcepts()).toBe(false)
		})

		it('should report a payment methods failure', () => {
			paymentMethodApiMock.getAll.mockReturnValue(throwError(() => new Error('boom')))
			setupStore()

			expect(store.readError().paymentMethods).toBe('The payment methods could not be loaded.')
			expect(store.isLoadingPaymentMethods()).toBe(false)
		})

		it('should clear every error', () => {
			cashApiMock.getAll.mockReturnValue(throwError(() => new Error('boom')))
			setupStore()

			store.clearErrors()

			expect(store.hasReadError()).toBe(false)
			expect(store.hasMutationError()).toBe(false)
		})
	})

	describe('period', () => {
		it('should reload when the branch changes', () => {
			setupStore()
			const callsBefore = cashApiMock.getAll.calls.length

			TestBed.inject(OfficeBranchStore).assign({ id: 9, name: 'Norte', address: 'Belgrano 5' })
			TestBed.tick()

			expect(cashApiMock.getAll.calls).toHaveLength(callsBefore + 1)
			expect(lastQuery().branchId).toBe(9)
		})

		it('should reload the new range', () => {
			setupStore()

			store.setDateRange(new Date(2026, 2, 1, 10), new Date(2026, 2, 4, 18))
			TestBed.tick()

			expect(lastQuery()).toEqual(expect.objectContaining({ from: new Date(2026, 2, 1), to: new Date(2026, 2, 4) }))
		})

		it('should swap a reversed range', () => {
			setupStore()

			store.setDateRange(new Date(2026, 2, 4), new Date(2026, 2, 1))
			TestBed.tick()

			expect(store.dateFrom()).toEqual(new Date(2026, 2, 1))
			expect(store.dateTo()).toEqual(new Date(2026, 2, 4))
		})

		it('should go back to today', () => {
			setupStore()
			store.setDateRange(new Date(2026, 2, 1), new Date(2026, 2, 4))

			store.setToday()

			expect(store.dateFrom()).toEqual(startOfDay(new Date()))
			expect(store.includesToday()).toBe(true)
		})

		it('should clear the selection when the range changes', () => {
			cashApiMock.getAll.mockReturnValue(of([createMockCashTransactionDto({ id: 1 })]))
			setupStore()
			store.selectTransaction(store.transactions()[0])

			store.setDateRange(new Date(2026, 2, 1), new Date(2026, 2, 4))

			expect(store.selectedTransaction()).toBeNull()
		})
	})

	describe('totals and register state', () => {
		const income = createMockCashTransactionDto({ id: 1, amount: '1000.00' })
		const expenseConcept = createMockConceptDto({ transactionType: { id: 0, description: 'Egreso' } })
		const expense = createMockCashTransactionDto({ id: 2, amount: '250.00', concept: expenseConcept })

		it('should total incomes, expenses and balance', () => {
			cashApiMock.getAll.mockReturnValue(of([income, expense]))
			setupStore()

			expect(store.totals()).toEqual({ incomes: 1000, expenses: 250, balance: 750 })
		})

		it('should allow opening an empty register today', () => {
			setupStore()

			expect(store.canOpenRegister()).toBe(true)
			expect(store.canOperateRegister()).toBe(false)
		})

		it('should allow operating a register with movements today', () => {
			cashApiMock.getAll.mockReturnValue(of([income]))
			setupStore()

			expect(store.canOpenRegister()).toBe(false)
			expect(store.canOperateRegister()).toBe(true)
		})

		it('should not allow opening or operating a past period', () => {
			setupStore()

			store.setDateRange(new Date(2020, 0, 1), new Date(2020, 0, 2))

			expect(store.canOpenRegister()).toBe(false)
			expect(store.canOperateRegister()).toBe(false)
		})
	})

	describe('selection and detail', () => {
		it('should select a transaction', () => {
			cashApiMock.getAll.mockReturnValue(of([createMockCashTransactionDto({ id: 4 })]))
			setupStore()

			store.selectTransaction(store.transactions()[0])

			expect(store.selectedTransaction()?.id).toBe(4)
		})

		it('should keep the selection fresh after a reload', () => {
			cashApiMock.getAll.mockReturnValue(of([createMockCashTransactionDto({ id: 4, note: 'Antes' })]))
			setupStore()
			store.selectTransaction(store.transactions()[0])
			cashApiMock.getAll.mockReturnValue(of([createMockCashTransactionDto({ id: 4, note: 'Después' })]))

			store.reload()

			expect(store.selectedTransaction()?.note).toBe('Después')
		})

		it('should load a transaction by id', () => {
			cashApiMock.getById.mockReturnValue(of(createMockCashTransactionDto({ id: 77 })))
			setupStore()

			store.loadTransaction(77)

			expect(cashApiMock.getById.calls[0]).toEqual([77])
			expect(store.selectedTransaction()?.id).toBe(77)
			expect(store.isLoadingDetail()).toBe(false)
		})

		it('should keep a transaction loaded by id when the list does not contain it', () => {
			cashApiMock.getById.mockReturnValue(of(createMockCashTransactionDto({ id: 77 })))
			setupStore()
			store.loadTransaction(77)

			store.reload()

			expect(store.selectedTransaction()?.id).toBe(77)
		})

		it('should report a detail failure', () => {
			cashApiMock.getById.mockReturnValue(throwError(() => new Error('boom')))
			setupStore()

			store.loadTransaction(77)

			expect(store.readError().detail).toBe('The transaction could not be loaded.')
			expect(store.selectedTransaction()).toBeNull()
		})
	})

	describe('createTransaction', () => {
		beforeEach(() => {
			cashApiMock.create.mockReturnValue(of([createMockCashTransactionDto()]))
		})

		it('should send the request with the signed-in user and the assigned branch', () => {
			setupStore()

			store.createTransaction(draft)

			const [request, user, branch] = cashApiMock.create.calls[0] as [
				{ amount: number; date: string },
				{ id: number },
				{ id: number },
			]
			expect(request.amount).toBe(1500)
			expect(request.date).toBe('2026-03-04T15:30:00.000Z')
			expect(user.id).toBe(1)
			expect(branch.id).toBe(mockBranch.id)
		})

		it('should reload the list after creating', () => {
			setupStore()
			const callsBefore = cashApiMock.getAll.calls.length

			store.createTransaction(draft)

			expect(cashApiMock.getAll.calls).toHaveLength(callsBefore + 1)
			expect(store.isCreating()).toBe(false)
			expect(store.mutationError().create).toBeNull()
		})

		it('should expose the pending state', () => {
			cashApiMock.create.mockReturnValue(NEVER)
			setupStore()

			store.createTransaction(draft)

			expect(store.isCreating()).toBe(true)
			expect(store.isMutating()).toBe(true)
		})

		it('should report a failure and not reload', () => {
			cashApiMock.create.mockReturnValue(throwError(() => new Error('boom')))
			setupStore()
			const callsBefore = cashApiMock.getAll.calls.length

			store.createTransaction(draft)

			expect(store.mutationError().create).toBe('The transaction could not be created.')
			expect(store.isCreating()).toBe(false)
			expect(cashApiMock.getAll.calls).toHaveLength(callsBefore)
		})

		it('should refuse to create without an assigned branch', () => {
			setupStore({ signedIn: false })
			signInAndAssignBranch({}, null)

			store.createTransaction(draft)

			expect(cashApiMock.create.calls).toHaveLength(0)
			expect(store.mutationError().create).toBe('Assign a branch to this device before operating the cash register.')
		})

		it('should clear a single mutation error', () => {
			cashApiMock.create.mockReturnValue(throwError(() => new Error('boom')))
			setupStore()
			store.createTransaction(draft)

			store.clearMutationError('create')

			expect(store.mutationError().create).toBeNull()
		})
	})

	describe('updateTransaction', () => {
		it('should send the request with the user and reload', () => {
			cashApiMock.update.mockReturnValue(of([1]))
			setupStore()
			const callsBefore = cashApiMock.getAll.calls.length

			store.updateTransaction({ ...draft, id: 12 })

			const [request, user] = cashApiMock.update.calls[0] as [{ id: number }, { id: number }]
			expect(request.id).toBe(12)
			expect(user.id).toBe(1)
			expect(cashApiMock.getAll.calls).toHaveLength(callsBefore + 1)
			expect(store.isUpdating()).toBe(false)
		})

		it('should report a failure', () => {
			cashApiMock.update.mockReturnValue(throwError(() => new Error('boom')))
			setupStore()

			store.updateTransaction({ ...draft, id: 12 })

			expect(store.mutationError().update).toBe('The transaction could not be updated.')
			expect(store.isUpdating()).toBe(false)
		})

		it('should report a failure when nobody is signed in', () => {
			setupStore({ signedIn: false })

			store.updateTransaction({ ...draft, id: 12 })

			expect(cashApiMock.update.calls).toHaveLength(0)
			expect(store.mutationError().update).toBe('The transaction could not be updated.')
		})
	})

	describe('deleteTransaction', () => {
		it('should delete, clear the selection of the deleted transaction and reload', () => {
			cashApiMock.getAll.mockReturnValue(of([createMockCashTransactionDto({ id: 5 })]))
			cashApiMock.remove.mockReturnValue(of({}))
			setupStore()
			store.selectTransaction(store.transactions()[0])
			const callsBefore = cashApiMock.getAll.calls.length

			store.deleteTransaction(5)

			expect(cashApiMock.remove.calls[0]).toEqual([5])
			expect(store.selectedTransaction()).toBeNull()
			expect(cashApiMock.getAll.calls).toHaveLength(callsBefore + 1)
			expect(store.isDeleting()).toBe(false)
		})

		it('should keep the selection when another transaction is deleted', () => {
			cashApiMock.getAll.mockReturnValue(
				of([createMockCashTransactionDto({ id: 5 }), createMockCashTransactionDto({ id: 6 })]),
			)
			cashApiMock.remove.mockReturnValue(of({}))
			setupStore()
			store.selectTransaction(store.transactions()[0])

			store.deleteTransaction(6)

			expect(store.selectedTransaction()?.id).toBe(5)
		})

		it('should report a failure', () => {
			cashApiMock.remove.mockReturnValue(throwError(() => new Error('boom')))
			setupStore()

			store.deleteTransaction(5)

			expect(store.mutationError().delete).toBe('The transaction could not be deleted.')
			expect(store.isDeleting()).toBe(false)
		})
	})

	describe('openRegister', () => {
		it('should open the register with the user and branch and reload', () => {
			cashApiMock.open.mockReturnValue(of(createMockCashTransactionDto()))
			setupStore()
			const callsBefore = cashApiMock.getAll.calls.length

			store.openRegister()

			const [user, branch] = cashApiMock.open.calls[0] as [{ id: number }, { id: number }]
			expect(user.id).toBe(1)
			expect(branch.id).toBe(mockBranch.id)
			expect(cashApiMock.getAll.calls).toHaveLength(callsBefore + 1)
			expect(store.isOpening()).toBe(false)
		})

		it('should report a failure', () => {
			cashApiMock.open.mockReturnValue(throwError(() => new Error('boom')))
			setupStore()

			store.openRegister()

			expect(store.mutationError().open).toBe('The cash register could not be opened.')
		})

		it('should refuse to open without a branch', () => {
			setupStore({ signedIn: false })

			store.openRegister()

			expect(cashApiMock.open.calls).toHaveLength(0)
			expect(store.mutationError().open).toBe('Assign a branch to this device before operating the cash register.')
		})
	})

	describe('closeRegister', () => {
		it('should close the register of the branch and reload', () => {
			cashApiMock.close.mockReturnValue(of({}))
			setupStore()
			const callsBefore = cashApiMock.getAll.calls.length

			store.closeRegister()

			expect(cashApiMock.close.calls[0]).toEqual([mockBranch])
			expect(cashApiMock.getAll.calls).toHaveLength(callsBefore + 1)
			expect(store.isClosing()).toBe(false)
		})

		it('should report a failure', () => {
			cashApiMock.close.mockReturnValue(throwError(() => new Error('boom')))
			setupStore()

			store.closeRegister()

			expect(store.mutationError().close).toBe('The cash register could not be closed.')
		})

		it('should refuse to close without a branch', () => {
			setupStore({ signedIn: false })

			store.closeRegister()

			expect(cashApiMock.close.calls).toHaveLength(0)
			expect(store.mutationError().close).toBe('Assign a branch to this device before operating the cash register.')
		})
	})
})
