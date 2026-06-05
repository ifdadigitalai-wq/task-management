import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";
import { ApiResponse } from "@/types";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
  return NextResponse.json<ApiResponse<any>>({
    success: true,
    data: session,
  });
}
