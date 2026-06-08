import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";
import { hasPermission } from "@/lib/rbac";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session.role, "import_employees")) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { employees } = body;

    if (!Array.isArray(employees) || employees.length === 0) {
      return NextResponse.json({ success: false, error: "Employees array is required" }, { status: 400 });
    }

    const createdUsers = [];
    const skippedEmails = [];

    for (const emp of employees) {
      if (!emp.email || !emp.name) {
        continue;
      }

      // Check if user already exists
      const existing = await prisma.user.findUnique({
        where: { email: emp.email },
      });

      if (existing) {
        skippedEmails.push(emp.email);
        continue;
      }

      // Default temporary password
      const tempPassword = "Password@123";
      const hashed = await bcrypt.hash(tempPassword, 12);

      // Handle department object linking if department exists
      let deptId = null;
      if (emp.department) {
        const dept = await prisma.department.findUnique({
          where: { name: emp.department },
        });
        if (dept) {
          deptId = dept.id;
        } else {
          // Auto create department if it doesn't exist
          const newDept = await prisma.department.create({
            data: { name: emp.department },
          });
          deptId = newDept.id;
        }
      }

      const user = await prisma.user.create({
        data: {
          name: emp.name,
          email: emp.email,
          passwordHash: hashed,
          role: emp.role || "EMPLOYEE",
          department: emp.department || null,
          departmentId: deptId,
          team: emp.team || null,
          jobTitle: emp.jobTitle || null,
          phone: emp.phone ? String(emp.phone) : null,
          mustResetPassword: true,
          isActive: true,
        },
      });

      createdUsers.push({
        id: user.id,
        name: user.name,
        email: user.email,
        tempPassword,
      });
    }

    // Write to AuditLog
    await prisma.auditLog.create({
      data: {
        action: "IMPORT_EMPLOYEES",
        entityType: "USER",
        performedBy: session.name,
        details: { count: createdUsers.length, imported: createdUsers.map(u => u.email), skipped: skippedEmails },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        importedCount: createdUsers.length,
        imported: createdUsers,
        skippedCount: skippedEmails.length,
        skipped: skippedEmails,
      },
    });
  } catch (error: any) {
    console.error("[POST IMPORT EMPLOYEES ERROR]", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
