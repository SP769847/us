-- AlterTable
ALTER TABLE `User` ADD COLUMN `questionPreference` VARCHAR(191) NOT NULL DEFAULT 'ROMANTIC';

-- AlterTable
ALTER TABLE `Question` ADD COLUMN `subcategory` VARCHAR(191) NULL,
    ADD COLUMN `responseType` VARCHAR(191) NOT NULL DEFAULT 'TEXT';

-- AlterTable
ALTER TABLE `SentQuestion` ADD COLUMN `subcategory` VARCHAR(191) NULL,
    ADD COLUMN `responseType` VARCHAR(191) NOT NULL DEFAULT 'TEXT',
    ADD COLUMN `skippedByRecipient` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `skippedAt` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `Question_subcategory_idx` ON `Question`(`subcategory`);

-- CreateTable
CREATE TABLE `SavedQuestion` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NULL,
    `customText` TEXT NULL,
    `category` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SavedQuestion_userId_idx`(`userId`),
    INDEX `SavedQuestion_questionId_idx`(`questionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SeenQuestion` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `seenAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SeenQuestion_userId_idx`(`userId`),
    INDEX `SeenQuestion_questionId_idx`(`questionId`),
    UNIQUE INDEX `SeenQuestion_userId_questionId_key`(`userId`, `questionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CustomQuestion` (
    `id` VARCHAR(191) NOT NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `recipientId` VARCHAR(191) NULL,
    `conversationId` VARCHAR(191) NULL,
    `questionText` TEXT NOT NULL,
    `category` VARCHAR(191) NULL,
    `ageRestricted` BOOLEAN NOT NULL DEFAULT false,
    `visibility` VARCHAR(191) NOT NULL DEFAULT 'PRIVATE',
    `scheduledFor` DATETIME(3) NULL,
    `deliveredAt` DATETIME(3) NULL,
    `sentQuestionId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `CustomQuestion_sentQuestionId_key`(`sentQuestionId`),
    INDEX `CustomQuestion_authorId_idx`(`authorId`),
    INDEX `CustomQuestion_recipientId_idx`(`recipientId`),
    INDEX `CustomQuestion_scheduledFor_idx`(`scheduledFor`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
