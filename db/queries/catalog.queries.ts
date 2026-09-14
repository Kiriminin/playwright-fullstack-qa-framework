import type { RowDataPacket } from "mysql2";
import type { Pool } from "mysql2/promise";

export interface CatalogProductRow extends RowDataPacket {
  id: string;
  brand_id: string;
  category_id: string;
}

export interface CatalogFilters {
  brandId?: string;
  categoryId?: string;
}

export async function findCatalogProducts(
  db: Pool,
  filters: CatalogFilters = {},
): Promise<CatalogProductRow[]> {
  const conditions = ["is_rental = 0"];
  const values: string[] = [];

  if (filters.brandId !== undefined) {
    conditions.push("brand_id = ?");
    values.push(filters.brandId);
  }

  if (filters.categoryId !== undefined) {
    conditions.push("category_id = ?");
    values.push(filters.categoryId);
  }

  const [rows] = await db.execute<CatalogProductRow[]>(
    `
      SELECT id, brand_id, category_id
      FROM products
      WHERE ${conditions.join(" AND ")}
      ORDER BY id
    `,
    values,
  );

  return rows;
}