/**
 * Script to generate the environment file used by Angular.
 * This script must be executed as a previous step to the application build
 * (build step).
 *
 * If the .env file does not exist in the project root, one will be created
 * with the default variables, which are described in the defaultEnvVariables
 * constant.
 *
 * This script *does not* copy all the .env file contents to the environment.ts file,
 * instead what it does is to read the process.env values that are set on Vercel and
 * provides the ground to set default values for your .env files, which are not private
 * or can be shared without any issues when commiting your code to a repository
 *
 * Author: @rolivencia
 */

// NodeJS & env
import { existsSync, mkdirSync, writeFile, writeFileSync } from 'fs'
import { join } from 'node:path'
import ErrnoException = NodeJS.ErrnoException

// Environments
export type TEnvironmentType = 'development' | 'preview' | 'staging' | 'production'

// Constants to generate the environment file
const environment: TEnvironmentType = (process.env['VERCEL_TARGET_ENV'] as TEnvironmentType) ?? 'development'
const dirPath = `src/app/environments`
const targetPath = `${dirPath}/environment.ts`

// Include your shareable default values for .env files, if any
const defaultEnvVariables = {
	NODE_ENV: 'development',
	DEFAULT_LANGUAGE: 'en',
}

// Creates an .env with default variables if it doesn't exist yet
function createAppEnvFile() {
	const envFilePath = join(process.cwd(), '.env')
	if (existsSync(envFilePath)) {
		console.log('.env file for the app already exists, so we use it instead of creating a new one.')
		return
	}

	const fileContents = Object.entries(defaultEnvVariables)
		.map(([key, value]) => `${key}=${value}`)
		.join('\n')

	writeFileSync(envFilePath, fileContents)
	console.log('Created .env file with default values.')
}

// Creates an .env with default variables for Sanity Studio if it doesn't exist yet
// TODO: Set to work only if you're using a local Sanity Studio project under the cms folder
// function createSanityStudioEnvFile() {
//   const envFilePath = join(process.cwd(), 'cms/.env');
//   if (existsSync(envFilePath)) {
//     console.log(
//       '.env file for Sanity Studio already exists, so we use it instead of creating a new one.',
//     );
//     return;
//   }
//
//   const fileContents = Object.entries(defaultEnvVariables)
//     .map(([key, value]) => `${key}=${value}`)
//     .join('\n');
//
//   writeFileSync(envFilePath, fileContents);
//   console.log('Created .env file for Sanity Studio with default values.');
// }

if (environment === 'development') {
	createAppEnvFile()
	// Uncomment if you're using Sanity Studio
	// createSanityStudioEnvFile();
}

// Generates an absolute path to the API based on the environment
const generateApiUrl = (environment: TEnvironmentType): string => {
	let url = '/'

	// Assigns URL based on the Vercel branch URL for staging environment
	if (environment === 'staging') {
		// TODO: Declare the staging domain name for your project in Vercel
		url = ``
	}
	// Reads the Vercel environment variable for preview deployments outside of staging
	else if (environment === 'preview') {
		url = `https://${process.env['VERCEL_BRANCH_URL']}/`
	}
	// Assigns URL based on environment variables for production and staging (preview develop)
	else if (environment === 'production') {
		url = `https://${process.env['VERCEL_PROJECT_PRODUCTION_URL']}/` as string
	}

	return url
}

const apiUrl = generateApiUrl(environment)
// Accesses environment variables and generates a string
// corresponding to the environment object that Angular will use

const exportedEnvironment = {
	environment: `${environment ?? 'development'}`,
	website: `${apiUrl ?? ''}`, // TODO: Include production domain here, if exists
	apiUrl: `${apiUrl}`,
	clarityProjectId: '',
	defaultLanguage: (process.env['DEFAULT_LANGUAGE'] as 'en' | 'es') ?? 'en',
}

// Checks if the environment variable for Microsoft Clarity analytics exists
// TODO: Declare Microsoft Clarity project id, if it exists
if (process.env['CLARITY_PROJECT_ID']) {
	exportedEnvironment.clarityProjectId = `${process.env['CLARITY_PROJECT_ID']}`
}

const environmentFileContent = `
    export const environment = ${JSON.stringify(exportedEnvironment)};
`

// Creates the environments directory if it doesn't exist
if (!existsSync(dirPath)) {
	mkdirSync(dirPath)
}

// Writes the content to the corresponding environment.ts file
writeFile(targetPath, environmentFileContent, { flag: 'w' }, function (err: ErrnoException | null) {
	if (err) {
		console.log(err)
		return
	}
	console.log(`Environment variables written to ${targetPath}`)
	console.log('Vercel Environment - VERCEL_TARGET_ENV = ', process.env['VERCEL_TARGET_ENV'])
	console.log('Vercel Environment - VERCEL_URL = ', process.env['VERCEL_URL'])
	console.log('Vercel branch URL - VERCEL_BRANCH_URL = ', process.env['VERCEL_BRANCH_URL'])
	console.log('API and Website URL = ', apiUrl)
})
