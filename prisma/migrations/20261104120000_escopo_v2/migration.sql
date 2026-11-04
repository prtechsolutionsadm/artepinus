-- CreateEnum
CREATE TYPE "ClasseDiametro" AS ENUM ('FINA', 'MEDIA', 'GROSSA');

-- CreateEnum
CREATE TYPE "ClasseMadeira" AS ENUM ('OTIMO', 'BOM', 'REGULAR');

-- CreateEnum
CREATE TYPE "StatusPedido" AS ENUM ('ABERTO', 'CONCLUIDO');

-- CreateEnum
CREATE TYPE "LocalEstoque" AS ENUM ('GRADE', 'PACOTE', 'ESTUFA', 'VERDE');

-- AlterTable
ALTER TABLE "CargaToras" ADD COLUMN     "chaveOffline" TEXT,
ADD COLUMN     "classeDiametro" "ClasseDiametro",
ADD COLUMN     "florestaId" TEXT,
ADD COLUMN     "fornecedorId" TEXT,
ADD COLUMN     "motoristaId" TEXT,
ADD COLUMN     "pesoT" DOUBLE PRECISION,
ADD COLUMN     "placaJulieta" TEXT,
ALTER COLUMN "origem" DROP NOT NULL;

-- AlterTable
ALTER TABLE "CicloSecagem" ADD COLUMN     "plantaoId" TEXT;

-- AlterTable
ALTER TABLE "ItemEstoque" ADD COLUMN     "pecas" INTEGER;

-- AlterTable
ALTER TABLE "ItemProducao" ADD COLUMN     "classe" "ClasseMadeira",
ADD COLUMN     "loteId" TEXT,
ALTER COLUMN "tipo" SET DEFAULT 'BOM';

-- AlterTable
ALTER TABLE "LevantamentoEstoque" ADD COLUMN     "chaveOffline" TEXT,
ADD COLUMN     "espessura" INTEGER,
ADD COLUMN     "estufaId" TEXT,
ADD COLUMN     "local" "LocalEstoque",
ALTER COLUMN "tipo" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Pacote" ADD COLUMN     "pedidoId" TEXT;

-- CreateTable
CREATE TABLE "Fornecedor" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "documento" TEXT,
    "telefone" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Fornecedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Motorista" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "placaCaminhao" TEXT NOT NULL,
    "placaJulieta" TEXT,
    "telefone" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Motorista_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pedido" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "cliente" TEXT NOT NULL,
    "destino" TEXT,
    "observacoes" TEXT,
    "status" "StatusPedido" NOT NULL DEFAULT 'ABERTO',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lote" (
    "id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "boletimId" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "espessura" INTEGER NOT NULL,
    "criadoPorId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "chaveOffline" TEXT,

    CONSTRAINT "Lote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfigSerraria" (
    "id" TEXT NOT NULL DEFAULT 'padrao',
    "metaDiariaM3" DOUBLE PRECISION NOT NULL,
    "horasDia" DOUBLE PRECISION NOT NULL,
    "rendimentoMeta" DOUBLE PRECISION,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfigSerraria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Fornecedor_nome_key" ON "Fornecedor"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Pedido_numero_key" ON "Pedido"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "Lote_numero_key" ON "Lote"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "Lote_chaveOffline_key" ON "Lote"("chaveOffline");

-- CreateIndex
CREATE INDEX "Lote_boletimId_idx" ON "Lote"("boletimId");

-- CreateIndex
CREATE INDEX "Lote_pedidoId_idx" ON "Lote"("pedidoId");

-- CreateIndex
CREATE UNIQUE INDEX "CargaToras_chaveOffline_key" ON "CargaToras"("chaveOffline");

-- CreateIndex
CREATE INDEX "ItemProducao_loteId_idx" ON "ItemProducao"("loteId");

-- CreateIndex
CREATE UNIQUE INDEX "LevantamentoEstoque_chaveOffline_key" ON "LevantamentoEstoque"("chaveOffline");

-- AddForeignKey
ALTER TABLE "ItemProducao" ADD CONSTRAINT "ItemProducao_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "Lote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CicloSecagem" ADD CONSTRAINT "CicloSecagem_plantaoId_fkey" FOREIGN KEY ("plantaoId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CargaToras" ADD CONSTRAINT "CargaToras_florestaId_fkey" FOREIGN KEY ("florestaId") REFERENCES "OrigemFlorestal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CargaToras" ADD CONSTRAINT "CargaToras_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "Fornecedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CargaToras" ADD CONSTRAINT "CargaToras_motoristaId_fkey" FOREIGN KEY ("motoristaId") REFERENCES "Motorista"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LevantamentoEstoque" ADD CONSTRAINT "LevantamentoEstoque_estufaId_fkey" FOREIGN KEY ("estufaId") REFERENCES "Estufa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pacote" ADD CONSTRAINT "Pacote_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lote" ADD CONSTRAINT "Lote_boletimId_fkey" FOREIGN KEY ("boletimId") REFERENCES "BoletimProducao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lote" ADD CONSTRAINT "Lote_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lote" ADD CONSTRAINT "Lote_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
