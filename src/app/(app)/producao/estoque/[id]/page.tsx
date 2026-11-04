import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { excluirLevantamento } from "@/app/actions/producao";
import { BotaoAcao } from "@/components/producao/BotaoAcao";
import { FormEstoque } from "@/components/producao/FormEstoque";
import { Titulo } from "@/components/ui";
import { db } from "@/lib/db";
import { podeProducao } from "@/lib/permissoes";
import { LOCAL_ESTOQUE, TIPO_ESTOQUE, dateParaDia, formatarDia, linhasDosItens, linhasParaTabela } from "@/lib/producao";
import { TabelaFicha } from "@/components/producao/TabelaFicha";
import { exigirProducao } from "@/lib/session";

export const metadata: Metadata = { title: "Inventário" };

export default async function LevantamentoPage({ params }: { params: Promise<{ id: string }> }) {
  const eu = await exigirProducao();
  const { id } = await params;
  const l = await db.levantamentoEstoque.findUnique({
    where: { id },
    include: { itens: { orderBy: [{ linha: "asc" }, { espessura: "asc" }, { comprimento: "desc" }] }, responsavel: { select: { nome: true } }, estufa: { select: { nome: true } } },
  });
  if (!l) notFound();
  const editar = !!l.local && (podeProducao(eu, "gerir") || (podeProducao(eu, "lancar") && l.responsavelId === eu.id));
  const onde = l.local === "ESTUFA" ? (l.estufa?.nome ?? "Estufa") : l.local ? LOCAL_ESTOQUE[l.local] : l.tipo ? TIPO_ESTOQUE[l.tipo] : "—";
  const estufas = editar ? await db.estufa.findMany({ where: { OR: [{ ativo: true }, ...(l.estufaId ? [{ id: l.estufaId }] : [])] }, orderBy: { numero: "asc" }, select: { id: true, nome: true } }) : [];
  return (
    <div className="mx-auto max-w-7xl">
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
            observacoes: l.observacoes,
            linhas: linhasDosItens(l.itens.filter((i) => i.pecas).map((i) => ({ ...i, larguras: i.largura }))),
          }}
        />
      ) : (
        <section className="cartao p-0">
          <TabelaFicha linhas={linhasParaTabela(l.itens.map((i) => ({ ...i, larguras: i.largura, pecas: i.pecas ?? i.grades ?? i.pacotes })))} />
        </section>
      )}
    </div>
  );
}
