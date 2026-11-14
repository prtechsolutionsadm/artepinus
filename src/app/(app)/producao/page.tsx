import type { Metadata } from "next";
import Link from "next/link";
import { after } from "next/server";
import { AlertTriangle, ChevronDown, Info, Link2, type LucideIcon } from "lucide-react";
import {
  CabecalhoModulo,
  Indicadores,
  NadaPendente,
  Painel,
  hojePorExtenso,
  saudacao,
  type AcaoInicio,
  type Indicador,
} from "@/components/inicio/PecasInicio";
import { alertarEstufasAtrasadas } from "@/lib/alertas-serraria";
import { PERFIL, PERFIL_PRODUCAO, formatarData, formatarDuracao } from "@/lib/constantes";
import { dadosInicio, type Pendencia } from "@/lib/inicio-producao";
import { podeProducao } from "@/lib/permissoes";
import { fmtM3, fmtNum, fmtPct } from "@/lib/producao";
import { exigirProducao } from "@/lib/session";

export const metadata: Metadata = { title: "Início" };

const ESTILO_PENDENCIA: Record<Pendencia["tipo"], { Icone: LucideIcon; cor: string }> = {
  atraso: { Icone: AlertTriangle, cor: "text-rose-600" },
  aviso: { Icone: Info, cor: "text-amber-600" },
  rastreio: { Icone: Link2, cor: "text-sky-600" },
};

/** Pendências à vista; as outras ficam em "Ver mais". */
const VISIVEIS = 6;

const EM_ESTOQUE = ["VERDE", "EM_ESTUFA", "SECO"] as const;
const NOME_ESTOQUE: Record<(typeof EM_ESTOQUE)[number], string> = { VERDE: "verdes", EM_ESTUFA: "na estufa", SECO: "secos" };

const plural = (n: number, um: string, varios: string) => `${fmtNum(n)} ${n === 1 ? um : varios}`;

/** Uma linha de "O que precisa de atenção" (o botão só para quem lança). */
function LinhaPendencia({ p, lancar }: { p: Pendencia; lancar: boolean }) {
  const { Icone, cor } = ESTILO_PENDENCIA[p.tipo];
  return (
    <li className="flex items-center gap-3 px-4 py-2.5 sm:px-5">
      <Icone className={`h-[18px] w-[18px] shrink-0 ${cor}`} aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-stone-800 first-letter:uppercase">{p.texto}</div>
        {p.detalhe && <div className="text-xs text-stone-500">{p.detalhe}</div>}
      </div>
      {lancar && (
        <Link
          href={p.href}
          className="shrink-0 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:border-marca-300 hover:bg-marca-50 hover:text-marca-800"
        >
          {p.acao}
        </Link>
      )}
    </li>
  );
}

/** Tela inicial da Serraria (painel de números): tarefas do dia em botões, indicadores, o que precisa de atenção, estufas e últimos lançamentos. */
export default async function InicioProducaoPage() {
  const eu = await exigirProducao();
  const lancar = podeProducao(eu, "lancar");
  // Últimos lançamentos: só para quem acompanha a equipe (supervisor e gerente)
  const gerir = podeProducao(eu, "gerir");
  const d = await dadosInicio({ comRecentes: gerir });
  // A rotina agendada roda poucas vezes por dia: quem abre o Início também dispara o aviso de estufa atrasada
  after(() => alertarEstufasAtrasadas().catch((e) => console.error(e)));

  const primeiroNome = eu.nome.trim().split(/\s+/)[0];
  const funcao = eu.perfil === "ADMIN" || eu.perfil === "GERENTE" ? PERFIL[eu.perfil] : eu.perfilProducao ? PERFIL_PRODUCAO[eu.perfilProducao] : null;
  const progresso = d.mes.metaM3 > 0 ? Math.min(1, d.mes.producaoM3 / d.mes.metaM3) : 0;
  const pacotes = EM_ESTOQUE.reduce((t, s) => t + (d.estoque[s]?.qtd ?? 0), 0);
  const m3Pacotes = EM_ESTOQUE.reduce((t, s) => t + (d.estoque[s]?.m3 ?? 0), 0);

  // Tarefas do dia: quem lança aponta a serraria; quem só consulta acompanha os números
  const acoes: AcaoInicio[] = lancar
    ? [
        { href: "/producao/boletins/novo", texto: "Apontar serraria", icone: "boletins", principal: true },
        { href: "/producao/toras/nova", texto: "Receber toras", icone: "toras" },
        { href: "/producao/paradas", texto: "Marcar parada", icone: "paradas", selo: d.maquinasParadas || undefined, alerta: true },
        { href: "/producao/escanear", texto: "Ler etiqueta", icone: "escanear" },
        { href: "/producao/pacotes/novo", texto: "Formar pacotes", icone: "pacotes", selo: d.ciclosSemPacote || undefined, alerta: true },
      ]
    : [
        { href: "/producao/indicadores", texto: "Indicadores", icone: "indicadores", principal: true },
        { href: "/producao/pedidos", texto: "Pedidos", icone: "pedidos" },
        { href: "/producao/estufas", texto: "Estufas", icone: "estufas", selo: d.estufasAtrasadas || undefined, alerta: true },
        { href: "/producao/pacotes", texto: "Pacotes", icone: "pacotes" },
        { href: "/producao/escanear", texto: "Ler etiqueta", icone: "escanear" },
      ];

  const indicadores: Indicador[] = [
    {
      rotulo: "Serrado hoje",
      valor: fmtM3(d.serradoHoje.m3, 1),
      detalhe: d.serradoHoje.lotes > 0 ? plural(d.serradoHoje.lotes, "lote", "lotes") : "ainda sem apontamento",
      href: d.boletimHoje ? `/producao/boletins/${d.boletimHoje.id}` : lancar ? "/producao/boletins/novo" : "/producao/boletins",
      tom: d.serradoHoje.m3 > 0 ? "normal" : "alerta",
    },
    {
      rotulo: "Serrado no mês",
      valor: fmtM3(d.mes.producaoM3, 1),
      detalhe: d.mes.metaM3 > 0 ? `${Math.round(progresso * 100)}% da meta de ${fmtM3(d.mes.metaM3, 0)}` : "sem meta",
      barra: d.mes.metaM3 > 0 ? progresso : undefined,
      href: "/producao/indicadores",
    },
    { rotulo: "OEE do mês", valor: fmtPct(d.mes.oee), detalhe: plural(d.mes.dias, "dia com apontamento", "dias com apontamento"), href: "/producao/indicadores" },
    {
      rotulo: "Máquinas paradas",
      valor: fmtNum(d.maquinasParadas),
      detalhe: d.maquinasParadas > 0 ? "a linha está perdendo tempo" : "linha rodando",
      href: "/producao/paradas",
      tom: d.maquinasParadas > 0 ? "perigo" : "normal",
    },
    {
      rotulo: "Estufas secando",
      valor: (
        <>
          {fmtNum(d.emSecagem)}
          {d.estufas.length > 0 && <span className="text-base font-medium text-stone-400"> de {fmtNum(d.estufas.length)}</span>}
        </>
      ),
      detalhe: d.estufasAtrasadas > 0 ? plural(d.estufasAtrasadas, "atrasada", "atrasadas") : "nenhuma atrasada",
      href: "/producao/estufas",
      tom: d.estufasAtrasadas > 0 ? "perigo" : "normal",
    },
    {
      rotulo: "Estoque",
      valor: (
        <>
          {fmtNum(pacotes)}
          <span className="text-base font-medium text-stone-400"> {pacotes === 1 ? "pacote" : "pacotes"}</span>
        </>
      ),
      detalhe: `${fmtM3(m3Pacotes, 1)} · ${EM_ESTOQUE.map((st) => `${fmtNum(d.estoque[st]?.qtd ?? 0)} ${NOME_ESTOQUE[st]}`).join(", ")}`,
      href: "/producao/pacotes",
    },
  ];

  const visiveis = d.pendencias.slice(0, VISIVEIS);
  const demais = d.pendencias.slice(VISIVEIS);

  return (
    <>
      <CabecalhoModulo
        titulo={`${saudacao()}, ${primeiroNome}`}
        subtitulo={funcao ? `Serraria · ${funcao}` : "Serraria"}
        data={hojePorExtenso()}
        acoes={acoes}
      />

      <Indicadores itens={indicadores} />

      <div className="mt-5 grid items-start gap-5 xl:grid-cols-5">
        <Painel titulo="O que precisa de atenção" contagem={d.pendencias.length} className="xl:col-span-3">
          {d.pendencias.length === 0 ? (
            <NadaPendente>Tudo em dia. Nenhuma pendência.</NadaPendente>
          ) : (
            <>
              <ul className="divide-y divide-stone-100">
                {visiveis.map((p, i) => (
                  <LinhaPendencia key={i} p={p} lancar={lancar} />
                ))}
              </ul>
              {demais.length > 0 && (
                <details className="group border-t border-stone-100">
                  <summary className="flex cursor-pointer list-none items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-marca-700 hover:bg-stone-50 [&::-webkit-details-marker]:hidden">
                    <span className="group-open:hidden">Ver mais {plural(demais.length, "pendência", "pendências")}</span>
                    <span className="hidden group-open:inline">Mostrar menos</span>
                    <ChevronDown className="h-4 w-4 transition group-open:rotate-180" aria-hidden />
                  </summary>
                  <ul className="divide-y divide-stone-100 border-t border-stone-100">
                    {demais.map((p, i) => (
                      <LinhaPendencia key={i} p={p} lancar={lancar} />
                    ))}
                  </ul>
                </details>
              )}
            </>
          )}
        </Painel>

        {/* Estufas agora: livre (cinza), secando (laranja, com a barra até a previsão) ou atrasada (vermelho) */}
        {d.estufas.length > 0 && (
          <Painel titulo="Estufas agora" link={{ href: "/producao/estufas", texto: "Ver estufas" }} className="xl:col-span-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                  <th className="px-4 py-2 font-semibold sm:pl-5">Estufa</th>
                  <th className="px-2 py-2 font-semibold">Situação</th>
                  <th className="px-2 py-2 text-right font-semibold">Tempo</th>
                  <th className="px-4 py-2 text-right font-semibold sm:pr-5">m³</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {d.estufas.map((e) => {
                  const href = e.ciclo ? `/producao/estufas/ciclos/${e.ciclo.id}` : lancar ? `/producao/estufas/ciclos/novo?estufa=${e.id}` : "/producao/estufas";
                  const cor = !e.ciclo ? "bg-stone-300" : e.ciclo.atrasado ? "bg-rose-500" : "bg-[#eb6834]";
                  return (
                    <tr key={e.id} className="relative transition hover:bg-stone-50">
                      <td className="px-4 py-2.5 font-medium text-stone-800 sm:pl-5">
                        {/* A linha toda abre a estufa */}
                        <Link href={href} className="after:absolute after:inset-0">
                          {e.nome}
                        </Link>
                      </td>
                      <td className="px-2 py-2.5">
                        <span className="flex items-center gap-2">
                          <span className={`h-2 w-2 shrink-0 rounded-full ${cor}`} aria-hidden />
                          {e.ciclo ? (
                            <span className="flex min-w-0 flex-1 items-center gap-2">
                              <span className={e.ciclo.atrasado ? "font-medium text-rose-700" : "text-stone-700"}>{e.ciclo.atrasado ? "Atrasada" : "Secando"}</span>
                              <span className="hidden h-1 max-w-20 flex-1 overflow-hidden rounded-full bg-stone-100 sm:block" aria-hidden>
                                <span
                                  className={`block h-full rounded-full ${e.ciclo.atrasado ? "bg-rose-500" : "bg-[#eb6834]"}`}
                                  style={{ width: `${(e.ciclo.progresso ?? 0) * 100}%` }}
                                />
                              </span>
                            </span>
                          ) : (
                            <span className="text-stone-400">{lancar ? "Livre · iniciar" : "Livre"}</span>
                          )}
                        </span>
                      </td>
                      <td className="px-2 py-2.5 text-right tabular-nums text-stone-600">{e.ciclo ? formatarDuracao(e.ciclo.horas * 60) : "—"}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-stone-600 sm:pr-5">{e.ciclo ? fmtNum(e.ciclo.m3, 1) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Painel>
        )}
      </div>

      {gerir && (
        <Painel titulo="Últimos lançamentos" className="mt-5">
          {d.recentes.length === 0 ? (
            <p className="px-4 py-4 text-sm text-stone-500 sm:px-5">Nada lançado ainda.</p>
          ) : (
            <ul className="max-h-[19.5rem] divide-y divide-stone-100 overflow-y-auto">
              {d.recentes.map((r) => (
                <li key={r.id} className="gap-4 px-4 py-2.5 text-sm sm:flex sm:items-baseline sm:justify-between sm:px-5">
                  <div className="min-w-0 text-stone-800">{r.resumo}</div>
                  <div className="shrink-0 text-xs text-stone-500 sm:text-right">
                    {r.usuario?.nome ?? "—"} · {formatarData(r.criadoEm, true)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Painel>
      )}
    </>
  );
}
