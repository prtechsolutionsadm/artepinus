-- AlterTable
ALTER TABLE "PlanoPreventivo" ADD COLUMN     "diaDoMes" INTEGER;

-- CreateIndex
CREATE INDEX "Pacote_pedidoId_idx" ON "Pacote"("pedidoId");

-- CreateIndex
CREATE INDEX "Pacote_romaneioId_idx" ON "Pacote"("romaneioId");

-- CreateIndex
CREATE INDEX "Pacote_expedidoEm_idx" ON "Pacote"("expedidoEm");

-- Planos mensais existentes: o dia de referência é o dia (Brasília) da próxima data atual
UPDATE "PlanoPreventivo"
SET "diaDoMes" = EXTRACT(DAY FROM ("proximaData" - INTERVAL '3 hours'))::INTEGER
WHERE "unidade" = 'MESES' AND "diaDoMes" IS NULL;
