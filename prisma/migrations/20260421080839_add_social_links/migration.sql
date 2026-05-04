-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "fetlifeUrl" TEXT,
ADD COLUMN     "instagramUrl" TEXT,
ADD COLUMN     "onlyfansUrl" TEXT,
ADD COLUMN     "pornhubUrl" TEXT,
ADD COLUMN     "socialLinksVisibility" TEXT NOT NULL DEFAULT 'members',
ADD COLUMN     "tumblrUrl" TEXT,
ADD COLUMN     "twitterUrl" TEXT;
