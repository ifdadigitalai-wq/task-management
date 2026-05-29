import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";
import process from "process";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Admin
  const adminPassword = await bcrypt.hash("Admin@123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "Admin@ifdatask.com" },
    update: {},
    create: {
      email: "Admin@ifdatask.com",
      name: "Admin",
      password: adminPassword,
      role: "ADMIN",
      mustResetPassword: false,
    },
  });

  console.log("✅ Admin created:", admin.email);

  // Employee
  const employeePassword = await bcrypt.hash("Employee1@123", 12);

  const employee = await prisma.user.upsert({
    where: { email: "Employee1@ifda.com" },
    update: {},
    create: {
      email: "Employee1@ifda.com",
      name: "Employee 1",
      password: employeePassword,
      role: "EMPLOYEE",
      mustResetPassword: true,
    },
  });

  console.log("✅ Employee created:", employee.email);

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