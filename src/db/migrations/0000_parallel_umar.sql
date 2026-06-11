CREATE TABLE `fasting_records` (
	`id` text PRIMARY KEY NOT NULL,
	`started_at` integer NOT NULL,
	`ended_at` integer,
	`goal_hours` real NOT NULL,
	`result` text,
	`weight_kg_before` real,
	`weight_kg_after` real,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `routine_completions` (
	`id` text PRIMARY KEY NOT NULL,
	`routine_id` text NOT NULL,
	`completed_date` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`routine_id`) REFERENCES `routines`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `routines` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`repeat_days` text NOT NULL,
	`reminder_time` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `todos` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`priority` text DEFAULT 'mid' NOT NULL,
	`due_date` text,
	`completed_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_profile` (
	`id` integer PRIMARY KEY NOT NULL,
	`height_cm` real,
	`weight_kg` real,
	`target_weight_kg` real,
	`age_years` integer,
	`is_male` integer,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `weight_history` (
	`id` text PRIMARY KEY NOT NULL,
	`weight_kg` real NOT NULL,
	`recorded_date` text NOT NULL,
	`created_at` integer NOT NULL
);
