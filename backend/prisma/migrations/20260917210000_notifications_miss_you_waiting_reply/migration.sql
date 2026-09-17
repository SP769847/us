-- AlterTable
ALTER TABLE `User` ADD COLUMN `notificationPreferences` TEXT NULL,
    ADD COLUMN `whatsappNumber` VARCHAR(191) NULL,
    ADD COLUMN `whatsappVerified` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `whatsappOtpHash` VARCHAR(191) NULL,
    ADD COLUMN `whatsappOtpExpiresAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `Notification` ADD COLUMN `senderId` VARCHAR(191) NULL,
    ADD COLUMN `conversationId` VARCHAR(191) NULL,
    ADD COLUMN `messageId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `Notification_senderId_idx` ON `Notification`(`senderId`);

-- CreateIndex
CREATE INDEX `Notification_conversationId_idx` ON `Notification`(`conversationId`);

-- CreateIndex
CREATE INDEX `Notification_type_createdAt_idx` ON `Notification`(`type`, `createdAt`);

-- CreateTable
CREATE TABLE `NotificationDelivery` (
    `id` VARCHAR(191) NOT NULL,
    `notificationId` VARCHAR(191) NOT NULL,
    `channel` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `provider` VARCHAR(191) NULL,
    `providerMessageId` VARCHAR(191) NULL,
    `failureReason` TEXT NULL,
    `attemptedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deliveredAt` DATETIME(3) NULL,

    INDEX `NotificationDelivery_notificationId_idx`(`notificationId`),
    INDEX `NotificationDelivery_channel_status_idx`(`channel`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ReminderSent` (
    `id` VARCHAR(191) NOT NULL,
    `messageId` VARCHAR(191) NOT NULL,
    `conversationId` VARCHAR(191) NOT NULL,
    `senderId` VARCHAR(191) NOT NULL,
    `recipientId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ReminderSent_messageId_key`(`messageId`),
    INDEX `ReminderSent_recipientId_createdAt_idx`(`recipientId`, `createdAt`),
    INDEX `ReminderSent_senderId_idx`(`senderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
