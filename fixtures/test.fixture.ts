import { test as base, expect } from "@playwright/test";
import type { Pool } from "mysql2/promise";
import { createDbPool } from "../db/connection";

type DatabaseFixtures = {
  db: Pool;
};

export const test = base.extend<DatabaseFixtures>({
  db: async ({}, use) => {
    const db = createDbPool();

    try {
      await use(db);
    } finally {
      await db.end();
    }
  },
});

export { expect };