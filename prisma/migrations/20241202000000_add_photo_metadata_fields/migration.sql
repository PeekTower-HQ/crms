-- Add photo metadata fields to Person
ALTER TABLE "persons" ADD COLUMN IF NOT EXISTS "photoFileKey" TEXT;
ALTER TABLE "persons" ADD COLUMN IF NOT EXISTS "photoThumbnailUrl" TEXT;
ALTER TABLE "persons" ADD COLUMN IF NOT EXISTS "photoSmallUrl" TEXT;
ALTER TABLE "persons" ADD COLUMN IF NOT EXISTS "photoMediumUrl" TEXT;
ALTER TABLE "persons" ADD COLUMN IF NOT EXISTS "photoHash" TEXT;
ALTER TABLE "persons" ADD COLUMN IF NOT EXISTS "photoSize" INTEGER;
ALTER TABLE "persons" ADD COLUMN IF NOT EXISTS "photoUploadedAt" TIMESTAMP(3);

-- Add photo metadata fields to AmberAlert
ALTER TABLE "amber_alerts" ADD COLUMN IF NOT EXISTS "photoFileKey" TEXT;
ALTER TABLE "amber_alerts" ADD COLUMN IF NOT EXISTS "photoThumbnailUrl" TEXT;
ALTER TABLE "amber_alerts" ADD COLUMN IF NOT EXISTS "photoSmallUrl" TEXT;
ALTER TABLE "amber_alerts" ADD COLUMN IF NOT EXISTS "photoMediumUrl" TEXT;
ALTER TABLE "amber_alerts" ADD COLUMN IF NOT EXISTS "photoHash" TEXT;
ALTER TABLE "amber_alerts" ADD COLUMN IF NOT EXISTS "photoSize" INTEGER;
ALTER TABLE "amber_alerts" ADD COLUMN IF NOT EXISTS "photoUploadedAt" TIMESTAMP(3);

-- Add photo metadata fields to WantedPerson
ALTER TABLE "wanted_persons" ADD COLUMN IF NOT EXISTS "photoFileKey" TEXT;
ALTER TABLE "wanted_persons" ADD COLUMN IF NOT EXISTS "photoThumbnailUrl" TEXT;
ALTER TABLE "wanted_persons" ADD COLUMN IF NOT EXISTS "photoSmallUrl" TEXT;
ALTER TABLE "wanted_persons" ADD COLUMN IF NOT EXISTS "photoMediumUrl" TEXT;
ALTER TABLE "wanted_persons" ADD COLUMN IF NOT EXISTS "photoHash" TEXT;
ALTER TABLE "wanted_persons" ADD COLUMN IF NOT EXISTS "photoSize" INTEGER;
ALTER TABLE "wanted_persons" ADD COLUMN IF NOT EXISTS "photoUploadedAt" TIMESTAMP(3);

-- Add officer fields: nationalId, enrollmentDate, and photo metadata
ALTER TABLE "officers" ADD COLUMN IF NOT EXISTS "nationalId" TEXT;
ALTER TABLE "officers" ADD COLUMN IF NOT EXISTS "enrollmentDate" TIMESTAMP(3);
ALTER TABLE "officers" ADD COLUMN IF NOT EXISTS "photoUrl" TEXT;
ALTER TABLE "officers" ADD COLUMN IF NOT EXISTS "photoFileKey" TEXT;
ALTER TABLE "officers" ADD COLUMN IF NOT EXISTS "photoThumbnailUrl" TEXT;
ALTER TABLE "officers" ADD COLUMN IF NOT EXISTS "photoSmallUrl" TEXT;
ALTER TABLE "officers" ADD COLUMN IF NOT EXISTS "photoMediumUrl" TEXT;
ALTER TABLE "officers" ADD COLUMN IF NOT EXISTS "photoHash" TEXT;
ALTER TABLE "officers" ADD COLUMN IF NOT EXISTS "photoSize" INTEGER;
ALTER TABLE "officers" ADD COLUMN IF NOT EXISTS "photoUploadedAt" TIMESTAMP(3);

-- Add unique constraint and index for officer nationalId
CREATE UNIQUE INDEX IF NOT EXISTS "officers_nationalId_key" ON "officers"("nationalId");
CREATE INDEX IF NOT EXISTS "officers_nationalId_idx" ON "officers"("nationalId");
