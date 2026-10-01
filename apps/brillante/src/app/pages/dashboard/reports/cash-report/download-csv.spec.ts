import { clearAllMocks, fn, spyOn } from '@resetshop/util/test-utils'
import { downloadCsv } from './download-csv'

describe('downloadCsv', () => {
	const originalCreateObjectUrl = URL.createObjectURL
	const originalRevokeObjectUrl = URL.revokeObjectURL
	const createObjectUrl = fn<[Blob], string>()
	const revokeObjectUrl = fn<[string], void>()
	let clickedDownloads: string[]
	let clickedHrefs: string[]

	beforeEach(() => {
		clearAllMocks()
		createObjectUrl.mockReturnValue('blob:report')
		URL.createObjectURL = createObjectUrl
		URL.revokeObjectURL = revokeObjectUrl
		clickedDownloads = []
		clickedHrefs = []
		spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
			clickedDownloads.push(this.download)
			clickedHrefs.push(this.href)
		})
	})

	afterEach(() => {
		URL.createObjectURL = originalCreateObjectUrl
		URL.revokeObjectURL = originalRevokeObjectUrl
	})

	it('should trigger a download of the file with the csv extension', () => {
		downloadCsv('Report (1 - 2)', 'a,b')

		expect(clickedDownloads).toEqual(['Report (1 - 2).csv'])
		expect(clickedHrefs).toEqual(['blob:report'])
	})

	it('should offer the content as a UTF-8 csv blob with a byte order mark', async () => {
		downloadCsv('report', 'a,b\r\n1,2')

		const [blob] = createObjectUrl.calls[0]
		expect(blob.type).toBe('text/csv;charset=utf-8')
		expect(await blob.text()).toBe('﻿a,b\r\n1,2')
	})

	it('should release the object url once the download started', () => {
		downloadCsv('report', 'a')

		expect(revokeObjectUrl.calls).toEqual([['blob:report']])
	})
})
