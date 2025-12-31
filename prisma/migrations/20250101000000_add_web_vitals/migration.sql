-- CreateTable
CREATE TABLE "WebVitals" (
    "id" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "rating" TEXT NOT NULL,
    "delta" DOUBLE PRECISION NOT NULL,
    "metricId" TEXT NOT NULL,
    "navigationType" TEXT NOT NULL,
    "url" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebVitals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WebVitals_metric_createdAt_idx" ON "WebVitals"("metric", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "WebVitals_rating_idx" ON "WebVitals"("rating");

-- CreateIndex
CREATE INDEX "WebVitals_url_idx" ON "WebVitals"("url");
