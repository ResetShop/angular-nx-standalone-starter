-- Add module column to permission table.
-- Extracts the module prefix from the existing name field (e.g. 'admin' from 'admin:users:read').
ALTER TABLE "permission" ADD COLUMN "module" text;
UPDATE "permission" SET "module" = split_part("name", ':', 1);
ALTER TABLE "permission" ALTER COLUMN "module" SET NOT NULL;