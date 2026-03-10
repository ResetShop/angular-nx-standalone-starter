CREATE INDEX "refresh_token_token_family_idx" ON "refresh_token" USING btree ("token_family");--> statement-breakpoint
CREATE INDEX "user_status_idx" ON "user" USING btree ("status");
