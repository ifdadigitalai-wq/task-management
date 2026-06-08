import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id: taskId } = await params;
    const body = await req.json();

    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
    }

    let attachmentsToCreate: { url: string; filename: string; uploadedBy: string }[] = [];

    if (Array.isArray(body.attachments)) {
      attachmentsToCreate = body.attachments.map((att: any) => ({
        url: att.url,
        filename: att.filename || att.name || "attachment",
        uploadedBy: session.name,
      }));
    } else if (body.url) {
      attachmentsToCreate = [
        {
          url: body.url,
          filename: body.filename || body.name || "attachment",
          uploadedBy: session.name,
        },
      ];
    } else {
      return NextResponse.json({ success: false, error: "No attachment details provided" }, { status: 400 });
    }

    const createdAttachments = await Promise.all(
      attachmentsToCreate.map((att) =>
        prisma.taskAttachment.create({
          data: {
            taskId,
            url: att.url,
            filename: att.filename,
            uploadedBy: att.uploadedBy,
          },
        })
      )
    );

    // Write to AuditLog
    await prisma.auditLog.create({
      data: {
        action: "ADD_ATTACHMENTS",
        entityType: "TASK",
        entityId: taskId,
        performedBy: session.name,
        details: { count: createdAttachments.length, filenames: createdAttachments.map(c => c.filename) },
      },
    });

    return NextResponse.json({ success: true, data: createdAttachments });
  } catch (error: any) {
    console.error("[POST ATTACHMENTS ERROR]", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
