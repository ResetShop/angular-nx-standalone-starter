// TODO: Uncomment if using Microsoft Clarity to handle analytics. To set the connector to work, you need to add the Clarity token to your environment variables.
// TODO: Install @microsoft/clarity package to use this connector.

// import { appEnv } from '@config/app.env';
// import { ClarityApiResponse } from '../utils/clarity.utils';
//
// export const fetchClarityData = async (): Promise<ClarityApiResponse> => {
// 	const response = await fetch('https://www.clarity.ms/export-data/api/v1/project-live-insights', {
// 		headers: { Authorization: `Bearer ${appEnv.CLARITY_TOKEN}`, ContentType: 'application/json' },
// 	});
// 	return (await response.json()) as ClarityApiResponse;
// };
