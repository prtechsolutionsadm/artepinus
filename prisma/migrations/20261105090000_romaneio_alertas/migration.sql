-- AlterTable
ALTER TABLE "CicloSecagem" ADD COLUMN     "alertaAtrasoEm" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Pacote" ADD COLUMN     "romaneioId" TEXT;

-- AlterTable
ALTER TABLE "Pedido" ADD COLUMN     "prontoAvisadoEm" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Romaneio" (
    "id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "motoristaId" TEXT,
    "motorista" TEXT,
    "placa" TEXT,
    "placaJulieta" TEXT,
    "observacoes" TEXT,
    "criadoPorId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Romaneio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Romaneio_numero_key" ON "Romaneio"("numero");

-- CreateIndex
CREATE INDEX "Romaneio_criadoEm_idx" ON "Romaneio"("criadoEm");

-- AddForeignKey
ALTER TABLE "Pacote" ADD CONSTRAINT "Pacote_romaneioId_fkey" FOREIGN KEY ("romaneioId") REFERENCES "Romaneio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Romaneio" ADD CONSTRAINT "Romaneio_motoristaId_fkey" FOREIGN KEY ("motoristaId") REFERENCES "Motorista"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Romaneio" ADD CONSTRAINT "Romaneio_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
