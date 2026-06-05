import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";
import { ApiResponse } from "@/types";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const timers = await prisma.taskTimer.findMany({
      where: { taskId: id },
      orderBy: { startedAt: "desc" },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json<ApiResponse<any[]>>({
      success: true,
      data: timers,
    });
  } catch (err) {
    console.error("[GET TASK TIMERS ERROR]", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Failed to fetch task timers." },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { action } = await req.json();

    if (action !== "start" && action !== "stop") {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Invalid action. Must be 'start' or 'stop'." },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const now = new Date();

      if (action === "start") {
        // Stop any running timers first to prevent leaks
        await tx.taskTimer.updateMany({
          where: { userId: session.id, stoppedAt: null },
          data: {
            stoppedAt: now,
            durationMinutes: 0, // Incomplete timer
          },
        });

        // Start new timer
        const timer = await tx.taskTimer.create({
          data: {
            taskId: id,
            userId: session.id,
            startedAt: now,
          },
        });

        await tx.activity.create({
          data: {
            userId: session.id,
            action: "START_TASK_TIMER",
            entityType: "TASK_TIMER",
            entityId: timer.id,
            taskId: id,
          },
        });

        return timer;
      } else {
        // Stop running timer for this task
        const runningTimer = await tx.taskTimer.findFirst({
          where: { taskId: id, userId: session.id, stoppedAt: null },
        });

        if (!runningTimer) {
          throw new Error("No running timer found for this task.");
        }

        const durationMs = now.getTime() - runningTimer.startedAt.getTime();
        const durationMinutes = Math.max(1, Math.round(durationMs / 60000));

        const timer = await tx.taskTimer.update({
          where: { id: runningTimer.id },
          data: {
            stoppedAt: now,
            durationMinutes,
          },
        });

        // Accumulate actualMinutes on Task
        await tx.task.update({
          where: { id },
          data: {
            actualMinutes: { increment: durationMinutes },
          },
        });

        await tx.activity.create({
          data: {
            userId: session.id,
            action: "STOP_TASK_TIMER",
            entityType: "TASK_TIMER",
            entityId: timer.id,
            taskId: id,
            meta: { durationMinutes },
          },
        });

        return timer;
      }
    });

    return NextResponse.json<ApiResponse<any>>({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error("[POST TASK TIMER ERROR]", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: err.message || "Failed to process task timer." },
      { status: 500 }
    );
  }
}
