CREATE TABLE `activity` (
	`id` text PRIMARY KEY NOT NULL,
	`creative_id` text NOT NULL,
	`actor` text NOT NULL,
	`text` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `comments` (
	`id` text PRIMARY KEY NOT NULL,
	`creative_id` text NOT NULL,
	`author` text NOT NULL,
	`email` text NOT NULL,
	`body` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `creatives` (
	`id` text PRIMARY KEY NOT NULL,
	`number` integer NOT NULL,
	`product` text DEFAULT 'BLIVE' NOT NULL,
	`title` text DEFAULT 'Novo criativo' NOT NULL,
	`parent` text DEFAULT '' NOT NULL,
	`kind` text DEFAULT 'Novo conceito' NOT NULL,
	`status` text DEFAULT 'brief' NOT NULL,
	`owner` text NOT NULL,
	`owner_email` text NOT NULL,
	`hypothesis` text DEFAULT '' NOT NULL,
	`offer` text DEFAULT '' NOT NULL,
	`angle` text DEFAULT '' NOT NULL,
	`message` text DEFAULT '' NOT NULL,
	`hook` text DEFAULT '' NOT NULL,
	`hook_copy` text DEFAULT '' NOT NULL,
	`hook_visual` text DEFAULT '' NOT NULL,
	`concept` text DEFAULT '' NOT NULL,
	`script` text DEFAULT '' NOT NULL,
	`editor_notes` text DEFAULT '' NOT NULL,
	`variable` text DEFAULT 'Hook' NOT NULL,
	`keep` text DEFAULT '' NOT NULL,
	`change` text DEFAULT '' NOT NULL,
	`version` text DEFAULT 'V01' NOT NULL,
	`asset_url` text DEFAULT '' NOT NULL,
	`spend` real,
	`cpa` real,
	`roas` real,
	`ctr` real,
	`cvr` real,
	`result` text DEFAULT '' NOT NULL,
	`learning` text DEFAULT '' NOT NULL,
	`next_action` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
