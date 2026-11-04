import type { Metadata } from "next";
import { FormPacote } from "@/components/producao/FormPacote";
import { Titulo } from "@/components/ui";
import { db } from "@/lib/db";
import { ciclosComMaterial, diasComLotes } from "@/lib/rastreio-dados";
import { exigirProducao } from "@/lib/session";

export const metadata: Metadata = { title: "Formar pacote" };

export default async function NovoPacotePage({ searchParams }: { searchParams: Promise<{ boletim?: string; ciclo?: string }> }) {
  await exigirProducao("lancar");
  const { boletim, ciclo } = await searchParams;
  const [ciclos, dias, pedidos] = await Promise.all([
    ciclosComMaterial(),
    diasComLotes(),
    db.pedido.findMany({ where: { status: "ABERTO" }, orderBy: { criadoEm: "desc" }, select: { id: true, numero: true, cliente: true } }),
  ]);
  const origem = boletim ? "boletim" : ciclo || ciclos.length ? "ciclo" : "boletim";
  return (
    <div className="mx-auto max-w-4xl">
      <Titulo subtitulo="Escolha a estufa e toque na madeira que forma o pacote. Cada pacote ganha uma etiqueta com QR Code.">Formar pacote</Titulo>
      <FormPacote ciclos={ciclos} dias={dias} pedidos={pedidos} inicial={{ origem, boletimId: boletim, cicloId: ciclo }} />
    </div>
  );
}
