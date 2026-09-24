CREATE TABLE `email_codes` (
	`email` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`expires_at` integer NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name_en` text NOT NULL,
	`name_fa` text NOT NULL,
	`title_en` text NOT NULL,
	`title_fa` text NOT NULL,
	`role` text NOT NULL,
	`city_id` text NOT NULL,
	`country_code` text NOT NULL,
	`bio_en` text DEFAULT '' NOT NULL,
	`bio_fa` text DEFAULT '' NOT NULL,
	`skills` text NOT NULL,
	`linkedin` text,
	`portfolio` text,
	`website` text,
	`photo` text,
	`hue` real NOT NULL,
	`verification` text DEFAULT 'email' NOT NULL,
	`hidden` integer DEFAULT false NOT NULL,
	`joined_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `profiles_user_id_unique` ON `profiles` (`user_id`);--> statement-breakpoint
CREATE INDEX `profiles_city_idx` ON `profiles` (`city_id`);--> statement-breakpoint
CREATE INDEX `profiles_country_idx` ON `profiles` (`country_code`);--> statement-breakpoint
CREATE TABLE `reports` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`reporter_user_id` text,
	`reason` text NOT NULL,
	`note` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`token` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`provider` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);