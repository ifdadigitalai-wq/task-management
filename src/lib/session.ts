import { cookies } from "next/headers";
import { verifyToken, type JWTPayload } from "./auth";
import { prisma } from "./prisma";

export const COOKIE_NAME = "idfa_session";

export async function getSession(): Promise<JWTPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = await verifyToken(token);
    if (!payload) return null;

    // Validate that the user in the session still exists in the DB.
    // This prevents stale JWT sessions from causing FK violations after a DB reset.
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, isActive: true },
    });

    if (!user || !user.isActive) {
      // Clear the stale cookie so the client is redirected to login
      cookieStore.delete(COOKIE_NAME);
      return null;
    }

    return payload;
  } catch {
    // If anything goes wrong (DB down, schema mismatch, etc.) treat as unauthenticated
    return null;
  }
}