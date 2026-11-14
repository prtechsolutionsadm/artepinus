import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarClock, Check, CheckCircle2, OctagonAlert, TriangleAlert } from "lucide-react";
import { liberarMaquina } from "@/app/actions/paradas";
import { BotaoAcao } from "@/components/producao/BotaoAcao";
import { ConvitePush } from "@/components/AtivarPush";
import { ListaRequisicoes, selectItemRequisicao } from "@/components/ListaRequisicoes";
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
import { PERFIL, STATUS, STATUS_HEX, STATUS_PENDENTES, formatarDuracao, minutosEntre, numeroRequisicao } from "@/lib/constantes";
import { CENTRO } from "@/lib/producao";
import { db } from "@/lib/db";
import { exigirModulo } from "@/lib/session";
import { PERFIS_RESPONSAVEIS, pode } from "@/lib/permissoes";

export const metadata: Metadata = { title: "Início" };

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

/** Tela inicial da Manutenção (painel de números): tarefas do dia em botões, indicadores, o que precisa de atenção e as listas da função. */
export default async function InicioPage() {
  const eu = await exigirModulo("manutencao");
  const equipe = pode(eu.perfil, "atenderRequisicoes");
  // Só supervisor e manutentor podem ser responsáveis; gerente/admin veem as que estão sem responsável
  const responsavel = PERFIS_RESPONSAVEIS.includes(eu.perfil);
  const semResponsavel = equipe && !responsavel;
  const agora = new Date();
  const em7dias = new Date(agora.getTime() + 7 * 24 * 60 * 60 * 1000);
  const hojeBR = new Date(agora.getTime() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const inicioMes = new Date(`${hojeBR.slice(0, 8)}01T00:00:00-03:00`);
  const inicioHoje = new Date(`${hojeBR}T00:00:00-03:00`);
  const pendentesDe = (where: object) => db.requisicao.count({ where: { ...where, status: { in: STATUS_PENDENTES } } });

  const [porStatus, urgentes, minhas, proximas, concluidasMes, paradas, liberadas, atrasadas, atribuidas, semDono, minhasAbertas] = await Promise.all([
    db.requisicao.groupBy({ by: ["status"], _count: { _all: true } }),
    db.requisicao.findMany({
      where: { status: { in: STATUS_PENDENTES }, prioridade: { in: ["URGENTE", "ALTA"] } },
      select: selectItemRequisicao,
      orderBy: [{ prioridade: "desc" }, { criadoEm: "asc" }],
      take: 5,
    }),
    db.requisicao.findMany({
      where: semResponsavel
        ? { responsavelId: null, status: { in: STATUS_PENDENTES } }
        : equipe
          ? { responsavelId: eu.id, status: { in: STATUS_PENDENTES } }
          : { solicitanteId: eu.id },
      select: selectItemRequisicao,
      orderBy: semResponsavel ? [{ prioridade: "desc" }, { criadoEm: "asc" }] : { atualizadoEm: "desc" },
      take: 5,
    }),
    db.requisicao.findMany({
      where: { status: "AGENDADA", dataAgendada: { gte: agora, lte: em7dias } },
      select: selectItemRequisicao,
      orderBy: { dataAgendada: "asc" },
      take: 5,
    }),
    db.requisicao.count({ where: { status: "CONCLUIDA", dataConclusao: { gte: inicioMes } } }),
    // Máquinas paradas agora (da serraria ou não): o que mais custa enquanto espera
    db.requisicao.findMany({
      where: { maquinaParada: true, paradaFim: null, status: { notIn: ["CONCLUIDA", "CANCELADA"] } },
      select: {
        id: true,
        titulo: true,
        paradaInicio: true,
        responsavel: { select: { nome: true } },
        equipamento: { select: { nome: true, codigo: true } },
        paradaMaquina: { select: { id: true, centro: true } },
      },
      orderBy: { paradaInicio: "asc" },
    }),
    // A máquina já voltou a operar (liberada na serraria ou aqui), mas a requisição segue pendente:
    // a equipe confere o serviço e conclui
    equipe
      ? db.requisicao.findMany({
          where: { maquinaParada: true, paradaFim: { not: null }, status: { in: STATUS_PENDENTES } },
          select: selectItemRequisicao,
          orderBy: { paradaFim: "asc" },
          take: 5,
        })
      : Promise.resolve([]),
    // Agendadas com a data vencida (as mesmas do alto da Agenda)
    db.requisicao.count({ where: { status: "AGENDADA", dataAgendada: { lt: inicioHoje } } }),
    // Números dos cartões de acesso rápido
    responsavel ? pendentesDe({ responsavelId: eu.id }) : Promise.resolve(0),
    equipe ? pendentesDe({ responsavelId: null }) : Promise.resolve(0),
    equipe ? Promise.resolve(0) : pendentesDe({ solicitanteId: eu.id }),
  ]);

  const contagem = Object.fromEntries(porStatus.map((s) => [s.status, s._count._all])) as Record<string, number>;
  const pendentes = STATUS_PENDENTES.reduce((t, s) => t + (contagem[s] ?? 0), 0);
  const comPendentes = STATUS_PENDENTES.filter((s) => contagem[s]);

  // Tarefas do dia de cada função (operador pede; manutentor/supervisor atendem; gerente distribui)
  const nova: AcaoInicio = { href: "/requisicoes/nova", texto: "Nova requisição", icone: "nova" };
  const agenda: AcaoInicio = { href: "/agenda", texto: "Agenda", icone: "agenda", selo: atrasadas || undefined, alerta: atrasadas > 0 };
  const semDonoAcao: AcaoInicio = { href: "/requisicoes?status=pendentes&responsavel=nenhum", texto: "Sem responsável", icone: "usuarios", selo: semDono || undefined, alerta: true };
  const acoes: AcaoInicio[] = !equipe
    ? [{ ...nova, principal: true }, { href: "/requisicoes?minhas=1", texto: "Minhas requisições", icone: "requisicoes", selo: minhasAbertas || undefined }, agenda]
    : responsavel
      ? [{ href: "/requisicoes?responsavel=eu&status=pendentes", texto: "Atribuídas a mim", icone: "perfil", principal: true, selo: atribuidas || undefined }, semDonoAcao, agenda, nova]
      : [
          { ...semDonoAcao, principal: true },
          { href: "/requisicoes?status=pendentes", texto: "Pendentes", icone: "requisicoes", selo: pendentes || undefined },
          agenda,
          nova,
          ...(pode(eu.perfil, "relatorios") ? [{ href: "/indicadores", texto: "Indicadores", icone: "indicadores" } as const] : []),
        ];

  const indicadores: Indicador[] = [
    { rotulo: "Pendentes", valor: pendentes, detalhe: comPendentes.map((st) => `${contagem[st]} ${STATUS[st].label.toLowerCase()}`).join(", ") || "nenhuma em aberto", href: "/requisicoes?status=pendentes" },
    {
      rotulo: "Máquinas paradas",
      valor: paradas.length,
      detalhe: paradas.length > 0 ? "esperando a manutenção" : "nenhuma parada",
      href: "/requisicoes?status=pendentes&maquina=parada",
      tom: paradas.length > 0 ? "perigo" : "normal",
    },
    {
      rotulo: "Alta e urgente",
      valor: urgentes.length,
      detalhe: urgentes.length > 0 ? "pedem atenção primeiro" : "nenhuma",
      href: "/requisicoes?status=pendentes&prioridade=ALTA,URGENTE",
      tom: urgentes.length > 0 ? "alerta" : "normal",
    },
    {
      rotulo: "Atrasadas na agenda",
      valor: atrasadas,
      detalhe: atrasadas > 0 ? "com a data vencida" : "agenda em dia",
      href: "/agenda",
      tom: atrasadas > 0 ? "alerta" : "normal",
    },
    { rotulo: "Concluídas no mês", valor: concluidasMes, detalhe: "requisições fechadas", href: "/requisicoes?status=CONCLUIDA" },
  ];

  const nadaUrgente = paradas.length === 0 && atrasadas === 0 && urgentes.length === 0 && liberadas.length === 0;

  return (
    <>
      <CabecalhoModulo
        titulo={`${saudacao()}, ${eu.nome.trim().split(/\s+/)[0]}`}
        subtitulo={`Manutenção · ${PERFIL[eu.perfil]}`}
        data={hojePorExtenso()}
        acoes={acoes}
      />

      <Indicadores itens={indicadores} />

      {/* Barra das pendentes por status, logo abaixo dos números */}
      {pendentes > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 px-1">
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-stone-200 sm:w-48">
            {comPendentes.map((st) => (
              <div key={st} style={{ width: `${(contagem[st] / pendentes) * 100}%`, background: STATUS_HEX[st] }} title={STATUS[st].label} />
            ))}
          </div>
          {comPendentes.map((st) => (
            <Link key={st} href={`/requisicoes?status=${st}`} className="inline-flex items-center gap-1.5 text-xs text-stone-600 hover:text-stone-900">
              <span className="h-2 w-2 rounded-full" style={{ background: STATUS_HEX[st] }} />
              {STATUS[st].label}
              <span className="font-semibold tabular-nums text-stone-900">{contagem[st]}</span>
            </Link>
          ))}
        </div>
      )}

      {/* Some quando não há convite (o componente não desenha nada) */}
      <div className="mt-5 empty:hidden [&>div]:mb-0">
        <ConvitePush />
      </div>

      <div className="mt-5 space-y-5">
        {nadaUrgente ? (
          <Painel titulo="O que precisa de atenção">
            <NadaPendente>Tudo em dia: nenhuma máquina parada nem requisição urgente.</NadaPendente>
          </Painel>
        ) : (
          <>
            {paradas.length > 0 && (
              <Painel titulo={<span className="text-rose-800">Máquinas paradas agora</span>} icone={<OctagonAlert className="h-4 w-4 text-rose-600" />} contagem={paradas.length} className="border-rose-300 ring-1 ring-rose-200">
                <ul className="divide-y divide-stone-100">
                  {paradas.map((r) => (
                    <li key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 sm:px-5">
                      <Link href={`/requisicoes/${r.id}`} className="min-w-0 flex-1 hover:underline">
                        <div className="font-medium">{r.equipamento ? `${r.equipamento.codigo} · ${r.equipamento.nome}` : r.titulo}</div>
                        <div className="text-sm text-stone-500">
                          {numeroRequisicao(r.id)} · parada há <b className="text-rose-700">{formatarDuracao(minutosEntre(r.paradaInicio))}</b>
                          {r.paradaMaquina && ` · serraria (${CENTRO[r.paradaMaquina.centro].label.toLowerCase()})`}
                          {` · ${r.responsavel ? r.responsavel.nome : "sem responsável"}`}
                        </div>
                      </Link>
                      {equipe && r.paradaMaquina && (
                        <BotaoAcao
                          acao={liberarMaquina}
                          arg={r.paradaMaquina.id}
                          confirmar="A máquina voltou a operar? O tempo parado vai para o boletim da serraria."
                          className="btn-primario shrink-0 px-3 py-1.5 text-sm"
                        >
                          <Check className="h-4 w-4" /> Máquina liberada
                        </BotaoAcao>
                      )}
                    </li>
                  ))}
                </ul>
              </Painel>
            )}

            {atrasadas > 0 && (
              <Link
                href="/agenda"
                className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 transition hover:border-amber-300"
              >
                <CalendarClock className="h-5 w-5 shrink-0 text-amber-600" aria-hidden />
                <span className="min-w-0 flex-1">
                  <b className="font-semibold">{plural(atrasadas, "serviço agendado", "serviços agendados")}</b> com a data vencida
                </span>
                <span className="inline-flex shrink-0 items-center gap-1 font-semibold">
                  Ver agenda <ArrowRight className="h-4 w-4" aria-hidden />
                </span>
              </Link>
            )}

            {(urgentes.length > 0 || liberadas.length > 0) && (
              <div className={`grid items-start gap-5 ${urgentes.length > 0 && liberadas.length > 0 ? "xl:grid-cols-2" : ""}`}>
                {urgentes.length > 0 && (
                  <Painel
                    titulo="Prioridade alta e urgente"
                    icone={<TriangleAlert className="h-4 w-4 text-orange-500" />}
                    link={{ href: "/requisicoes?status=pendentes&prioridade=ALTA,URGENTE", texto: "Ver todas" }}
                  >
                    <ListaRequisicoes itens={urgentes} embutida />
                  </Painel>
                )}
                {liberadas.length > 0 && (
                  <Painel
                    titulo="Máquina liberada: conferir e concluir"
                    icone={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                    link={{ href: "/requisicoes?status=pendentes&maquina=liberada", texto: "Ver todas" }}
                  >
                    <ListaRequisicoes itens={liberadas} embutida />
                  </Painel>
                )}
              </div>
            )}
          </>
        )}

        <div className="grid items-start gap-5 xl:grid-cols-2">
          {semResponsavel ? (
            <Painel titulo="Sem responsável" link={{ href: "/requisicoes?status=pendentes&responsavel=nenhum", texto: "Ver todas" }}>
              <ListaRequisicoes itens={minhas} embutida vazio="Todas as requisições pendentes têm responsável." />
            </Painel>
          ) : (
            <Painel
              titulo={equipe ? "Atribuídas a mim" : "Minhas requisições"}
              link={{ href: equipe ? "/requisicoes?responsavel=eu&status=pendentes" : "/requisicoes?minhas=1", texto: "Ver todas" }}
            >
              <ListaRequisicoes itens={minhas} embutida vazio={equipe ? "Nenhuma requisição atribuída a você." : "Você ainda não abriu requisições."} />
            </Painel>
          )}
          <Painel titulo="Agendadas nos próximos 7 dias" link={{ href: "/agenda", texto: "Ver agenda" }}>
            <ListaRequisicoes itens={proximas} embutida vazio="Nada agendado para os próximos dias." />
          </Painel>
        </div>
      </div>
    </>
  );
}

