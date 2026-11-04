import type { Metadata } from "next";
import { ControlesTv } from "./Relogio";
import { EMPRESA } from "@/lib/empresa";
import { CENTRO, CLASSE_MADEIRA, diaParaDate, formatarDia } from "@/lib/producao";
import { exigirProducao } from "@/lib/session";
import { dadosTv } from "@/lib/tv";

export const metadata: Metadata = { title: "Painel da serraria" };
export const dynamic = "force-dynamic";

const n = (v: number, d = 0) => v.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });
const pct = (v: number | null) => (v == null ? "—" : `${n(v * 100, 0)}%`);
const dur = (min: number) => (min >= 60 ? `${Math.floor(min / 60)}h${String(Math.round(min % 60)).padStart(2, "0")}` : `${Math.round(min)} min`);

function Cartao({ titulo, children, className = "" }: { titulo: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`min-w-0 rounded-2xl border border-white/10 bg-white/[0.04] p-[1.4vw] ${className}`}>
      <h2 className="mb-[0.8vw] text-[1.05vw] font-semibold uppercase tracking-[0.12em] text-white/50">{titulo}</h2>
      {children}
    </section>
  );
}

function Barra({ valor, cor = "#3fa52f", alto = "h-[0.9vw]" }: { valor: number; cor?: string; alto?: string }) {
  return (
    <div className={`${alto} overflow-hidden rounded-full bg-white/10`}>
      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, valor * 100))}%`, background: cor }} />
    </div>
  );
}

/** Painel para a TV do barracão: tela cheia, letras grandes, atualiza sozinho a cada minuto. */
export default async function PainelTv() {
  await exigirProducao();
  const d = await dadosTv();
  const fracDia = d.dia.metaM3 ? d.dia.serradoM3 / d.dia.metaM3 : 0;
  const fracMes = d.mes.metaM3 ? d.mes.serradoM3 / d.mes.metaM3 : 0;
  const corDia = fracDia >= 1 ? "#45c534" : fracDia >= 0.7 ? "#f2b233" : "#eb6834";
  const atualizado = new Date().toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });

  return (
    <main className="flex h-dvh flex-col gap-[1.2vw] overflow-hidden bg-[#0b100a] p-[1.6vw] text-white">
      {/* Cabeçalho */}
      <header className="flex shrink-0 items-center justify-between">
        <div className="flex items-center gap-[1.2vw]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={EMPRESA.logoBranco} alt="Artepinus" className="h-[3.6vw] w-auto" />
          <div>
            <div className="text-[1.9vw] font-bold leading-tight">Serraria</div>
            <div className="text-[1.05vw] text-white/60 first-letter:uppercase">{formatarDia(diaParaDate(d.hoje), { weekday: "long", day: "2-digit", month: "long" })}</div>
          </div>
        </div>
        <ControlesTv atualizadoEm={atualizado} />
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-3 grid-rows-[1.15fr_1fr] gap-[1.2vw]">
        {/* Serrado hoje */}
        <Cartao titulo="Serrado hoje" className="col-span-2 flex flex-col">
          <div className="flex items-end justify-between gap-6">
            <div className="leading-none">
              <span className="text-[7vw] font-bold tabular-nums" style={{ color: corDia }}>
                {n(d.dia.serradoM3, 1)}
              </span>
              <span className="ml-3 text-[2.4vw] font-semibold text-white/70">m³</span>
            </div>
            <div className="pb-[0.8vw] text-right">
              <div className="text-[3.2vw] font-bold tabular-nums leading-none">{pct(fracDia)}</div>
              <div className="mt-1 text-[1.15vw] text-white/60">da meta de {n(d.dia.metaM3, 0)} m³</div>
            </div>
          </div>
          <div className="mt-[1vw]">
            <Barra valor={fracDia} cor={corDia} alto="h-[1.4vw]" />
          </div>
          <ul className="mt-[1.1vw] min-h-0 space-y-[0.35vw] overflow-hidden text-[1.05vw]">
            {d.dia.ultimosLotes.length === 0 && <li className="text-white/40">Nenhum lote apontado hoje.</li>}
            {d.dia.ultimosLotes.slice(0, 3).map((l) => (
              <li key={l.codigo} className="flex items-baseline justify-between gap-4 border-b border-white/5 pb-[0.3vw]">
                <span className="min-w-0 truncate">
                  <b className="font-mono">{l.codigo}</b> <span className="text-white/45">às {l.hora}</span> <span className="text-white/65">· {l.pedido}</span>
                </span>
                <span className="shrink-0 tabular-nums text-white/80">
                  {n(l.pecas)} pç · {n(l.m3, 2)} m³
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-auto grid grid-cols-5 gap-[1vw] pt-[1.2vw]">
            {(["OTIMO", "BOM", "REGULAR"] as const).map((c) => (
              <div key={c}>
                <div className="flex items-center gap-2 text-[1vw] text-white/60">
                  <span className="h-[0.8vw] w-[0.8vw] rounded-sm" style={{ background: CLASSE_MADEIRA[c].hex }} />
                  {CLASSE_MADEIRA[c].label}
                </div>
                <div className="text-[2vw] font-bold tabular-nums">{n(d.dia.porClasse[c], 1)} m³</div>
              </div>
            ))}
            <div>
              <div className="text-[1vw] text-white/60">Peças</div>
              <div className="text-[2vw] font-bold tabular-nums">{n(d.dia.pecas)}</div>
            </div>
            <div>
              <div className="text-[1vw] text-white/60">Lotes</div>
              <div className="text-[2vw] font-bold tabular-nums">{n(d.dia.lotes)}</div>
            </div>
          </div>
        </Cartao>

        {/* Paradas hoje */}
        <Cartao titulo="Paradas hoje" className="flex flex-col">
          {d.paradasAgora.length > 0 && (
            <ul className="mb-[1vw] space-y-[0.4vw] rounded-xl bg-rose-600/20 px-[0.9vw] py-[0.7vw] ring-1 ring-rose-500/50">
              {d.paradasAgora.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 text-[1.25vw] font-semibold text-rose-100">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="h-[0.8vw] w-[0.8vw] shrink-0 animate-pulse rounded-full" style={{ background: CENTRO[p.centro].hex }} />
                    <span className="truncate">⛔ {p.maquina}</span>
                  </span>
                  <span className="shrink-0 tabular-nums">{dur(p.minutos)}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="text-[4.2vw] font-bold leading-none tabular-nums" style={{ color: d.dia.minutosParados ? "#fb8a9d" : "#45c534" }}>
            {d.dia.minutosParados ? dur(d.dia.minutosParados) : "0 min"}
          </div>
          <div className="mt-[1vw] space-y-[0.6vw]">
            {(["MEC", "ELE", "OPE"] as const).map((c) => (
              <div key={c} className="flex items-center justify-between text-[1.2vw]">
                <span className="flex items-center gap-2 text-white/70">
                  <span className="h-[0.8vw] w-[0.8vw] rounded-full" style={{ background: CENTRO[c].hex }} />
                  {CENTRO[c].label}
                </span>
                <span className="font-semibold tabular-nums">{dur(d.dia.paradoPorCentro[c])}</span>
              </div>
            ))}
          </div>
          {d.dia.motivos.length > 0 && (
            <ul className="mt-auto space-y-1 border-t border-white/10 pt-[0.8vw] text-[1vw] text-white/70">
              {d.dia.motivos.map((m) => (
                <li key={m.rotulo} className="flex justify-between gap-3">
                  <span className="truncate">{m.rotulo}</span>
                  <span className="shrink-0 tabular-nums">{dur(m.minutos)}</span>
                </li>
              ))}
            </ul>
          )}
        </Cartao>

        {/* Estufas */}
        <Cartao titulo="Estufas" className="col-span-2">
          <ul className="grid grid-cols-3 gap-[0.9vw]">
            {d.estufas.map((e) => {
              const atraso = e.ciclo?.restante != null && e.ciclo.restante < 0;
              const cor = !e.ciclo ? "#57534e" : atraso ? "#f43f5e" : "#eb6834";
              return (
                <li key={e.id} className="rounded-xl border border-white/10 bg-white/[0.03] px-[1vw] py-[0.8vw]">
                  <div className="flex items-center justify-between">
                    <span className="text-[1.35vw] font-bold">{e.nome}</span>
                    <span className="rounded-full px-2 py-0.5 text-[0.85vw] font-semibold" style={{ background: `${cor}33`, color: e.ciclo ? cor : "#a8a29e" }}>
                      {!e.ciclo ? "Livre" : atraso ? "Passou da previsão" : "Secando"}
                    </span>
                  </div>
                  {e.ciclo ? (
                    <>
                      <div className="mt-1 text-[1.05vw] text-white/70 tabular-nums">
                        {dur(e.ciclo.horas * 60)} · {n(e.ciclo.m3, 1)} m³
                        {e.ciclo.restante != null && ` · ${e.ciclo.restante >= 0 ? `faltam ${dur(e.ciclo.restante * 60)}` : `${dur(-e.ciclo.restante * 60)} além`}`}
                      </div>
                      <div className="mt-[0.5vw]">
                        <Barra valor={e.ciclo.progresso ?? 0} cor={cor} alto="h-[0.6vw]" />
                      </div>
                    </>
                  ) : (
                    <div className="mt-1 text-[1.05vw] text-white/40">Pronta para carregar</div>
                  )}
                </li>
              );
            })}
          </ul>
        </Cartao>

        {/* Mês */}
        <Cartao titulo="No mês" className="flex flex-col">
          <div className="flex items-baseline justify-between">
            <span className="text-[2.4vw] font-bold tabular-nums">{n(d.mes.serradoM3, 0)} m³</span>
            <span className="text-[1.1vw] text-white/60">meta {n(d.mes.metaM3, 0)} m³</span>
          </div>
          <div className="mt-[0.6vw]">
            <Barra valor={fracMes} />
          </div>
          <div className="mt-auto grid grid-cols-2 gap-y-[0.6vw] pt-[0.8vw] text-[0.95vw] text-white/60">
            <div>
              OEE do mês <b className="block text-[1.6vw] leading-tight text-white">{pct(d.mes.oee)}</b>
            </div>
            <div>
              Disponibilidade <b className="block text-[1.6vw] leading-tight text-white">{pct(d.mes.disponibilidade)}</b>
            </div>
            <div>
              Pacotes formados hoje <b className="block text-[1.6vw] leading-tight text-white">{n(d.dia.formados)}</b>
            </div>
            <div>
              Pacotes expedidos hoje <b className="block text-[1.6vw] leading-tight text-white">{n(d.dia.expedidos)}</b>
            </div>
          </div>
        </Cartao>
      </div>
    </main>
  );
}
