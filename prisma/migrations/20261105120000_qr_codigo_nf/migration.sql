-- AlterTable
ALTER TABLE "Pacote" ADD COLUMN     "codigoPublico" TEXT,
ADD COLUMN     "qrLegado" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Romaneio" ADD COLUMN     "chaveNfe" TEXT,
ADD COLUMN     "notaFiscal" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Pacote_codigoPublico_key" ON "Pacote"("codigoPublico");

-- Pacotes já existentes: as etiquetas impressas usam o número no QR, que continua valendo.
UPDATE "Pacote" SET "qrLegado" = true;
-- Código aleatório (10 caracteres) para as reimpressões e os pacotes novos.
UPDATE "Pacote" SET "codigoPublico" = substr(md5(random()::text || id || clock_timestamp()::text), 1, 10) WHERE "codigoPublico" IS NULL;
