import crypto from "crypto";
import { queryDb } from "./db";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";

export interface CallerIdentity {
  id: number;
  name: string;
  email: string;
  role: string;
  client_name?: string | null;
}

export function parseTokenFromHeader(header: string | null): string | null {
  if (!header) return null;
  if (header.startsWith("Bearer ")) {
    return header.slice(7).trim();
  }
  return header.trim();
}

export function verifyJwt(token: string): CallerIdentity | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [headerB64, bodyB64, sigB64] = parts;
    const expectedSig = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${headerB64}.${bodyB64}`)
      .digest("base64url");
    if (expectedSig !== sigB64) return null;
    const payload = JSON.parse(Buffer.from(bodyB64, "base64url").toString());
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload as CallerIdentity;
  } catch {
    return null;
  }
}

export async function getCaller(req: Request): Promise<CallerIdentity | null> {
  const authHeader = req.headers.get("authorization");
  const token = parseTokenFromHeader(authHeader);
  if (!token) return null;
  const verified = verifyJwt(token);
  if (!verified) return null;

  try {
    const users = await queryDb<CallerIdentity>(
      `SELECT id, name, email, role, client_name
       FROM users
       WHERE id = ${verified.id} AND COALESCE(is_deleted, false) = false
       LIMIT 1`
    );
    return users[0] || verified;
  } catch {
    return verified;
  }
}
