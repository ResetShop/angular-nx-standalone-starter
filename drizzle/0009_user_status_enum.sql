-- Step 1: Create the enum type
CREATE TYPE "user_status" AS ENUM('active', 'disabled', 'deleted');

-- Step 2: Add status column as nullable first (required for data migration)
ALTER TABLE "user" ADD COLUMN "status" "user_status";

-- Step 3: Migrate existing boolean data to enum values
-- deleted=true -> 'deleted', enabled=false -> 'disabled', else -> 'active'
UPDATE "user"
SET "status" = CASE
  WHEN "deleted" = true THEN 'deleted'::"user_status"
  WHEN "enabled" = false THEN 'disabled'::"user_status"
  ELSE 'active'::"user_status"
END;

-- Step 4: Apply NOT NULL constraint after all rows are set
ALTER TABLE "user" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "user" ALTER COLUMN "status" SET DEFAULT 'active';

-- Step 5: Add audit columns
ALTER TABLE "user" ADD COLUMN "status_changed_at" timestamp;
ALTER TABLE "user" ADD COLUMN "status_changed_by" integer REFERENCES "user"("id") ON DELETE SET NULL;
ALTER TABLE "user" ADD COLUMN "deleted_at" timestamp;

-- Step 6: Drop old boolean columns (only after status column is fully set up)
ALTER TABLE "user" DROP COLUMN "enabled";
ALTER TABLE "user" DROP COLUMN "deleted";
