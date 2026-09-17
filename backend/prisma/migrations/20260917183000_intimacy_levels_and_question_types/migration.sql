-- AlterTable
ALTER TABLE `Question` ADD COLUMN `intimacyLevel` VARCHAR(191) NULL,
    ADD COLUMN `options` TEXT NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `SentQuestion` ADD COLUMN `intimacyLevel` VARCHAR(191) NULL,
    ADD COLUMN `options` TEXT NULL,
    ADD COLUMN `senderAnswer` TEXT NULL,
    ADD COLUMN `senderAnsweredAt` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `Question_intimacyLevel_idx` ON `Question`(`intimacyLevel`);
