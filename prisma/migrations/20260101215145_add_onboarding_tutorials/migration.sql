-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "hasCompletedOnboarding" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboardingCompletedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE IF NOT EXISTS "user_onboarding_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "completedSteps" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "setupVersion" TEXT,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_onboarding_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "user_onboarding_progress_userId_key" ON "user_onboarding_progress"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "user_onboarding_progress_userId_idx" ON "user_onboarding_progress"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "user_onboarding_progress_isCompleted_idx" ON "user_onboarding_progress"("isCompleted");

-- AddForeignKey
ALTER TABLE "user_onboarding_progress" ADD CONSTRAINT "user_onboarding_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
