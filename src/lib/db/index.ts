import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (process.env.NODE_ENV === "production" && !process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be configured in production.");
}

const connectionString = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/upgradecafe";

const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
};

// Use connection pooling with safe connection reuse across HMR & serverless idle timeouts
const client =
  globalForDb.conn ??
  postgres(connectionString, {
    prepare: false,
    max: process.env.NODE_ENV === "production" ? 10 : 5,
    idle_timeout: 20,
    connect_timeout: 10,
    max_lifetime: 60 * 30,
  });

if (process.env.NODE_ENV !== "production") globalForDb.conn = client;

export const db = drizzle(client, { schema });
export { schema };
