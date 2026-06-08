import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { userId, title, message, type, link } = body;

    if (!userId || !message) {
      return NextResponse.json({ success: false, error: "userId and message are required" }, { status: 400 });
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        type: type || "INFO",
        message: title ? `${title}: ${message}` : message,
        link: link || null,
        read: false,
      },
    });

    return NextResponse.json({ success: true, data: notification });
  } catch (error: any) {
    console.error("[POST NOTIFICATIONS PUSH ERROR]", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
