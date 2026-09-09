import type { ResultSetHeader, RowDataPacket } from "mysql2";
import type { Pool } from "mysql2/promise";

export interface UserRow extends RowDataPacket {
  id: string;
  first_name: string;
  last_name: string;
  street: string | null;
  house_number: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  phone: string | null;
  dob: string | null;
  email: string;
  password: string | null;
  role: string;
  enabled: number;
  failed_login_attempts: number;
}

export async function findUserByEmail(
  db: Pool,
  email: string,
): Promise<UserRow | undefined> {
  const [rows] = await db.execute<UserRow[]>(
    `
      SELECT
        id,
        first_name,
        last_name,
        street,
        house_number,
        city,
        state,
        country,
        postal_code,
        phone,
        DATE_FORMAT(dob, '%Y-%m-%d') AS dob,
        email,
        password,
        role,
        enabled,
        failed_login_attempts
      FROM users
      WHERE email = ?
    `,
    [email],
  );

  return rows[0];
}

export async function deleteUserById(
  db: Pool,
  userId: string,
): Promise<void> {
  await db.execute<ResultSetHeader>(
    "DELETE FROM users WHERE id = ?",
    [userId],
  );
}