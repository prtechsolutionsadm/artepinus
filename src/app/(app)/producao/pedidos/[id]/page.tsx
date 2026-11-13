import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { BarraPedido } from "@/components/producao/BarraPedido";
import { Badge } from "@/components/ui";
import { formatarData } from "@/lib/constantes";
import { db } from "@/lib/db";
import { podeProducao } from "@/lib/permissoes";
import { situacaoPedidos } from "@/lib/pedidos";
import { fmtM3, fmtNum, fmtPct, formatarDia } from "@/lib/producao";
import { STATUS_PACOTE, codigoLote, codigoPacote, codigoRomaneio } from "@/lib/rastreio";
import { exigirProducao } from "@/lib/session";

export const metadata: Metadata = { title: "Pedido" };

/** Um pedido: andamento (serrado → seco → expedido), saldo, lotes, pacotes e romaneios. */
export default async function PedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const eu = await exigirProducao();
  const { id } = await params;
  const [[p], lotes, pacotes] = await Promise.all([
    situacaoPedidos({ id }),
    db.lote.findMany({ where: { pedidoId: id }, orderBy: { numero: "desc" }, include: { boletim: { select: { data: true } }, itens: { select: { m3: true, pecas: true } } } }),
    db.pacote.findMany({ where: { pedidoId: id, status: { not: "CANCELADO" } }, orderBy: { numero: "desc" }, include: { romaneio: { select: { numero: true, notaFiscal: true } } } }),
  ]);
  if (!p) notFound();
  const romaneios = [...new Map(pacotes.filter((x) => x.romaneio).map((x) => [x.romaneio!.numero, x.romaneio!])).values()];

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <Link href="/producao/pedidos" className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800">
        <ArrowLeft className="h-4 w-4" /> Pedidos
      </Link>
      <section className="cartao">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-stone-500">Pedido</p>
            <h1 className="font-mono text-2xl font-bold">{p.numero}</h1>
            <p className="text-stone-700">
              {p.cliente}
              {p.destino ? ` · ${p.destino}` : ""}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge cor={p.status === "ABERTO" ? "bg-emerald-50 text-emerald-800 ring-emerald-200" : "bg-stone-100 text-stone-600 ring-stone-200"}>{p.status === "ABERTO" ? "Aberto" : "Concluído"}</Badge>
            {podeProducao(eu, "gerir") && (
              <Link href="/producao/cadastros?aba=pedidos" className="inline-flex items-center gap-1 text-sm font-medium text-marca-700 hover:underline">
                <Pencil className="h-3.5 w-3.5" /> Editar
              </Link>
            )}
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            ["Volume combinado", p.volumeM3 != null ? fmtM3(p.volumeM3, 2) : "—"],
            ["Prazo", p.prazo ? formatarDia(p.prazo) : "—"],
            ["Serrado", fmtM3(p.serrado, 2)],
            ["Expedido", `${fmtM3(p.expedido, 2)}${p.atendido != null ? ` (${fmtPct(p.atendido)})` : ""}`],
            ["Saldo a expedir", p.saldo != null ? fmtM3(p.saldo, 2) : "—"],
          ].map(([a, b]) => (
            <div key={a}>
              <dt className="text-xs text-stone-500">{a}</dt>
              <dd className="font-semibold tabular-nums">{b}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4">
          <BarraPedido p={p} legenda />
        </div>
        {p.pronto && p.status === "ABERTO" && (
          <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800 ring-1 ring-emerald-200">
            Pronto para expedir: os pacotes secos cobrem {p.saldo != null ? "o saldo do pedido" : "tudo o que falta sair"}.{" "}
            <Link href={`/producao/pacotes?status=SECO&q=${encodeURIComponent(p.numero)}`} className="font-semibold underline">
              Ver pacotes secos
            </Link>
          </p>
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="cartao p-0">
          <h2 className="border-b border-stone-100 px-4 py-3 font-semibold">Pacotes ({pacotes.length})</h2>
          {pacotes.length === 0 ? (
            <p className="px-4 py-4 text-sm text-stone-500">Nenhum pacote formado para este pedido.</p>
          ) : (
            <ul className="max-h-96 divide-y divide-stone-100 overflow-y-auto text-sm">
              {pacotes.map((x) => (
                <li key={x.id}>
                  <Link href={`/producao/pacotes/${x.numero}`} className="flex items-center gap-2 px-4 py-2 hover:bg-stone-50">
                    <span className="font-mono font-semibold">{codigoPacote(x.numero)}</span>
                    <span className="inline-flex items-center gap-1 text-xs text-stone-600">
                      <span className="h-2 w-2 rounded-full" style={{ background: STATUS_PACOTE[x.status].hex }} />
                      {STATUS_PACOTE[x.status].label}
                    </span>
                    <span className="ml-auto tabular-nums text-stone-600">
                      {x.espessura}×{x.largura}×{x.comprimento} · {fmtNum(x.pecas)} pç · {fmtM3(x.m3, 3)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <div className="space-y-5">
          <section className="cartao p-0">
            <h2 className="border-b border-stone-100 px-4 py-3 font-semibold">Lotes serrados ({lotes.length})</h2>
            {lotes.length === 0 ? (
              <p className="px-4 py-4 text-sm text-stone-500">Nenhum lote apontado para este pedido.</p>
            ) : (
              <ul className="max-h-60 divide-y divide-stone-100 overflow-y-auto text-sm">
                {lotes.map((l) => (
                  <li key={l.id}>
                    <Link href={`/producao/lotes/${l.numero}`} className="flex items-center gap-2 px-4 py-2 hover:bg-stone-50">
                      <span className="font-mono font-semibold">{codigoLote(l.numero)}</span>
                      <span className="text-stone-500">{formatarDia(l.boletim.data)}</span>
                      <span className="ml-auto tabular-nums text-stone-600">
                        {fmtNum(l.itens.reduce((t, i) => t + i.pecas, 0))} pç · {fmtM3(l.itens.reduce((t, i) => t + i.m3, 0), 3)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="cartao p-0">
            <h2 className="border-b border-stone-100 px-4 py-3 font-semibold">Romaneios ({romaneios.length})</h2>
            {romaneios.length === 0 ? (
              <p className="px-4 py-4 text-sm text-stone-500">Nenhuma carga expedida ainda.</p>
            ) : (
              <ul className="divide-y divide-stone-100 text-sm">
                {romaneios.map((r) => (
                  <li key={r.numero}>
                    <Link href={`/producao/romaneios/${r.numero}`} className="flex items-center gap-2 px-4 py-2 hover:bg-stone-50">
                      <span className="font-mono font-semibold">{codigoRomaneio(r.numero)}</span>
                      {r.notaFiscal && <span className="text-stone-500">NF {r.notaFiscal}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
      <p className="text-xs text-stone-400">Atualizado em {formatarData(new Date(), true)}.</p>
    </div>
  );
}
