import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";
import { Priority, Frequency } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (session.role === "EMPLOYEE") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { tasks } = body;

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json({ success: false, error: "Tasks array is required" }, { status: 400 });
    }

    const createdTasks = [];
    
    // Fetch all users to map assignee email to ID
    const users = await prisma.user.findMany({
      select: { id: true, email: true },
    });
    const emailToIdMap = new Map(users.map((u) => [u.email.toLowerCase(), u.id]));

    // Fetch all departments to map department name to ID
    const departments = await prisma.department.findMany();
    const deptNameToIdMap = new Map(departments.map((d) => [d.name.toLowerCase(), d.id]));

    for (const t of tasks) {
      if (!t.title) continue;

      let assigneeId = null;
      if (t.assigneeEmail) {
        assigneeId = emailToIdMap.get(t.assigneeEmail.toLowerCase()) || null;
      }

      let dept = t.department || "General";
      
      // Auto-create department if it doesn't exist
      if (t.department && !deptNameToIdMap.has(t.department.toLowerCase())) {
        const newDept = await prisma.department.create({
          data: { name: t.department },
        });
        deptNameToIdMap.set(t.department.toLowerCase(), newDept.id);
      }

      // Priority translation
      let priorityVal: Priority = "MEDIUM";
      if (t.priority) {
        const pUpper = t.priority.toUpperCase();
        if (["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(pUpper)) {
          priorityVal = pUpper as Priority;
        }
      }

      // Frequency translation
      let frequencyVal: Frequency = "ONE_TIME";
      if (t.frequency) {
        const fUpper = t.frequency.toUpperCase();
        if (["ONE_TIME", "DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY", "CUSTOM"].includes(fUpper)) {
          frequencyVal = fUpper as Frequency;
        }
      }

      const task = await prisma.task.create({
        data: {
          title: t.title,
          description: t.description || null,
          status: "TODO",
          priority: priorityVal,
          dueDate: t.dueDate ? new Date(t.dueDate) : null,
          creatorId: session.id,
          assigneeId,
          department: dept,
          frequency: frequencyVal,
          customFrequency: t.customFrequency || null,
        },
      });

      createdTasks.push(task);
    }

    // Write to AuditLog
    await prisma.auditLog.create({
      data: {
        action: "IMPORT_TASKS",
        entityType: "TASK",
        performedBy: session.name,
        details: { count: createdTasks.length, titles: createdTasks.map(t => t.title) },
      },
    });

    return NextResponse.json({ success: true, data: { importedCount: createdTasks.length, imported: createdTasks } });
  } catch (error: any) {
    console.error("[POST IMPORT TASKS ERROR]", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
