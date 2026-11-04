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
    <div className="mx-auto max-w-7xl">
      <Titulo subtitulo="Preencha a ficha com tudo o que foi contado: em cada linha, onde está a madeira, a medida e as peças.">Inventário do dia</Titulo>
      <FormEstoque estufas={estufas} inicial={{ data: hojeSP(), local: null, estufaId: null, observacoes: null, linhas: [] }} />
    </div>
  );
}
