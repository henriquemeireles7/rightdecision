CREATE TABLE "clips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pipeline_run_id" uuid NOT NULL,
	"source_timestamp_start" integer NOT NULL,
	"source_timestamp_end" integer NOT NULL,
	"duration" integer NOT NULL,
	"score" integer,
	"suggested_title" text,
	"transcript_snippet" text,
	"storage_url" text,
	"approved" boolean DEFAULT false NOT NULL,
	"cut_status" text DEFAULT 'pending' NOT NULL,
	"platform_fit" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "insights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date_range_start" timestamp NOT NULL,
	"date_range_end" timestamp NOT NULL,
	"recommendation" text NOT NULL,
	"supporting_data" jsonb,
	"acted_on" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pipeline_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"input_video_url" text NOT NULL,
	"input_video_size" integer,
	"duration_seconds" integer,
	"category" text,
	"status" text DEFAULT 'queued' NOT NULL,
	"step_failed_at" text,
	"error_message" text,
	"transcript" text,
	"config" jsonb,
	"clips_generated" integer DEFAULT 0 NOT NULL,
	"clips_approved" integer DEFAULT 0 NOT NULL,
	"clips_posted" integer DEFAULT 0 NOT NULL,
	"clips_failed" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" text NOT NULL,
	"account_handle" text NOT NULL,
	"account_type" text NOT NULL,
	"upload_post_profile_id" text,
	"posting_schedule" jsonb,
	"char_limit" integer,
	"hashtag_limit" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"snapshot_at" timestamp DEFAULT now() NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"likes" integer DEFAULT 0 NOT NULL,
	"comments" integer DEFAULT 0 NOT NULL,
	"shares" integer DEFAULT 0 NOT NULL,
	"saves" integer DEFAULT 0 NOT NULL,
	"impressions" integer DEFAULT 0 NOT NULL,
	"reach" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clip_id" uuid NOT NULL,
	"platform_account_id" uuid NOT NULL,
	"platform_name" text,
	"upload_post_id" text,
	"upload_post_response" jsonb,
	"description" text,
	"hashtags" text[],
	"cta" text,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"scheduled_at" timestamp,
	"posted_at" timestamp,
	"failure_reason" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clips" ADD CONSTRAINT "clips_pipeline_run_id_pipeline_runs_id_fk" FOREIGN KEY ("pipeline_run_id") REFERENCES "public"."pipeline_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_analytics" ADD CONSTRAINT "post_analytics_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_clip_id_clips_id_fk" FOREIGN KEY ("clip_id") REFERENCES "public"."clips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_platform_account_id_platform_accounts_id_fk" FOREIGN KEY ("platform_account_id") REFERENCES "public"."platform_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_clips_pipeline_run" ON "clips" USING btree ("pipeline_run_id");--> statement-breakpoint
CREATE INDEX "idx_clips_approved" ON "clips" USING btree ("pipeline_run_id","approved");--> statement-breakpoint
CREATE INDEX "idx_runs_status" ON "pipeline_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_runs_created" ON "pipeline_runs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_analytics_post" ON "post_analytics" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "idx_analytics_snapshot" ON "post_analytics" USING btree ("snapshot_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_posts_clip_account" ON "posts" USING btree ("clip_id","platform_account_id");--> statement-breakpoint
CREATE INDEX "idx_posts_clip" ON "posts" USING btree ("clip_id");--> statement-breakpoint
CREATE INDEX "idx_posts_status" ON "posts" USING btree ("status");