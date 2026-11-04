"use client";

import { useState } from "react";
import { registrarEventoPacote } from "@/app/actions/rastreio";
import { ActionForm, BotaoEnviar } from "@/components/ActionForm";
import type { StatusPacote } from "@/generated/prisma/enums";

type Acao = "estufa" | "expedir" | "observacao" | "cancelar";

const ROTULO: Record<Acao, string> = {
  estufa: "Enviar para estufa",
  expedir: "Registrar saída",
  observacao: "Observação",
  cancelar: "Cancelar pacote",
};

/** Ações rápidas na tela do pacote (quem escaneou o QR registra o que aconteceu). */
export function AcoesPacote({
  numero,
  status,
  ciclos,
  podeGerir,
  pedido,
  motoristas = [],
}: {
  numero: number;
  status: StatusPacote;
  ciclos: { id: string; rotulo: string }[];
  podeGerir: boolean;
  /** "Nº · cliente" do pedido do pacote, se houver. */
  pedido?: string | null;
  motoristas?: { id: string; nome: string; placaCaminhao: string; placaJulieta: string | null }[];
}) {
  const encerrado = status === "EXPEDIDO" || status === "CANCELADO";
  const acoes: Acao[] = [
    ...(status === "VERDE" ? (["estufa"] as const) : []),
    ...(status === "VERDE" || status === "SECO" ? (["expedir"] as const) : []),
    "observacao" as const,
    ...(podeGerir && !encerrado ? (["cancelar"] as const) : []),
  ];
  const [acao, setAcao] = useState<Acao>(acoes[0]);

  return (
    <section className="cartao" aria-label="Registrar">
      <h2 className="mb-3 font-semibold">Registrar</h2>
      <div className="mb-4 flex flex-wrap gap-2" role="tablist">
        {acoes.map((a) => (
          <button
            key={a}
            type="button"
            role="tab"
            aria-selected={acao === a}
            onClick={() => setAcao(a)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ring-1 ring-inset ${
              acao === a ? (a === "cancelar" ? "bg-rose-600 text-white ring-rose-600" : "bg-marca-600 text-white ring-marca-600") : "bg-white text-stone-600 ring-stone-200"
            }`}
          >
            {ROTULO[a]}
          </button>
        ))}
      </div>
      <ActionForm key={acao} action={registrarEventoPacote} limparAoSalvar className="grid gap-3">
        <input type="hidden" name="numero" value={numero} />
        <input type="hidden" name="acao" value={acao} />
        {acao === "estufa" &&
          (ciclos.length ? (
            <div>
              <label htmlFor="ev-ciclo">Ciclo em secagem *</label>
              <select id="ev-ciclo" name="cicloId" required className="campo">
                {ciclos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.rotulo}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <p className="text-sm text-stone-500">Nenhuma estufa com ciclo em andamento. Inicie o ciclo em Estufas.</p>
          ))}
        {acao === "expedir" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <p className="text-sm text-stone-600 sm:col-span-2">
              Registra a saída física do pacote e gera o romaneio. Cliente e destino já vêm do pedido{pedido ? ` (${pedido})` : ""}. Para vários pacotes no mesmo caminhão, use a lista de Pacotes.
            </p>
            <div>
              <label htmlFor="ev-mot">Motorista</label>
              <select id="ev-mot" name="motoristaId" className="campo" defaultValue="">
                <option value="">— Sem motorista cadastrado —</option>
                {motoristas.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome} · {m.placaCaminhao}
                    {m.placaJulieta ? ` + ${m.placaJulieta}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="ev-obs">Observações do romaneio</label>
              <input id="ev-obs" name="texto" className="campo" />
            </div>
          </div>
        )}
        {(acao === "observacao" || acao === "cancelar") && (
          <div>
            <label htmlFor="ev-txt">{acao === "cancelar" ? "Motivo" : "Observação *"}</label>
            <textarea id="ev-txt" name="texto" rows={2} required={acao === "observacao"} className="campo" />
          </div>
        )}
        {!(acao === "estufa" && !ciclos.length) && (
          <div className="flex justify-end">
            <BotaoEnviar className={acao === "cancelar" ? "btn-perigo" : "btn-primario"}>{ROTULO[acao]}</BotaoEnviar>
          </div>
        )}
      </ActionForm>
    </section>
  );
}
