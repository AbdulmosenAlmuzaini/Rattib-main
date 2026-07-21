-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "brandingColor" TEXT NOT NULL,
    "phone" TEXT,
    "city" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL DEFAULT 'ws-1',
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "passwordHash" TEXT NOT NULL DEFAULT '',
    "role" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL DEFAULT 'ws-1',
    "fullName" TEXT NOT NULL,
    "clientType" TEXT NOT NULL DEFAULT 'individual',
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "city" TEXT,
    "nationalId" TEXT,
    "residenceId" TEXT,
    "commercialRegister" TEXT,
    "companyName" TEXT,
    "nationality" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceCategory" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL DEFAULT 'ws-1',
    "name" TEXT NOT NULL,

    CONSTRAINT "ServiceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceTemplate" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL DEFAULT 'ws-1',
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "expectedDurationDays" INTEGER NOT NULL DEFAULT 3,
    "defaultServiceFee" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "defaultGovernmentFee" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "requiredDocuments" TEXT NOT NULL,
    "checklistSteps" TEXT NOT NULL,

    CONSTRAINT "ServiceTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL DEFAULT 'ws-1',
    "referenceNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "serviceTemplateId" TEXT,
    "description" TEXT,
    "assignedUserId" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "status" TEXT NOT NULL DEFAULT 'new',
    "receivedDate" TEXT NOT NULL,
    "expectedCompletionDate" TEXT,
    "nextFollowUpDate" TEXT,
    "completedDate" TEXT,
    "serviceFee" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "governmentFee" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "extraExpenses" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "receivedAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "remainingAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "paymentStatus" TEXT NOT NULL DEFAULT 'unpaid',
    "internalNotes" TEXT,
    "sharedNotes" TEXT,
    "checklist" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL DEFAULT 'ws-1',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "transactionId" TEXT,
    "clientId" TEXT,
    "assignedUserId" TEXT,
    "startDate" TEXT,
    "dueDate" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "taskType" TEXT NOT NULL DEFAULT 'general',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL DEFAULT 'ws-1',
    "transactionId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "paymentDate" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL DEFAULT 'cash',
    "referenceNumber" TEXT,
    "notes" TEXT,
    "recordedBy" TEXT NOT NULL DEFAULT 'usr-1',
    "status" TEXT NOT NULL DEFAULT 'received',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL DEFAULT 'ws-1',
    "title" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "expenseDate" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "transactionId" TEXT,
    "recordedBy" TEXT NOT NULL DEFAULT 'usr-1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppNotification" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL DEFAULT 'ws-1',
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL DEFAULT 'ws-1',
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL DEFAULT 'ws-1',
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "details" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppDocument" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL DEFAULT 'ws-1',
    "clientId" TEXT,
    "transactionId" TEXT,
    "documentType" TEXT NOT NULL DEFAULT 'other',
    "fileName" TEXT NOT NULL,
    "fileSize" DOUBLE PRECISION NOT NULL,
    "issueDate" TEXT,
    "expiryDate" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_slug_key" ON "Workspace"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_workspaceId_idx" ON "User"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_workspaceId_idx" ON "Session"("workspaceId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE INDEX "Client_workspaceId_fullName_idx" ON "Client"("workspaceId", "fullName");

-- CreateIndex
CREATE INDEX "Client_workspaceId_phone_idx" ON "Client"("workspaceId", "phone");

-- CreateIndex
CREATE INDEX "Client_workspaceId_status_idx" ON "Client"("workspaceId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Client_workspaceId_id_key" ON "Client"("workspaceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceCategory_workspaceId_id_key" ON "ServiceCategory"("workspaceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceCategory_workspaceId_name_key" ON "ServiceCategory"("workspaceId", "name");

-- CreateIndex
CREATE INDEX "ServiceTemplate_workspaceId_categoryId_idx" ON "ServiceTemplate"("workspaceId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceTemplate_workspaceId_id_key" ON "ServiceTemplate"("workspaceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceTemplate_workspaceId_name_key" ON "ServiceTemplate"("workspaceId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_referenceNumber_key" ON "Transaction"("referenceNumber");

-- CreateIndex
CREATE INDEX "Transaction_workspaceId_clientId_idx" ON "Transaction"("workspaceId", "clientId");

-- CreateIndex
CREATE INDEX "Transaction_workspaceId_status_idx" ON "Transaction"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "Transaction_workspaceId_assignedUserId_idx" ON "Transaction"("workspaceId", "assignedUserId");

-- CreateIndex
CREATE INDEX "Transaction_workspaceId_nextFollowUpDate_idx" ON "Transaction"("workspaceId", "nextFollowUpDate");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_workspaceId_id_key" ON "Transaction"("workspaceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_workspaceId_referenceNumber_key" ON "Transaction"("workspaceId", "referenceNumber");

-- CreateIndex
CREATE INDEX "Task_workspaceId_dueDate_idx" ON "Task"("workspaceId", "dueDate");

-- CreateIndex
CREATE INDEX "Task_workspaceId_status_idx" ON "Task"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "Task_workspaceId_assignedUserId_idx" ON "Task"("workspaceId", "assignedUserId");

-- CreateIndex
CREATE INDEX "Payment_workspaceId_transactionId_idx" ON "Payment"("workspaceId", "transactionId");

-- CreateIndex
CREATE INDEX "Payment_workspaceId_clientId_idx" ON "Payment"("workspaceId", "clientId");

-- CreateIndex
CREATE INDEX "Payment_workspaceId_paymentDate_idx" ON "Payment"("workspaceId", "paymentDate");

-- CreateIndex
CREATE INDEX "Expense_workspaceId_expenseDate_idx" ON "Expense"("workspaceId", "expenseDate");

-- CreateIndex
CREATE INDEX "Expense_workspaceId_category_idx" ON "Expense"("workspaceId", "category");

-- CreateIndex
CREATE INDEX "AppNotification_workspaceId_userId_isRead_idx" ON "AppNotification"("workspaceId", "userId", "isRead");

-- CreateIndex
CREATE INDEX "ActivityLog_workspaceId_createdAt_idx" ON "ActivityLog"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_workspaceId_entityType_entityId_idx" ON "ActivityLog"("workspaceId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_workspaceId_createdAt_idx" ON "AuditLog"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_workspaceId_severity_idx" ON "AuditLog"("workspaceId", "severity");

-- CreateIndex
CREATE INDEX "AppDocument_workspaceId_clientId_idx" ON "AppDocument"("workspaceId", "clientId");

-- CreateIndex
CREATE INDEX "AppDocument_workspaceId_transactionId_idx" ON "AppDocument"("workspaceId", "transactionId");

-- CreateIndex
CREATE INDEX "AppDocument_workspaceId_expiryDate_idx" ON "AppDocument"("workspaceId", "expiryDate");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceCategory" ADD CONSTRAINT "ServiceCategory_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTemplate" ADD CONSTRAINT "ServiceTemplate_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTemplate" ADD CONSTRAINT "ServiceTemplate_workspaceId_categoryId_fkey" FOREIGN KEY ("workspaceId", "categoryId") REFERENCES "ServiceCategory"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_workspaceId_clientId_fkey" FOREIGN KEY ("workspaceId", "clientId") REFERENCES "Client"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_workspaceId_serviceTemplateId_fkey" FOREIGN KEY ("workspaceId", "serviceTemplateId") REFERENCES "ServiceTemplate"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_workspaceId_transactionId_fkey" FOREIGN KEY ("workspaceId", "transactionId") REFERENCES "Transaction"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_workspaceId_clientId_fkey" FOREIGN KEY ("workspaceId", "clientId") REFERENCES "Client"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_workspaceId_transactionId_fkey" FOREIGN KEY ("workspaceId", "transactionId") REFERENCES "Transaction"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_workspaceId_clientId_fkey" FOREIGN KEY ("workspaceId", "clientId") REFERENCES "Client"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_recordedBy_fkey" FOREIGN KEY ("recordedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_workspaceId_transactionId_fkey" FOREIGN KEY ("workspaceId", "transactionId") REFERENCES "Transaction"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_recordedBy_fkey" FOREIGN KEY ("recordedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppNotification" ADD CONSTRAINT "AppNotification_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppNotification" ADD CONSTRAINT "AppNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppDocument" ADD CONSTRAINT "AppDocument_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppDocument" ADD CONSTRAINT "AppDocument_workspaceId_clientId_fkey" FOREIGN KEY ("workspaceId", "clientId") REFERENCES "Client"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppDocument" ADD CONSTRAINT "AppDocument_workspaceId_transactionId_fkey" FOREIGN KEY ("workspaceId", "transactionId") REFERENCES "Transaction"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
