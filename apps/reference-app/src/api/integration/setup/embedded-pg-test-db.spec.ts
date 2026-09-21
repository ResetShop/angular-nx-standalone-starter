import asyncExitHook from 'async-exit-hook'

// `embedded-postgres` registers its exit hooks when it is first imported, so loading the helper
// module is enough to exercise the hook adjustment — no Postgres cluster is started here.
describe('embedded-pg-test-db exit hooks', () => {
	it('removes the beforeExit hook that would force the process to exit with code 0', async () => {
		await import('./embedded-pg-test-db')

		expect(asyncExitHook.hookedEvents()).not.toContain('beforeExit')
	})

	it('removes the exit hook that would throw while the process exits', async () => {
		await import('./embedded-pg-test-db')

		expect(asyncExitHook.hookedEvents()).not.toContain('exit')
	})

	it('keeps the signal hooks that stop the cluster on Ctrl-C', async () => {
		await import('./embedded-pg-test-db')

		expect(asyncExitHook.hookedEvents()).toEqual(expect.arrayContaining(['SIGINT', 'SIGTERM']))
	})
})
