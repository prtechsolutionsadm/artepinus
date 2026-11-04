import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { excluirLevantamento } from "@/app/actions/producao";
import { BotaoAcao } from "@/components/producao/BotaoAcao";
import { FormEstoque } from "@/components/producao/FormEstoque";
import { Titulo } from "@/components/ui";
import { db } from "@/lib/db";
import { podeProducao } from "@/lib/permissoes";
import { LOCAL_ESTOQUE, TIPO_ESTOQUE, dateParaDia, fmtNum, formatarDia } from "@/lib/producao";
import { exigirProducao } from "@/lib/session";

export const metadata: Metadata = { title: "Inventário" };

export default async function LevantamentoPage({ params }: { params: Promise<{ id: string }> }) {
  const eu = await exigirProducao();
  const { id } = await params;
  const l = await db.levantamentoEstoque.findUnique({
    where: { id },
    include: { itens: { orderBy: [{ espessura: "asc" }, { comprimento: "desc" }] }, responsavel: { select: { nome: true } }, estufa: { select: { nome: true } } },
  });
  if (!l) notFound();
  const editar = !!l.local && (podeProducao(eu, "gerir") || (podeProducao(eu, "lancar") && l.responsavelId === eu.id));
  const onde = l.local === "ESTUFA" ? (l.estufa?.nome ?? "Estufa") : l.local ? LOCAL_ESTOQUE[l.local] : l.tipo ? TIPO_ESTOQUE[l.tipo] : "—";
  const estufas = editar ? await db.estufa.findMany({ where: { OR: [{ ativo: true }, ...(l.estufaId ? [{ id: l.estufaId }] : [])] }, orderBy: { numero: "asc" }, select: { id: true, nome: true } }) : [];
  return (
    <div className="mx-auto max-w-5xl">
      <Titulo
        subtitulo={`Registrado por ${l.responsavel.nome}`}
        acao={
          podeProducao(eu, "gerir") && (
            <BotaoAcao acao={excluirLevantamento} arg={l.id} confirmar="Excluir este inventário?" depois="/producao/estoque" className="btn-perigo">
              <Trash2 className="h-4 w-4" /> Excluir
            </BotaoAcao>
          )
        }
      >
        {onde}
        {l.espessura ? ` · ${l.espessura} mm` : ""} · {formatarDia(l.data)}
      </Titulo>
      {editar ? (
        <FormEstoque
          estufas={estufas}
          inicial={{
            id: l.id,
            data: dateParaDia(l.data),
            local: l.local,
            estufaId: l.estufaId,
            espessura: l.espessura,
            observacoes: l.observacoes,
            itens: l.itens.filter((i) => i.pecas).map((i) => ({ largura: Number(i.largura), comprimento: Math.round(i.comprimento * 1000), pecas: i.pecas! })),
          }}
        />
      ) : (
        <section className="cartao overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-stone-200 text-left text-xs text-stone-500">
              <tr>
                <th className="px-3 py-2">Esp.</th>
                <th className="px-3 py-2">Largura</th>
                <th className="px-3 py-2 text-right">Comp.</th>
                <th className="px-3 py-2 text-right">Peças / grades / pacotes</th>
                <th className="px-3 py-2 text-right">m³</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {l.itens.map((i) => (
                <tr key={i.id}>
                  <td className="px-3 py-2">{i.espessura} mm</td>
                  <td className="px-3 py-2">{i.largura}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmtNum(i.comprimento, 2)} m</td>
                  <td className="px-3 py-2 text-right tabular-nums">{i.pecas ?? i.grades ?? i.pacotes ?? "—"}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmtNum(i.m3, 3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
