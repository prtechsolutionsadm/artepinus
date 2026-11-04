import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { ApontamentoSerraria } from "@/components/producao/ApontamentoSerraria";
import { Titulo } from "@/components/ui";
import { db } from "@/lib/db";
import { diaParaDate, hojeSP } from "@/lib/producao";
import { configSerraria } from "@/lib/producao-dados";
import { exigirProducao } from "@/lib/session";

export const metadata: Metadata = { title: "Apontar serraria" };

/** Apontamento da serraria: pedido + ficha (espessura, larguras e peças por comprimento) → lote com etiqueta. */
export default async function ApontarSerrariaPage({ searchParams }: { searchParams: Promise<{ data?: string }> }) {
  await exigirProducao("lancar");
  const { data: q } = await searchParams;
  const data = q && /^\d{4}-\d{2}-\d{2}$/.test(q) && q <= hojeSP() ? q : hojeSP();
  const [pedidos, cfg, boletim] = await Promise.all([
    db.pedido.findMany({ where: { status: "ABERTO" }, orderBy: { criadoEm: "desc" }, select: { id: true, numero: true, cliente: true, destino: true } }),
    configSerraria(),
    db.boletimProducao.findUnique({ where: { data: diaParaDate(data) }, select: { id: true, metaM3: true, horasProgramadas: true } }),
  ]);
  return (
    <div className="mx-auto max-w-7xl">
      <Titulo
        subtitulo="Escolha o pedido e preencha a ficha: uma linha por espessura e larguras, com as peças em cada comprimento. Cada lançamento vira um lote com etiqueta."
        acao={
          boletim && (
            <Link href={`/producao/boletins/${boletim.id}`} className="btn-secundario">
              <ClipboardList className="h-4 w-4" /> Boletim do dia
            </Link>
          )
        }
      >
        Apontar serraria
      </Titulo>
      <ApontamentoSerraria pedidos={pedidos} dataInicial={data} meta={boletim?.metaM3 ?? cfg.metaDiariaM3} horas={boletim?.horasProgramadas ?? cfg.horasDia} />
    </div>
  );
}
