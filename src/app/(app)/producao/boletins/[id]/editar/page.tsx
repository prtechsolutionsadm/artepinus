import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { FormBoletim } from "@/components/producao/FormBoletim";
import { Titulo } from "@/components/ui";
import { db } from "@/lib/db";
import { podeProducao } from "@/lib/permissoes";
import { dateParaDia, formatarDia } from "@/lib/producao";
import { opcoesBoletim } from "@/lib/producao-dados";
import { cargasParaForm } from "@/lib/rastreio-dados";
import { exigirProducao } from "@/lib/session";

export const metadata: Metadata = { title: "Editar boletim" };

export default async function EditarBoletimPage({ params }: { params: Promise<{ id: string }> }) {
  const eu = await exigirProducao("lancar");
  const { id } = await params;
  const b = await db.boletimProducao.findUnique({ where: { id }, include: { itens: { select: { m3: true } }, paradas: { include: { equipamento: { select: { nome: true } }, motivo: { select: { descricao: true } } } }, cargas: { select: { id: true } } } });
  if (!b) notFound();
  if (b.responsavelId !== eu.id && !podeProducao(eu, "gerir")) redirect(`/producao/boletins/${id}`);
  const opcoes = await opcoesBoletim();
  return (
    <div className="mx-auto max-w-4xl">
      <Titulo subtitulo="Paradas da linha, toras serradas e observações do dia">Boletim de {formatarDia(b.data)}</Titulo>
      <FormBoletim
        inicial={{ ...b, data: dateParaDia(b.data), paradas: b.paradas.filter((p) => !p.paradaMaquinaId), cargaIds: b.cargas.map((c) => c.id) }}
        automaticas={b.paradas
          .filter((p) => p.paradaMaquinaId)
          .map((p) => ({ id: p.id, centro: p.centro, minutos: p.minutos, rotulo: [p.equipamento?.nome, p.motivo?.descricao ?? p.descricao].filter(Boolean).join(" — ") || "Parada" }))}
        motivos={opcoes.motivos}
        equipamentos={opcoes.equipamentos}
        meta={b.metaM3}
        horasPadrao={b.horasProgramadas}
        producaoM3={b.itens.reduce((t, i) => t + i.m3, 0)}
        cargas={await cargasParaForm(b.cargas.map((c) => c.id))}
      />
    </div>
  );
}
