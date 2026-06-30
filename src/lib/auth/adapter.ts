import type {
  Adapter,
  AdapterUser,
  VerificationToken,
} from "@auth/core/adapters";
import { getAuthDb } from "@/lib/auth/auth-db";

export function createAuthAdapter(): Adapter {
  return {
    async getUserByEmail(email) {
      const db = await getAuthDb();
      const result = await db.execute({
        sql: "SELECT id, email, name, image, email_verified FROM auth_users WHERE email = ? LIMIT 1",
        args: [email.toLowerCase()],
      });
      const row = result.rows[0];
      if (!row) return null;
      return rowToUser(row);
    },

    async createVerificationToken(token) {
      const db = await getAuthDb();
      await db.execute({
        sql: `INSERT INTO auth_verification_tokens (identifier, token, expires)
              VALUES (?, ?, ?)
              ON CONFLICT(identifier) DO UPDATE SET
                token = excluded.token,
                expires = excluded.expires`,
        args: [token.identifier, token.token, token.expires.toISOString()],
      });
      return token;
    },

    async useVerificationToken({ identifier, token }) {
      const db = await getAuthDb();
      const result = await db.execute({
        sql: `SELECT identifier, token, expires FROM auth_verification_tokens
              WHERE identifier = ? AND token = ? LIMIT 1`,
        args: [identifier, token],
      });
      const row = result.rows[0];
      if (!row) return null;

      await db.execute({
        sql: "DELETE FROM auth_verification_tokens WHERE identifier = ?",
        args: [identifier],
      });

      const expiresRaw = row.expires ?? row.EXPIRES;
      return {
        identifier: String(row.identifier ?? row.IDENTIFIER),
        token: String(row.token ?? row.TOKEN),
        expires: new Date(String(expiresRaw)),
      } satisfies VerificationToken;
    },
  };
}

function rowToUser(row: Record<string, unknown>): AdapterUser {
  const verified = row.email_verified ? new Date(String(row.email_verified)) : null;
  return {
    id: String(row.id),
    email: String(row.email),
    emailVerified: verified,
    name: row.name ? String(row.name) : null,
    image: row.image ? String(row.image) : null,
  };
}
