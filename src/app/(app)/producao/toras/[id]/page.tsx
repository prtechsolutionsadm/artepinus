import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { excluirCargaToras } from "@/app/actions/producao";
import { BotaoAcao } from "@/components/producao/BotaoAcao";
import { FormToras } from "@/components/producao/FormToras";
import { Titulo } from "@/components/ui";
import { db } from "@/lib/db";
import { podeProducao } from "@/lib/permissoes";
import { CLASSE_DIAMETRO, dateParaDia, fmtNum, formatarDia } from "@/lib/producao";
import { opcoesCarga } from "@/lib/producao-dados";
import { codigoCarga } from "@/lib/rastreio";
import { exigirProducao } from "@/lib/session";

export const metadata: Metadata = { title: "Carga de toras" };

export default async function CargaPage({ params }: { params: Promise<{ id: string }> }) {
  const eu = await exigirProducao();
  const { id } = await params;
  const c = await db.cargaToras.findUnique({
    where: { id },
    include: { responsavel: { select: { nome: true } }, floresta: true, fornecedor: true, motoristaCad: true, itens: true },
  });
  if (!c) notFound();
  const editar = podeProducao(eu, "gerir") || (podeProducao(eu, "lancar") && c.responsavelId === eu.id);
  return (
    <div className="mx-auto max-w-3xl">
      <Titulo
        subtitulo={`${codigoCarga(c.numero)} · registrada por ${c.responsavel.nome}`}
        acao={
          podeProducao(eu, "gerir") && (
            <BotaoAcao acao={excluirCargaToras} arg={c.id} confirmar="Excluir esta carga?" depois="/producao/toras" className="btn-perigo">
              <Trash2 className="h-4 w-4" /> Excluir
            </BotaoAcao>
          )
        }
      >
        Carga de {formatarDia(c.data)}
      </Titulo>
      {editar && c.florestaId ? (
        <FormToras
          {...await opcoesCarga(c)}
          inicial={{
            id: c.id,
            data: dateParaDia(c.data),
            florestaId: c.florestaId,
            fornecedorId: c.fornecedorId,
            motoristaId: c.motoristaId,
            comprimentoMedio: c.comprimentoMedio,
            classeDiametro: c.classeDiametro,
            pesoT: c.pesoT,
            observacoes: c.observacoes,
          }}
        />
      ) : (
        <section className="cartao">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
            {[
              ["Floresta", c.floresta?.nome ?? c.origem],
              ["Fornecedor", c.fornecedor?.nome],
              ["Motorista", c.motorista],
              ["Placa do caminhão", c.placa],
              ["Placa da julieta", c.placaJulieta],
              ["Diâmetro", c.classeDiametro ? CLASSE_DIAMETRO[c.classeDiametro] : null],
              ["Comprimento médio", c.comprimentoMedio ? `${fmtNum(c.comprimentoMedio, 2)} m` : null],
              ["Peso", c.pesoT ? `${fmtNum(c.pesoT, 2)} t` : null],
              ["Toras (formato antigo)", c.itens.length ? fmtNum(c.itens.reduce((t, i) => t + i.quantidade, 0)) : null],
            ]
              .filter(([, v]) => v)
              .map(([r, v]) => (
                <div key={r}>
                  <dt className="text-xs text-stone-500">{r}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
          </dl>
          {c.observacoes && <p className="mt-4 whitespace-pre-line text-sm text-stone-700">{c.observacoes}</p>}
          {editar && !c.florestaId && <p className="mt-4 text-xs text-stone-500">Carga registrada no formato antigo (sem floresta cadastrada): só leitura.</p>}
        </section>
      )}
    </div>
  );
}
