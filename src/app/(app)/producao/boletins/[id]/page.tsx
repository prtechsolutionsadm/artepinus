import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PackagePlus, Pencil, Printer, Tag, Trash2, Wrench } from "lucide-react";
import { abrirRequisicaoDaParada, excluirBoletim } from "@/app/actions/producao";
import { BotaoAcao } from "@/components/producao/BotaoAcao";
import { Badge, Titulo } from "@/components/ui";
import { formatarData, formatarDuracao, numeroRequisicao } from "@/lib/constantes";
import { db } from "@/lib/db";
import { podeProducao, temModulo } from "@/lib/permissoes";
import { CENTRO, calcularKpis, dateParaDia, fmtM3, fmtNum, fmtPct, formatarDia } from "@/lib/producao";
import { codigoCarga, codigoLote } from "@/lib/rastreio";
import { exigirProducao } from "@/lib/session";

export const metadata: Metadata = { title: "Boletim da serraria" };

export default async function BoletimPage({ params }: { params: Promise<{ id: string }> }) {
  const eu = await exigirProducao();
  const { id } = await params;
  const b = await db.boletimProducao.findUnique({
    where: { id },
    include: {
      responsavel: { select: { nome: true } },
      itens: { select: { tipo: true, m3: true, comprimento: true, pecas: true, loteId: true } },
      lotes: { orderBy: { numero: "asc" }, include: { pedido: { select: { numero: true, cliente: true } }, itens: { select: { pecas: true, m3: true, comprimento: true, espessura: true, larguras: true, largura: true } } } },
      paradas: {
        orderBy: { minutos: "desc" },
        include: { motivo: true, equipamento: { select: { nome: true } }, requisicao: { select: { id: true, status: true } }, paradaMaquina: { select: { inicio: true, fim: true } } },
      },
      cargas: { orderBy: { data: "asc" }, include: { floresta: { select: { nome: true } } } },
      ciclos: { select: { id: true, numero: true, estufa: { select: { nome: true } } } },
      pacotes: { select: { numero: true, m3: true, status: true } },
    },
  });
  if (!b) notFound();
  const k = calcularKpis([b]);
  const editar = podeProducao(eu, "gerir") || (podeProducao(eu, "lancar") && b.responsavelId === eu.id);
  const abrirReq = podeProducao(eu, "lancar") && temModulo(eu, "manutencao");

  return (
    <div className="mx-auto max-w-5xl">
      <Titulo
        subtitulo={
          <>
            Lançado por {b.responsavel.nome} · atualizado em {formatarData(b.atualizadoEm, true)}
          </>
        }
        acao={
          <div className="flex flex-wrap gap-2">
            {podeProducao(eu, "lancar") && (
              <Link href={`/producao/boletins/novo?data=${dateParaDia(b.data)}`} className="btn-primario">
                <Tag className="h-4 w-4" /> Apontar lote
              </Link>
            )}
            {editar && (
              <Link href={`/producao/boletins/${b.id}/editar`} className="btn-secundario">
                <Pencil className="h-4 w-4" /> Paradas e toras
              </Link>
            )}
            {podeProducao(eu, "gerir") && (
              <BotaoAcao acao={excluirBoletim} arg={b.id} confirmar="Excluir este boletim? Esta ação não pode ser desfeita." depois="/producao/boletins" className="btn-perigo">
                <Trash2 className="h-4 w-4" /> Excluir
              </BotaoAcao>
            )}
          </div>
        }
      >
        Boletim de {formatarDia(b.data, { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
      </Titulo>

      <dl className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Serrado", fmtM3(k.producaoM3), `meta ${fmtM3(k.metaM3)}`],
          ["Disponibilidade", fmtPct(k.disponibilidade), `${formatarDuracao(k.minutosParados)} parado de ${fmtNum(b.horasProgramadas, 1)} h`],
          ["Produtividade", fmtPct(k.produtividade), "serrado ÷ meta"],
          ["OEE", fmtPct(k.oee), "disponibilidade × produtividade"],
          ["Ótimo", fmtM3(k.porClasse.OTIMO), "2,50 e 2,10 m"],
          ["Bom", fmtM3(k.porClasse.BOM), "1,65 m"],
          ["Regular", fmtM3(k.porClasse.REGULAR), "1,30 · 1,00 · 0,70 m"],
          ["Rendimento", fmtPct(k.rendimento), b.torasM3 ? `de ${fmtM3(b.torasM3)} em toras` : "toras não informadas"],
        ].map(([r, v, d]) => (
          <div key={r} className="cartao py-3">
            <dt className="text-xs text-stone-500">{r}</dt>
            <dd className="text-lg font-semibold tabular-nums">{v}</dd>
            {d && <dd className="text-xs text-stone-500">{d}</dd>}
          </div>
        ))}
      </dl>

      <section className="cartao mb-6 overflow-hidden p-0">
        <div className="flex items-center justify-between gap-2 border-b border-stone-100 px-4 py-3">
          <h2 className="font-semibold">Lotes do dia</h2>
          {b.lotes.length > 0 && (
            <Link href={`/producao/lotes/etiquetas?n=${b.lotes.map((l) => l.numero).join(",")}`} className="inline-flex items-center gap-1 text-sm font-medium text-marca-700 hover:underline">
              <Printer className="h-4 w-4" /> Etiquetas de todos
            </Link>
          )}
        </div>
        {b.lotes.length === 0 ? (
          <p className="px-4 py-4 text-sm text-stone-500">Nenhum lote apontado neste dia.</p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {b.lotes.map((l) => (
              <li key={l.id}>
                <Link href={`/producao/lotes/${l.numero}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-stone-50">
                  <span className="font-mono text-sm font-semibold">{codigoLote(l.numero)}</span>
                  <span className="text-sm">{[...new Set(l.itens.map((i) => `${i.espessura} mm · ${i.larguras ?? i.largura}`))].join(" | ")}</span>
                  <span className="text-sm text-stone-600">
                    {fmtNum(l.itens.reduce((t, i) => t + i.pecas, 0))} peças · {fmtM3(l.itens.reduce((t, i) => t + i.m3, 0), 3)}
                  </span>
                  <span className="text-sm text-stone-500">
                    Pedido {l.pedido.numero} · {l.pedido.cliente}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {b.itens.some((i) => !i.loteId) && (
          <p className="border-t border-stone-100 px-4 py-2 text-xs text-stone-500">
            Este boletim também tem {fmtM3(b.itens.filter((i) => !i.loteId).reduce((t, i) => t + i.m3, 0), 2)} lançados no formato antigo (sem lote).
          </p>
        )}
      </section>

      <section className="cartao mb-6 p-0">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 px-4 py-3">
          <h2 className="font-semibold">Paradas</h2>
          <div className="flex flex-wrap gap-1.5 text-xs">
            {(Object.keys(CENTRO) as (keyof typeof CENTRO)[]).map((c) => (
              <span key={c} className="rounded-full bg-stone-100 px-2 py-0.5 text-stone-600">
                {CENTRO[c].curto} {formatarDuracao(k.paradoPorCentro[c])}
              </span>
            ))}
          </div>
        </div>
        {b.paradas.length === 0 ? (
          <p className="px-4 py-4 text-sm text-stone-500">Sem paradas.</p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {b.paradas.map((p) => (
              <li key={p.id} className="flex flex-wrap items-start gap-x-3 gap-y-2 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{p.motivo ? `${p.motivo.codigo} · ${p.motivo.descricao}` : (p.descricao ?? "Parada")}</div>
                  <div className="text-sm text-stone-500">
                    {CENTRO[p.centro].label}
                    {p.equipamento && ` · ${p.equipamento.nome}`} · {p.ocorrencias}× · <b className="text-stone-700">{formatarDuracao(p.minutos)}</b>
                  </div>
                  {p.motivo && p.descricao && <div className="mt-0.5 text-sm text-stone-600">{p.descricao}</div>}
                  {p.paradaMaquina && (
                    <div className="mt-0.5 text-xs text-stone-500">
                      Marcada na hora: {formatarData(p.paradaMaquina.inicio, true)} → {formatarData(p.paradaMaquina.fim, true)} (só o tempo dentro do turno conta)
                    </div>
                  )}
                </div>
                {p.requisicao ? (
                  temModulo(eu, "manutencao") ? (
                    <Link href={`/requisicoes/${p.requisicao.id}`} className="shrink-0">
                      <Badge cor="bg-sky-50 text-sky-800 ring-sky-200">Requisição {numeroRequisicao(p.requisicao.id)}</Badge>
                    </Link>
                  ) : (
                    <Badge cor="bg-sky-50 text-sky-800 ring-sky-200">Requisição {numeroRequisicao(p.requisicao.id)}</Badge>
                  )
                ) : (
                  abrirReq &&
                  p.centro !== "OPE" && (
                    <BotaoAcao
                      acao={abrirRequisicaoDaParada}
                      arg={p.id}
                      confirmar="Abrir uma requisição de manutenção corretiva para esta parada?"
                      depois="/requisicoes/{id}"
                      className="btn-secundario shrink-0 px-3 py-1.5 text-sm"
                    >
                      <Wrench className="h-4 w-4" /> Abrir requisição
                    </BotaoAcao>
                  )
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="cartao mb-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Rastreabilidade</h2>
          {podeProducao(eu, "lancar") && (
            <Link href={`/producao/pacotes/novo?boletim=${b.id}`} className="btn-secundario px-3 py-1.5 text-sm">
              <PackagePlus className="h-4 w-4" /> Formar pacote verde deste dia
            </Link>
          )}
        </div>
        <dl className="grid gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-500">Toras serradas</dt>
            {b.cargas.length ? (
              <dd className="space-y-1">
                {b.cargas.map((c) => (
                  <Link key={c.id} href={`/producao/toras/${c.id}`} className="block hover:underline">
                    <span className="font-mono text-xs text-stone-500">{codigoCarga(c.numero)}</span> {c.floresta?.nome ?? c.origem ?? "—"}
                    {c.pesoT ? ` · ${fmtNum(c.pesoT, 1)} t` : ""}
                  </Link>
                ))}
              </dd>
            ) : (
              <dd className="text-stone-500">Nenhuma carga ligada (edite o boletim para marcar).</dd>
            )}
          </div>
          <div>
            <dt className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-500">Estufas</dt>
            {b.ciclos.length ? (
              <dd className="space-y-1">
                {b.ciclos.map((c) => (
                  <Link key={c.id} href={`/producao/estufas/ciclos/${c.id}`} className="block hover:underline">
                    {c.estufa.nome}
                    {c.numero ? ` · ciclo nº ${c.numero}` : ""}
                  </Link>
                ))}
              </dd>
            ) : (
              <dd className="text-stone-500">Madeira ainda não ligada a um ciclo.</dd>
            )}
          </div>
          <div>
            <dt className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-500">Pacotes verdes</dt>
            <dd>
              {b.pacotes.length ? (
                <Link href={`/producao/pacotes?status=todos&boletim=${b.id}`} className="hover:underline">
                  {b.pacotes.length} pacote(s) · {fmtM3(b.pacotes.reduce((s, p) => s + p.m3, 0), 2)}
                </Link>
              ) : (
                <span className="text-stone-500">Nenhum.</span>
              )}
            </dd>
          </div>
        </dl>
      </section>

      {b.observacoes && (
        <section className="cartao">
          <h2 className="mb-1 font-semibold">Observações</h2>
          <p className="whitespace-pre-line text-sm text-stone-700">{b.observacoes}</p>
        </section>
      )}
    </div>
  );
}
