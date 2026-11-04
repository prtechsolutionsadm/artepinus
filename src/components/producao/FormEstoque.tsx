"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CloudOff } from "lucide-react";
import { salvarLevantamento, type Resultado } from "@/app/actions/producao";
import { FichaMadeira, linhaVazia, linhasPreenchidas, validarFicha } from "@/components/producao/FichaMadeira";
import { enviarOuGuardar } from "@/lib/fila-offline";
import { LOCAL_ESTOQUE, hojeSP, type LinhaFicha } from "@/lib/producao";
import type { LocalEstoque } from "@/generated/prisma/enums";

export type LevantamentoInicial = {
  id?: string;
  data: string;
  local: LocalEstoque | null;
  estufaId: string | null;
  observacoes: string | null;
  linhas: LinhaFicha[];
};

/** Inventário do dia: a ficha com "Madeira em", espessura, larguras e peças por comprimento em cada linha. */
export function FormEstoque({ inicial, estufas }: { inicial: LevantamentoInicial; estufas: { id: string; nome: string }[] }) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<{ guardado: boolean; texto: string } | null>(null);
  const [data, setData] = useState(inicial.data);
  const [obs, setObs] = useState(inicial.observacoes ?? "");
  // Lançamentos antigos tinham um local só: ele vira o "Madeira em" de cada linha
  const localAntigo = inicial.local ? (inicial.local === "ESTUFA" ? `ESTUFA:${inicial.estufaId}` : inicial.local) : null;
  const [linhas, setLinhas] = useState<LinhaFicha[]>(inicial.linhas.length ? inicial.linhas.map((l) => ({ ...l, local: l.local ?? localAntigo })) : [linhaVazia()]);
  const locais = [
    { valor: "GRADE", rotulo: LOCAL_ESTOQUE.GRADE },
    { valor: "PACOTE", rotulo: LOCAL_ESTOQUE.PACOTE },
    ...estufas.map((e) => ({ valor: `ESTUFA:${e.id}`, rotulo: e.nome })),
    { valor: "VERDE", rotulo: LOCAL_ESTOQUE.VERDE },
  ];
  const nomeLocal = (v?: string | null) => locais.find((o) => o.valor === v)?.rotulo ?? "";
  const cheias = linhasPreenchidas(linhas);

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setAviso(null);
    const invalida = validarFicha(linhas, true);
    if (invalida) return setErro(invalida);
    const esp = [...new Set(cheias.map((l) => l.espessura))].join("/");
    const onde = [...new Set(cheias.map((l) => nomeLocal(l.local)))].join(", ");
    const dados = { id: inicial.id ?? null, data, observacoes: obs, linhas: cheias };
    iniciar(async () => {
      const salvar = (d: Record<string, unknown>) => salvarLevantamento(d as Parameters<typeof salvarLevantamento>[0]);
      const r = inicial.id ? await salvar(dados) : await enviarOuGuardar("estoque", `Inventário: ${onde} · ${esp} mm`, dados, salvar);
      if ("guardado" in r) {
        setAviso({ guardado: true, texto: `${onde} · ${esp} mm guardado no aparelho; será enviado quando a internet voltar.` });
        setLinhas([linhaVazia()]);
        return;
      }
      const res = r as Resultado;
      if (res.erro) return setErro(res.erro);
      if (inicial.id) {
        router.push("/producao/estoque");
        router.refresh();
        return;
      }
      setAviso({ guardado: false, texto: `${onde} · ${esp} mm registrado. Pode lançar o próximo.` });
      setLinhas([linhaVazia()]);
      router.refresh();
    });
  }

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
        <section className="cartao">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-semibold">Madeira contada</h2>
              <p className="text-sm text-stone-500">Uma linha por local e medida: onde está, espessura, larguras e as peças em cada comprimento.</p>
            </div>
            <div className="w-full sm:w-48">
              <label htmlFor="e-data">Data *</label>
              <input id="e-data" type="date" required max={hojeSP()} value={data} onChange={(e) => setData(e.target.value)} className="campo" />
            </div>
          </div>
          <FichaMadeira linhas={linhas} onChange={setLinhas} locais={locais} />
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
        <div className="barra-acoes">
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
