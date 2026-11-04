"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { salvarBoletim, type DadosBoletim } from "@/app/actions/producao";
import { SeletorMultiplo } from "@/components/producao/SeletorMultiplo";
import { CENTRO, fmtM3, fmtNum, fmtPct, hojeSP } from "@/lib/producao";
import { formatarDuracao } from "@/lib/constantes";
import type { CentroParada } from "@/generated/prisma/enums";

export type MotivoOpcao = { id: string; codigo: number; descricao: string; centro: CentroParada; equipamentoId: string | null };
export type EquipamentoOpcao = { id: string; codigo: string; nome: string };

type Parada = {
  k: number;
  motivoId: string;
  equipamentoId: string;
  centro: CentroParada;
  ocorrencias: string;
  minutos: string;
  descricao: string;
  requisicaoId: number | null;
};

export type BoletimInicial = {
  id?: string;
  data: string;
  metaM3: number;
  horasProgramadas: number;
  torasQtd: number | null;
  torasM3: number | null;
  observacoes: string | null;
  paradas: { motivoId: string | null; equipamentoId: string | null; centro: CentroParada; ocorrencias: number; minutos: number; descricao: string | null; requisicaoId: number | null }[];
  cargaIds: string[];
};

let seq = 0;
const novaChave = () => ++seq;
const num = (s: string) => (s.trim() === "" ? NaN : Number(s.replace(",", ".")));
const txt = (n: number | null | undefined) => (n == null ? "" : String(n));

/**
 * Dados do dia na serraria: paradas, toras serradas e observações. A produção
 * entra pelos lotes (Apontar serraria); meta e horas vêm da configuração padrão.
 */
export function FormBoletim({
  inicial,
  motivos,
  equipamentos,
  cargas,
  dataPadrao,
  meta,
  horasPadrao,
  producaoM3 = 0,
  automaticas = [],
}: {
  inicial: BoletimInicial | null;
  /** Data já escolhida (ex.: vindo de uma pendência "boletim de ontem não lançado"). */
  dataPadrao?: string;
  motivos: MotivoOpcao[];
  equipamentos: EquipamentoOpcao[];
  cargas: { id: string; rotulo: string }[];
  /** Meta e horas da configuração padrão (para um dia novo). */
  meta: number;
  horasPadrao: number;
  /** Volume já lançado nos lotes do dia. */
  producaoM3?: number;
  /** Paradas marcadas na hora ("Máquina parou"): só leitura aqui. */
  automaticas?: { id: string; rotulo: string; centro: CentroParada; minutos: number }[];
}) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const hoje = hojeSP();
  const [data, setData] = useState(inicial?.data ?? (dataPadrao && dataPadrao <= hoje ? dataPadrao : hoje));
  const metaM3 = inicial?.metaM3 ?? meta;
  const horas = inicial?.horasProgramadas ?? horasPadrao;
  const [torasQtd, setTorasQtd] = useState(txt(inicial?.torasQtd));
  const [torasM3, setTorasM3] = useState(txt(inicial?.torasM3));
  const [obs, setObs] = useState(inicial?.observacoes ?? "");
  const [cargaIds, setCargaIds] = useState<string[]>(inicial?.cargaIds ?? []);
  const [paradas, setParadas] = useState<Parada[]>(() =>
    (inicial?.paradas ?? []).map((p) => ({
      k: novaChave(),
      motivoId: p.motivoId ?? "",
      equipamentoId: p.equipamentoId ?? "",
      centro: p.centro,
      ocorrencias: String(p.ocorrencias),
      minutos: String(p.minutos),
      descricao: p.descricao ?? "",
      requisicaoId: p.requisicaoId,
    })),
  );

  const motivoPorId = useMemo(() => new Map(motivos.map((m) => [m.id, m])), [motivos]);
  const motivosPorCentro = useMemo(() => {
    const g: Record<CentroParada, MotivoOpcao[]> = { MEC: [], ELE: [], OPE: [] };
    for (const m of motivos) g[m.centro].push(m);
    return g;
  }, [motivos]);

  const minutosParados = paradas.reduce((t, p) => t + (num(p.minutos) || 0), 0) + automaticas.reduce((t, p) => t + p.minutos, 0);
  const disponibilidade = horas > 0 ? Math.max(0, (horas * 60 - minutosParados) / (horas * 60)) : null;
  const produtividade = metaM3 > 0 ? producaoM3 / metaM3 : null;
  const kpis = { minutosParados };
  const mudarParada = (k: number, mud: Partial<Parada>) => setParadas((l) => l.map((p) => (p.k === k ? { ...p, ...mud } : p)));

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    const payload: DadosBoletim = {
      id: inicial?.id ?? null,
      data,
      torasQtd,
      torasM3: torasM3.replace(",", "."),
      observacoes: obs,
      cargaIds,
      paradas: paradas
        .filter((p) => p.minutos || p.motivoId)
        .map((p) => ({
          motivoId: p.motivoId,
          equipamentoId: p.equipamentoId,
          centro: p.centro,
          ocorrencias: p.ocorrencias || 1,
          minutos: p.minutos.replace(",", "."),
          descricao: p.descricao,
          requisicaoId: p.requisicaoId,
        })),
    };
    iniciar(async () => {
      const r = await salvarBoletim(payload);
      if (r.erro) {
        setErro(r.erro);
        return;
      }
      router.push(`/producao/boletins/${r.id}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={enviar} className="space-y-6">
      <fieldset disabled={pendente} className="min-w-0 space-y-6">
        <section className="cartao grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <label htmlFor="b-data">Data *</label>
            <input id="b-data" type="date" required max={hoje} value={data} disabled={!!inicial?.id} onChange={(e) => setData(e.target.value)} className="campo" />
          </div>
          <div>
            <span className="block text-sm font-medium text-stone-700">Meta</span>
            <span className="mt-1.5 block rounded-md bg-stone-100 px-3 py-2.5 font-semibold tabular-nums text-stone-600">{fmtNum(metaM3, 1)} m³</span>
          </div>
          <div>
            <span className="block text-sm font-medium text-stone-700">Horas programadas</span>
            <span className="mt-1.5 block rounded-md bg-stone-100 px-3 py-2.5 font-semibold tabular-nums text-stone-600">{fmtNum(horas, 1)} h</span>
          </div>
          <div>
            <span className="block text-sm font-medium text-stone-700">Serrado no dia</span>
            <span className="mt-1.5 block rounded-md bg-stone-100 px-3 py-2.5 font-semibold tabular-nums text-stone-600">{fmtM3(producaoM3, 2)}</span>
          </div>
          <p className="col-span-2 text-xs text-stone-500 sm:col-span-4">Meta e horas vêm da configuração padrão (Cadastros › Configuração). As peças entram por Apontar serraria.</p>
        </section>

        <section className="cartao grid grid-cols-2 gap-3">
          <h2 className="col-span-2 font-semibold">Toras consumidas no dia</h2>
          <div>
            <label htmlFor="b-tq">Quantidade</label>
            <input id="b-tq" inputMode="numeric" value={torasQtd} onChange={(e) => setTorasQtd(e.target.value)} className="campo" />
          </div>
          <div>
            <label htmlFor="b-tm">Volume (m³) — para o rendimento</label>
            <input id="b-tm" inputMode="decimal" value={torasM3} onChange={(e) => setTorasM3(e.target.value)} className="campo" />
          </div>
        </section>

        <section className="cartao">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">Paradas da linha</h2>
            <span className="text-sm text-stone-500">Total: {formatarDuracao(kpis.minutosParados)}</span>
          </div>
          {automaticas.length > 0 && (
            <div className="mb-3 rounded-xl bg-stone-50 p-3 ring-1 ring-stone-200">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">Marcadas na hora (Paradas de máquina)</p>
              <ul className="space-y-1 text-sm">
                {automaticas.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: CENTRO[a.centro].hex }} aria-hidden />
                      <span className="truncate">{a.rotulo}</span>
                    </span>
                    <span className="shrink-0 tabular-nums text-stone-600">
                      {CENTRO[a.centro].curto} · {formatarDuracao(a.minutos)}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-stone-500">Para corrigir, use a requisição da manutenção ou a tela Paradas de máquina.</p>
            </div>
          )}
          {paradas.length === 0 && <p className="mb-3 text-sm text-stone-500">{automaticas.length ? "Nenhuma outra parada lançada." : "Nenhuma parada lançada."}</p>}
          <ul className="space-y-3">
            {paradas.map((p, n) => (
              <li key={p.k} className="rounded-xl border border-stone-200 p-3">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-12 sm:items-end">
                  <div className="col-span-2 sm:col-span-5">
                    <label htmlFor={`p-m-${p.k}`}>Motivo</label>
                    <select
                      id={`p-m-${p.k}`}
                      value={p.motivoId}
                      onChange={(e) => {
                        const m = motivoPorId.get(e.target.value);
                        mudarParada(p.k, { motivoId: e.target.value, ...(m ? { centro: m.centro, equipamentoId: m.equipamentoId ?? p.equipamentoId } : {}) });
                      }}
                      className="campo"
                    >
                      <option value="">— Outro (descrever) —</option>
                      {(Object.keys(motivosPorCentro) as CentroParada[]).map((c) => (
                        <optgroup key={c} label={CENTRO[c].label}>
                          {motivosPorCentro[c].map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.codigo} · {m.descricao}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor={`p-c-${p.k}`}>Centro</label>
                    <select id={`p-c-${p.k}`} value={p.centro} onChange={(e) => mudarParada(p.k, { centro: e.target.value as CentroParada })} className="campo">
                      {(Object.keys(CENTRO) as CentroParada[]).map((c) => (
                        <option key={c} value={c}>
                          {CENTRO[c].label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-3">
                    <label htmlFor={`p-e-${p.k}`}>Equipamento</label>
                    <select id={`p-e-${p.k}`} value={p.equipamentoId} onChange={(e) => mudarParada(p.k, { equipamentoId: e.target.value })} className="campo">
                      <option value="">—</option>
                      {equipamentos.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-1">
                    <label htmlFor={`p-o-${p.k}`}>Vezes</label>
                    <input id={`p-o-${p.k}`} inputMode="numeric" value={p.ocorrencias} onChange={(e) => mudarParada(p.k, { ocorrencias: e.target.value.replace(/\D/g, "") })} className="campo" />
                  </div>
                  <div className="sm:col-span-1">
                    <label htmlFor={`p-t-${p.k}`}>Min.</label>
                    <input id={`p-t-${p.k}`} inputMode="decimal" required value={p.minutos} onChange={(e) => mudarParada(p.k, { minutos: e.target.value })} className="campo" />
                  </div>
                  <div className="col-span-2 sm:col-span-12">
                    <label htmlFor={`p-d-${p.k}`}>Observação {p.motivoId ? "" : "*"}</label>
                    <input
                      id={`p-d-${p.k}`}
                      required={!p.motivoId}
                      value={p.descricao}
                      onChange={(e) => mudarParada(p.k, { descricao: e.target.value })}
                      placeholder="O que aconteceu"
                      className="campo"
                    />
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2 text-sm">
                  <span className="text-stone-500">
                    {n + 1}. {CENTRO[p.centro].curto} · {formatarDuracao(num(p.minutos) || 0)}
                    {p.requisicaoId ? " · requisição aberta" : ""}
                  </span>
                  <button type="button" onClick={() => setParadas((l) => l.filter((x) => x.k !== p.k))} className="btn-secundario px-2 py-1 text-xs text-rose-700" aria-label={`Remover parada ${n + 1}`}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() =>
              setParadas((l) => [...l, { k: novaChave(), motivoId: "", equipamentoId: "", centro: "OPE", ocorrencias: "1", minutos: "", descricao: "", requisicaoId: null }])
            }
            className="btn-secundario mt-3"
          >
            <Plus className="h-4 w-4" /> Adicionar parada
          </button>
        </section>

        <section className="cartao">
          <h2 className="mb-1 font-semibold">Toras serradas no dia</h2>
          <p className="mb-3 text-sm text-stone-500">Marque as cargas que foram serradas hoje — é o que liga os pacotes deste dia à floresta de origem.</p>
          <SeletorMultiplo opcoes={cargas} valor={cargaIds} onChange={setCargaIds} rotulo="Cargas de toras" vazio="Nenhuma carga de toras registrada nos últimos 60 dias." />
        </section>

        <section className="cartao">
          <label htmlFor="b-obs">Observações do dia</label>
          <textarea id="b-obs" rows={3} value={obs} onChange={(e) => setObs(e.target.value)} className="campo" />
        </section>

        <section className="cartao" aria-label="Resumo do dia">
          <h2 className="mb-3 font-semibold">Resumo</h2>
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            {[
              ["Serrado", fmtM3(producaoM3)],
              ["Parado", formatarDuracao(minutosParados)],
              ["Disponibilidade", fmtPct(disponibilidade)],
              ["OEE", fmtPct(disponibilidade != null && produtividade != null ? disponibilidade * produtividade : null)],
            ].map(([r, v]) => (
              <div key={r} className="rounded-md bg-stone-50 px-3 py-2">
                <dt className="text-xs text-stone-500">{r}</dt>
                <dd className="font-semibold tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        {erro && (
          <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800 ring-1 ring-rose-200">
            {erro}
          </p>
        )}
        <div className="barra-acoes">
          <button type="button" onClick={() => router.back()} className="btn-secundario">
            Cancelar
          </button>
          <button type="submit" className="btn-primario">
            {pendente ? "Salvando…" : "Salvar o dia"}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
