"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CloudOff } from "lucide-react";
import { salvarLevantamento, type Resultado } from "@/app/actions/producao";
import { SeletorEspessura } from "@/components/producao/ApontamentoSerraria";
import { GradeBitolas, chaveCelula, itensDaGrade, type ValoresGrade } from "@/components/producao/GradeBitolas";
import { enviarOuGuardar } from "@/lib/fila-offline";
import { LOCAL_ESTOQUE, hojeSP } from "@/lib/producao";
import type { LocalEstoque } from "@/generated/prisma/enums";

export type LevantamentoInicial = {
  id?: string;
  data: string;
  local: LocalEstoque | null;
  estufaId: string | null;
  espessura: number | null;
  observacoes: string | null;
  itens: { largura: number; comprimento: number; pecas: number }[];
};

/** Inventário do dia: onde está a madeira, a espessura e a grade de peças (Largura × Comprimento). */
export function FormEstoque({ inicial, estufas }: { inicial: LevantamentoInicial; estufas: { id: string; nome: string }[] }) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<{ guardado: boolean; texto: string } | null>(null);
  const [data, setData] = useState(inicial.data);
  const [local, setLocal] = useState<LocalEstoque | null>(inicial.local);
  const [estufaId, setEstufaId] = useState(inicial.estufaId ?? estufas[0]?.id ?? "");
  const [espessura, setEspessura] = useState<number | null>(inicial.espessura);
  const [obs, setObs] = useState(inicial.observacoes ?? "");
  const [valores, setValores] = useState<ValoresGrade>(() =>
    Object.fromEntries(inicial.itens.map((i) => [chaveCelula(i.largura, i.comprimento), String(i.pecas)])),
  );
  const itens = itensDaGrade(valores);

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setAviso(null);
    if (!local) return setErro("Escolha onde está a madeira");
    if (!espessura) return setErro("Escolha a espessura");
    if (!itens.length) return setErro("Preencha a quantidade de peças em pelo menos uma medida");
    const onde = local === "ESTUFA" ? (estufas.find((x) => x.id === estufaId)?.nome ?? "Estufa") : LOCAL_ESTOQUE[local];
    const dados = { id: inicial.id ?? null, data, local, estufaId: local === "ESTUFA" ? estufaId : null, espessura, observacoes: obs, itens };
    iniciar(async () => {
      const salvar = (d: Record<string, unknown>) => salvarLevantamento(d as Parameters<typeof salvarLevantamento>[0]);
      const r = inicial.id ? await salvar(dados) : await enviarOuGuardar("estoque", `Inventário: ${onde} · ${espessura} mm`, dados, salvar);
      if ("guardado" in r) {
        setAviso({ guardado: true, texto: `${onde} · ${espessura} mm guardado no aparelho; será enviado quando a internet voltar.` });
        setValores({});
        return;
      }
      const res = r as Resultado;
      if (res.erro) return setErro(res.erro);
      if (inicial.id) {
        router.push("/producao/estoque");
        router.refresh();
        return;
      }
      setAviso({ guardado: false, texto: `${onde} · ${espessura} mm registrado. Escolha outra espessura ou local para continuar.` });
      setValores({});
      router.refresh();
    });
  }

  const botao = (ativo: boolean, i: number) =>
    `py-2.5 text-sm font-semibold transition ${i > 0 ? "border-l border-stone-300" : ""} ${ativo ? "bg-marca-700 text-white" : "bg-white text-stone-700 hover:bg-stone-50"}`;

  return (
    <form onSubmit={enviar}>
      <fieldset disabled={pendente} className="min-w-0 space-y-5">
        {aviso && (
          <p
            role="status"
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ring-1 ${aviso.guardado ? "bg-amber-50 text-amber-900 ring-amber-200" : "bg-emerald-50 text-emerald-900 ring-emerald-200"}`}
          >
            {aviso.guardado ? <CloudOff className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />} {aviso.texto}
          </p>
        )}
        <section className="cartao grid gap-4 lg:grid-cols-3">
          <div>
            <label htmlFor="e-data">Data *</label>
            <input id="e-data" type="date" required max={hojeSP()} value={data} onChange={(e) => setData(e.target.value)} className="campo" />
          </div>
          <div className="lg:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-stone-700">Madeira em *</span>
            <div className="grid grid-cols-4 overflow-hidden rounded-md border border-stone-300" role="radiogroup" aria-label="Madeira em">
              {(Object.keys(LOCAL_ESTOQUE) as LocalEstoque[]).map((l, i) => (
                <button key={l} type="button" role="radio" aria-checked={local === l} onClick={() => setLocal(l)} className={botao(local === l, i)}>
                  {LOCAL_ESTOQUE[l]}
                </button>
              ))}
            </div>
            {local === "ESTUFA" && (
              <select value={estufaId} onChange={(e) => setEstufaId(e.target.value)} aria-label="Estufa" className="campo">
                {estufas.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.nome}
                  </option>
                ))}
              </select>
            )}
          </div>
        </section>

        <section className="cartao">
          <div className="mb-4 w-full max-w-sm">
            <span className="mb-1.5 block text-sm font-medium text-stone-700">Espessura *</span>
            <SeletorEspessura valor={espessura} onChange={setEspessura} />
          </div>
          <GradeBitolas espessura={espessura} valores={valores} onChange={setValores} />
        </section>

        <section className="cartao">
          <label htmlFor="e-obs">Observações</label>
          <textarea id="e-obs" rows={2} value={obs} onChange={(e) => setObs(e.target.value)} className="campo" />
        </section>

        {erro && (
          <p role="alert" className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800 ring-1 ring-rose-200">
            {erro}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => router.push("/producao/estoque")} className="btn-secundario">
            {inicial.id ? "Cancelar" : "Concluir"}
          </button>
          <button type="submit" className="btn-primario">
            {pendente ? "Salvando…" : inicial.id ? "Salvar" : "Registrar"}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
