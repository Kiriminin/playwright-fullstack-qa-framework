import type { RowDataPacket } from "mysql2";
import type { Pool } from "mysql2/promise";

export interface ProductRow extends RowDataPacket {
  id: string;
  name: string;
  description: string | null;
  stock: number | null;
  price: string;
  is_location_offer: number;
  is_rental: number;
  co2_rating: string | null;
}

export async function findProductById(
  db: Pool,
  productId: string,
): Promise<ProductRow | undefined> {
  const [rows] = await db.execute<ProductRow[]>(
    `
      SELECT
        id,
        name,
        description,
        stock,
        price,
        is_location_offer,
        is_rental,
        co2_rating
      FROM products
      WHERE id = ?
    `,
    [productId],
  );

  return rows[0];
}