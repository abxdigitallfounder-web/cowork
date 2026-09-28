CREATE TABLE `team_members` (
	`email` text PRIMARY KEY NOT NULL,
	`name` text DEFAULT '' NOT NULL,
	`role` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `creatives` ADD `copy_assignee` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `creatives` ADD `editor_assignee` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `creatives` ADD `media_assignee` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `creatives` ADD `due_at` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `creatives` ADD `editor_response` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `creatives` ADD `editor_checklist` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `creatives` ADD `review_feedback` text DEFAULT '' NOT NULL;