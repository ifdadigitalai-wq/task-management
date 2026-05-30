/*
  Warnings:

  - Made the column `password` on table `User` required. This step will fail if there are existing NULL values in that column.

*/

-- CreateTable
CREATE TABLE "TaskUpdate" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "remark" TEXT NOT NULL,
    "files" TEXT[],
    "images" TEXT[],
    "hasVoice" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UpdateComment" (
    "id" TEXT NOT NULL,
    "updateId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UpdateComment_pkey" PRIMARY KEY ("id")
);
-- handle existing NULLs before enforcing NOT NULL
UPDATE "User" SET "password" = '' WHERE "password" IS NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "password" SET NOT NULL;
-- AddForeignKey
ALTER TABLE "TaskUpdate" ADD CONSTRAINT "TaskUpdate_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UpdateComment" ADD CONSTRAINT "UpdateComment_updateId_fkey" FOREIGN KEY ("updateId") REFERENCES "TaskUpdate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UpdateComment" ADD CONSTRAINT "UpdateComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
