import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { email, name, tempPassword } = body;

    if (!email || !name || !tempPassword) {
      return NextResponse.json({ success: false, error: "email, name, and tempPassword are required" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const loginLink = `${appUrl}/login`;

    const result = await sendWelcomeEmail({
      employeeEmail: email,
      employeeName: name,
      tempPassword,
      loginLink,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("[POST SEND WELCOME EMAIL ERROR]", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
