import type { Metadata } from "next";
import { FormEstoque } from "@/components/producao/FormEstoque";
import { Titulo } from "@/components/ui";
import { db } from "@/lib/db";
import { hojeSP } from "@/lib/producao";
import { exigirProducao } from "@/lib/session";

export const metadata: Metadata = { title: "Inventário do dia" };

export default async function NovoLevantamentoPage() {
  await exigirProducao("lancar");
  const estufas = await db.estufa.findMany({ where: { ativo: true }, orderBy: { numero: "asc" }, select: { id: true, nome: true } });
  return (
    <div className="mx-auto max-w-5xl">
      <Titulo subtitulo="Escolha onde está a madeira e a espessura, e digite as peças na grade. Repita para cada local e espessura.">Inventário do dia</Titulo>
      <FormEstoque estufas={estufas} inicial={{ data: hojeSP(), local: null, estufaId: null, espessura: null, observacoes: null, itens: [] }} />
    </div>
  );
}
