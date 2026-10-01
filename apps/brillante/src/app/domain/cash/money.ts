/**
 * Rounds a monetary amount to cents, avoiding floating-point drift in sums and products.
 */
export function roundToCents(amount: number): number {
	return Math.round((amount + Number.EPSILON) * 100) / 100
}

/**
 * Formats an amount the way the shop writes prices: `$ 1.234,50` (es-AR grouping and decimals).
 */
export function formatMoney(amount: number): string {
	const formatter = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
	return `$ ${formatter.format(amount)}`
}
