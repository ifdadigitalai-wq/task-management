import { cookies } from "next/headers";
import { verifyToken, type JWTPayload } from "./auth";

export const COOKIE_NAME = "idfa_session";

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return await verifyToken(token);
}