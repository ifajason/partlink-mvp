CREATE TABLE `car_brands` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`nameEn` varchar(100),
	`logo` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `car_brands_id` PRIMARY KEY(`id`),
	CONSTRAINT `car_brands_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `car_models` (
	`id` int AUTO_INCREMENT NOT NULL,
	`brandId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`nameEn` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `car_models_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `car_years` (
	`id` int AUTO_INCREMENT NOT NULL,
	`modelId` int NOT NULL,
	`year` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `car_years_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inquiries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`sellerId` int NOT NULL,
	`buyerName` varchar(100) NOT NULL,
	`buyerPhone` varchar(20),
	`buyerLine` varchar(100),
	`buyerEmail` varchar(320),
	`message` text,
	`status` enum('pending','replied','closed') NOT NULL DEFAULT 'pending',
	`isUrgent` boolean DEFAULT false,
	`sellerReply` text,
	`repliedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inquiries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sellerId` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'TWD',
	`paymentType` enum('subscription','upgrade','renewal') NOT NULL,
	`fromPlan` enum('free','basic','pro','enterprise'),
	`toPlan` enum('free','basic','pro','enterprise') NOT NULL,
	`proratedDays` int,
	`paymentStatus` enum('pending','success','failed','refunded') NOT NULL DEFAULT 'pending',
	`paymentMethod` varchar(50),
	`transactionId` varchar(255),
	`paymentGateway` varchar(50) DEFAULT 'ecpay',
	`paidAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `product_images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`imageUrl` varchar(500) NOT NULL,
	`imageKey` varchar(500) NOT NULL,
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `product_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sellerId` int NOT NULL,
	`brandId` int NOT NULL,
	`modelId` int NOT NULL,
	`year` int,
	`partName` varchar(255) NOT NULL,
	`partNumber` varchar(100),
	`condition` enum('new','used','refurbished') NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`stock` int DEFAULT 1,
	`description` text,
	`status` enum('active','sold','inactive') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quick_replies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sellerId` int NOT NULL,
	`title` varchar(100) NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quick_replies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sellers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`businessName` varchar(255) NOT NULL,
	`contactPhone` varchar(20) NOT NULL,
	`address` text,
	`lineId` varchar(100),
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sellers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sub_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sellerId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('owner','manager','staff') NOT NULL DEFAULT 'staff',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sub_accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sellerId` int NOT NULL,
	`currentPlan` enum('free','basic','pro','enterprise') NOT NULL DEFAULT 'free',
	`nextPlan` enum('free','basic','pro','enterprise'),
	`status` enum('active','expired','cancelled') NOT NULL DEFAULT 'active',
	`subscriptionStart` timestamp NOT NULL,
	`subscriptionEnd` timestamp NOT NULL,
	`planChangeAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscriptions_sellerId_unique` UNIQUE(`sellerId`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);