-- Replace single-column user references with tenant-scoped composite references.
ALTER TABLE "AppNotification" DROP CONSTRAINT "AppNotification_userId_fkey";
ALTER TABLE "Expense" DROP CONSTRAINT "Expense_recordedBy_fkey";
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_recordedBy_fkey";
ALTER TABLE "Task" DROP CONSTRAINT "Task_assignedUserId_fkey";
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_assignedUserId_fkey";

CREATE UNIQUE INDEX "User_workspaceId_id_key" ON "User"("workspaceId", "id");

ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_workspaceId_assignedUserId_fkey"
  FOREIGN KEY ("workspaceId", "assignedUserId") REFERENCES "User"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_workspaceId_assignedUserId_fkey"
  FOREIGN KEY ("workspaceId", "assignedUserId") REFERENCES "User"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_workspaceId_recordedBy_fkey"
  FOREIGN KEY ("workspaceId", "recordedBy") REFERENCES "User"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_workspaceId_recordedBy_fkey"
  FOREIGN KEY ("workspaceId", "recordedBy") REFERENCES "User"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AppNotification" ADD CONSTRAINT "AppNotification_workspaceId_userId_fkey"
  FOREIGN KEY ("workspaceId", "userId") REFERENCES "User"("workspaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
