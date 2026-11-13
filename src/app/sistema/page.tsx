import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { ArrowRight, ChevronRight, Flame, FlaskConical, KeyRound, Lock, OctagonAlert, Package, Wrench, type LucideIcon } from "lucide-react";
import { db } from "@/lib/db";
import { sair } from "@/app/actions/auth";
import { BotaoAjuda } from "@/components/ajuda/BotaoAjuda";
import { BotaoSair } from "@/components/BotaoSair";
import { ICONES } from "@/components/icones";
import { TopoApp } from "@/components/Navegacao";
import { FaixaPainel } from "@/components/painel";
import { MedidaRolagem } from "@/components/painel/MedidaRolagem";
import { Rodape } from "@/components/Rodape";
import { Sininho } from "@/components/Sininho";
import { BotaoTema, SCRIPT_TEMA, TemaApp } from "@/components/Tema";
import { rotuloPerfis, STATUS_PENDENTES } from "@/lib/constantes";
import { COOKIE_MODULO, menusDoUsuario, moduloSalvo, type IconeMenu } from "@/lib/menu";
import { MODULOS, MODULOS_ATIVOS, MODULOS_EM_TESTE, pode, podeProducao, temModulo, type Modulo } from "@/lib/permissoes";
import { exigirUsuario } from "@/lib/session";

export const metadata: Metadata = { title: "Início", robots: { index: false, follow: false } };

const MODULO: Record<Modulo, { icone: IconeMenu; descricao: string }> = {
  producao: {
    icone: "serraria",
    descricao:
      "Acompanha a madeira da tora ao caminhão: recebimento de toras, apontamento da serraria, paradas de máquina, estufas, pacotes com etiqueta QR, expedição com romaneio, pedidos, inventário e indicadores.",
  },
  manutencao: {
    icone: "manutencao",
    descricao:
      "Organiza a manutenção da fábrica: abrir e acompanhar requisições (com fotos e máquina parada), atendimento pela equipe, agenda, preventivas, checklists, equipamentos com QR e indicadores.",
  },
};

/** Módulo em teste (aparece "Em breve" para todos e abre só para o administrador). */
const emTeste = (m: Modulo) => !MODULOS_ATIVOS.includes(m) && MODULOS_EM_TESTE.includes(m);

/** Selo do canto do cartão de módulo: Ativo, Em teste (só o administrador) ou Em breve. */
function Selo({ modulo, liberado }: { modulo: Modulo; liberado: boolean }) {
  if (!emTeste(modulo))
    return liberado ? (
      <span className="whitespace-nowrap rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-800 ring-1 ring-emerald-200">Ativo</span>
    ) : null;
  return liberado ? (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-amber-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-800 ring-1 ring-amber-200 sm:px-2.5">
      <FlaskConical className="hidden h-3.5 w-3.5 sm:block" aria-hidden /> Em teste
    </span>
  ) : (
    <span className="whitespace-nowrap rounded-full bg-stone-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-stone-500 ring-1 ring-stone-200 sm:px-2.5">Em breve</span>
  );
}

type Numero = { href: string; Icone: LucideIcon; n: number; rotulo: string; alerta?: boolean };

/**
 * Cartão de um módulo: ícone, nome, uma linha, o resumo do momento (chips que abrem a lista) e "Acessar".
 * Sem acesso fica tracejado, com o motivo no rodapé (ex.: Em breve).
 */
function CartaoModulo({ modulo, liberado }: { modulo: Modulo; liberado: boolean }) {
  const Icone = ICONES[MODULO[modulo].icone];
  const cabeca = (
    <div className="flex items-start gap-4">
      <span
        className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${liberado ? "fundo-marca text-white shadow-md shadow-marca-900/20" : "bg-stone-100 text-stone-400"}`}
      >
        <Icone className="h-6 w-6" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h2 className={`text-lg font-semibold ${liberado ? "text-stone-900" : "text-stone-500"}`}>{MODULOS[modulo].nome}</h2>
          <Selo modulo={modulo} liberado={liberado} />
        </div>
        <p className="mt-1 text-sm leading-relaxed text-stone-600">{MODULO[modulo].descricao}</p>
      </div>
    </div>
  );
  if (!liberado)
    return (
      <div aria-disabled className="flex h-full flex-col rounded-2xl border border-dashed border-stone-300 bg-stone-50/60 p-5">
        {cabeca}
        <p className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm text-stone-500">
          <Lock className="h-4 w-4 shrink-0" aria-hidden /> {emTeste(modulo) ? "Disponível em breve" : "Sem acesso: fale com o gerente"}
        </p>
      </div>
    );
  return (
    <div className="flex h-full flex-col rounded-2xl border border-stone-200 bg-white p-5 shadow-[0_1px_2px_rgb(16_24_16/0.04)] transition hover:border-marca-300 hover:shadow-md">
      {cabeca}
      <div className="flex-1" />
      <Link
        href={MODULOS[modulo].inicio}
        className="group mt-5 flex items-center justify-between gap-2 border-t border-stone-100 pt-4 text-sm font-semibold text-marca-700"
      >
        Abrir a {MODULOS[modulo].nome}
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
      </Link>
    </div>
  );
}

/** Cartão geral da tela de início (ajuda, avisos, administração): ícone, título, uma linha e seta. */
function CartaoGeral({ href, icone, titulo, texto, selo }: { href: string; icone: IconeMenu; titulo: string; texto: string; selo?: number }) {
  const Icone = ICONES[icone];
  return (
    <Link
      href={href}
      className="group flex h-full items-center gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-[0_1px_2px_rgb(16_24_16/0.04)] transition hover:border-marca-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-500"
    >
      <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-marca-50 text-marca-700 ring-1 ring-marca-100">
        <Icone className="h-5 w-5" aria-hidden />
        {!!selo && (
          <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {selo > 99 ? "99+" : selo}
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-stone-900">{titulo}</span>
        <span className="block text-sm text-stone-500">{texto}</span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-stone-400 transition group-hover:translate-x-0.5 group-hover:text-marca-700" aria-hidden />
    </Link>
  );
}

/** Topo de quem ainda não tem nenhum módulo (o TopoApp precisa de um módulo): logo, tema, ajuda, avisos e Sair. */
function TopoSemModulo({ naoLidas, usuarioId }: { naoLidas: number; usuarioId: string }) {
  return (
    <header className="nao-imprimir sticky top-0 z-20 border-b border-stone-200 bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-2 px-4 sm:px-6 lg:h-16 lg:px-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="Artepinus" className="h-9 w-auto dark:hidden lg:h-10" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-branco.svg" alt="Artepinus" className="hidden h-9 w-auto dark:block lg:h-10" />
        <div className="ml-auto flex items-center lg:gap-1">
          <BotaoTema />
          <BotaoAjuda />
          <Sininho naoLidasInicial={naoLidas} />
          <BotaoSair sair={sair} usuarioId={usuarioId} variante="icone" />
        </div>
      </div>
    </header>
  );
}

/** Tela de início do sistema: boas-vindas, números do momento, a escolha do módulo e a administração. */
export default async function SistemaPage() {
  const eu = await exigirUsuario();
  const serraria = temModulo(eu, "producao");
  const manutencao = temModulo(eu, "manutencao");
  const [seg, naoLidas, paradas, secando, pacotes, requisicoes, urgentes] = await Promise.all([
    db.usuario.findUniqueOrThrow({ where: { id: eu.id }, select: { perguntaSeguranca: true, respostaHash: true } }),
    db.notificacao.count({ where: { usuarioId: eu.id, lida: false } }),
    serraria ? db.paradaMaquina.count({ where: { fim: null } }) : null,
    serraria ? db.cicloSecagem.count({ where: { status: "EM_SECAGEM" } }) : null,
    serraria ? db.pacote.count({ where: { status: { in: ["VERDE", "EM_ESTUFA", "SECO"] } } }) : null,
    manutencao ? db.requisicao.count({ where: { status: { in: STATUS_PENDENTES } } }) : null,
    manutencao ? db.requisicao.count({ where: { status: { in: STATUS_PENDENTES }, prioridade: { in: ["ALTA", "URGENTE"] } } }) : null,
  ]);
  const temPergunta = seg.perguntaSeguranca != null && !!seg.respostaHash;
  // "Serraria: Apontador · Manutenção: Operador" (só os módulos que a pessoa enxerga)
  const perfil = rotuloPerfis(eu);
  const primeiro = eu.nome.trim().split(/\s+/)[0];
  const menus = menusDoUsuario(eu);
  const salvo = moduloSalvo((await cookies()).get(COOKIE_MODULO)?.value);

  const plural = (n: number, um: string, varios: string) => (n === 1 ? um : varios);
  const numerosSerraria: Numero[] = [
    paradas != null && { href: "/producao/paradas", Icone: OctagonAlert, n: paradas, rotulo: plural(paradas, "máquina parada", "máquinas paradas"), alerta: paradas > 0 },
    secando != null && { href: "/producao/estufas", Icone: Flame, n: secando, rotulo: plural(secando, "estufa secando", "estufas secando") },
    pacotes != null && { href: "/producao/pacotes", Icone: Package, n: pacotes, rotulo: plural(pacotes, "pacote em estoque", "pacotes em estoque") },
  ].filter(Boolean) as Numero[];
  const numerosManutencao: Numero[] = [
    requisicoes != null && { href: "/requisicoes?status=pendentes", Icone: Wrench, n: requisicoes, rotulo: plural(requisicoes, "requisição aberta", "requisições abertas") },
    urgentes != null && {
      href: "/requisicoes?status=pendentes&prioridade=ALTA,URGENTE",
      Icone: OctagonAlert,
      n: urgentes,
      rotulo: plural(urgentes, "alta ou urgente", "altas ou urgentes"),
      alerta: urgentes > 0,
    },
  ].filter(Boolean) as Numero[];
  const numeros = [...numerosSerraria, ...numerosManutencao];

  const ordem = Object.keys(MODULOS) as Modulo[];
  const algum = ordem.some((m) => temModulo(eu, m));
  // Painel de administração: usuários, auditoria ou os cadastros da Serraria (mesma regra de /administracao)
  const adm = { usuarios: pode(eu.perfil, "usuarios"), cadastros: podeProducao(eu, "gerir"), historico: pode(eu.perfil, "auditoria") };
  const administra = adm.usuarios || adm.cadastros || adm.historico;
  const partes = [adm.usuarios && "usuários", adm.cadastros && "cadastros", adm.historico && "histórico", "dados do sistema"].filter(Boolean) as string[];
  const textoAdm = `${partes.slice(0, -1).join(", ")} e ${partes.at(-1)}`.replace(/^./, (c) => c.toUpperCase());

  // Mesma largura do topo e do conteúdo das telas do sistema (layout do app)
  const largura = "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8";
  return (
    <div className="flex min-h-dvh flex-col">
      <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      <TemaApp />
      <MedidaRolagem />
      {algum ? (
        <TopoApp
          menus={menus}
          salvo={salvo}
          usuario={{ nome: eu.nome, perfilLabel: perfil }}
          sair={sair}
          usuarioId={eu.id}
          naoLidas={naoLidas}
          mostrarModulos={false}
          semMenuLateral
        />
      ) : (
        <TopoSemModulo naoLidas={naoLidas} usuarioId={eu.id} />
      )}

      {/* overflow-x-clip: a FaixaPainel vai até as bordas sem rolagem lateral (como no layout do app) */}
      <div className="flex-1 overflow-x-clip">
        <main className={`${largura} pb-8 pt-5 lg:pt-6`}>
          <FaixaPainel
            titulo={
              <>
                Olá, {primeiro}{" "}
                <span aria-hidden>👋</span>
              </>
            }
            subtitulo={algum ? "Escolha um módulo para começar" : "Assim que o gerente liberar o seu acesso, os módulos aparecem aqui"}
          />

          {/* Resumo do momento dos módulos que a pessoa usa */}
          {numeros.length > 0 && (
            <ul className="mt-4 flex flex-wrap justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-3 shadow-[0_1px_2px_rgb(16_24_16/0.04)]">
              {numeros.map(({ href, Icone: I, n, rotulo, alerta }) => (
                <li key={href + rotulo}>
                  <Link
                    href={href}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ring-1 transition ${
                      alerta ? "bg-rose-50 text-rose-800 ring-rose-200 hover:bg-rose-100" : "bg-stone-50 text-stone-700 ring-stone-200 hover:bg-stone-100"
                    }`}
                  >
                    <I className="h-4 w-4 shrink-0" aria-hidden />
                    <b className="font-semibold tabular-nums">{n}</b> {rotulo}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {/* Os dois módulos, com o que cada um faz */}
          <section aria-label="Módulos" className="mt-4 grid gap-4 lg:grid-cols-2">
            {ordem.map((m) => (
              <CartaoModulo key={m} modulo={m} liberado={temModulo(eu, m)} />
            ))}
          </section>

          {/* Funções gerais: ajuda, avisos e administração */}
          <section aria-label="Geral" className={`mt-4 grid gap-4 sm:grid-cols-2 ${administra ? "lg:grid-cols-3" : ""}`}>
            <CartaoGeral href="/ajuda" icone="ajuda" titulo="Ajuda" texto="Manual de cada tela, dúvidas e roteiros" />
            <CartaoGeral
              href="/notificacoes"
              icone="notificacoes"
              titulo="Notificações"
              texto={naoLidas === 0 ? "Nenhum aviso novo" : naoLidas === 1 ? "1 aviso novo para você" : `${naoLidas} avisos novos para você`}
              selo={naoLidas}
            />
            {administra && <CartaoGeral href="/administracao" icone="seguranca" titulo="Administração" texto={textoAdm} />}
          </section>

          {!temPergunta && (
            <Link
              href="/perfil"
              className="group mt-4 flex items-center gap-2.5 rounded-xl bg-amber-50/70 px-4 py-2.5 text-sm text-amber-900 ring-1 ring-amber-200/70 transition hover:bg-amber-100"
            >
              <KeyRound className="h-4 w-4 shrink-0" aria-hidden />
              <span className="min-w-0">
                <b className="font-semibold">Cadastre a sua pergunta de segurança</b>
                <span className="hidden sm:inline">: assim você recupera a senha sozinho, se esquecer</span>
              </span>
              <ArrowRight className="ml-auto h-4 w-4 shrink-0 transition group-hover:translate-x-0.5" aria-hidden />
            </Link>
          )}
        </main>
      </div>

      <div className="nao-imprimir border-t border-stone-200/70">
        <Rodape className={`${largura} py-5 lg:flex lg:items-center lg:justify-between lg:gap-6 lg:text-left`} />
      </div>
    </div>
  );
}
