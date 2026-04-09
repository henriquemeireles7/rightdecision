CREATE TABLE "drip_emails" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"email_index" integer NOT NULL,
	"decision_text" text NOT NULL,
	"scheduled_at" timestamp NOT NULL,
	"sent_at" timestamp,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "free_intro_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_one_answer" text,
	"lesson_one_completed_at" timestamp,
	"email" text,
	"merged_to_user_id" uuid,
	"ab_variant" text,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "user_decisions_user_class_idx";--> statement-breakpoint
ALTER TABLE "pipeline_runs" ADD COLUMN IF NOT EXISTS "step_timings" jsonb;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "plan_interval" text DEFAULT 'year' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_decisions" ADD COLUMN "block_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "user_decisions" ADD COLUMN "is_custom" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user_decisions" ADD COLUMN "previous_context" jsonb;--> statement-breakpoint
ALTER TABLE "drip_emails" ADD CONSTRAINT "drip_emails_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "free_intro_sessions" ADD CONSTRAINT "free_intro_sessions_merged_to_user_id_users_id_fk" FOREIGN KEY ("merged_to_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "drip_emails_user_index_idx" ON "drip_emails" USING btree ("user_id","email_index");--> statement-breakpoint
CREATE INDEX "drip_emails_pending_idx" ON "drip_emails" USING btree ("status","scheduled_at");--> statement-breakpoint
CREATE UNIQUE INDEX "user_decisions_user_class_block_idx" ON "user_decisions" USING btree ("user_id","class_id","block_id");--> statement-breakpoint
CREATE INDEX "user_decisions_user_created_idx" ON "user_decisions" USING btree ("user_id","created_at");