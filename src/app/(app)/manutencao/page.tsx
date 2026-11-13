import type { Metadata } from "next";
import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, CalendarClock, Check, CheckCircle2, ClipboardList, OctagonAlert, TriangleAlert } from "lucide-react";
import { liberarMaquina } from "@/app/actions/paradas";
import { BotaoAcao } from "@/components/producao/BotaoAcao";
import { ConvitePush } from "@/components/AtivarPush";
import { ListaRequisicoes, selectItemRequisicao } from "@/components/ListaRequisicoes";
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
import { PERFIL, STATUS, STATUS_HEX, STATUS_PENDENTES, formatarDuracao, minutosEntre, numeroRequisicao } from "@/lib/constantes";
import { CENTRO } from "@/lib/producao";
import { db } from "@/lib/db";
import { menusDoUsuario } from "@/lib/menu";
import { exigirModulo } from "@/lib/session";
import { PERFIS_RESPONSAVEIS, pode } from "@/lib/permissoes";

export const metadata: Metadata = { title: "Início" };

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

/** Tela inicial da Manutenção: resumo, o que precisa de atenção, as tarefas do dia da função e todas as telas. */
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

  const chips: ChipResumo[] = [
    { href: "/requisicoes?status=pendentes", icone: ClipboardList, texto: <><b className="font-semibold tabular-nums">{pendentes}</b> {pendentes === 1 ? "pendente" : "pendentes"}</> },
    {
      href: "/requisicoes?status=pendentes&maquina=parada",
      icone: OctagonAlert,
      texto: <><b className="font-semibold tabular-nums">{paradas.length}</b> {paradas.length === 1 ? "máquina parada" : "máquinas paradas"}</>,
      tom: paradas.length > 0 ? "perigo" : "normal",
    },
    {
      href: "/agenda",
      icone: CalendarClock,
      texto: <><b className="font-semibold tabular-nums">{atrasadas}</b> {atrasadas === 1 ? "atrasada" : "atrasadas"} na agenda</>,
      tom: atrasadas > 0 ? "alerta" : "normal",
    },
    {
      href: "/requisicoes?status=CONCLUIDA",
      icone: CheckCircle2,
      texto: <><b className="font-semibold tabular-nums">{concluidasMes}</b> {concluidasMes === 1 ? "concluída" : "concluídas"} no mês</>,
    },
  ];

  // Acesso rápido: a tarefa do dia de cada função (operador pede; manutentor/supervisor atendem; gerente distribui)
  const nova = { href: "/requisicoes/nova", titulo: "Nova requisição", descricao: "Pedir um conserto ou serviço", icone: "nova" } as const;
  const agenda: ComponentProps<typeof CartaoAtalho> = {
    href: "/agenda",
    titulo: "Agenda",
    descricao: "Serviços marcados, dia a dia",
    icone: "agenda",
    selo: atrasadas > 0 ? plural(atrasadas, "vencida", "vencidas") : contagem.AGENDADA || undefined,
    alerta: atrasadas > 0,
  };
  const todasPendentes = {
    href: "/requisicoes?status=pendentes",
    titulo: "Todas as pendentes",
    descricao: "Todas as requisições em aberto",
    icone: "requisicoes",
    selo: pendentes || undefined,
  } as const;
  const semDonoAtalho = {
    href: "/requisicoes?status=pendentes&responsavel=nenhum",
    titulo: "Sem responsável",
    descricao: "Requisições que ninguém assumiu ainda",
    icone: "usuarios",
    selo: semDono || undefined,
    alerta: true,
  } as const;

  let principal: ComponentProps<typeof CartaoPrincipal>;
  let atalhos: ComponentProps<typeof CartaoAtalho>[];
  if (!equipe) {
    principal = {
      href: "/requisicoes/nova",
      rotulo: "Tarefa principal",
      titulo: "Nova requisição",
      descricao: "Máquina com problema? Diga qual é, o que aconteceu e, se puder, mande uma foto.",
      icone: "nova",
      acao: "Abrir requisição",
    };
    atalhos = [
      {
        href: "/requisicoes?minhas=1",
        titulo: "Minhas requisições",
        descricao: "O andamento dos pedidos que você abriu",
        icone: "requisicoes",
        selo: minhasAbertas > 0 ? plural(minhasAbertas, "pendente", "pendentes") : undefined,
      },
      agenda,
    ];
  } else if (responsavel) {
    principal = {
      href: "/requisicoes?responsavel=eu&status=pendentes",
      rotulo: "Tarefa principal",
      titulo: "Atribuídas a mim",
      descricao:
        atribuidas > 0
          ? `${plural(atribuidas, "requisição esperando", "requisições esperando")} por você.`
          : "Nenhuma requisição com você agora. Veja as que estão sem responsável.",
      icone: "perfil",
      acao: "Ver as minhas",
    };
    atalhos = [semDonoAtalho, agenda, nova, todasPendentes];
  } else {
    principal = {
      href: "/requisicoes?status=pendentes&responsavel=nenhum",
      rotulo: "Tarefa principal",
      titulo: "Sem responsável",
      descricao:
        semDono > 0
          ? `${plural(semDono, "requisição esperando", "requisições esperando")} alguém assumir.`
          : "Todas as requisições pendentes têm responsável.",
      icone: "usuarios",
      acao: "Distribuir",
    };
    atalhos = [
      todasPendentes,
      agenda,
      nova,
      ...(pode(eu.perfil, "relatorios")
        ? [{ href: "/indicadores", titulo: "Indicadores", descricao: "Números e gráficos da manutenção", icone: "indicadores" } as const]
        : []),
    ];
  }

  const nadaUrgente = paradas.length === 0 && atrasadas === 0 && urgentes.length === 0 && liberadas.length === 0;

  return (
    <>
      <FaixaPainel rotulo={`Manutenção · ${PERFIL[eu.perfil]}`} titulo={`${saudacao()}, ${eu.nome.trim().split(/\s+/)[0]}`} subtitulo={hojePorExtenso()} />

      <ResumoInicio chips={chips} />

      {/* Some quando não há convite (o componente não desenha nada) */}
      <div className="mt-6 empty:hidden [&>div]:mb-0">
        <ConvitePush />
      </div>

      <SecaoInicio titulo="O que precisa de atenção">
        {nadaUrgente ? (
          <TudoEmDia>Tudo em dia: nenhuma máquina parada nem requisição urgente.</TudoEmDia>
        ) : (
          <div className="space-y-5">
            {paradas.length > 0 && (
              <section className="cartao border-rose-300 p-0 ring-1 ring-rose-200 sm:p-0">
                <div className="flex items-center justify-between border-b border-rose-100 px-4 py-3">
                  <h3 className="flex items-center gap-2 font-semibold text-rose-800">
                    <OctagonAlert className="h-5 w-5" /> Máquinas paradas agora
                  </h3>
                  <span className="rounded-full bg-rose-600 px-2 py-0.5 text-xs font-semibold text-white">{paradas.length}</span>
                </div>
                <ul className="divide-y divide-stone-100">
                  {paradas.map((r) => (
                    <li key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
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
              </section>
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
              <div className={`grid gap-5 ${urgentes.length > 0 && liberadas.length > 0 ? "lg:grid-cols-2" : ""}`}>
                {urgentes.length > 0 && (
                  <Bloco
                    titulo="Prioridade alta e urgente"
                    icone={<TriangleAlert className="h-4 w-4 text-orange-500" />}
                    href="/requisicoes?status=pendentes&prioridade=ALTA,URGENTE"
                  >
                    <ListaRequisicoes itens={urgentes} />
                  </Bloco>
                )}
                {liberadas.length > 0 && (
                  <Bloco
                    titulo="Máquina liberada: conferir e concluir"
                    icone={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                    href="/requisicoes?status=pendentes&maquina=liberada"
                  >
                    <ListaRequisicoes itens={liberadas} />
                  </Bloco>
                )}
              </div>
            )}
          </div>
        )}
      </SecaoInicio>

      <AcessoRapido principal={principal} atalhos={atalhos} />

      {pendentes > 0 && (
        <SecaoInicio titulo="Pendentes por status" contagem={pendentes} link={{ href: "/requisicoes?status=pendentes", texto: "Ver todas" }}>
          <div className="cartao">
            <div className="flex h-2.5 overflow-hidden rounded-full bg-stone-100">
              {comPendentes.map((s) => (
                <div key={s} style={{ width: `${(contagem[s] / pendentes) * 100}%`, background: STATUS_HEX[s] }} title={STATUS[s].label} />
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
              {comPendentes.map((s) => (
                <Link key={s} href={`/requisicoes?status=${s}`} className="inline-flex items-center gap-1.5 text-sm text-stone-600 hover:text-stone-900">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_HEX[s] }} />
                  {STATUS[s].label}
                  <span className="font-semibold tabular-nums text-stone-900">{contagem[s]}</span>
                </Link>
              ))}
            </div>
          </div>
        </SecaoInicio>
      )}

      <div className="grid gap-x-6 lg:grid-cols-2">
        {semResponsavel ? (
          <SecaoInicio titulo="Sem responsável" link={{ href: "/requisicoes?status=pendentes&responsavel=nenhum", texto: "Ver todas" }}>
            <ListaRequisicoes itens={minhas} vazio="Todas as requisições pendentes têm responsável." />
          </SecaoInicio>
        ) : (
          <SecaoInicio
            titulo={equipe ? "Atribuídas a mim" : "Minhas requisições"}
            link={{ href: equipe ? "/requisicoes?responsavel=eu&status=pendentes" : "/requisicoes?minhas=1", texto: "Ver todas" }}
          >
            <ListaRequisicoes itens={minhas} vazio={equipe ? "Nenhuma requisição atribuída a você." : "Você ainda não abriu requisições."} />
          </SecaoInicio>
        )}
        <SecaoInicio titulo="Agendadas nos próximos 7 dias" link={{ href: "/agenda", texto: "Ver agenda" }}>
          <ListaRequisicoes itens={proximas} vazio="Nada agendado para os próximos dias." />
        </SecaoInicio>
      </div>

    </>
  );
}

/** Lista dentro de "O que precisa de atenção": título com ícone e "Ver todas". */
function Bloco({ titulo, icone, href, children }: { titulo: string; icone?: ReactNode; href: string; children: ReactNode }) {
  return (
    <section className="min-w-0">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="flex min-w-0 items-center gap-2 text-sm font-semibold text-stone-800">
          {icone}
          {titulo}
        </h3>
        <Link href={href} className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-marca-700 hover:underline">
          Ver todas <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      {children}
    </section>
  );
}
