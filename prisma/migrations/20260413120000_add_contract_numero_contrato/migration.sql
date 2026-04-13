-- AlterTable
ALTER TABLE "contracts" ADD COLUMN "numeroContrato" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "contracts_numeroContrato_key" ON "contracts"("numeroContrato");
