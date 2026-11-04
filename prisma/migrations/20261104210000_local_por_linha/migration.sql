-- AlterTable
ALTER TABLE "ItemEstoque" ADD COLUMN     "estufaId" TEXT,
ADD COLUMN     "local" "LocalEstoque";

-- AddForeignKey
ALTER TABLE "ItemEstoque" ADD CONSTRAINT "ItemEstoque_estufaId_fkey" FOREIGN KEY ("estufaId") REFERENCES "Estufa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
