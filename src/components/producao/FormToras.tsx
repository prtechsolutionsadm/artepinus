"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CloudOff } from "lucide-react";
import { salvarCargaToras, type Resultado } from "@/app/actions/producao";
import { enviarOuGuardar } from "@/lib/fila-offline";
import { CLASSE_DIAMETRO, hojeSP } from "@/lib/producao";
import type { ClasseDiametro } from "@/generated/prisma/enums";

type Opcao = { id: string; nome: string };
type MotoristaOpcao = Opcao & { placaCaminhao: string; placaJulieta: string | null };

export type CargaInicial = {
  id?: string;
  data: string;
  florestaId: string | null;
  fornecedorId: string | null;
  motoristaId: string | null;
  comprimentoMedio: number | null;
  classeDiametro: ClasseDiametro | null;
  pesoT: number | null;
  observacoes: string | null;
};

const txt = (n: number | null | undefined) => (n == null ? "" : String(n));

/** Recebimento de uma carga de toras: floresta, fornecedor, motorista (placas automáticas), diâmetro e peso. */
export function FormToras({
  inicial,
  florestas,
  fornecedores,
  motoristas,
}: {
  inicial: CargaInicial;
  florestas: Opcao[];
  fornecedores: Opcao[];
  motoristas: MotoristaOpcao[];
}) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);
  const [f, setF] = useState({
    data: inicial.data,
    florestaId: inicial.florestaId ?? "",
    fornecedorId: inicial.fornecedorId ?? "",
    motoristaId: inicial.motoristaId ?? "",
    comprimentoMedio: txt(inicial.comprimentoMedio),
    pesoT: txt(inicial.pesoT),
    observacoes: inicial.observacoes ?? "",
  });
  const [classe, setClasse] = useState<ClasseDiametro | null>(inicial.classeDiametro);
  const set = (c: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF((x) => ({ ...x, [c]: e.target.value }));
  const motorista = motoristas.find((m) => m.id === f.motoristaId);

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (!classe) return setErro("Escolha o diâmetro");
    const dados = { id: inicial.id ?? null, ...f, classeDiametro: classe, comprimentoMedio: f.comprimentoMedio.replace(",", "."), pesoT: f.pesoT.replace(",", ".") };
    const floresta = florestas.find((x) => x.id === f.florestaId)?.nome ?? "";
    iniciar(async () => {
      const salvar = (d: Record<string, unknown>) => salvarCargaToras(d as Parameters<typeof salvarCargaToras>[0]);
      // Editar exige internet; uma carga nova pode ser guardada no aparelho
      const r = inicial.id ? await salvar(dados) : await enviarOuGuardar("carga", `Toras: ${floresta} · ${f.pesoT} t`, dados, salvar);
      if ("guardado" in r) {
        setGuardado(true);
        setF((x) => ({ ...x, motoristaId: "", pesoT: "", observacoes: "" }));
        setClasse(null);
        return;
      }
      const res = r as Resultado;
      if (res.erro) return setErro(res.erro);
      router.push("/producao/toras");
      router.refresh();
    });
  }

  return (
    <form onSubmit={enviar}>
      <fieldset disabled={pendente} className="min-w-0 space-y-6">
        {guardado && (
          <p role="status" className="flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900 ring-1 ring-amber-200">
            <CloudOff className="h-4 w-4 shrink-0" /> Carga guardada no aparelho. Ela será enviada sozinha quando a internet voltar. Já pode lançar a próxima.
          </p>
        )}
        <section className="cartao grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="t-data">Data *</label>
            <input id="t-data" type="date" required max={hojeSP()} value={f.data} onChange={set("data")} className="campo" />
          </div>
          <div>
            <label htmlFor="t-flo">Floresta *</label>
            <select id="t-flo" required value={f.florestaId} onChange={set("florestaId")} className="campo">
              <option value="">{florestas.length ? "Escolha…" : "Cadastre as florestas em Cadastros"}</option>
              {florestas.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="t-for">Fornecedor *</label>
            <select id="t-for" required value={f.fornecedorId} onChange={set("fornecedorId")} className="campo">
              <option value="">{fornecedores.length ? "Escolha…" : "Cadastre os fornecedores em Cadastros"}</option>
              {fornecedores.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="t-mot">Motorista *</label>
            <select id="t-mot" required value={f.motoristaId} onChange={set("motoristaId")} className="campo">
              <option value="">{motoristas.length ? "Escolha…" : "Cadastre os motoristas em Cadastros"}</option>
              {motoristas.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.nome} · {x.placaCaminhao}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:col-span-2">
            <div>
              <span className="block text-sm font-medium text-stone-700">Placa do caminhão</span>
              <span className="mt-1.5 block rounded-md bg-stone-100 px-3 py-2.5 font-mono font-semibold text-stone-700">{motorista?.placaCaminhao ?? "—"}</span>
            </div>
            <div>
              <span className="block text-sm font-medium text-stone-700">Placa da julieta</span>
              <span className="mt-1.5 block rounded-md bg-stone-100 px-3 py-2.5 font-mono font-semibold text-stone-700">{motorista ? (motorista.placaJulieta ?? "sem julieta") : "—"}</span>
            </div>
          </div>
        </section>

        <section className="cartao grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-3">
            <span className="mb-1.5 block text-sm font-medium text-stone-700">Diâmetro *</span>
            <div className="grid grid-cols-3 overflow-hidden rounded-md border border-stone-300" role="radiogroup" aria-label="Diâmetro">
              {(Object.keys(CLASSE_DIAMETRO) as ClasseDiametro[]).map((c, i) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={classe === c}
                  onClick={() => setClasse(c)}
                  className={`flex items-center justify-center gap-1.5 py-3 text-sm font-semibold transition ${i > 0 ? "border-l border-stone-300" : ""} ${classe === c ? "bg-marca-700 text-white" : "bg-white text-stone-700 hover:bg-stone-50"}`}
                >
                  {classe === c && <CheckCircle2 className="h-4 w-4" />} {CLASSE_DIAMETRO[c]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="t-comp">Comprimento médio (m) *</label>
            <input id="t-comp" inputMode="decimal" required value={f.comprimentoMedio} onChange={set("comprimentoMedio")} className="campo" />
          </div>
          <div>
            <label htmlFor="t-peso">Peso (toneladas) *</label>
            <input id="t-peso" inputMode="decimal" required value={f.pesoT} onChange={set("pesoT")} className="campo" />
          </div>
          <div className="sm:col-span-3">
            <label htmlFor="t-obs">Observações</label>
            <textarea id="t-obs" rows={2} value={f.observacoes} onChange={set("observacoes")} className="campo" />
          </div>
        </section>

        {erro && (
          <p role="alert" className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800 ring-1 ring-rose-200">
            {erro}
          </p>
        )}
        <div className="barra-acoes">
          <button type="button" onClick={() => router.back()} className="btn-secundario">
            Cancelar
          </button>
          <button type="submit" className="btn-primario">
            {pendente ? "Salvando…" : inicial.id ? "Salvar carga" : "Registrar carga"}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
