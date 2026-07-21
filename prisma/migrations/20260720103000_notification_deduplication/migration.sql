ALTER TABLE "AppNotification" ADD COLUMN "actionUrl" TEXT,
  ADD COLUMN "dedupeKey" TEXT;

CREATE UNIQUE INDEX "AppNotification_workspaceId_userId_dedupeKey_key"
  ON "AppNotification"("workspaceId", "userId", "dedupeKey");
