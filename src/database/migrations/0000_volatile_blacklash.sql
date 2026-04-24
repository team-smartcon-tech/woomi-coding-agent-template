CREATE TYPE "public"."article_type_enum" AS ENUM('News', 'Post');--> statement-breakpoint
CREATE TYPE "public"."notificator_channel_type_enum" AS ENUM('Teams', 'Kakao');--> statement-breakpoint
CREATE TYPE "public"."scrapper_type_enum" AS ENUM('News', 'Post');--> statement-breakpoint
CREATE TYPE "public"."user_role_enum" AS ENUM('Master', 'Admin', 'User');--> statement-breakpoint
CREATE TABLE "articles" (
	"id" text PRIMARY KEY NOT NULL,
	"fetch_id" text NOT NULL,
	"title" text NOT NULL,
	"original_link" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"pub_date" timestamp with time zone NOT NULL,
	"media_name" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fetch_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"fetch_date" timestamp with time zone NOT NULL,
	"keyword" text NOT NULL,
	"article_type" "article_type_enum" NOT NULL,
	"count_unique_articles" integer DEFAULT 0 NOT NULL,
	"notified" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notificators" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"channel_type" "notificator_channel_type_enum" NOT NULL,
	"channel_api_url" text NOT NULL,
	"channel_api_key" text NOT NULL,
	"activated" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_subscription" (
	"endpoint" text PRIMARY KEY NOT NULL,
	"p256dh_key" text NOT NULL,
	"auth_key" text NOT NULL,
	"activated" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"day" integer NOT NULL,
	"start" integer NOT NULL,
	"end" integer NOT NULL,
	"interval" integer NOT NULL,
	"scrapper_id" uuid,
	"notificator_id" uuid
);
--> statement-breakpoint
CREATE TABLE "scrappers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scrapper_name" text NOT NULL,
	"type" "scrapper_type_enum" NOT NULL,
	"activated" boolean DEFAULT false NOT NULL,
	"keyword" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"role" "user_role_enum" NOT NULL,
	"created" date NOT NULL
);
--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_fetch_id_fetch_logs_id_fk" FOREIGN KEY ("fetch_id") REFERENCES "public"."fetch_logs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_scrapper_id_scrappers_id_fk" FOREIGN KEY ("scrapper_id") REFERENCES "public"."scrappers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_notificator_id_notificators_id_fk" FOREIGN KEY ("notificator_id") REFERENCES "public"."notificators"("id") ON DELETE cascade ON UPDATE no action;