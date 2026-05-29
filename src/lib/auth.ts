import { SignJWT, jwtVerify } from "jose";

export type JWTPayload = {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "EMPLOYEE";
  mustResetPassword: boolean;
};

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const EXPIRY = "24h";

export async function signToken(payload: JWTPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}