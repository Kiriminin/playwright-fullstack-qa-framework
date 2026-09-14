import type { RowDataPacket } from "mysql2";
import type { Pool } from "mysql2/promise";

export interface CartRow extends RowDataPacket {
  id: string;
}

export interface CartItemRow extends RowDataPacket {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
}

export async function findCartById(
  db: Pool,
  cartId: string,
): Promise<CartRow | undefined> {
  const [rows] = await db.execute<CartRow[]>(
    "SELECT id FROM carts WHERE id = ?",
    [cartId],
  );

  return rows[0];
}

export async function findCartItems(
  db: Pool,
  cartId: string,
): Promise<CartItemRow[]> {
  const [rows] = await db.execute<CartItemRow[]>(
    `
      SELECT id, cart_id, product_id, quantity
      FROM cart_items
      WHERE cart_id = ?
      ORDER BY id
    `,
    [cartId],
  );

  return rows;
}