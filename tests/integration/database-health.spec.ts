import type { RowDataPacket } from "mysql2";
import { test, expect } from "../../fixtures/test.fixture";

interface ProductCountRow extends RowDataPacket {
  database_name: string;
  product_count: number;
}

test("@smoke database contains seeded products", async ({ db }) => {
  const [rows] = await db.query<ProductCountRow[]>(`
    SELECT
      DATABASE() AS database_name,
      COUNT(*) AS product_count
    FROM products
  `);

  expect(rows).toHaveLength(1);
  expect(rows[0].database_name).toBe("toolshop");
  expect(Number(rows[0].product_count)).toBeGreaterThan(0);
});