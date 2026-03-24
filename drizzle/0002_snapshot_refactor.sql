-- Refactor role_history: JSONB → snapshot columns
ALTER TABLE "role_history" DROP COLUMN "old_values";
--> statement-breakpoint
ALTER TABLE "role_history" DROP COLUMN "new_values";
--> statement-breakpoint
ALTER TABLE "role_history" ADD COLUMN "name" text NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE "role_history" ADD COLUMN "code" text NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE "role_history" ADD COLUMN "description" text;
--> statement-breakpoint
-- Remove defaults after backfill (new rows always provide values)
ALTER TABLE "role_history" ALTER COLUMN "name" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "role_history" ALTER COLUMN "code" DROP DEFAULT;
--> statement-breakpoint
-- Simplify user_status_history: drop old_status, rename new_status → status
ALTER TABLE "user_status_history" DROP COLUMN "old_status";
--> statement-breakpoint
ALTER TABLE "user_status_history" RENAME COLUMN "new_status" TO "status";
--> statement-breakpoint
-- Create user_profile_history table
CREATE TABLE "user_profile_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"email" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"changed_by" integer NOT NULL,
	"changed_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_profile_history" ADD CONSTRAINT "user_profile_history_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_profile_history" ADD CONSTRAINT "user_profile_history_changed_by_user_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "user_profile_history_user_id_idx" ON "user_profile_history" USING btree ("user_id");
