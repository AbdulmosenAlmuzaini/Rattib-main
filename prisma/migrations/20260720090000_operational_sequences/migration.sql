ALTER TABLE "Expense" ADD COLUMN "voucherNumber" TEXT;
ALTER TABLE "Payment" ADD COLUMN "receiptNumber" TEXT;
ALTER TABLE "Workspace" ADD COLUMN "expenseSequence" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "receiptSequence" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "transactionSequence" INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX "Client_workspaceId_nationalId_key" ON "Client"("workspaceId", "nationalId");
CREATE UNIQUE INDEX "Client_workspaceId_residenceId_key" ON "Client"("workspaceId", "residenceId");
CREATE UNIQUE INDEX "Client_workspaceId_commercialRegister_key" ON "Client"("workspaceId", "commercialRegister");
CREATE UNIQUE INDEX "Expense_workspaceId_voucherNumber_key" ON "Expense"("workspaceId", "voucherNumber");
CREATE UNIQUE INDEX "Payment_workspaceId_receiptNumber_key" ON "Payment"("workspaceId", "receiptNumber");
