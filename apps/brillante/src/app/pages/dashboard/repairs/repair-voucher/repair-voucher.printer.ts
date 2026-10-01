import { DOCUMENT } from '@angular/common'
import { inject, Injectable } from '@angular/core'
import type { Repair } from '@domain/repair/repair.model'
import { AppTranslation } from '@providers/i18n/app-translation'
import { Translation } from '@resetshop/angular-core/i18n/translation'
import { parseDurationToMs } from '@resetshop/util'
import { buildRepairVoucherHtml, type RepairVoucherLabels } from './repair-voucher.builder'

/**
 * Prints the delivery voucher of a repair. The voucher is rendered inside a hidden iframe so the
 * browser print dialog shows the voucher alone, without the dashboard shell around it.
 */
@Injectable({ providedIn: 'root' })
export class RepairVoucherPrinter {
	private readonly document = inject(DOCUMENT)
	private readonly translation = inject(AppTranslation)
	private readonly language = inject(Translation)

	public print(repair: Repair, now: Date = new Date()): void {
		const locale = this.language.getCurrentLanguage() === 'es' ? 'es-AR' : 'en-US'
		const html = buildRepairVoucherHtml(repair, this.labels(), { now, locale })
		this.printHtml(html)
	}

	private labels(): RepairVoucherLabels {
		const t = (key: Parameters<AppTranslation['instant']>[0]): string => this.translation.instant(key)
		return {
			title: t('REPAIRS.VOUCHER.TITLE'),
			customerSection: t('REPAIRS.VOUCHER.CUSTOMER_SECTION'),
			fullName: t('REPAIRS.VOUCHER.FULL_NAME'),
			dni: t('REPAIRS.VOUCHER.DNI'),
			address: t('REPAIRS.VOUCHER.ADDRESS'),
			telephone: t('REPAIRS.VOUCHER.TELEPHONE'),
			deviceSection: t('REPAIRS.VOUCHER.DEVICE_SECTION'),
			model: t('REPAIRS.VOUCHER.MODEL'),
			deviceId: t('REPAIRS.VOUCHER.DEVICE_ID'),
			workDone: t('REPAIRS.VOUCHER.WORK_DONE'),
			checkIn: t('REPAIRS.VOUCHER.CHECK_IN'),
			checkOut: t('REPAIRS.VOUCHER.CHECK_OUT'),
			warranty: t('REPAIRS.VOUCHER.WARRANTY'),
			noWarranty: t('REPAIRS.VOUCHER.NO_WARRANTY'),
			signature: t('REPAIRS.VOUCHER.SIGNATURE'),
		}
	}

	private printHtml(html: string): void {
		const frame = this.document.createElement('iframe')
		frame.setAttribute('aria-hidden', 'true')
		frame.setAttribute('tabindex', '-1')
		frame.style.cssText = 'position:fixed;width:0;height:0;border:0;visibility:hidden'
		const removeFrame = (): void => frame.remove()
		frame.onload = (): void => {
			const view = frame.contentWindow
			if (!view) {
				removeFrame()
				return
			}
			view.addEventListener('afterprint', removeFrame)
			view.focus()
			view.print()
			// Browsers without `afterprint` support would otherwise leave the frame behind.
			setTimeout(removeFrame, parseDurationToMs('1m'))
		}
		frame.srcdoc = html
		this.document.body.appendChild(frame)
	}
}
