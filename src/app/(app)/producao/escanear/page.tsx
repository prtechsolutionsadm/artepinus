import type { Metadata } from "next";
import { Escaner } from "@/components/producao/Escaner";
import { Titulo } from "@/components/ui";
import { exigirProducao } from "@/lib/session";

export const metadata: Metadata = { title: "Ler etiqueta" };

export default async function EscanearPage() {
  await exigirProducao();
  return (
    <div className="mx-auto max-w-md">
      <Titulo subtitulo="Leia a etiqueta do pacote ou do lote para ver a história e registrar o que aconteceu">Ler etiqueta</Titulo>
      <Escaner />
    </div>
  );
}
