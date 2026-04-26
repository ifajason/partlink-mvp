DROP TABLE `car_brands`;--> statement-breakpoint
DROP TABLE `car_models`;--> statement-breakpoint
DROP TABLE `car_years`;--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `year` varchar(20);--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `condition` varchar(100);--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `price` varchar(50);--> statement-breakpoint
ALTER TABLE `products` ADD `brand` varchar(100);--> statement-breakpoint
ALTER TABLE `products` ADD `model` varchar(100);--> statement-breakpoint
ALTER TABLE `products` DROP COLUMN `brandId`;--> statement-breakpoint
ALTER TABLE `products` DROP COLUMN `modelId`;