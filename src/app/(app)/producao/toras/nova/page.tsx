import type { Metadata } from "next";
import { FormToras } from "@/components/producao/FormToras";
import { Titulo } from "@/components/ui";
import { hojeSP } from "@/lib/producao";
import { opcoesCarga } from "@/lib/producao-dados";
import { exigirProducao } from "@/lib/session";

export const metadata: Metadata = { title: "Nova carga de toras" };

export default async function NovaCargaPage() {
  await exigirProducao("lancar");
  return (
    <div className="mx-auto max-w-3xl">
      <Titulo>Nova carga de toras</Titulo>
      <FormToras
        {...await opcoesCarga()}
        inicial={{ data: hojeSP(), florestaId: null, fornecedorId: null, motoristaId: null, comprimentoMedio: null, classeDiametro: null, pesoT: null, observacoes: null }}
      />
    </div>
  );
}
