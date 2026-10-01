import { mapRepairDto } from '@domain/repair/repair.mapper'
import type { Repair } from '@domain/repair/repair.model'
import { createMockRepairDto } from '@providers/repair/repair.mock'
import { buildRepairVoucherHtml, type RepairVoucherLabels } from './repair-voucher.builder'

const LABELS: RepairVoucherLabels = {
	title: 'TECHNICAL SERVICE',
	customerSection: 'Customer information',
	fullName: 'Full name',
	dni: 'DNI',
	address: 'Address',
	telephone: 'Phone',
	deviceSection: 'Device information',
	model: 'Model',
	deviceId: 'IMEI',
	workDone: 'Repair performed',
	checkIn: 'Check-in date',
	checkOut: 'Delivery date',
	warranty: 'Warranty: {months} months.',
	noWarranty: 'NO WARRANTY',
	signature: 'Customer signature',
}

const OPTIONS = { now: new Date(2024, 5, 10, 15, 30), locale: 'en-US' }

function buildFor(overrides: Partial<Repair> = {}): string {
	const repair = {
		...mapRepairDto(createMockRepairDto({ id: 9, checkIn: new Date(2024, 4, 1, 9, 5).toISOString(), warrantyTerm: 3 })),
		note: 'Cambio de pantalla',
		...overrides,
	}
	return buildRepairVoucherHtml(repair, LABELS, OPTIONS)
}

describe('buildRepairVoucherHtml', () => {
	it('builds a standalone document titled with the repair id', () => {
		const html = buildFor()

		expect(html).toContain('<!doctype html>')
		expect(html).toContain('<title>TECHNICAL SERVICE #9</title>')
		expect(html).toContain('lang="en-US"')
	})

	it('shows the business contact details', () => {
		const html = buildFor()

		expect(html).toContain('25 de Mayo 3567 - Santa Fe')
		expect(html).toContain('www.brillantestore.com')
		expect(html).toContain('contacto@brillantestore.com')
	})

	it('lists the customer data', () => {
		const html = buildFor()

		expect(html).toContain('<strong>Full name:</strong> Ada Lovelace')
		expect(html).toContain('<strong>DNI:</strong> 30123456')
		expect(html).toContain('<strong>Address:</strong> Calle Falsa 123')
		expect(html).toContain('<strong>Phone:</strong> 3425551234')
	})

	it('lists the device, its identifier and the work performed', () => {
		const html = buildFor()

		expect(html).toContain('<strong>Model:</strong> Samsung S21')
		expect(html).toContain('<strong>IMEI:</strong> 3569871')
		expect(html).toContain('<strong>Repair performed:</strong> Cambio de pantalla')
	})

	it('omits the device identifier when there is none', () => {
		const repair = mapRepairDto(createMockRepairDto())
		const html = buildFor({ device: { ...repair.device, deviceId: '' } })

		expect(html).not.toContain('IMEI')
	})

	it('prints the check-in and the delivery dates in the requested locale', () => {
		const html = buildFor()

		expect(html).toContain('<strong>Check-in date:</strong> 5/1/24, 9:05 AM')
		expect(html).toContain('<strong>Delivery date:</strong> 6/10/24, 3:30 PM')
		expect(html).toContain('Monday, June 10, 2024')
	})

	it('prints a dash when the repair has no check-in date', () => {
		const html = buildFor({ checkIn: null })

		expect(html).toContain('<strong>Check-in date:</strong> -')
	})

	it('states the warranty in months when the repair has one', () => {
		expect(buildFor({ warrantyTerm: 6 })).toContain('Warranty: 6 months.')
	})

	it('states that there is no warranty when the term is zero', () => {
		const html = buildFor({ warrantyTerm: 0 })

		expect(html).toContain('NO WARRANTY')
		expect(html).not.toContain('months')
	})

	it('escapes every dynamic value', () => {
		const repair = mapRepairDto(createMockRepairDto())
		const html = buildFor({
			note: '<script>alert("x")</script>',
			customer: { ...repair.customer, fullName: 'Tom & "Jerry" <b>' },
		})

		expect(html).not.toContain('<script>')
		expect(html).toContain('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;')
		expect(html).toContain('Tom &amp; &quot;Jerry&quot; &lt;b&gt;')
	})

	it('ends with the signature line', () => {
		expect(buildFor()).toContain('<div class="signature">Customer signature</div>')
	})
})
