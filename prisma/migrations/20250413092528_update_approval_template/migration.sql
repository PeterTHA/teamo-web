/*
  Warnings:

  - A unique constraint covering the columns `[workspaceId,name]` on the table `ApprovalTemplate` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ApprovalTemplate_workspaceId_name_key" ON "ApprovalTemplate"("workspaceId", "name");
