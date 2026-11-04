import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardPen,
  Flame,
  Info,
  Link2,
  OctagonAlert,
  Package,
  QrCode,
  Truck,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import { formatarData, formatarDuracao } from "@/lib/constantes";
import { dadosInicio, type Pendencia } from "@/lib/inicio-producao";
import { alertarEstufasAtrasadas } from "@/lib/alertas-serraria";
import { after } from "next/server";
import { podeProducao } from "@/lib/permissoes";
import {
  fmtM3,
  fmtNum,
  fmtPct,
  formatarDia,
  diaParaDate,
} from "@/lib/producao";
import { STATUS_PACOTE } from "@/lib/rastreio";
import { exigirProducao } from "@/lib/session";

export const metadata: Metadata = { title: "Início" };

const TAREFAS: {
  etapa?: number;
  titulo: string;
  texto: string;
  href: string;
  Icone: LucideIcon;
}[] = [
  {
    etapa: 1,
    titulo: "Receber toras",
    texto: "Carga no pátio",
    href: "/producao/toras/nova",
    Icone: Truck,
  },
  {
    etapa: 2,
    titulo: "Apontar serraria",
    texto: "Lote com etiqueta",
    href: "/producao/boletins/novo",
    Icone: ClipboardPen,
  },
  {
    titulo: "Máquina parou",
    texto: "Cronômetro e aviso à manutenção",
    href: "/producao/paradas",
    Icone: OctagonAlert,
  },
  {
    etapa: 3,
    titulo: "Iniciar estufa",
    texto: "Novo ciclo",
    href: "/producao/estufas/ciclos/novo",
    Icone: Flame,
  },
  {
    etapa: 4,
    titulo: "Formar pacote",
    texto: "Com etiqueta QR",
    href: "/producao/pacotes/novo",
    Icone: Package,
  },
  {
    titulo: "Inventário do dia",
    texto: "Grade, pacote, estufa, verde",
    href: "/producao/estoque/novo",
    Icone: Warehouse,
  },
];

const ESTILO_PENDENCIA: Record<
  Pendencia["tipo"],
  { Icone: LucideIcon; cor: string }
> = {
  atraso: { Icone: AlertTriangle, cor: "text-rose-600" },
  aviso: { Icone: Info, cor: "text-amber-600" },
  rastreio: { Icone: Link2, cor: "text-sky-600" },
};

function saudacao() {
  const h = Number(
    new Date().toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      hour12: false,
    }),
  );
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

/** Uma linha de tarefa (botão grande de "Lançar"). */
function Tarefa({
  href,
  titulo,
  texto,
  etapa,
  Icone,
}: {
  href: string;
  titulo: string;
  texto: string;
  etapa?: number;
  Icone: LucideIcon;
}) {
  return (
    <li className="bg-white">
      <Link
        href={href}
        className="group flex h-full items-center gap-3 px-4 py-3 transition hover:bg-marca-50"
      >
        <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-md bg-marca-50 text-marca-700 group-hover:bg-white">
          <Icone className="h-[18px] w-[18px]" />
          {etapa && (
            <span className="absolute -right-1.5 -top-1.5 grid h-[17px] w-[17px] place-items-center rounded-full bg-marca-700 text-[10px] font-bold text-white ring-2 ring-white">
              {etapa}
            </span>
          )}
        </span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-sm font-semibold">{titulo}</span>
          <span className="block truncate text-xs text-stone-500">{texto}</span>
        </span>
        <ArrowRight className="h-4 w-4 shrink-0 text-stone-300 group-hover:text-marca-700" />
      </Link>
    </li>
  );
}

/** Tela inicial do sistema: o que precisa de atenção, as tarefas do dia e a situação geral. */
export default async function InicioProducaoPage() {
  const eu = await exigirProducao();
  const lancar = podeProducao(eu, "lancar");
  const d = await dadosInicio();
  // A rotina agendada roda poucas vezes por dia: quem abre o Início também dispara o aviso de estufa atrasada
  after(() => alertarEstufasAtrasadas().catch((e) => console.error(e)));
  const primeiroNome = eu.nome.split(" ")[0];
  const progresso =
    d.mes.metaM3 > 0 ? Math.min(1, d.mes.producaoM3 / d.mes.metaM3) : 0;

  return (
    // No computador a tela cabe na altura da janela; as listas rolam por dentro dos quadros
    <div className="flex flex-col gap-5 lg:h-[calc(100dvh-6.75rem-2px-3.25rem)] lg:min-h-[520px]">
      <div className="flex shrink-0 flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-stone-500 first-letter:uppercase">
            {formatarDia(diaParaDate(d.hoje), {
              weekday: "long",
              day: "2-digit",
              month: "long",
            })}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {saudacao()}, {primeiroNome}
          </h1>
        </div>
        <Link href="/producao/escanear" className="btn-secundario">
          <QrCode className="h-4 w-4" /> Ler etiqueta
        </Link>
      </div>

      <div className="grid gap-5 lg:min-h-0 lg:flex-1 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-5 lg:col-span-2 lg:min-h-0">
          {/* Pendências */}
          <section className="cartao flex flex-col p-0 lg:min-h-0 lg:shrink">
            <div className="flex shrink-0 items-center justify-between border-b border-stone-200 px-4 py-3 sm:px-5">
              <h2 className="font-semibold">O que precisa de atenção</h2>
              {d.pendencias.length > 0 && (
                <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-600">
                  {d.pendencias.length}
                </span>
              )}
            </div>
            {d.pendencias.length === 0 ? (
              <p className="flex items-center gap-3 px-4 py-5 text-sm text-stone-600 sm:px-5">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />{" "}
                Tudo em dia. Nenhuma pendência.
              </p>
            ) : (
              <ul className="divide-y divide-stone-100 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
                {d.pendencias.map((p, i) => {
                  const { Icone, cor } = ESTILO_PENDENCIA[p.tipo];
                  return (
                    <li
                      key={i}
                      className={`flex items-center gap-3 px-4 py-2.5 sm:px-5 ${i >= 8 ? "max-lg:hidden" : ""}`}
                    >
                      <Icone className={`h-[18px] w-[18px] shrink-0 ${cor}`} />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium first-letter:uppercase">
                          {p.texto}
                        </div>
                        {p.detalhe && (
                          <div className="text-xs text-stone-500">
                            {p.detalhe}
                          </div>
                        )}
                      </div>
                      {lancar && (
                        <Link
                          href={p.href}
                          className="shrink-0 rounded-md border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                        >
                          {p.acao}
                        </Link>
                      )}
                    </li>
                  );
                })}
                {d.pendencias.length > 8 && (
                  <li className="px-4 py-2.5 text-xs text-stone-500 sm:px-5 lg:hidden">
                    E mais {d.pendencias.length - 8} pendência(s).
                  </li>
                )}
              </ul>
            )}
          </section>

          {/* Estufas agora */}
          {d.estufas.length > 0 && (
            <section className="shrink-0">
              <div className="mb-2 flex items-baseline justify-between">
                <h2 className="font-semibold">Estufas agora</h2>
                <Link href="/producao/estufas" className="text-xs font-semibold text-marca-700 hover:underline">
                  Ver estufas
                </Link>
              </div>
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
                {d.estufas.map((e) => (
                  <li key={e.id}>
                    <Link
                      href={e.ciclo ? `/producao/estufas/ciclos/${e.ciclo.id}` : `/producao/estufas/ciclos/novo?estufa=${e.id}`}
                      className="block h-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 transition hover:border-marca-300"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold">{e.nome}</span>
                        <span className={`h-2 w-2 shrink-0 rounded-full ${!e.ciclo ? "bg-stone-300" : e.ciclo.atrasado ? "bg-rose-500" : "bg-[#eb6834]"}`} aria-hidden />
                      </div>
                      {e.ciclo ? (
                        <>
                          <div className="mt-0.5 text-xs text-stone-500 tabular-nums">
                            {formatarDuracao(e.ciclo.horas * 60)} · {fmtM3(e.ciclo.m3, 1)}
                          </div>
                          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-stone-100">
                            <div className={`h-full rounded-full ${e.ciclo.atrasado ? "bg-rose-500" : "bg-[#eb6834]"}`} style={{ width: `${(e.ciclo.progresso ?? 0) * 100}%` }} />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="mt-0.5 text-xs text-stone-400">Livre · iniciar ciclo</div>
                          <div className="mt-1.5 h-1 rounded-full bg-stone-100" />
                        </>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Tarefas, na ordem do processo */}
          {lancar && (
            <section className="shrink-0">
              <h2 className="mb-2 font-semibold">Lançar</h2>
              <ul className="grid gap-px overflow-hidden rounded-lg border border-stone-200 bg-stone-200 sm:grid-cols-2 xl:grid-cols-3">
                {TAREFAS.map((t) => (
                  <Tarefa key={t.href} {...t} />
                ))}
                <Tarefa
                  href="/producao/pacotes?status=SECO"
                  titulo="Expedir pacotes"
                  texto="Carregar caminhão"
                  Icone={Truck}
                />
              </ul>
            </section>
          )}
        </div>

        {/* Situação e últimos lançamentos */}
        <aside className="flex min-w-0 flex-col gap-5 lg:min-h-0">
          <section className="cartao shrink-0 py-3 sm:py-4">
            <h2 className="mb-1 font-semibold">Situação agora</h2>
            <dl className="divide-y divide-stone-100 text-sm">
              <div className="flex items-center justify-between gap-3 py-2">
                <dt className="text-stone-600">Boletim de hoje</dt>
                <dd>
                  {d.boletimHoje ? (
                    <Link
                      href={`/producao/boletins/${d.boletimHoje.id}`}
                      className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:underline"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Lançado
                    </Link>
                  ) : lancar ? (
                    <Link
                      href="/producao/boletins/novo"
                      className="font-semibold text-marca-700 hover:underline"
                    >
                      Apontar agora
                    </Link>
                  ) : (
                    <span className="text-stone-500">Ainda não</span>
                  )}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 py-2">
                <dt className="text-stone-600">Estufas em secagem</dt>
                <dd>
                  <Link
                    href="/producao/estufas"
                    className="font-semibold hover:underline"
                  >
                    {d.emSecagem}
                  </Link>
                </dd>
              </div>
              <div className="py-2">
                <Link href="/producao/pacotes" className="flex items-center justify-between gap-3 hover:underline">
                  <dt className="text-stone-600">Pacotes em estoque</dt>
                  <dd className="tabular-nums">
                    <b>{fmtNum((["VERDE", "EM_ESTUFA", "SECO"] as const).reduce((t, s) => t + (d.estoque[s]?.qtd ?? 0), 0))}</b>{" "}
                    <span className="text-stone-400">· {fmtM3((["VERDE", "EM_ESTUFA", "SECO"] as const).reduce((t, s) => t + (d.estoque[s]?.m3 ?? 0), 0), 1)}</span>
                  </dd>
                </Link>
                <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-stone-500">
                  {(["VERDE", "EM_ESTUFA", "SECO"] as const).map((s) => (
                    <Link key={s} href={`/producao/pacotes?status=${s}`} className="inline-flex items-center gap-1 hover:text-stone-800">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_PACOTE[s].hex }} />
                      {d.estoque[s]?.qtd ?? 0} {s === "VERDE" ? "verdes" : s === "EM_ESTUFA" ? "na estufa" : "secos"}
                    </Link>
                  ))}
                </div>
              </div>
            </dl>
          </section>

          <section className="cartao shrink-0 py-3 sm:py-4">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="font-semibold">Serrado no mês</h2>
              <span className="text-xs text-stone-500">
                {d.mes.dias} dia(s)
              </span>
            </div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">
              {fmtM3(d.mes.producaoM3, 1)}
            </div>
            <div
              className="mt-2 h-2 overflow-hidden rounded-full bg-stone-100"
              aria-hidden
            >
              <div
                className="h-full rounded-full bg-marca-600"
                style={{ width: `${progresso * 100}%` }}
              />
            </div>
            <div className="mt-1.5 flex justify-between text-xs text-stone-500">
              <span>meta {fmtM3(d.mes.metaM3, 0)}</span>
              <Link
                href="/producao/indicadores"
                className="font-semibold text-marca-700 hover:underline"
              >
                OEE {fmtPct(d.mes.oee)} · ver indicadores
              </Link>
            </div>
          </section>

          <section className="cartao flex flex-col p-0 lg:min-h-0 lg:shrink">
            <div className="shrink-0 border-b border-stone-200 px-4 py-3 sm:px-5">
              <h2 className="font-semibold">Últimos lançamentos</h2>
            </div>
            {d.recentes.length === 0 ? (
              <p className="px-4 py-5 text-sm text-stone-500 sm:px-5">
                Nada lançado ainda.
              </p>
            ) : (
              <ul className="divide-y divide-stone-100 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
                {d.recentes.map((r) => (
                  <li key={r.id} className="px-4 py-2 text-sm sm:px-5">
                    <div className="text-stone-800">{r.resumo}</div>
                    <div className="text-xs text-stone-500">
                      {r.usuario?.nome ?? "—"} ·{" "}
                      {formatarData(r.criadoEm, true)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
