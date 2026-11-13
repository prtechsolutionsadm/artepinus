"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { salvarCiclo } from "@/app/actions/producao";
import { mensagemFalha } from "@/lib/falha-acao";
import { SeletorMultiplo } from "@/components/producao/SeletorMultiplo";
import { FichaMadeira, linhaVazia, linhasPreenchidas, validarFicha } from "@/components/producao/FichaMadeira";
import type { LinhaFicha } from "@/lib/producao";

export type CicloInicial = {
  id?: string;
  estufaId: string;
  numero: number | null;
  entrada: string;
  previsaoSaida: string;
  plantaoId: string | null;
  proximaCarga: string | null;
  observacoes: string | null;
  linhas: LinhaFicha[];
  boletimIds: string[];
};

const txt = (v: number | string | null | undefined) =>
  v == null ? "" : String(v);

export function FormCiclo({
  inicial,
  estufas,
  boletins,
  usuarios,
}: {
  inicial: CicloInicial;
  estufas: { id: string; nome: string; ocupada: boolean }[];
  boletins: { id: string; rotulo: string }[];
  /** Usuários que podem ficar de plantão. */
  usuarios: { id: string; nome: string }[];
}) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [f, setF] = useState({
    estufaId: inicial.estufaId,
    numero: txt(inicial.numero),
    entrada: inicial.entrada,
    previsaoSaida: inicial.previsaoSaida,
    plantaoId: inicial.plantaoId ?? "",
    proximaCarga: inicial.proximaCarga ?? "",
    observacoes: inicial.observacoes ?? "",
  });
  const [linhas, setLinhas] = useState<LinhaFicha[]>(inicial.linhas.length ? inicial.linhas : [linhaVazia()]);
  const [boletimIds, setBoletimIds] = useState<string[]>(inicial.boletimIds);
  const set =
    (campo: keyof typeof f) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) =>
      setF((x) => ({ ...x, [campo]: e.target.value }));
  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    const invalida = validarFicha(linhas);
    if (invalida) return setErro(invalida);
    iniciar(async () => {
      let r: Awaited<ReturnType<typeof salvarCiclo>>;
      try {
        r = await salvarCiclo({
          id: inicial.id ?? null,
          ...f,
          boletimIds,
          linhas: linhasPreenchidas(linhas),
        });
      } catch (e) {
        return setErro(mensagemFalha(e));
      }
      if (r.erro) return setErro(r.erro);
      router.push(`/producao/estufas/ciclos/${r.id}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={enviar}>
      <fieldset disabled={pendente} className="min-w-0 space-y-6">
        <section className="cartao grid gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor="c-estufa">Estufa *</label>
            <select
              id="c-estufa"
              required
              value={f.estufaId}
              onChange={set("estufaId")}
              className="campo"
            >
              <option value="">Escolha…</option>
              {estufas.map((e) => (
                <option
                  key={e.id}
                  value={e.id}
                  disabled={e.ocupada && e.id !== inicial.estufaId}
                >
                  {e.nome}
                  {e.ocupada && e.id !== inicial.estufaId
                    ? " (em secagem)"
                    : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="c-num">Nº do ciclo</label>
            <input
              id="c-num"
              inputMode="numeric"
              value={f.numero}
              onChange={set("numero")}
              className="campo"
            />
          </div>
          <div>
            <label htmlFor="c-ent">Entrada *</label>
            <input
              id="c-ent"
              type="datetime-local"
              required
              value={f.entrada}
              onChange={set("entrada")}
              className="campo"
            />
          </div>
          <div>
            <label htmlFor="c-prev">Previsão de saída</label>
            <input
              id="c-prev"
              type="datetime-local"
              value={f.previsaoSaida}
              onChange={set("previsaoSaida")}
              className="campo"
            />
          </div>
          <div>
            <label htmlFor="c-pl">Plantão (responsável)</label>
            <select
              id="c-pl"
              value={f.plantaoId}
              onChange={set("plantaoId")}
              className="campo"
            >
              <option value="">— Escolha —</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="cartao">
          <h2 className="mb-1 font-semibold">Madeira carregada</h2>
          <p className="mb-4 text-sm text-stone-500">
            Como na ficha da estufa: uma linha por espessura e larguras, com as peças em cada comprimento e as grades úmidas.
          </p>
          <FichaMadeira linhas={linhas} onChange={setLinhas} gradesUmidas />
        </section>

        <section className="cartao">
          <h2 className="mb-1 font-semibold">Madeira de quais dias?</h2>
          <p className="mb-3 text-sm text-stone-500">
            Marque os dias de serraria cuja madeira entrou nesta estufa — liga
            os pacotes secos ao dia em que foram serrados e às toras.
          </p>
          <SeletorMultiplo
            opcoes={boletins}
            valor={boletimIds}
            onChange={setBoletimIds}
            rotulo="Boletins da serraria"
            vazio="Nenhum boletim lançado nos últimos 30 dias."
          />
        </section>

        <section className="cartao grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="c-prox">Próxima carga</label>
            <input
              id="c-prox"
              value={f.proximaCarga}
              onChange={set("proximaCarga")}
              placeholder="Ex.: 25 mm mista, 3,0 m"
              className="campo"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="c-obs">Observações</label>
            <textarea
              id="c-obs"
              rows={3}
              value={f.observacoes}
              onChange={set("observacoes")}
              className="campo"
            />
          </div>
        </section>

        {erro && (
          <p
            role="alert"
            className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800 ring-1 ring-rose-200"
          >
            {erro}
          </p>
        )}
        <div className="barra-acoes">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secundario"
          >
            Cancelar
          </button>
          <button type="submit" className="btn-primario">
            {pendente
              ? "Salvando…"
              : inicial.id
                ? "Salvar ciclo"
                : "Iniciar ciclo"}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
