import { computed, Directive, HostAttributeToken, inject, input } from '@angular/core'
import type { DrawerDirection } from './drawer'

/**
 * Computes the CSS panel classes for the Drawer component based on
 * direction and any host `class` overrides (e.g. `class="w-lg"`).
 *
 * Applied as a hostDirective on Drawer with `direction` input forwarded.
 */
@Directive({ standalone: true })
export class DrawerPanel {
	readonly direction = input<DrawerDirection>('right')

	private readonly hostClasses = inject(new HostAttributeToken('class'), { optional: true }) ?? ''

	private readonly layoutClasses = computed(() => {
		const dir = this.direction()
		if (dir === 'left' || dir === 'right') {
			return 'h-full max-w-3/4'
		}
		return 'w-screen max-h-3/4'
	})

	private readonly positionClasses = computed(() => {
		const positions: Record<DrawerDirection, string> = {
			left: 'inset-y-0 left-0',
			right: 'inset-y-0 right-0 ml-auto',
			top: 'inset-x-0 top-0',
			bottom: 'inset-x-0 bottom-0 mt-auto',
		}
		return positions[this.direction()]
	})

	private readonly directionClass = computed(() => `drawer-${this.direction()}`)

	readonly panelClasses = computed(() => {
		return `${this.layoutClasses()} ${this.positionClasses()} ${this.directionClass()} ${this.hostClasses}`.trim()
	})
}
