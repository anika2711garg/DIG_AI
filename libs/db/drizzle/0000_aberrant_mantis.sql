CREATE TYPE "public"."approval_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."confidence" AS ENUM('strong', 'weak', 'unreproduced');--> statement-breakpoint
CREATE TYPE "public"."failure_type" AS ENUM('cant_localize', 'cant_reproduce', 'weak_reproduction', 'build_failed', 'patch_apply_failed', 'tests_regressed', 'flaky_suite', 'revert_check_failed', 'budget_exceeded', 'attempts_exhausted', 'injection_suspected', 'rejected_by_human', 'infra_error', 'invalid_repository', 'unsupported_repository', 'sandbox_timeout', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."intervention_kind" AS ENUM('approve_pr', 'review_repro', 'clarify_issue', 'abort');--> statement-breakpoint
CREATE TYPE "public"."intervention_status" AS ENUM('pending', 'resolved', 'expired');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."mode" AS ENUM('strict', 'permissive', 'vibes');--> statement-breakpoint
CREATE TYPE "public"."pr_status" AS ENUM('draft', 'opened', 'failed');--> statement-breakpoint
CREATE TYPE "public"."run_state" AS ENUM('created', 'ingesting', 'localizing', 'reproducing', 'patching', 'verifying', 'awaiting_human', 'opening_pr', 'done', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."trace_kind" AS ENUM('model', 'tool');--> statement-breakpoint
CREATE TABLE "approvals" (
	"id" serial PRIMARY KEY NOT NULL,
	"run_id" integer NOT NULL,
	"status" "approval_status" DEFAULT 'pending' NOT NULL,
	"reviewer_identifier" text,
	"reviewer_comment" text,
	"approved_patch_digest" text NOT NULL,
	"approved_reproduction_digest" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"decided_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"run_id" integer NOT NULL,
	"n" integer NOT NULL,
	"localization_result_json" jsonb,
	"reproduction_patch" text,
	"reproduction_result_json" jsonb,
	"source_patch" text,
	"patch_apply_result_json" jsonb,
	"verification_result_json" jsonb,
	"verdict" text,
	"model_metadata_json" jsonb,
	"token_usage_json" jsonb,
	"cost_usd" numeric(12, 6),
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attempts_run_id_n_key" UNIQUE("run_id","n")
);
--> statement-breakpoint
CREATE TABLE "evaluations" (
	"id" serial PRIMARY KEY NOT NULL,
	"dataset_version" text NOT NULL,
	"task_subset" text,
	"config_snapshot_json" jsonb,
	"model_identifiers_json" jsonb,
	"commit_sha" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"aggregate_metrics_json" jsonb,
	"per_task_results_json" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"run_id" integer NOT NULL,
	"sequence_number" integer DEFAULT 1 NOT NULL,
	"type" text NOT NULL,
	"state" "run_state",
	"data_json" jsonb,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interventions" (
	"id" serial PRIMARY KEY NOT NULL,
	"run_id" integer NOT NULL,
	"stage" text NOT NULL,
	"kind" "intervention_kind" NOT NULL,
	"request_json" jsonb,
	"status" "intervention_status" DEFAULT 'pending' NOT NULL,
	"response_json" jsonb,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	"resolved_by" text
);
--> statement-breakpoint
CREATE TABLE "issues" (
	"id" serial PRIMARY KEY NOT NULL,
	"repo_id" integer NOT NULL,
	"external_issue_id" text,
	"issue_number" integer NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"labels_json" jsonb,
	"comments_json" jsonb,
	"author_json" jsonb,
	"state" text DEFAULT 'open' NOT NULL,
	"source_url" text,
	"fetched_at" timestamp with time zone,
	"raw_payload_json" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"run_id" integer NOT NULL,
	"stage" text NOT NULL,
	"status" "job_status" DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"available_at" timestamp with time zone DEFAULT now() NOT NULL,
	"locked_at" timestamp with time zone,
	"locked_by" text,
	"last_error" text,
	"payload_json" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prs" (
	"id" serial PRIMARY KEY NOT NULL,
	"run_id" integer NOT NULL,
	"idempotency_key" text NOT NULL,
	"provider" text DEFAULT 'github' NOT NULL,
	"external_pr_number" integer,
	"external_pr_id" text,
	"url" text,
	"head_branch" text,
	"base_branch" text DEFAULT 'main',
	"status" "pr_status" DEFAULT 'draft' NOT NULL,
	"labels_json" jsonb,
	"request_payload_json" jsonb,
	"response_payload_json" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "prs_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "repos" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"default_branch" text DEFAULT 'main' NOT NULL,
	"clone_url" text,
	"status" text DEFAULT 'active' NOT NULL,
	"image_tag" text,
	"build_recipe_json" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "repos_full_name_unique" UNIQUE("full_name")
);
--> statement-breakpoint
CREATE TABLE "runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"repo_id" integer NOT NULL,
	"issue_id" integer,
	"issue_number" integer NOT NULL,
	"state" "run_state" DEFAULT 'created' NOT NULL,
	"mode" "mode" DEFAULT 'permissive' NOT NULL,
	"confidence" "confidence",
	"failure_type" "failure_type",
	"failure_details_json" jsonb,
	"current_attempt" integer DEFAULT 1 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"budget_usd" numeric(10, 4) NOT NULL,
	"spent_usd" numeric(12, 6) DEFAULT '0' NOT NULL,
	"token_budget" integer DEFAULT 500000,
	"tokens_used" integer DEFAULT 0,
	"wall_clock_limit_seconds" integer DEFAULT 1800,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"claimed_by" text,
	"claimed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "traces" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"run_id" integer NOT NULL,
	"attempt_id" integer,
	"kind" "trace_kind" NOT NULL,
	"name" text NOT NULL,
	"input_json" jsonb,
	"output_json" jsonb,
	"success" text DEFAULT 'true',
	"error_type" text,
	"error_message" text,
	"tokens_in" integer,
	"tokens_out" integer,
	"latency_ms" integer,
	"cost_usd" numeric(12, 6),
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_run_id_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_run_id_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_run_id_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interventions" ADD CONSTRAINT "interventions_run_id_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issues" ADD CONSTRAINT "issues_repo_id_repos_id_fk" FOREIGN KEY ("repo_id") REFERENCES "public"."repos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_run_id_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prs" ADD CONSTRAINT "prs_run_id_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "runs" ADD CONSTRAINT "runs_repo_id_repos_id_fk" FOREIGN KEY ("repo_id") REFERENCES "public"."repos"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "runs" ADD CONSTRAINT "runs_issue_id_issues_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."issues"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "traces" ADD CONSTRAINT "traces_run_id_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "traces" ADD CONSTRAINT "traces_attempt_id_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."attempts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "events_run_id_id_idx" ON "events" USING btree ("run_id","id");--> statement-breakpoint
CREATE INDEX "interventions_run_id_status_idx" ON "interventions" USING btree ("run_id","status");--> statement-breakpoint
CREATE INDEX "jobs_status_available_idx" ON "jobs" USING btree ("status","available_at");--> statement-breakpoint
CREATE INDEX "runs_state_idx" ON "runs" USING btree ("state");--> statement-breakpoint
CREATE INDEX "traces_run_id_id_idx" ON "traces" USING btree ("run_id","id");