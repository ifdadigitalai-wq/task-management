import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { ApiResponse } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        jobTitle: true,
        avatarUrl: true,
        phone: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "User not found or inactive." },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<any>>({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("[GET ME ERROR]", error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Failed to fetch user session." },
      { status: 500 }
    );
  }
}
