import type { Metadata } from "next";
import { FormCiclo } from "@/components/producao/FormCiclo";
import { Titulo } from "@/components/ui";
import { dateParaDataLocal } from "@/lib/constantes";
import { estufasParaForm } from "@/lib/producao-estufas";
import { boletinsParaForm } from "@/lib/rastreio-dados";
import { usuariosAtivos } from "@/lib/producao-dados";
import { exigirProducao } from "@/lib/session";

export const metadata: Metadata = { title: "Iniciar ciclo de secagem" };

export default async function NovoCicloPage({ searchParams }: { searchParams: Promise<{ estufa?: string }> }) {
  const eu = await exigirProducao("lancar");
  const { estufa } = await searchParams;
  const estufas = await estufasParaForm();
  const escolhida = estufas.find((e) => e.id === estufa && !e.ocupada)?.id ?? estufas.find((e) => !e.ocupada)?.id ?? "";
  return (
    <div className="mx-auto max-w-7xl">
      <Titulo subtitulo="O checklist da estufa é criado junto com o ciclo">Iniciar ciclo de secagem</Titulo>
      <FormCiclo
        usuarios={await usuariosAtivos()}
        estufas={estufas}
        inicial={{
          estufaId: escolhida,
          numero: null,
          entrada: dateParaDataLocal(new Date()),
          previsaoSaida: "",
          plantaoId: eu.id,
          proximaCarga: null,
          observacoes: null,
          linhas: [],
          boletimIds: [],
        }}
        boletins={await boletinsParaForm()}
      />
    </div>
  );
}
