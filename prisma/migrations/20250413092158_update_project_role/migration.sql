/*
  Warnings:

  - A unique constraint covering the columns `[workspaceId,name]` on the table `ProjectRole` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ProjectRole" ADD COLUMN     "workspaceId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ProjectRole_workspaceId_name_key" ON "ProjectRole"("workspaceId", "name");

-- AddForeignKey
ALTER TABLE "ProjectRole" ADD CONSTRAINT "ProjectRole_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
