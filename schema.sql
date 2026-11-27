-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "extensions";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('user', 'authority');

-- CreateEnum
CREATE TYPE "IssueStatus" AS ENUM ('REPORTED', 'ROUTED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'FIX_SUBMITTED', 'FIX_VERIFIED', 'FIX_REJECTED', 'NEEDS_REVIEW', 'RECURRED');

-- CreateEnum
CREATE TYPE "IssueCategory" AS ENUM ('pothole', 'drainage', 'garbage');

-- CreateEnum
CREATE TYPE "PriorityBand" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "ImageKind" AS ENUM ('report', 'fix');

-- CreateEnum
CREATE TYPE "FixDecision" AS ENUM ('APPROVED', 'REJECTED', 'NEEDS_REVIEW');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issues" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lon" DOUBLE PRECISION NOT NULL,
    "status" "IssueStatus" NOT NULL DEFAULT 'REPORTED',
    "flags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "severity" SMALLINT,
    "severity_rationale" TEXT,
    "priority_score" INTEGER,
    "priority_band" "PriorityBand",
    "priority_rationale" TEXT,
    "report_count" INTEGER NOT NULL DEFAULT 1,
    "sla_due_at" TIMESTAMP(3),
    "routed_authorities" JSONB,
    "is_seed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "issue_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "image_id" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lon" DOUBLE PRECISION NOT NULL,
    "captured_at" TIMESTAMP(3),
    "classification" JSONB,
    "human_override" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "images" (
    "id" TEXT NOT NULL,
    "kind" "ImageKind" NOT NULL,
    "path" TEXT NOT NULL,
    "sha256" TEXT NOT NULL,
    "exif" JSONB,
    "embedding" vector(512),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_runs" (
    "id" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "prompt_hash" TEXT NOT NULL,
    "input_hashes" TEXT[],
    "raw_output" TEXT NOT NULL,
    "parsed" JSONB,
    "latency_ms" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fix_attempts" (
    "id" TEXT NOT NULL,
    "issue_id" TEXT NOT NULL,
    "image_ids" TEXT[],
    "pair_outputs" JSONB,
    "fix_score" DOUBLE PRECISION,
    "decision" "FixDecision",
    "thresholds" JSONB,
    "receipt" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fix_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "issue_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "authorities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "zone" TEXT,
    "handles" JSONB,
    "verified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "authorities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metrics_runs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dataset" TEXT,
    "n" INTEGER,
    "results" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metrics_runs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "issues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "images"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fix_attempts" ADD CONSTRAINT "fix_attempts_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "issues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "issues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- If migrating existing tables, convert category column to TEXT to support all civic hazards:
ALTER TABLE "issues" ALTER COLUMN "category" TYPE TEXT;


