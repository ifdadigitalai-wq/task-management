import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { ApiResponse } from "@/types";

/**
 * POST /api/integration/whatsapp
 * A mocked API endpoint to test WhatsApp message sending or to configure webhook listeners.
 */
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { phone, message } = body;

    if (!phone || !message) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Phone and message are required." },
        { status: 400 }
      );
    }

    console.log(`[WHATSAPP WEBHOOK / OUTBOUND] Manually sending message to ${phone}: ${message}`);

    return NextResponse.json<ApiResponse<any>>({
      success: true,
      data: {
        status: "queued",
        phone,
        message,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("[WHATSAPP WEBHOOK ERROR]", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Failed to process WhatsApp request." },
      { status: 500 }
    );
  }
}

/**
 * GET /api/integration/whatsapp
 * Webhook validation for services like Facebook Graph API webhook verification.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const hubMode = searchParams.get("hub.mode");
  const hubChallenge = searchParams.get("hub.challenge");
  const hubVerifyToken = searchParams.get("hub.verify_token");

  // Mock token verification
  if (hubMode === "subscribe" && hubVerifyToken === "taskcenter_token") {
    return new Response(hubChallenge, { status: 200 });
  }

  return NextResponse.json({ success: true, message: "WhatsApp integration active" });
}
