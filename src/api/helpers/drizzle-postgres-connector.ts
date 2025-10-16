// TODO: Uncomment if using Drizzle's Postgres connector. To set the connector to work, you need to add the Postgres connection string to your environment variables.
// TODO: Install drizzle-orm, drizzle-kit and postgres packages to use this connector.

// import { drizzle } from 'drizzle-orm/postgres-js';
// import postgres from 'postgres';
// import { environment } from './environment';
//
// const connectionString = environment.database.connectionString;
//
// // Disable prefetch as it is not supported for "Transaction" pool mode
// export const pgClient = postgres(connectionString, { prepare: false });
// export const db = drizzle(pgClient);
