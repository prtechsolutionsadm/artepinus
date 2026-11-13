"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, CloudOff, OctagonAlert, Trash2, Wrench, X } from "lucide-react";
import { excluirParadaMaquina, liberarMaquina, pararMaquina, type Resultado } from "@/app/actions/paradas";
import { mensagemFalha } from "@/lib/falha-acao";
import { EVENTO_FILA, enviarOuGuardar, listarFila, type ItemFila } from "@/lib/fila-offline";
import { MODULOS_ATIVOS } from "@/lib/permissoes";
import { CENTRO } from "@/lib/producao";
import type { CentroParada, OrigemParada } from "@/generated/prisma/enums";

type Maquina = { id: string; codigo: string; nome: string };
type Motivo = { id: string; codigo: number; descricao: string; centro: CentroParada; equipamentoId: string | null };
type Aberta = {
  id: string;
  equipamentoId: string;
  maquina: string;
  centro: CentroParada;
  motivo: string | null;
  descricao: string | null;
  inicio: string;
  abertaPor: string;
  origem: OrigemParada;
  /** `encerrada`: concluída ou cancelada na manutenção. */
  requisicao: { id: number; numero: string; status: string; encerrada: boolean } | null;
};

/** Com a manutenção em teste, os avisos dela não chegam a ninguém: a tela não promete que ela foi avisada. */
const MANUTENCAO_ATIVA = MODULOS_ATIVOS.includes("manutencao");

/** "1h05" / "12 min" a partir de milissegundos (cronômetro). */
function cronometro(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, "0");
  return h ? `${h}h${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

const hora = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });

/**
 * Botão "Máquina parou" (máquina → motivo → tipo da falha) e as paradas abertas com o
 * cronômetro e o botão "Máquina liberada". Recarrega a cada minuto para ver o que a
 * manutenção liberou.
 */
export function PainelParadas({
  usuarioId,
  podeMarcar,
  podeExcluir,
  verManutencao,
  maquinas,
  motivos,
  abertas,
}: {
  /** Usuário logado: as paradas guardadas por outro usuário só vão quando ele entrar. */
  usuarioId: string;
  podeMarcar: boolean;
  podeExcluir: boolean;
  verManutencao: boolean;
  maquinas: Maquina[];
  motivos: Motivo[];
  abertas: Aberta[];
}) {
  const router = useRouter();
  const [agora, setAgora] = useState(() => Date.now());
  const [aberto, setAberto] = useState(false);
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<{ texto: string; guardado: boolean } | null>(null);
  // Paradas guardadas no aparelho (sem internet) que ainda não chegaram ao servidor
  const [naFila, setNaFila] = useState<ItemFila[]>([]);
  const [f, setF] = useState({ equipamentoId: "", motivoId: "", centro: "" as CentroParada | "", descricao: "" });

  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 1000);
    const r = setInterval(() => navigator.onLine && router.refresh(), 60_000);
    return () => {
      clearInterval(t);
      clearInterval(r);
    };
  }, [router]);

  useEffect(() => {
    const ler = () => listarFila().then((l) => setNaFila(l.filter((i) => i.tipo === "parada" && !i.erro)));
    ler();
    window.addEventListener(EVENTO_FILA, ler);
    return () => window.removeEventListener(EVENTO_FILA, ler);
  }, []);

  const paradasIds = new Set(abertas.map((a) => a.equipamentoId));
  const deOutro = (i: ItemFila) => !!i.usuarioId && i.usuarioId !== usuarioId;
  // Só as paradas deste usuário (e as antigas, sem dono) bloqueiam a máquina: a de outro usuário
  // espera o login dele, e se chegar com a máquina já parada o servidor recusa
  const pendentesIds = new Set(naFila.filter((i) => !deOutro(i)).map((i) => String(i.dados?.equipamentoId)));
  // Motivos da máquina escolhida primeiro; depois os gerais (sem máquina)
  const motivosDaMaquina = useMemo(
    () => motivos.filter((m) => m.equipamentoId === f.equipamentoId || !m.equipamentoId).sort((a, b) => Number(!!b.equipamentoId) - Number(!!a.equipamentoId) || a.codigo - b.codigo),
    [motivos, f.equipamentoId],
  );
  const motivo = motivos.find((m) => m.id === f.motivoId);
  const centro = motivo?.centro ?? f.centro;

  function fechar() {
    setAberto(false);
    setErro(null);
    setF({ equipamentoId: "", motivoId: "", centro: "", descricao: "" });
  }

  function marcar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (!f.equipamentoId) return setErro("Escolha a máquina");
    if (!centro) return setErro("Diga se a falha é mecânica, elétrica ou operacional");
    const maquina = maquinas.find((m) => m.id === f.equipamentoId);
    const dados = { ...f, centro, registradaEm: new Date().toISOString() };
    iniciar(async () => {
      try {
        const r = await enviarOuGuardar("parada", `Parada: ${maquina?.nome ?? "máquina"}`, dados, (d) => pararMaquina(d as Parameters<typeof pararMaquina>[0]));
        if ("guardado" in r) {
          setAviso({
            guardado: true,
            texto: "Sem internet: a parada foi guardada no aparelho com a hora de agora e será enviada quando a conexão voltar. Avise a manutenção pessoalmente.",
          });
          fechar();
          return;
        }
        const res = r as Resultado;
        if (res.erro) return setErro(res.erro);
        setAviso({
          guardado: false,
          texto: !res.requisicaoId
            ? "Parada marcada. O cronômetro está correndo."
            : MANUTENCAO_ATIVA
              ? "Parada marcada. A manutenção foi avisada."
              : "Parada marcada. O cronômetro está correndo. Avise a manutenção.",
        });
        fechar();
        router.refresh();
      } catch (e) {
        setErro(mensagemFalha(e));
      }
    });
  }

  function liberar(a: Aberta) {
    const obs = window.prompt(`${a.maquina} voltou a operar?\nSe quiser, anote o que foi feito (opcional):`, "");
    if (obs === null) return;
    iniciar(async () => {
      try {
        const r = await liberarMaquina(a.id, obs);
        if (r.erro) return window.alert(r.erro);
        setAviso({
          guardado: false,
          texto: `${a.maquina} liberada. O tempo parado foi para o boletim.${
            MANUTENCAO_ATIVA && a.requisicao && !a.requisicao.encerrada ? " A manutenção foi avisada para conferir e concluir a requisição." : ""
          }`,
        });
        router.refresh();
      } catch (e) {
        window.alert(mensagemFalha(e));
      }
    });
  }

  function excluir(a: Aberta) {
    const daRequisicao =
      a.requisicao && !a.requisicao.encerrada
        ? a.origem === "SERRARIA"
          ? `\nA requisição de manutenção ${a.requisicao.numero}, aberta junto, é cancelada se ninguém da manutenção a assumiu.`
          : `\nA requisição de manutenção ${a.requisicao.numero} continua aberta, sem a marcação de máquina parada.`
        : "";
    if (!window.confirm(`Excluir a parada de ${a.maquina}? Use só se foi marcada por engano.${daRequisicao}`)) return;
    iniciar(async () => {
      try {
        const r = await excluirParadaMaquina(a.id);
        if (r.erro) return window.alert(r.erro);
        router.refresh();
      } catch (e) {
        window.alert(mensagemFalha(e));
      }
    });
  }

  return (
    <div className="space-y-4">
      {aviso && (
        <p
          role="status"
          className={`flex items-start gap-2 rounded-md px-3 py-2 text-sm ring-1 ${aviso.guardado ? "bg-amber-50 text-amber-900 ring-amber-200" : "bg-emerald-50 text-emerald-900 ring-emerald-200"}`}
        >
          {aviso.guardado ? <CloudOff className="mt-0.5 h-4 w-4 shrink-0" /> : <Check className="mt-0.5 h-4 w-4 shrink-0" />}
          <span className="flex-1">{aviso.texto}</span>
          <button type="button" onClick={() => setAviso(null)} aria-label="Fechar aviso">
            <X className="h-4 w-4" />
          </button>
        </p>
      )}

      {podeMarcar && !aberto && (
        <button
          type="button"
          onClick={() => {
            setAviso(null);
            setAberto(true);
          }}
          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-rose-600 px-6 py-5 text-lg font-bold text-white shadow-sm transition hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
        >
          <OctagonAlert className="h-7 w-7" /> Máquina parou
        </button>
      )}

      {aberto && (
        <form onSubmit={marcar} className="cartao border-rose-300 ring-1 ring-rose-200">
          <fieldset disabled={pendente} className="min-w-0 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-rose-800">Qual máquina parou?</h2>
              <button type="button" onClick={fechar} className="btn-secundario px-3 py-1.5 text-sm">
                Cancelar
              </button>
            </div>
            {erro && (
              <p role="alert" className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800 ring-1 ring-rose-200">
                {erro}
              </p>
            )}
            <div>
              <label htmlFor="pm-maquina">Máquina *</label>
              <select
                id="pm-maquina"
                required
                value={f.equipamentoId}
                onChange={(e) => setF((x) => ({ ...x, equipamentoId: e.target.value, motivoId: "" }))}
                className="campo text-base"
              >
                <option value="">— Escolha —</option>
                {maquinas.map((m) => (
                  <option key={m.id} value={m.id} disabled={paradasIds.has(m.id) || pendentesIds.has(m.id)}>
                    {m.codigo} · {m.nome}
                    {paradasIds.has(m.id) ? " (já parada)" : pendentesIds.has(m.id) ? " (guardada no aparelho)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="pm-motivo">Motivo</label>
              <select id="pm-motivo" value={f.motivoId} onChange={(e) => setF((x) => ({ ...x, motivoId: e.target.value }))} className="campo text-base">
                <option value="">— Outro / não sei —</option>
                {motivosDaMaquina.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.codigo} · {m.descricao} ({CENTRO[m.centro].curto})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span className="mb-1 block text-sm font-medium">Tipo da falha *</span>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(CENTRO) as CentroParada[]).map((c) => {
                  const marcado = centro === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      disabled={!!motivo}
                      aria-pressed={marcado}
                      onClick={() => setF((x) => ({ ...x, centro: c }))}
                      className={`rounded-xl border px-2 py-3 text-sm font-semibold transition disabled:cursor-not-allowed ${
                        marcado ? "border-transparent text-white" : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50 disabled:opacity-50"
                      }`}
                      style={marcado ? { background: CENTRO[c].hex } : undefined}
                    >
                      {CENTRO[c].label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1 text-xs text-stone-500">
                {motivo
                  ? "Definido pelo motivo escolhido."
                  : MANUTENCAO_ATIVA
                    ? "Mecânica e elétrica abrem na hora uma requisição para a manutenção, que é avisada."
                    : "Mecânica ou elétrica: avise a manutenção."}
              </p>
            </div>
            <div>
              <label htmlFor="pm-obs">O que aconteceu? (opcional)</label>
              <input id="pm-obs" maxLength={500} value={f.descricao} onChange={(e) => setF((x) => ({ ...x, descricao: e.target.value }))} className="campo" placeholder="Ex.: correia arrebentou" />
            </div>
            <button className="btn-primario w-full bg-rose-600 py-3 text-base hover:bg-rose-700">{pendente ? "Marcando…" : "Marcar parada agora"}</button>
          </fieldset>
        </form>
      )}

      <section aria-labelledby="paradas-agora">
        <h2 id="paradas-agora" className="mb-2 font-semibold">
          Paradas agora {abertas.length > 0 && <span className="ml-1 rounded-full bg-rose-600 px-2 py-0.5 text-xs text-white">{abertas.length}</span>}
        </h2>
        {abertas.length === 0 ? (
          naFila.length === 0 && <p className="cartao text-sm text-stone-500">Nenhuma máquina parada. 👍</p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {abertas.map((a) => (
              <li key={a.id} className="cartao flex flex-col gap-2 border-l-4" style={{ borderLeftColor: CENTRO[a.centro].hex }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold">{a.maquina}</div>
                    <div className="text-sm text-stone-600">
                      {CENTRO[a.centro].label}
                      {a.motivo && ` · ${a.motivo}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div suppressHydrationWarning className="font-mono text-2xl font-bold tabular-nums text-rose-700">{cronometro(agora - new Date(a.inicio).getTime())}</div>
                    <div className="text-xs text-stone-500">desde {hora(a.inicio)}</div>
                  </div>
                </div>
                {a.descricao && <p className="text-sm text-stone-600">{a.descricao}</p>}
                <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
                  <span>
                    {a.origem === "MANUTENCAO"
                      ? a.requisicao
                        ? `Marcada na requisição ${a.requisicao.numero} por ${a.abertaPor}`
                        : `Aberta numa requisição de manutenção por ${a.abertaPor}`
                      : `Marcada por ${a.abertaPor}`}
                  </span>
                  {a.requisicao &&
                    (verManutencao ? (
                      <Link href={`/requisicoes/${a.requisicao.id}`} className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 font-medium text-sky-800 ring-1 ring-sky-200">
                        <Wrench className="h-3 w-3" /> {a.requisicao.numero} · {a.requisicao.status}
                      </Link>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 font-medium text-sky-800 ring-1 ring-sky-200">
                        <Wrench className="h-3 w-3" />{" "}
                        {a.requisicao.encerrada
                          ? `Requisição ${a.requisicao.numero} · ${a.requisicao.status}`
                          : MANUTENCAO_ATIVA
                            ? `Manutenção avisada · ${a.requisicao.numero}`
                            : `Requisição ${a.requisicao.numero}`}
                      </span>
                    ))}
                </div>
                <div className="mt-auto flex gap-2 pt-1">
                  {podeMarcar && (
                    <button type="button" disabled={pendente} onClick={() => liberar(a)} className="btn-primario flex-1 py-2.5">
                      <Check className="h-4 w-4" /> Máquina liberada
                    </button>
                  )}
                  {podeExcluir && (
                    <button type="button" disabled={pendente} onClick={() => excluir(a)} className="btn-secundario px-3" aria-label={`Excluir a parada de ${a.maquina}`} title="Marcada por engano">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        {naFila.length > 0 && (
          <ul className="mt-3 space-y-2">
            {naFila.map((i) => (
              <li key={i.chave} className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900 ring-1 ring-amber-200">
                <CloudOff className="h-4 w-4 shrink-0" />
                <span className="min-w-0 flex-1">
                  <b>{maquinas.find((m) => m.id === i.dados?.equipamentoId)?.nome ?? i.titulo}</b> · desde {hora(String(i.dados?.registradaEm ?? i.criadoEm))}
                  <span className="block text-xs opacity-80">
                    {deOutro(i)
                      ? `Lançada por ${i.usuarioNome ?? "outro usuário"}: só é enviada quando ele entrar neste aparelho`
                      : navigator.onLine
                        ? "Guardada no aparelho, enviando…"
                        : "Guardada no aparelho, aguardando internet"}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
