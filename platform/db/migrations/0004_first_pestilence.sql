CREATE TABLE "reading_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"class_id" text NOT NULL,
	"course_slug" text NOT NULL,
	"time_spent_sec" integer DEFAULT 0 NOT NULL,
	"scroll_depth" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_decisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"class_id" text NOT NULL,
	"course_slug" text NOT NULL,
	"decision_type" text NOT NULL,
	"prompt" text NOT NULL,
	"response" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reading_analytics" ADD CONSTRAINT "reading_analytics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_decisions" ADD CONSTRAINT "user_decisions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "reading_analytics_user_class_idx" ON "reading_analytics" USING btree ("user_id","class_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_decisions_user_class_idx" ON "user_decisions" USING btree ("user_id","class_id");