-- AlterTable
ALTER TABLE "CargaCiclo" ADD COLUMN     "linha" INTEGER,
ADD COLUMN     "pecas" INTEGER,
ALTER COLUMN "grades" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "ItemEstoque" ADD COLUMN     "linha" INTEGER;

-- AlterTable
ALTER TABLE "ItemProducao" ADD COLUMN     "larguras" TEXT,
ADD COLUMN     "linha" INTEGER;

-- AlterTable
ALTER TABLE "Lote" ALTER COLUMN "espessura" DROP NOT NULL;
