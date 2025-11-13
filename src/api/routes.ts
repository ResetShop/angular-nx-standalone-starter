import authController from './modules/auth/auth.controller';
import healthController from './modules/health/health.controller';

export default [
	{
		path: '/health',
		controller: healthController,
	},
	{
		path: '/auth',
		controller: authController,
	},
];
