import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Printer, Trash2 } from "lucide-react";
import { excluirLote } from "@/app/actions/producao";
import { BotaoAcao } from "@/components/producao/BotaoAcao";
import { Titulo } from "@/components/ui";
import { formatarData, inteiroPositivo } from "@/lib/constantes";
import { db } from "@/lib/db";
import { podeProducao } from "@/lib/permissoes";
import { fmtM3, fmtNum, formatarDia, linhasParaTabela } from "@/lib/producao";
import { TabelaFicha } from "@/components/producao/TabelaFicha";
import { codigoLote } from "@/lib/rastreio";
import { exigirProducao } from "@/lib/session";

export async function generateMetadata({ params }: { params: Promise<{ numero: string }> }): Promise<Metadata> {
  const n = inteiroPositivo((await params).numero);
  return { title: n ? codigoLote(n) : "Lote" };
}

/** Lote da serraria (destino do QR da etiqueta): ficha lançada, pedido e dia. */
export default async function LotePage({ params }: { params: Promise<{ numero: string }> }) {
  const eu = await exigirProducao();
  const numero = inteiroPositivo((await params).numero);
  if (!numero) notFound();
  const l = await db.lote.findUnique({
    where: { numero },
    include: { itens: { orderBy: [{ linha: "asc" }, { comprimento: "desc" }] }, pedido: true, boletim: { select: { id: true, data: true } }, criadoPor: { select: { nome: true } } },
  });
  if (!l) notFound();
  const totalPecas = l.itens.reduce((t, i) => t + i.pecas, 0);
  const totalM3 = l.itens.reduce((t, i) => t + i.m3, 0);
  const espessuras = [...new Set(l.itens.map((i) => i.espessura))].join(", ");

  return (
    <div className="mx-auto max-w-6xl">
      <Titulo
        subtitulo={`Lançado por ${l.criadoPor.nome} em ${formatarData(l.criadoEm, true)}`}
        acao={
          <div className="flex flex-wrap gap-2">
            <Link href={`/producao/lotes/etiquetas?n=${l.numero}`} className="btn-primario">
              <Printer className="h-4 w-4" /> Etiqueta
            </Link>
            {podeProducao(eu, "gerir") && (
              <BotaoAcao acao={excluirLote} arg={l.id} confirmar="Excluir este lote? As peças saem do boletim do dia." depois={`/producao/boletins/${l.boletim.id}`} className="btn-perigo">
                <Trash2 className="h-4 w-4" /> Excluir
              </BotaoAcao>
            )}
          </div>
        }
      >
        <span className="font-mono">{codigoLote(l.numero)}</span>
      </Titulo>

      <dl className="mb-5 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-stone-200 bg-stone-200 sm:grid-cols-4">
        {[
          ["Pedido", `${l.pedido.numero} · ${l.pedido.cliente}`],
          ["Destino", l.pedido.destino ?? "—"],
          ["Dia", formatarDia(l.boletim.data)],
          ["Espessura", `${espessuras} mm`],
          ["Peças", fmtNum(totalPecas)],
          ["Volume", fmtM3(totalM3, 3)],
        ].map(([r, v]) => (
          <div key={r} className="min-w-0 bg-white px-4 py-3">
            <dt className="text-xs text-stone-500">{r}</dt>
            <dd className="truncate font-semibold">{v}</dd>
          </div>
        ))}
        <div className="col-span-2 bg-white px-4 py-3">
          <dt className="text-xs text-stone-500">Boletim</dt>
          <dd>
            <Link href={`/producao/boletins/${l.boletim.id}`} className="font-semibold text-marca-700 hover:underline">
              Ver o dia na serraria
            </Link>
          </dd>
        </div>
      </dl>

      <section className="cartao p-0">
        <TabelaFicha
          titulo="Madeira serrada"
          linhas={linhasParaTabela(l.itens.map((i) => ({ ...i, larguras: i.larguras ?? String(i.largura) })))}
          pdf={{ titulo: `Lote ${codigoLote(l.numero)} · pedido ${l.pedido.numero} · ${l.pedido.cliente}`, subtitulo: `Serraria em ${formatarDia(l.boletim.data)}`, arquivo: codigoLote(l.numero) }}
        />
      </section>
    </div>
  );
}
