/*
  Warnings:

  - A unique constraint covering the columns `[workspaceId,name]` on the table `OvertimePolicy` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "OvertimePolicy_workspaceId_name_key" ON "OvertimePolicy"("workspaceId", "name");
