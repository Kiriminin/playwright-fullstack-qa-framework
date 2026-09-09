import { createPool, type Pool } from "mysql2/promise";
import { env } from "../config/env";

export function createDbPool(): Pool {
  return createPool({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 5,
    enableKeepAlive: true,
  });
}