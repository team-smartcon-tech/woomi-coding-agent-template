import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Module, Global } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

export type DB = NodePgDatabase<typeof schema>;
export const DATABASE = 'DATABASE';

const dbProvider = {
  provide: DATABASE,
  useFactory: () => {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not set');
    }

    return drizzle({
      connection: {
        connectionString: process.env.DATABASE_URL,
        // ssl: {
        //   rejectUnauthorized: false,
        // },
        connectionTimeoutMillis: 5000,
        query_timeout: 10000,
        statement_timeout: 10000,
      },
      schema,
    });
  },
};

@Global()
@Module({
  providers: [dbProvider],
  exports: [DATABASE],
})
export class DBModule {}
