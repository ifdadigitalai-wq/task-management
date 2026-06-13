import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { ApiResponse } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Unauthorized." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const receiverId = searchParams.get("receiverId");

    if (!receiverId) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Receiver ID is required." },
        { status: 400 }
      );
    }

    // Mark messages from receiver to session user as read
    await prisma.message.updateMany({
      where: {
        senderId: receiverId,
        receiverId: session.id,
        read: false,
      },
      data: {
        read: true,
      },
    });

    // Fetch message history
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: session.id, receiverId },
          { senderId: receiverId, receiverId: session.id },
        ],
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json<ApiResponse<any[]>>({ success: true, data: messages });
  } catch (err) {
    console.error("[GET CHAT MESSAGES ERROR]", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Failed to fetch messages." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Unauthorized." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { receiverId, content } = body;

    if (!receiverId || !content || !content.trim()) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Receiver ID and message content are required." },
        { status: 400 }
      );
    }

    const message = await prisma.message.create({
      data: {
        senderId: session.id,
        receiverId,
        content: content.trim(),
      },
    });

    return NextResponse.json<ApiResponse<any>>({ success: true, data: message }, { status: 201 });
  } catch (err) {
    console.error("[POST CHAT MESSAGE ERROR]", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Failed to send message." },
      { status: 500 }
    );
  }
}
