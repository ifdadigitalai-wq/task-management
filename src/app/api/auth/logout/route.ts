import { NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/session";
import { ApiResponse } from "@/types";

export async function POST() {
  const response = NextResponse.json<ApiResponse<null>>({ success: true });

  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0, // expire immediately
  });

  return response;
}