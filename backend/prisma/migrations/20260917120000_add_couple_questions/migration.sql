-- CreateTable
CREATE TABLE `Question` (
    `id` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `questionText` VARCHAR(500) NOT NULL,
    `ageRestricted` BOOLEAN NOT NULL DEFAULT false,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Question_category_idx`(`category`),
    UNIQUE INDEX `Question_category_questionText_key`(`category`, `questionText`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SentQuestion` (
    `id` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NULL,
    `customText` TEXT NULL,
    `mode` VARCHAR(191) NOT NULL DEFAULT 'SURPRISE',
    `category` VARCHAR(191) NULL,
    `conversationId` VARCHAR(191) NOT NULL,
    `messageId` VARCHAR(191) NOT NULL,
    `senderId` VARCHAR(191) NOT NULL,
    `recipientId` VARCHAR(191) NOT NULL,
    `revealed` BOOLEAN NOT NULL DEFAULT true,
    `answer` TEXT NULL,
    `answeredById` VARCHAR(191) NULL,
    `answeredAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `SentQuestion_messageId_key`(`messageId`),
    INDEX `SentQuestion_questionId_idx`(`questionId`),
    INDEX `SentQuestion_conversationId_idx`(`conversationId`),
    INDEX `SentQuestion_senderId_idx`(`senderId`),
    INDEX `SentQuestion_recipientId_idx`(`recipientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
