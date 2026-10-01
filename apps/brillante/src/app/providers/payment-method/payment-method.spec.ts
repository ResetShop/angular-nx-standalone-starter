import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'
import { clearAllMocks } from '@resetshop/util/test-utils'
import { environment } from '../../environments/environment'
import { HttpPaymentMethodApi } from './payment-method'

describe('HttpPaymentMethodApi', () => {
	beforeEach(() => {
		clearAllMocks()
		TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] })
	})

	it('reads the payment methods with GET /cash/getPaymentMethods', () => {
		const httpMock = TestBed.inject(HttpTestingController)
		const methods = [
			{
				id: 2,
				description: 'MercadoPago',
				allowsInstallments: true,
				installments: [{ installments: 3, interestRate: '0.11' }],
			},
		]
		let result: unknown

		TestBed.inject(HttpPaymentMethodApi)
			.getAll()
			.subscribe((value) => (result = value))

		const req = httpMock.expectOne(`${environment.apiUrl}/cash/getPaymentMethods`)
		expect(req.request.method).toBe('GET')
		req.flush(methods)
		expect(result).toEqual(methods)
		httpMock.verify()
	})
})
