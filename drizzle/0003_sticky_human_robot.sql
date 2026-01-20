ALTER TABLE "role" ADD COLUMN "code" text NOT NULL;--> statement-breakpoint
ALTER TABLE "role" ADD COLUMN "removable" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "role" ADD CONSTRAINT "role_code_unique" UNIQUE("code");