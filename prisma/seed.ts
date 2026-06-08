import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";
import process from "process";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database with updated enterprise schema...");

  // Clean old data
  await prisma.activity.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.taskComment.deleteMany({});
  await prisma.taskUpdate.deleteMany({});
  await prisma.taskTimer.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.taskTemplate.deleteMany({});
  await prisma.holiday.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.department.deleteMany({});

  // Seed departments
  const defaultDepts = [
    "Admin department",
    "Centre head / Management",
    "Sales / counselling department",
    "Academics department",
    "Faculty department",
    "Backend department",
    "Accounts & Finance department",
    "IT department",
    "HR & Placement department"
  ];
  
  const deptMap: Record<string, any> = {};
  for (const name of defaultDepts) {
    const deptObj = await prisma.department.create({
      data: {
        name,
        description: `Standard operational ${name}.`,
      },
    });
    deptMap[name] = deptObj;
    console.log(`✅ Seeded Department: ${name}`);
  }

  // 1. Create Admin
  const adminPassword = await bcrypt.hash("Admin@123", 12);
  const admin = await prisma.user.create({
    data: {
      email: "Admin@ifdatask.com",
      name: "System Admin",
      passwordHash: adminPassword,
      role: "ADMIN",
      mustResetPassword: false,
      department: "Admin department",
      departmentId: deptMap["Admin department"]?.id || null,
      jobTitle: "Administrator",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80",
      phone: "+91 99999 88888",
      joinedAt: new Date("2025-01-01"),
    },
  });
  console.log("✅ Admin created:", admin.email);

  // 2. Create 5 Employees
  const employees = [];
  const deptsMapping = [
    "Academics department",
    "Faculty department",
    "Backend department",
    "Accounts & Finance department",
    "HR & Placement department"
  ];
  const jobTitles = ["Senior Instructor", "Lead Faculty", "Backend Architect", "Finance Officer", "HR Lead"];
  const avatars = [
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&h=256&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&h=256&q=80",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=256&h=256&q=80",
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&h=256&q=80",
  ];
  
  for (let i = 1; i <= 5; i++) {
    const passwordHash = await bcrypt.hash(`Employee${i}@123`, 12);
    const deptName = deptsMapping[i - 1];
    const employee = await prisma.user.create({
      data: {
        email: `Employee${i}@ifda.com`,
        name: `Employee ${i}`,
        passwordHash,
        role: "EMPLOYEE",
        mustResetPassword: true,
        department: deptName,
        departmentId: deptMap[deptName]?.id || null,
        jobTitle: jobTitles[i - 1],
        avatarUrl: avatars[i - 1],
        phone: `+91 98765 4321${i}`,
        joinedAt: new Date("2025-02-15"),
      },
    });
    employees.push(employee);
    console.log(`✅ Employee ${i} created: ${employee.email}`);
  }

  // 3. Create 2 Task Templates
  const template1 = await prisma.taskTemplate.create({
    data: {
      name: "Daily Operations Review",
      description: "Standard daily checklist to verify servers and counselor call logs",
      defaultPriority: "HIGH",
      checklistItems: [
        "Check backend server logs for memory leaks",
        "Review counselor dashboard lead stats",
        "Verify backup database cron job output",
      ],
      createdById: admin.id,
    },
  });

  const template2 = await prisma.taskTemplate.create({
    data: {
      name: "Monthly Faculty Syncup",
      description: "Prepare and execute the monthly alignment syncup for academic team members",
      defaultPriority: "MEDIUM",
      checklistItems: [
        "Consolidate student course completion feedback",
        "Generate faculty utilization metrics sheet",
        "Schedule Zoom call invitation and agenda",
      ],
      createdById: admin.id,
    },
  });
  console.log("✅ Templates created");

  // 4. Create 10 Sample Tasks
  const statuses = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELLED"] as const;
  const priorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
  const taskTitles = [
    "Fix login token expiration bug",
    "Prepare Academic Syllabus for Q3",
    "Counseling department lead call checklist",
    "Audit server resources and logs",
    "Review salary sheets for HR department",
    "Deploy AI integration chat demo",
    "Onboard new student counselors",
    "Optimize postgres query indices",
    "Configure websocket reconnection settings",
    "Prepare presentation slides for board",
  ];

  for (let i = 0; i < 10; i++) {
    const assignee = employees[i % 5];
    const status = statuses[i % 5];
    const priority = priorities[i % 4];
    
    await prisma.task.create({
      data: {
        title: taskTitles[i],
        description: `This is a seeded sample description for task ${i + 1}. Please ensure all prerequisites are met.`,
        status,
        priority,
        dueDate: new Date(Date.now() + (i - 2) * 24 * 60 * 60 * 1000), // some overdue, some future
        estimatedMinutes: (i + 1) * 60,
        actualMinutes: status === "DONE" ? (i + 1) * 55 : 0,
        creatorId: admin.id,
        assigneeId: assignee.id,
        templateId: i % 3 === 0 ? template1.id : undefined,
        tags: [assignee.department || "General", priority],
        checklistItems: i % 2 === 0 ? ["Step A checklist item", "Step B checklist item"] : [],
        attachments: {
          create: [
            { filename: "specs_v1.pdf", url: "https://uploadthing.com/specs_v1.pdf", uploadedBy: "System Admin" },
            { filename: "screenshot.png", url: "https://uploadthing.com/screenshot.png", uploadedBy: "System Admin" },
          ]
        },
        recurrence: { rule: i % 4 === 0 ? "WEEKLY" : "NONE", interval: 1 },
        department: assignee.department || "General",
      },
    });
  }
  console.log("✅ 10 Sample tasks seeded successfully");

  // 5. Create 5 Holidays
  const holidays = [
    { name: "New Year's Day", date: new Date("2026-01-01"), isRecurring: true },
    { name: "Republic Day", date: new Date("2026-01-26"), isRecurring: true },
    { name: "Independence Day", date: new Date("2026-08-15"), isRecurring: true },
    { name: "Gandhi Jayanti", date: new Date("2026-10-02"), isRecurring: true },
    { name: "Annual Company Foundation Day", date: new Date("2026-12-10"), isRecurring: false },
  ];

  for (const h of holidays) {
    await prisma.holiday.create({ data: h });
  }
  console.log("✅ 5 Holidays seeded successfully");

  console.log("🎉 Seeding complete.");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });