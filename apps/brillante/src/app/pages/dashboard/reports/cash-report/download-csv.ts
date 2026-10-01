/**
 * Offers `content` to the user as a downloaded CSV file named `fileName`. A byte order mark is
 * prepended so spreadsheet programs open accented text as UTF-8.
 */
export function downloadCsv(fileName: string, content: string): void {
	const blob = new Blob(['﻿', content], { type: 'text/csv;charset=utf-8' })
	const url = URL.createObjectURL(blob)
	const link = document.createElement('a')
	link.href = url
	link.download = `${fileName}.csv`
	link.click()
	URL.revokeObjectURL(url)
}
