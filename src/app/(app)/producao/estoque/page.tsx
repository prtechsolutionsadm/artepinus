import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { BotaoLink, Titulo, Vazio } from "@/components/ui";
import { db } from "@/lib/db";
import { podeProducao } from "@/lib/permissoes";
import { ESPESSURAS, LOCAL_ESTOQUE, TIPO_ESTOQUE, dateParaDia, fmtM3, fmtNum, formatarDia } from "@/lib/producao";
import { exigirProducao } from "@/lib/session";

export const metadata: Metadata = { title: "Inventário de madeira" };

type Lev = { local: keyof typeof LOCAL_ESTOQUE | null; tipo: keyof typeof TIPO_ESTOQUE | null; estufa: { nome: string } | null };
const onde = (l: Lev) => (l.local === "ESTUFA" ? (l.estufa?.nome ?? "Estufa") : l.local ? LOCAL_ESTOQUE[l.local] : l.tipo ? TIPO_ESTOQUE[l.tipo] : "—");

export default async function EstoquePage() {
  const eu = await exigirProducao();
  const levantamentos = await db.levantamentoEstoque.findMany({
    orderBy: [{ data: "desc" }, { criadoEm: "desc" }],
    take: 120,
    include: { itens: { select: { m3: true, pecas: true, espessura: true } }, responsavel: { select: { nome: true } }, estufa: { select: { nome: true } } },
  });
  // Último dia com inventário: m³ por local × espessura
  const ultimoDia = levantamentos[0] ? dateParaDia(levantamentos[0].data) : null;
  const doDia = levantamentos.filter((l) => dateParaDia(l.data) === ultimoDia);
  const linhas = [...new Set(doDia.map(onde))];
  const espessuras = [...new Set([...ESPESSURAS, ...doDia.flatMap((l) => l.itens.map((i) => i.espessura))])].sort((a, b) => a - b);
  const m3 = (lugar: string | null, esp: number | null) =>
    doDia
      .filter((l) => lugar === null || onde(l) === lugar)
      .flatMap((l) => l.itens)
      .filter((i) => esp === null || i.espessura === esp)
      .reduce((t, i) => t + i.m3, 0);

  return (
    <>
      <Titulo
        subtitulo="Inventário diário por local (grade, pacote, estufas e verde)"
        acao={
          podeProducao(eu, "lancar") && (
            <BotaoLink href="/producao/estoque/novo">
              <Plus className="h-4 w-4" /> Inventário do dia
            </BotaoLink>
          )
        }
      >
        Inventário de madeira
      </Titulo>

      {ultimoDia && (
        <section className="cartao mb-6 min-w-0 p-0">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-stone-200 px-4 py-3">
            <h2 className="font-semibold">Último inventário · {formatarDia(doDia[0].data)}</h2>
            <span className="text-sm font-semibold tabular-nums">{fmtM3(m3(null, null), 2)}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead className="text-xs text-stone-500">
                <tr className="border-b border-stone-100">
                  <th className="px-4 py-2 text-left font-semibold">Madeira em</th>
                  {espessuras.map((e) => (
                    <th key={e} className="px-3 py-2 text-right font-semibold">
                      {e} mm
                    </th>
                  ))}
                  <th className="px-4 py-2 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {linhas.map((lugar) => (
                  <tr key={lugar}>
                    <th scope="row" className="px-4 py-2 text-left font-medium">
                      {lugar}
                    </th>
                    {espessuras.map((e) => (
                      <td key={e} className="px-3 py-2 text-right tabular-nums">
                        {m3(lugar, e) ? fmtNum(m3(lugar, e), 2) : "·"}
                      </td>
                    ))}
                    <td className="px-4 py-2 text-right font-semibold tabular-nums">{fmtNum(m3(lugar, null), 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-stone-100 px-4 py-2 text-xs text-stone-500">Volumes em m³.</p>
        </section>
      )}

      <h2 className="mb-3 text-lg font-semibold">Histórico</h2>
      {levantamentos.length === 0 ? (
        <Vazio>Nenhum inventário registrado.</Vazio>
      ) : (
        <ul className="divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200 bg-white">
          {levantamentos.map((l) => (
            <li key={l.id}>
              <Link href={`/producao/estoque/${l.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50">
                <div className="w-20 shrink-0 font-semibold">{formatarDia(l.data, { day: "2-digit", month: "2-digit" })}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">
                    {onde(l)}
                    {l.espessura ? ` · ${l.espessura} mm` : ""}
                  </div>
                  <div className="text-sm text-stone-500">
                    {fmtM3(l.itens.reduce((t, i) => t + i.m3, 0), 2)}
                    {l.itens.some((i) => i.pecas) && ` · ${fmtNum(l.itens.reduce((t, i) => t + (i.pecas ?? 0), 0))} peças`} · {l.responsavel.nome}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-stone-300" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
