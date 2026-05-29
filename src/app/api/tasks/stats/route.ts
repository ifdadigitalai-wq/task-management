import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
const POINTS: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };

type HML = { H: number; M: number; L: number };
const emptyHML = (): HML => ({ H: 0, M: 0, L: 0 });

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tasks = await prisma.task.findMany({
    where: {
      isDeleted: false,
      ...(session.role === "EMPLOYEE" && { assignedToId: session.id }),
    },
    include: { assignedTo: true },
  });

  // DEBUG — remove after confirming
  // console.log("[stats] total tasks:", tasks.length);
  // console.log("[stats] sample tasks:", JSON.stringify(
  //   tasks.slice(0, 5).map((t) => ({
  //     id: t.id,
  //     title: t.title,
  //     status: t.status,
  //     priority: t.priority,
  //     assignedToId: t.assignedToId,
  //     assignedTo: t.assignedTo ? { id: t.assignedTo.id, name: t.assignedTo.name } : null,
  //     tag: t.tag,
  //     dueDate: t.dueDate,
  //   })),
  //   null, 2
  // ));

  const now = new Date();

  const priorityMap: Record<"HIGH" | "MEDIUM" | "LOW", { total: number; due: number; completed: number }> = {
    HIGH:   { total: 0, due: 0, completed: 0 },
    MEDIUM: { total: 0, due: 0, completed: 0 },
    LOW:    { total: 0, due: 0, completed: 0 },
  };

  const empMap = new Map<string, {
    id: string; name: string; dept: string;
    total: number; due: HML; completed: HML; maxScore: number; score: number;
  }>();

const deptMap = new Map<string, {
    name: string; total: number; due: HML; completed: HML; maxScore: number; score: number;
  }>();

  for (const task of tasks) {
    const pri = task.priority as "HIGH" | "MEDIUM" | "LOW";
    const pts = POINTS[pri] ?? 1;
    const isDone = task.status === "COMPLETED";
    const isDue  = !!task.dueDate && new Date(task.dueDate) < now && !isDone;
    const bucket: keyof HML = pri === "HIGH" ? "H" : pri === "MEDIUM" ? "M" : "L";

    priorityMap[pri].total++;
    if (isDue)  priorityMap[pri].due++;
    if (isDone) priorityMap[pri].completed++;

    if (task.assignedTo) {
      const uid = task.assignedTo.id;
      if (!empMap.has(uid)) {
        const tagParts = (task.tag ?? "").split(" · ").map((s) => s.trim()).filter(Boolean);
        empMap.set(uid, {
          id: uid, name: task.assignedTo.name,
          dept: tagParts[0] || "Unassigned",
          total: 0, due: emptyHML(), completed: emptyHML(),
          maxScore: 0, score: 0,
        });
      }
      const emp = empMap.get(uid)!;
      if (emp.dept === "Unassigned" && task.tag) {
        const tagParts = task.tag.split(" · ").map((s) => s.trim()).filter(Boolean);
        if (tagParts[0]) emp.dept = tagParts[0];
      }
      emp.total++;
      emp.maxScore += pts;
      if (isDue)  emp.due[bucket]++;
      if (isDone) { emp.completed[bucket]++; emp.score += pts; }
    }

    const tagParts = (task.tag ?? "").split(" · ").map((s) => s.trim()).filter(Boolean);
    const deptName = tagParts[0] || "Unassigned";
    if (!deptMap.has(deptName)) {
      deptMap.set(deptName, {
        name: deptName, total: 0, due: emptyHML(), completed: emptyHML(),
        maxScore: 0, score: 0,
      });
    }
    const dept = deptMap.get(deptName)!;
    dept.total++;
    dept.maxScore += pts;
    if (isDue)  dept.due[bucket]++;
    if (isDone) { dept.completed[bucket]++; dept.score += pts; }
  }

  const result = {
    employees:   Array.from(empMap.values()),
    departments: Array.from(deptMap.values()),
    priorities:  priorityMap,
  };

  return NextResponse.json(result, {
    headers: { "Cache-Control": "no-store" },
  });
}