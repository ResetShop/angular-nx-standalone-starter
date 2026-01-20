ALTER TABLE "role_permission" DROP CONSTRAINT "role_permission_permission_id_permission_id_fk";
--> statement-breakpoint
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_permission_id_permission_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permission"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_permission_name" ON "permission" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_role_code" ON "role" USING btree ("code");