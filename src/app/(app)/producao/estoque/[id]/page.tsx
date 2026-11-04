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
import { BotaoPdfFicha } from "@/components/producao/BotaoPdfFicha";
import { exigirProducao } from "@/lib/session";

export const metadata: Metadata = { title: "Inventário" };

export default async function LevantamentoPage({ params }: { params: Promise<{ id: string }> }) {
  const eu = await exigirProducao();
  const { id } = await params;
  const l = await db.levantamentoEstoque.findUnique({
    where: { id },
    include: { itens: { orderBy: [{ linha: "asc" }, { espessura: "asc" }, { comprimento: "desc" }], include: { estufa: { select: { nome: true } } } }, responsavel: { select: { nome: true } }, estufa: { select: { nome: true } } },
  });
  if (!l) notFound();
  const editar = (!!l.local || l.itens.some((i) => i.local)) && (podeProducao(eu, "gerir") || (podeProducao(eu, "lancar") && l.responsavelId === eu.id));
  const nome = (local: keyof typeof LOCAL_ESTOQUE | null, estufa?: { nome: string } | null) => (local === "ESTUFA" ? (estufa?.nome ?? "Estufa") : local ? LOCAL_ESTOQUE[local] : null);
  const lugares = [...new Set(l.itens.map((i) => nome(i.local, i.estufa)).filter(Boolean))];
  const onde = lugares.length ? lugares.join(", ") : (nome(l.local, l.estufa) ?? (l.tipo ? TIPO_ESTOQUE[l.tipo] : "—"));
  const estufas = editar ? await db.estufa.findMany({ where: { OR: [{ ativo: true }, ...(l.estufaId ? [{ id: l.estufaId }] : [])] }, orderBy: { numero: "asc" }, select: { id: true, nome: true } }) : [];
  const tabela = linhasParaTabela(l.itens.map((i) => ({ ...i, larguras: i.largura, pecas: i.pecas ?? i.grades ?? i.pacotes }))).map((x, n) => {
    const i = l.itens.find((it) => `L${it.linha}` === x.chave || `${it.espessura}|${it.largura}` === x.chave) ?? l.itens[n];
    const lugar = nome(i?.local ?? l.local, i?.estufa ?? l.estufa) ?? "—";
    return { ...x, antes: [lugar], antesTexto: [lugar] };
  });
  const pdf = { titulo: `Inventário de madeira · ${formatarDia(l.data)}`, subtitulo: `${onde} · registrado por ${l.responsavel.nome}`, arquivo: `inventario-${dateParaDia(l.data)}` };
  return (
    <div className="mx-auto max-w-7xl">
      <Titulo
        subtitulo={`Registrado por ${l.responsavel.nome}`}
        acao={
          <div className="flex flex-wrap gap-2">
            {editar && <BotaoPdfFicha dados={{ ...pdf, colunasAntes: ["Madeira em"], linhas: tabela.map((t) => ({ ...t, antes: t.antesTexto })) }} />}
            {podeProducao(eu, "gerir") && (
              <BotaoAcao acao={excluirLevantamento} arg={l.id} confirmar="Excluir este inventário?" depois="/producao/estoque" className="btn-perigo">
                <Trash2 className="h-4 w-4" /> Excluir
              </BotaoAcao>
            )}
          </div>
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
          <TabelaFicha
            titulo="Madeira contada"
            pdf={pdf}
            colunasAntes={["Madeira em"]}
            linhas={tabela}
          />
        </section>
      )}
    </div>
  );
}
