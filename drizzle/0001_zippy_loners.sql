CREATE TABLE "role_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"role_id" integer NOT NULL,
	"action" text NOT NULL,
	"old_values" jsonb,
	"new_values" jsonb,
	"changed_by" integer NOT NULL,
	"changed_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_permission_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"role_id" integer NOT NULL,
	"permission_id" integer NOT NULL,
	"action" text NOT NULL,
	"changed_by" integer NOT NULL,
	"changed_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_role_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"role_id" integer NOT NULL,
	"action" text NOT NULL,
	"changed_by" integer NOT NULL,
	"changed_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_status_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"old_status" text NOT NULL,
	"new_status" text NOT NULL,
	"changed_by" integer NOT NULL,
	"changed_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "role_history" ADD CONSTRAINT "role_history_changed_by_user_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permission_history" ADD CONSTRAINT "role_permission_history_changed_by_user_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_role_history" ADD CONSTRAINT "user_role_history_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_role_history" ADD CONSTRAINT "user_role_history_changed_by_user_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_status_history" ADD CONSTRAINT "user_status_history_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_status_history" ADD CONSTRAINT "user_status_history_changed_by_user_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "role_history_role_id_idx" ON "role_history" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "role_permission_history_role_id_idx" ON "role_permission_history" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "user_role_history_user_id_idx" ON "user_role_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_role_history_role_id_idx" ON "user_role_history" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "user_status_history_user_id_idx" ON "user_status_history" USING btree ("user_id");