CREATE TABLE "brief_files" (
	"id" text PRIMARY KEY NOT NULL,
	"creative_id" text NOT NULL,
	"name" text NOT NULL,
	"size" integer NOT NULL,
	"data" text NOT NULL,
	"uploaded_by" text NOT NULL,
	"created_at" bigint NOT NULL
);
