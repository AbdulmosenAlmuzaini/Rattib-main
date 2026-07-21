ALTER TABLE "AppDocument" ADD COLUMN "checksumSha256" TEXT,
  ADD COLUMN "mimeType" TEXT,
  ADD COLUMN "storageKey" TEXT,
  ADD COLUMN "uploadedBy" TEXT;

CREATE UNIQUE INDEX "AppDocument_storageKey_key" ON "AppDocument"("storageKey");
CREATE INDEX "AppDocument_workspaceId_storageKey_idx" ON "AppDocument"("workspaceId", "storageKey");

ALTER TABLE "AppDocument" ADD CONSTRAINT "AppDocument_workspaceId_uploadedBy_fkey"
  FOREIGN KEY ("workspaceId", "uploadedBy") REFERENCES "User"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
