ALTER TABLE `reports` ADD `status` text DEFAULT 'open' NOT NULL;--> statement-breakpoint
ALTER TABLE `reports` ADD `resolved_at` integer;--> statement-breakpoint
ALTER TABLE `reports` ADD `resolved_by` text;