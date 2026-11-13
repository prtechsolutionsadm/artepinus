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
import { CartaoAtalho, CartaoPrincipal, FaixaPainel, GrupoAtalhos, SobreFaixa } from "@/components/painel";
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
  producao: { icone: "serraria", descricao: "Toras, serraria, estufas, pacotes, romaneios e indicadores" },
  manutencao: { icone: "manutencao", descricao: "Requisições, preventivas, checklists e equipamentos" },
};

/** Escudo do painel de administração (o mesmo ícone de "seguranca" dos cartões). */
const IconeAdmin = ICONES.seguranca;

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

/**
 * Cartão menor do Acesso rápido (outro módulo, manual, perfil, avisos): ícone, selo, título, uma linha
 * e o rodapé "Acessar →". Sem `href`, fica tracejado e mostra `bloqueado` no rodapé (ex.: Em breve).
 * `forte`: ícone verde cheio (outro módulo), como no cartão principal.
 */
function CartaoRapido({
  href,
  icone,
  titulo,
  texto,
  selo,
  bloqueado,
  forte = false,
}: {
  href?: string;
  icone: IconeMenu;
  titulo: string;
  texto: string;
  selo?: React.ReactNode;
  bloqueado?: string;
  forte?: boolean;
}) {
  const Icone = ICONES[icone];
  const corpo = (
    <>
      <span className="flex items-start justify-between gap-2">
        <span
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl sm:h-11 sm:w-11 ${
            !href ? "bg-stone-100 text-stone-400" : forte ? "fundo-marca text-white shadow-md shadow-marca-900/20" : "bg-marca-50 text-marca-700 ring-1 ring-marca-100"
          }`}
        >
          <Icone className="h-5 w-5" aria-hidden />
        </span>
        {selo}
      </span>
      <span className="mt-4 block flex-1">
        <span className={`block font-semibold leading-snug sm:text-lg ${href ? "text-stone-900" : "text-stone-500"}`}>{titulo}</span>
        <span className="mt-0.5 block text-[13px] leading-snug text-stone-500 sm:text-sm">{texto}</span>
      </span>
      {/* Rodapé sempre embaixo, na mesma altura nos cartões lado a lado; no celular o cartão todo é o botão
          (sem acesso, o selo "Em breve" já diz) */}
      <span className="mt-4 hidden items-center justify-between gap-2 border-t border-stone-100 pt-4 text-sm sm:flex">
        {href ? (
          <>
            <span className="text-stone-500">Abrir</span>
            <span className="ml-auto inline-flex items-center gap-1 font-semibold text-marca-700">
              Acessar <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
            </span>
          </>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-stone-500">
            <Lock className="h-4 w-4 shrink-0" aria-hidden /> {bloqueado}
          </span>
        )}
      </span>
    </>
  );
  const base = "flex h-full flex-col rounded-2xl p-4 sm:p-5";
  return href ? (
    <Link
      href={href}
      className={`group ${base} border border-stone-200 bg-white shadow-[0_1px_2px_rgb(16_24_16/0.04)] transition hover:border-marca-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-500`}
    >
      {corpo}
    </Link>
  ) : (
    <div aria-disabled className={`${base} border border-dashed border-stone-300 bg-stone-50/60`}>
      {corpo}
    </div>
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
  const [seg, naoLidas, paradas, secando, pacotes, requisicoes] = await Promise.all([
    db.usuario.findUniqueOrThrow({ where: { id: eu.id }, select: { perguntaSeguranca: true, respostaHash: true } }),
    db.notificacao.count({ where: { usuarioId: eu.id, lida: false } }),
    serraria ? db.paradaMaquina.count({ where: { fim: null } }) : null,
    serraria ? db.cicloSecagem.count({ where: { status: "EM_SECAGEM" } }) : null,
    serraria ? db.pacote.count({ where: { status: { in: ["VERDE", "EM_ESTUFA", "SECO"] } } }) : null,
    manutencao ? db.requisicao.count({ where: { status: { in: STATUS_PENDENTES } } }) : null,
  ]);
  const temPergunta = seg.perguntaSeguranca != null && !!seg.respostaHash;
  // "Serraria: Apontador · Manutenção: Operador" (só os módulos que a pessoa enxerga)
  const perfil = rotuloPerfis(eu);
  const primeiro = eu.nome.trim().split(/\s+/)[0];
  const menus = menusDoUsuario(eu);
  const salvo = moduloSalvo((await cookies()).get(COOKIE_MODULO)?.value);

  const numeros = [
    paradas != null && { href: "/producao/paradas", Icone: OctagonAlert, n: paradas, rotulo: paradas === 1 ? "máquina parada" : "máquinas paradas", alerta: paradas > 0 },
    secando != null && { href: "/producao/estufas", Icone: Flame, n: secando, rotulo: secando === 1 ? "estufa secando" : "estufas secando", alerta: false },
    pacotes != null && { href: "/producao/pacotes", Icone: Package, n: pacotes, rotulo: pacotes === 1 ? "pacote em estoque" : "pacotes em estoque", alerta: false },
    requisicoes != null && {
      href: "/requisicoes?status=pendentes",
      Icone: Wrench,
      n: requisicoes,
      rotulo: requisicoes === 1 ? "requisição aberta" : "requisições abertas",
      alerta: false,
    },
  ].filter(Boolean) as { href: string; Icone: LucideIcon; n: number; rotulo: string; alerta: boolean }[];

  // Módulo em destaque: a Serraria (o principal); sem ela, o primeiro liberado; sem nenhum, só os cartões menores
  const ordem = Object.keys(MODULOS) as Modulo[];
  const liberados = ordem.filter((m) => temModulo(eu, m));
  const principal: Modulo | undefined = liberados[0];
  const outros = ordem.filter((m) => m !== principal);
  // Painel de administração: usuários, auditoria ou os cadastros da Serraria (mesma regra de /administracao)
  const adm = { usuarios: pode(eu.perfil, "usuarios"), cadastros: podeProducao(eu, "gerir"), historico: pode(eu.perfil, "auditoria") };
  const administra = adm.usuarios || adm.cadastros || adm.historico;
  // "Usuários, cadastros, histórico e dados do sistema": só o que a pessoa vai encontrar lá
  const partes = [adm.usuarios && "usuários", adm.cadastros && "cadastros", adm.historico && "histórico", "dados do sistema"].filter(Boolean) as string[];
  const textoAdm = `${partes.slice(0, -1).join(", ")} e ${partes.at(-1)}`.replace(/^./, (c) => c.toUpperCase());

  const rapidos = [
    ...outros.map((m) => {
      const liberado = temModulo(eu, m);
      return (
        <CartaoRapido
          key={m}
          href={liberado ? MODULOS[m].inicio : undefined}
          icone={MODULO[m].icone}
          titulo={MODULOS[m].nome}
          texto={MODULO[m].descricao}
          selo={<Selo modulo={m} liberado={liberado} />}
          bloqueado={emTeste(m) ? "Disponível em breve" : "Sem acesso: fale com o gerente"}
          forte
        />
      );
    }),
    <CartaoRapido key="ajuda" href="/ajuda" icone="ajuda" titulo="Manual do usuário" texto="Como usar cada tela e roteiros para imprimir" />,
    <CartaoRapido key="perfil" href="/perfil" icone="perfil" titulo="Meu perfil" texto="Seus dados, senha, tema e avisos no celular" />,
    // Com o módulo principal, completa a grade 2 × 2 ao lado dele
    ...(principal
      ? [
          <CartaoRapido
            key="avisos"
            href="/notificacoes"
            icone="notificacoes"
            titulo="Notificações"
            texto={naoLidas === 0 ? "Nenhum aviso novo" : naoLidas === 1 ? "1 aviso novo para você" : `${naoLidas} avisos novos para você`}
            selo={
              naoLidas > 0 ? (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold tabular-nums text-amber-800 ring-1 ring-amber-200">{naoLidas > 99 ? "99+" : naoLidas}</span>
              ) : undefined
            }
          />,
        ]
      : []),
  ];

  // Mesma largura do topo e do conteúdo das telas do sistema (layout do app)
  const largura = "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8";
  return (
    <div className="flex min-h-dvh flex-col">
      <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      <TemaApp />
      <MedidaRolagem />
      {principal ? (
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
        <main className={`${largura} pb-12 pt-5 lg:pt-7`}>
          <FaixaPainel
            rotulo={`Artepinus · ${perfil}`}
            titulo={
              <>
                Olá, {primeiro}{" "}
                <span aria-hidden>👋</span>
              </>
            }
            subtitulo={principal ? "Selecione um módulo para começar" : "Assim que o gerente liberar o seu acesso, os módulos aparecem aqui"}
          />

          {/* Números do momento, por cima da faixa verde */}
          <SobreFaixa>
            <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl shadow-marca-950/5">
              <div className="px-4 py-4 sm:px-5">
                {numeros.length > 0 ? (
                  <>
                    {/* Celular: 2 por linha, número em cima (o último sozinho ocupa a linha); tablet e computador: chips */}
                    <ul className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-center [&>li:last-child:nth-child(odd)]:col-span-2">
                      {numeros.map(({ href, Icone, n, rotulo, alerta }) => (
                        <li key={href}>
                          <Link
                            href={href}
                            className={`flex h-full items-center gap-2.5 rounded-xl px-3 py-2 ring-1 transition sm:inline-flex sm:gap-2 sm:rounded-full sm:px-3.5 sm:py-1.5 ${
                              alerta ? "bg-rose-50 text-rose-800 ring-rose-200 hover:bg-rose-100" : "bg-stone-50 text-stone-700 ring-stone-200 hover:bg-stone-100"
                            }`}
                          >
                            <Icone className="h-4 w-4 shrink-0" aria-hidden />
                            <span className="min-w-0 leading-tight sm:text-sm sm:font-medium">
                              <b className="block text-base font-semibold tabular-nums sm:inline sm:text-sm sm:font-medium">{n}</b>{" "}
                              <span className="block text-xs sm:inline sm:text-sm">{rotulo}</span>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-center text-xs text-stone-400">Toque num número para abrir a lista</p>
                  </>
                ) : (
                  <p className="text-center text-sm text-stone-500">Seu usuário ainda não tem acesso a nenhum módulo. Fale com o gerente.</p>
                )}
              </div>
              {!temPergunta && (
                <Link
                  href="/perfil"
                  className="group flex items-center gap-2.5 border-t border-amber-200/70 bg-amber-50/70 px-4 py-2.5 text-sm text-amber-900 transition hover:bg-amber-100 sm:justify-center sm:px-5"
                >
                  <KeyRound className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="min-w-0">
                    <b className="font-semibold">Cadastre a sua pergunta de segurança</b>
                    <span className="hidden sm:inline">: assim você recupera a senha sozinho, se esquecer</span>
                  </span>
                  <ArrowRight className="ml-auto h-4 w-4 shrink-0 transition group-hover:translate-x-0.5 sm:ml-0" aria-hidden />
                </Link>
              )}
            </div>
          </SobreFaixa>

          {/* Acesso rápido: o módulo principal grande e os outros cartões ao lado */}
          <section className="mt-8">
            <div className="mb-2.5 flex items-baseline justify-between gap-3 px-0.5">
              <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Acesso rápido</h2>
              <span className="text-sm text-stone-500">
                {liberados.length === 0 ? "Nenhum módulo liberado" : liberados.length === 1 ? "1 módulo disponível" : `${liberados.length} módulos disponíveis`}
              </span>
            </div>
            {principal ? (
              <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
                <div className="relative">
                  <CartaoPrincipal
                    href={MODULOS[principal].inicio}
                    rotulo="Módulo principal"
                    titulo={MODULOS[principal].nome}
                    descricao={MODULO[principal].descricao}
                    icone={MODULO[principal].icone}
                    acao="Acessar"
                  />
                  <span className="pointer-events-none absolute right-5 top-5 sm:right-6 sm:top-6">
                    <Selo modulo={principal} liberado />
                  </span>
                </div>
                <ul className="grid grid-cols-2 gap-3 sm:gap-4">
                  {rapidos.map((c) => (
                    <li key={c.key}>{c}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                {rapidos.map((c) => (
                  <li key={c.key}>{c}</li>
                ))}
              </ul>
            )}
          </section>

          {/* Administração: usuários, cadastros, histórico e dados do sistema */}
          {administra && (
            <Link
              href="/administracao"
              className="group mt-4 flex items-center gap-4 rounded-2xl border border-marca-200 bg-linear-to-r from-marca-50 via-white to-white p-4 shadow-[0_1px_2px_rgb(16_24_16/0.04)] transition hover:border-marca-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-500 sm:p-5"
            >
              <span className="fundo-marca grid h-12 w-12 shrink-0 place-items-center rounded-xl text-white shadow-md shadow-marca-900/20">
                <IconeAdmin className="h-6 w-6" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-marca-700">Painel</span>
                <span className="block font-semibold text-stone-900 sm:text-lg">Administração</span>
                <span className="block text-sm text-stone-500">{textoAdm}</span>
              </span>
              <ChevronRight className="h-5 w-5 shrink-0 text-marca-700 transition group-hover:translate-x-0.5" aria-hidden />
            </Link>
          )}

          {/* Atalhos do dia a dia da Serraria, mais discretos */}
          {serraria && (
            <GrupoAtalhos titulo="Atalhos da serraria" colunas={2}>
              <CartaoAtalho href="/producao/escanear" icone="escanear" titulo="Ler etiqueta" descricao="Aponte a câmera para o QR de um pacote ou lote" />
              <CartaoAtalho
                href="/producao/paradas"
                icone="paradas"
                titulo="Paradas de máquina"
                descricao="Máquina parou? Marque na hora e avise a manutenção"
                selo={paradas ? paradas : undefined}
                alerta={!!paradas}
              />
            </GrupoAtalhos>
          )}
        </main>
      </div>

      <div className="nao-imprimir border-t border-stone-200/70">
        <Rodape className={`${largura} py-5 lg:flex lg:items-center lg:justify-between lg:gap-6 lg:text-left`} />
      </div>
    </div>
  );
}
