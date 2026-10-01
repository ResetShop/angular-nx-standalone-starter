import { RepairStatusId } from '@contracts/repair/repair-status.constants'
import { createMockRepairDto } from '@pages/dashboard/repairs/repair.mock'
import { canGenerateVoucher, isFinishedStatus, shouldGenerateTransaction } from './repair.functions'
import { mapRepairDto } from './repair.mapper'
import type { Repair } from './repair.model'

function repairWith(overrides: Partial<Repair>): Repair {
	return { ...mapRepairDto(createMockRepairDto()), ...overrides }
}

describe('repair functions', () => {
	describe('isFinishedStatus', () => {
		it.each([
			RepairStatusId.FINISHED_AND_PAID,
			RepairStatusId.RETURNED_WITHOUT_REPAIR,
			RepairStatusId.FINISHED_DIAGNOSTICS,
		])('treats status %i as finished', (id) => {
			expect(isFinishedStatus(id)).toBe(true)
		})

		it.each([
			RepairStatusId.ENTERED,
			RepairStatusId.IN_PROGRESS,
			RepairStatusId.READY_FOR_DELIVER,
			RepairStatusId.FINISHED_BY_WARRANTY,
		])('treats status %i as open', (id) => {
			expect(isFinishedStatus(id)).toBe(false)
		})
	})

	describe('shouldGenerateTransaction', () => {
		it('generates the transaction when a finished repair has a price', () => {
			expect(shouldGenerateTransaction(RepairStatusId.FINISHED_AND_PAID, 500)).toBe(true)
		})

		it('does not generate it for a finished repair without a price', () => {
			expect(shouldGenerateTransaction(RepairStatusId.FINISHED_AND_PAID, 0)).toBe(false)
		})

		it('does not generate it for an open repair', () => {
			expect(shouldGenerateTransaction(RepairStatusId.IN_PROGRESS, 500)).toBe(false)
		})
	})

	describe('canGenerateVoucher', () => {
		const ready = {
			status: { id: RepairStatusId.READY_FOR_DELIVER, description: '' },
			note: 'Cambio de pantalla',
			price: 900,
		}

		it('allows a repair the customer is waiting on with a note and a price', () => {
			expect(canGenerateVoucher(repairWith(ready))).toBe(true)
		})

		it.each([
			RepairStatusId.REQUIRES_CUSTOMER_INTERVENTION,
			RepairStatusId.FINISHED_AND_PAID,
			RepairStatusId.IN_BOARD_REPAIR,
		])('allows status %i', (id) => {
			expect(canGenerateVoucher(repairWith({ ...ready, status: { id, description: '' } }))).toBe(true)
		})

		it('rejects a repair still being worked on', () => {
			const status = { id: RepairStatusId.IN_PROGRESS, description: '' }

			expect(canGenerateVoucher(repairWith({ ...ready, status }))).toBe(false)
		})

		it('rejects a repair without a note', () => {
			expect(canGenerateVoucher(repairWith({ ...ready, note: '   ' }))).toBe(false)
		})

		it('rejects a repair without a price', () => {
			expect(canGenerateVoucher(repairWith({ ...ready, price: 0 }))).toBe(false)
		})
	})
})
