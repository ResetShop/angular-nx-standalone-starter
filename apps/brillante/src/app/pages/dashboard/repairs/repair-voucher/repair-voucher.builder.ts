import type { Repair } from '@domain/repair/repair.model'

export interface RepairVoucherLabels {
	title: string
	customerSection: string
	fullName: string
	dni: string
	address: string
	telephone: string
	deviceSection: string
	model: string
	deviceId: string
	workDone: string
	checkIn: string
	checkOut: string
	/** Contains the `{months}` placeholder. */
	warranty: string
	noWarranty: string
	signature: string
}

export interface RepairVoucherOptions {
	now: Date
	locale: string
}

function escapeHtml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;')
}

function formatLongDate(date: Date, locale: string): string {
	return new Intl.DateTimeFormat(locale, { dateStyle: 'full' }).format(date)
}

function formatDateTime(date: Date | null, locale: string): string {
	if (!date) return '-'
	return new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeStyle: 'short' }).format(date)
}

function line(label: string, value: string): string {
	return `<p><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`
}

function customerSection(repair: Repair, labels: RepairVoucherLabels): string {
	const { customer } = repair
	return `<section>
<h2>${escapeHtml(labels.customerSection)}</h2>
${line(labels.fullName, customer.fullName)}
${line(labels.dni, String(customer.dni))}
${line(labels.address, customer.address)}
${line(labels.telephone, customer.telephone)}
</section>`
}

function deviceSection(repair: Repair, labels: RepairVoucherLabels): string {
	const { device } = repair
	const deviceId = device.deviceId ? line(labels.deviceId, device.deviceId) : ''
	return `<section>
<h2>${escapeHtml(labels.deviceSection)}</h2>
${line(labels.model, `${device.manufacturer} ${device.model}`.trim())}
${deviceId}
<p class="note"><strong>${escapeHtml(labels.workDone)}:</strong> ${escapeHtml(repair.note)}</p>
</section>`
}

function warrantyText(repair: Repair, labels: RepairVoucherLabels): string {
	return repair.warrantyTerm > 0 ? labels.warranty.replace('{months}', String(repair.warrantyTerm)) : labels.noWarranty
}

/**
 * Builds the standalone printable document handed to the customer when a repair is delivered.
 * Every dynamic value is escaped; the labels are supplied already translated.
 */
export function buildRepairVoucherHtml(
	repair: Repair,
	labels: RepairVoucherLabels,
	{ now, locale }: RepairVoucherOptions,
): string {
	const branches = ['25 de Mayo 3567 - Santa Fe', 'San Jerónimo 1767 - Santa Fe', 'Victoria 114 - Paraná']
	const contact = ['www.brillantestore.com', 'contacto@brillantestore.com']
	const header = [...branches, ...contact].map((text) => `<p>${escapeHtml(text)}</p>`).join('\n')

	return `<!doctype html>
<html lang="${escapeHtml(locale)}">
<head>
<meta charset="utf-8">
<title>${escapeHtml(labels.title)} #${repair.id ?? ''}</title>
<style>
body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 24mm 15mm; }
header { display: flex; justify-content: space-between; align-items: flex-start; }
header h1 { margin: 0; font-size: 28px; letter-spacing: 2px; }
header div { text-align: right; color: #555; font-size: 12px; }
header p { margin: 2px 0; }
.title { display: flex; justify-content: space-between; align-items: baseline; margin: 28px 0 8px; }
.title h2 { margin: 0; font-size: 22px; }
section { margin-top: 24px; }
section h2 { font-size: 18px; border-bottom: 1px solid #111; display: inline-block; padding-bottom: 2px; margin-bottom: 12px; }
p { margin: 8px 0; font-size: 14px; }
.note { white-space: pre-line; }
.signature { margin-top: 80px; border-top: 1px solid #111; width: 260px; padding-top: 4px; font-size: 12px; text-align: center; }
</style>
</head>
<body>
<header>
<h1>BRILLANTE</h1>
<div>
${header}
</div>
</header>
<div class="title">
<h2>${escapeHtml(labels.title)}</h2>
<span>${escapeHtml(formatLongDate(now, locale))}</span>
</div>
${customerSection(repair, labels)}
${deviceSection(repair, labels)}
<section>
${line(labels.checkIn, formatDateTime(repair.checkIn, locale))}
${line(labels.checkOut, formatDateTime(now, locale))}
<p>${escapeHtml(warrantyText(repair, labels))}</p>
</section>
<div class="signature">${escapeHtml(labels.signature)}</div>
</body>
</html>`
}
