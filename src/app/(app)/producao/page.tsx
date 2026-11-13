import type { Metadata } from "next";
import type { ComponentProps } from "react";
import Link from "next/link";
import { after } from "next/server";
import { AlertTriangle, ArrowRight, ChevronDown, ClipboardPen, Flame, Info, Link2, OctagonAlert, Package, type LucideIcon } from "lucide-react";
import {
  AcessoRapido,
  ResumoInicio,
  SecaoInicio,
  TodasAsTelasInicio,
  TudoEmDia,
  hojePorExtenso,
  saudacao,
  type ChipResumo,
} from "@/components/inicio/PecasInicio";
import { FaixaPainel } from "@/components/painel/FaixaPainel";
import type { CartaoAtalho } from "@/components/painel/CartaoAtalho";
import type { CartaoPrincipal } from "@/components/painel/CartaoPrincipal";
import { alertarEstufasAtrasadas } from "@/lib/alertas-serraria";
import { PERFIL, PERFIL_PRODUCAO, formatarData, formatarDuracao } from "@/lib/constantes";
import { dadosInicio, type Pendencia } from "@/lib/inicio-producao";
import { menusDoUsuario } from "@/lib/menu";
import { podeProducao } from "@/lib/permissoes";
import { fmtM3, fmtNum, fmtPct } from "@/lib/producao";
import { STATUS_PACOTE } from "@/lib/rastreio";
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

/** Tela inicial da Serraria: resumo de hoje, o que precisa de atenção, as tarefas do dia e todas as telas. */
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

  // Resumo sobre a faixa: hoje, estufas e estoque (máquina parada só quando há)
  const chips: ChipResumo[] = [
    d.serradoHoje.m3 > 0
      ? {
          href: d.boletimHoje ? `/producao/boletins/${d.boletimHoje.id}` : "/producao/boletins",
          icone: ClipboardPen,
          texto: (
            <>
              Hoje: <b className="font-semibold tabular-nums">{fmtM3(d.serradoHoje.m3, 1)}</b> serrados
            </>
          ),
        }
      : {
          href: lancar ? "/producao/boletins/novo" : "/producao/boletins",
          icone: ClipboardPen,
          texto: "Hoje: ainda sem apontamento",
        },
    ...(d.maquinasParadas > 0
      ? [
          {
            href: "/producao/paradas",
            icone: OctagonAlert,
            texto: <b className="font-semibold">{plural(d.maquinasParadas, "máquina parada", "máquinas paradas")}</b>,
            tom: "perigo" as const,
          },
        ]
      : []),
    {
      href: "/producao/estufas",
      icone: Flame,
      texto: (
        <>
          <b className="font-semibold tabular-nums">{fmtNum(d.emSecagem)}</b>
          {d.estufas.length > 0 && ` de ${fmtNum(d.estufas.length)}`} {d.estufas.length === 1 ? "estufa secando" : "estufas secando"}
        </>
      ),
      tom: d.estufasAtrasadas > 0 ? "perigo" : "normal",
    },
    {
      href: "/producao/pacotes",
      icone: Package,
      texto: (
        <>
          <b className="font-semibold tabular-nums">{fmtNum(pacotes)}</b> {pacotes === 1 ? "pacote" : "pacotes"} em estoque
          <span className="text-stone-500"> · {fmtM3(m3Pacotes, 1)}</span>
        </>
      ),
    },
  ];

  // Acesso rápido: a tarefa principal de quem lança é apontar a serraria; quem só consulta acompanha os números
  const principal: ComponentProps<typeof CartaoPrincipal> = lancar
    ? {
        href: "/producao/boletins/novo",
        rotulo: "Tarefa principal",
        titulo: "Apontar serraria",
        descricao:
          d.serradoHoje.lotes > 0
            ? `Hoje já são ${plural(d.serradoHoje.lotes, "lote", "lotes")} (${fmtM3(d.serradoHoje.m3, 1)}). Escolha o pedido, preencha a ficha e gere a etiqueta do próximo.`
            : "Escolha o pedido, preencha a ficha e gere a etiqueta do lote.",
        icone: "boletins",
        acao: "Apontar",
      }
    : {
        href: "/producao/indicadores",
        rotulo: "Para acompanhar",
        titulo: "Indicadores",
        descricao: "Volume serrado, metas e gráficos do mês.",
        icone: "indicadores",
        acao: "Ver indicadores",
      };
  const lerEtiqueta = { href: "/producao/escanear", titulo: "Ler etiqueta", descricao: "Abrir um pacote ou lote pelo QR", icone: "escanear" } as const;
  const atalhos: ComponentProps<typeof CartaoAtalho>[] = lancar
    ? [
        { href: "/producao/toras/nova", titulo: "Receber toras", descricao: "Registrar a carga que chegou ao pátio", icone: "toras" },
        {
          href: "/producao/paradas",
          titulo: "Marcar parada",
          descricao: "Máquina parou? Marque na hora e avise a manutenção",
          icone: "paradas",
          selo: d.maquinasParadas > 0 ? plural(d.maquinasParadas, "parada", "paradas") : undefined,
          alerta: true,
        },
        lerEtiqueta,
        {
          href: "/producao/pacotes/novo",
          titulo: "Formar pacotes",
          // Madeira de estufa esperando virar pacote: o número no selo, o que é na descrição
          descricao:
            d.ciclosSemPacote > 0
              ? `${plural(d.ciclosSemPacote, "ciclo de estufa terminou", "ciclos de estufa terminaram")} sem pacote`
              : "Montar o pacote e imprimir a etiqueta QR",
          icone: "pacotes",
          selo: d.ciclosSemPacote > 0 ? d.ciclosSemPacote : undefined,
          alerta: true,
        },
      ]
    : [
        { href: "/producao/pedidos", titulo: "Pedidos", descricao: "Pedidos dos clientes e quanto falta de cada um", icone: "pedidos" },
        {
          href: "/producao/estufas",
          titulo: "Estufas",
          descricao: "Secagem da madeira em cada estufa",
          icone: "estufas",
          selo: d.estufasAtrasadas > 0 ? plural(d.estufasAtrasadas, "atrasada", "atrasadas") : undefined,
          alerta: true,
        },
        { href: "/producao/pacotes", titulo: "Pacotes", descricao: "Pacotes em estoque e expedidos", icone: "pacotes" },
        lerEtiqueta,
      ];

  const visiveis = d.pendencias.slice(0, VISIVEIS);
  const demais = d.pendencias.slice(VISIVEIS);

  return (
    <>
      <FaixaPainel rotulo={funcao ? `Serraria · ${funcao}` : "Serraria"} titulo={`${saudacao()}, ${primeiroNome}`} subtitulo={hojePorExtenso()} />

      <ResumoInicio
        chips={chips}
        rodape={
          pacotes > 0 &&
          EM_ESTOQUE.map((s) => (
            <Link key={s} href={`/producao/pacotes?status=${s}`} className="inline-flex items-center gap-1.5 hover:text-stone-800">
              <span className="h-2 w-2 rounded-full" style={{ background: STATUS_PACOTE[s].hex }} aria-hidden />
              <span>
                <span className="tabular-nums">{fmtNum(d.estoque[s]?.qtd ?? 0)}</span> {NOME_ESTOQUE[s]}
              </span>
            </Link>
          ))
        }
      />

      <SecaoInicio titulo="O que precisa de atenção" contagem={d.pendencias.length}>
        {d.pendencias.length === 0 ? (
          <TudoEmDia />
        ) : (
          <div className="cartao overflow-hidden p-0 sm:p-0">
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
          </div>
        )}
      </SecaoInicio>

      <AcessoRapido principal={principal} atalhos={atalhos} />

      <div className={d.estufas.length > 0 ? "grid gap-x-5 lg:grid-cols-3" : ""}>
        {/* Estufas agora: livre (cinza), secando (laranja, com a barra até a previsão) ou atrasada (vermelho) */}
        {d.estufas.length > 0 && (
          <SecaoInicio titulo="Estufas agora" link={{ href: "/producao/estufas", texto: "Ver estufas" }} className="lg:col-span-2">
            <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {d.estufas.map((e) => (
                <li key={e.id}>
                  <Link
                    href={e.ciclo ? `/producao/estufas/ciclos/${e.ciclo.id}` : lancar ? `/producao/estufas/ciclos/novo?estufa=${e.id}` : "/producao/estufas"}
                    className="block h-full rounded-xl border border-stone-200 bg-white px-3.5 py-3 transition hover:border-marca-300 hover:shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-stone-800">{e.nome}</span>
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${!e.ciclo ? "bg-stone-300" : e.ciclo.atrasado ? "bg-rose-500" : "bg-[#eb6834]"}`}
                        aria-hidden
                      />
                    </div>
                    {e.ciclo ? (
                      <>
                        <div className={`mt-0.5 text-xs tabular-nums ${e.ciclo.atrasado ? "font-medium text-rose-700" : "text-stone-500"}`}>
                          {e.ciclo.atrasado ? "Atrasada · " : ""}
                          {formatarDuracao(e.ciclo.horas * 60)} · {fmtM3(e.ciclo.m3, 1)}
                        </div>
                        <div className="mt-2 h-1 overflow-hidden rounded-full bg-stone-100">
                          <div
                            className={`h-full rounded-full ${e.ciclo.atrasado ? "bg-rose-500" : "bg-[#eb6834]"}`}
                            style={{ width: `${(e.ciclo.progresso ?? 0) * 100}%` }}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="mt-0.5 text-xs text-stone-400">{lancar ? "Livre · iniciar ciclo" : "Livre"}</div>
                        <div className="mt-2 h-1 rounded-full bg-stone-100" />
                      </>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </SecaoInicio>
        )}

        <SecaoInicio titulo="Serrado no mês">
          <Link
            href="/producao/indicadores"
            className="group flex flex-1 flex-col rounded-2xl border border-stone-200 bg-white p-4 shadow-[0_1px_2px_rgb(16_24_16/0.04)] transition hover:border-marca-300 hover:shadow-md sm:p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-2xl font-semibold tabular-nums tracking-tight text-stone-900 sm:text-3xl">{fmtM3(d.mes.producaoM3, 1)}</div>
                <div className="mt-0.5 text-xs text-stone-500">{plural(d.mes.dias, "dia com apontamento", "dias com apontamento")}</div>
              </div>
              <span className="shrink-0 rounded-full bg-marca-50 px-2 py-0.5 text-xs font-semibold text-marca-800 ring-1 ring-marca-100">
                {d.mes.metaM3 > 0 ? `${Math.round(progresso * 100)}% da meta` : "sem meta"}
              </span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-stone-100" aria-hidden>
              <div className="h-full rounded-full bg-marca-600" style={{ width: `${progresso * 100}%` }} />
            </div>
            <div className="mt-auto flex items-center justify-between gap-2 pt-3 text-sm text-stone-600">
              <span>
                Meta {fmtM3(d.mes.metaM3, 0)} · OEE {fmtPct(d.mes.oee)}
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-stone-400 transition group-hover:translate-x-0.5 group-hover:text-marca-700" aria-hidden />
            </div>
          </Link>
        </SecaoInicio>
      </div>

      {gerir && (
        <SecaoInicio titulo="Últimos lançamentos">
          {d.recentes.length === 0 ? (
            <p className="cartao text-sm text-stone-500">Nada lançado ainda.</p>
          ) : (
            <ul className="max-h-[19.5rem] divide-y divide-stone-100 overflow-y-auto rounded-2xl border border-stone-200 bg-white shadow-[0_1px_2px_rgb(16_24_16/0.04)]">
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
        </SecaoInicio>
      )}

      <TodasAsTelasInicio grupos={menusDoUsuario(eu).producao} />
    </>
  );
}
