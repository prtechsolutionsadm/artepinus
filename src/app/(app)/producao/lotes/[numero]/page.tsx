import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Printer, Trash2 } from "lucide-react";
import { excluirLote } from "@/app/actions/producao";
import { BotaoAcao } from "@/components/producao/BotaoAcao";
import { Badge, Titulo } from "@/components/ui";
import { formatarData } from "@/lib/constantes";
import { db } from "@/lib/db";
import { podeProducao } from "@/lib/permissoes";
import { CLASSE_MADEIRA, COMPRIMENTOS, LARGURAS, classeDoComprimento, fmtComprimento, fmtM3, fmtNum, formatarDia } from "@/lib/producao";
import { codigoLote } from "@/lib/rastreio";
import { exigirProducao } from "@/lib/session";

export async function generateMetadata({ params }: { params: Promise<{ numero: string }> }): Promise<Metadata> {
  const n = Number((await params).numero);
  return { title: Number.isInteger(n) && n > 0 ? codigoLote(n) : "Lote" };
}

/** Lote da serraria (destino do QR da etiqueta): grade lançada, pedido e dia. */
export default async function LotePage({ params }: { params: Promise<{ numero: string }> }) {
  const eu = await exigirProducao();
  const numero = Number((await params).numero);
  if (!Number.isInteger(numero) || numero <= 0) notFound();
  const l = await db.lote.findUnique({
    where: { numero },
    include: { itens: true, pedido: true, boletim: { select: { id: true, data: true } }, criadoPor: { select: { nome: true } } },
  });
  if (!l) notFound();
  const pecas = (lg: number, c: number) => l.itens.filter((i) => i.largura === lg && i.comprimento === c).reduce((t, i) => t + i.pecas, 0);
  const totalPecas = l.itens.reduce((t, i) => t + i.pecas, 0);
  const totalM3 = l.itens.reduce((t, i) => t + i.m3, 0);
  const comps = [...new Set([...COMPRIMENTOS.map((c) => c.mm), ...l.itens.map((i) => i.comprimento)])].sort((a, b) => b - a);
  const largs = [...new Set([...LARGURAS, ...l.itens.map((i) => i.largura)])].sort((a, b) => a - b);

  return (
    <div className="mx-auto max-w-4xl">
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
          ["Espessura", `${l.espessura} mm`],
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

      <section className="cartao overflow-x-auto p-0">
        <table className="w-full min-w-[480px] text-sm">
          <thead className="border-b border-stone-200 text-xs text-stone-500">
            <tr>
              <th className="px-4 py-2 text-left font-semibold">Comprimento</th>
              {largs.map((lg) => (
                <th key={lg} className="px-2 py-2 text-center font-semibold">
                  {lg} mm
                </th>
              ))}
              <th className="px-4 py-2 text-right font-semibold">Peças</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {comps.map((c) => {
              const total = largs.reduce((t, lg) => t + pecas(lg, c), 0);
              const cls = CLASSE_MADEIRA[classeDoComprimento(c)];
              return (
                <tr key={c} className={total ? "" : "text-stone-300"}>
                  <th scope="row" className="px-4 py-2 text-left font-medium">
                    {fmtComprimento(c)} <Badge cor={cls.cor}>{cls.label}</Badge>
                  </th>
                  {largs.map((lg) => (
                    <td key={lg} className="px-2 py-2 text-center tabular-nums">
                      {pecas(lg, c) || "·"}
                    </td>
                  ))}
                  <td className="px-4 py-2 text-right font-semibold tabular-nums">{total || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
