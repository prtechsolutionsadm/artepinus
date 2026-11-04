-- CreateEnum
CREATE TYPE "OrigemParada" AS ENUM ('SERRARIA', 'MANUTENCAO');

-- AlterTable
ALTER TABLE "ConfigSerraria" ADD COLUMN     "turnoFim" TEXT NOT NULL DEFAULT '17:00',
ADD COLUMN     "turnoInicio" TEXT NOT NULL DEFAULT '07:00';

-- AlterTable
ALTER TABLE "Equipamento" ADD COLUMN     "linhaSerraria" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ParadaProducao" ADD COLUMN     "paradaMaquinaId" TEXT;

-- CreateTable
CREATE TABLE "ParadaMaquina" (
    "id" TEXT NOT NULL,
    "equipamentoId" TEXT NOT NULL,
    "motivoId" TEXT,
    "centro" "CentroParada" NOT NULL,
    "descricao" TEXT,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fim" TIMESTAMP(3),
    "origem" "OrigemParada" NOT NULL DEFAULT 'SERRARIA',
    "abertaPorId" TEXT NOT NULL,
    "encerradaPorId" TEXT,
    "requisicaoId" INTEGER,
    "chaveOffline" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParadaMaquina_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ParadaMaquina_requisicaoId_key" ON "ParadaMaquina"("requisicaoId");

-- CreateIndex
CREATE UNIQUE INDEX "ParadaMaquina_chaveOffline_key" ON "ParadaMaquina"("chaveOffline");

-- CreateIndex
CREATE INDEX "ParadaMaquina_fim_idx" ON "ParadaMaquina"("fim");

-- CreateIndex
CREATE INDEX "ParadaMaquina_inicio_idx" ON "ParadaMaquina"("inicio");

-- CreateIndex
CREATE UNIQUE INDEX "ParadaProducao_paradaMaquinaId_boletimId_key" ON "ParadaProducao"("paradaMaquinaId", "boletimId");

-- AddForeignKey
ALTER TABLE "ParadaProducao" ADD CONSTRAINT "ParadaProducao_paradaMaquinaId_fkey" FOREIGN KEY ("paradaMaquinaId") REFERENCES "ParadaMaquina"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParadaMaquina" ADD CONSTRAINT "ParadaMaquina_equipamentoId_fkey" FOREIGN KEY ("equipamentoId") REFERENCES "Equipamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParadaMaquina" ADD CONSTRAINT "ParadaMaquina_motivoId_fkey" FOREIGN KEY ("motivoId") REFERENCES "MotivoParada"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParadaMaquina" ADD CONSTRAINT "ParadaMaquina_abertaPorId_fkey" FOREIGN KEY ("abertaPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParadaMaquina" ADD CONSTRAINT "ParadaMaquina_encerradaPorId_fkey" FOREIGN KEY ("encerradaPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParadaMaquina" ADD CONSTRAINT "ParadaMaquina_requisicaoId_fkey" FOREIGN KEY ("requisicaoId") REFERENCES "Requisicao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Máquinas da linha: equipamentos do setor Serraria e os ligados a motivos de parada (estufas ficam fora)
UPDATE "Equipamento" e SET "linhaSerraria" = true
WHERE NOT EXISTS (SELECT 1 FROM "Estufa" s WHERE s."equipamentoId" = e.id) AND e.nome NOT ILIKE '%estufa%'
  AND (e."setorId" IN (SELECT id FROM "Setor" WHERE nome ILIKE '%serraria%')
       OR e.id IN (SELECT "equipamentoId" FROM "MotivoParada" WHERE "equipamentoId" IS NOT NULL));
