import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { ApontamentoSerraria } from "@/components/producao/ApontamentoSerraria";
import { Titulo } from "@/components/ui";
import { db } from "@/lib/db";
import { situacaoPedidos } from "@/lib/pedidos";
import { diaParaDate, hojeSP } from "@/lib/producao";
import { configSerraria } from "@/lib/producao-dados";
import { exigirProducao } from "@/lib/session";
import { diaValido } from "@/lib/constantes";

export const metadata: Metadata = { title: "Apontar serraria" };

/** Apontamento da serraria: pedido + ficha (espessura, larguras e peças por comprimento) → lote com etiqueta. */
export default async function ApontarSerrariaPage({ searchParams }: { searchParams: Promise<{ data?: string }> }) {
  await exigirProducao("lancar");
  const { data: q } = await searchParams;
  const data = diaValido(q) && q <= hojeSP() ? q : hojeSP();
  const [pedidos, cfg, boletim] = await Promise.all([
    situacaoPedidos({ status: "ABERTO" }),
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
      <ApontamentoSerraria
        pedidos={pedidos.map((p) => ({
          id: p.id,
          numero: p.numero,
          cliente: p.cliente,
          destino: p.destino,
          // O que ainda falta serrar do volume combinado
          falta: p.volumeM3 != null ? Math.max(0, p.volumeM3 - p.serrado) : null,
        }))} dataInicial={data} meta={boletim?.metaM3 ?? cfg.metaDiariaM3} horas={boletim?.horasProgramadas ?? cfg.horasDia} />
    </div>
  );
}
