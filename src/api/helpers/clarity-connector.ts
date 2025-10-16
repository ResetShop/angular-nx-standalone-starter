// TODO: Uncomment if using Microsoft Clarity to handle analytics. To set the connector to work, you need to add the Clarity token to your environment variables.
// import { environment } from './environment';
// import { ClarityApiResponse } from '../utils/clarity.utils';
//
// export const fetchClarityData = async (): Promise<ClarityApiResponse> => {
// 	const response = await fetch('https://www.clarity.ms/export-data/api/v1/project-live-insights', {
// 		headers: { Authorization: `Bearer ${environment.clarity.token}`, ContentType: 'application/json' },
// 	});
// 	return (await response.json()) as ClarityApiResponse;
// };
