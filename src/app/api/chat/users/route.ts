import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { ApiResponse } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Unauthorized." },
        { status: 401 }
      );
    }

    const users = await prisma.user.findMany({
      where: {
        id: { not: session.id },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        jobTitle: true,
        avatarUrl: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json<ApiResponse<any[]>>({ success: true, data: users });
  } catch (err) {
    console.error("[GET CHAT USERS ERROR]", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Failed to fetch chat users." },
      { status: 500 }
    );
  }
}
