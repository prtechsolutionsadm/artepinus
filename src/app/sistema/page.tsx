import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  CircleHelp,
  Factory,
  Flame,
  FlaskConical,
  KeyRound,
  Lock,
  OctagonAlert,
  Package,
  QrCode,
  ShieldCheck,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { db } from "@/lib/db";
import { sair } from "@/app/actions/auth";
import { BotaoSair } from "@/components/BotaoSair";
import { Rodape } from "@/components/Rodape";
import { Sininho } from "@/components/Sininho";
import { BotaoTema, SCRIPT_TEMA, TemaApp } from "@/components/Tema";
import { PERFIL, PERFIL_PRODUCAO, STATUS_PENDENTES } from "@/lib/constantes";
import { iniciais } from "@/lib/menu";
import { MODULOS, MODULOS_ATIVOS, MODULOS_EM_TESTE, pode, temModulo, type Modulo } from "@/lib/permissoes";
import { exigirUsuario } from "@/lib/session";

export const metadata: Metadata = { title: "Início", robots: { index: false, follow: false } };

const MODULO: Record<Modulo, { Icone: LucideIcon; descricao: string }> = {
  producao: { Icone: Factory, descricao: "Toras, serraria, estufas, pacotes, romaneios e indicadores" },
  manutencao: { Icone: Wrench, descricao: "Requisições, preventivas, checklists e equipamentos" },
};

function saudacao() {
  const h = Number(new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", hour12: false }));
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

/** Selo do canto do cartão: Ativo, Em teste (só o administrador) ou Em breve. */
function Selo({ modulo, liberado }: { modulo: Modulo; liberado: boolean }) {
  const emTeste = !MODULOS_ATIVOS.includes(modulo) && MODULOS_EM_TESTE.includes(modulo);
  if (!emTeste)
    return liberado ? (
      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-800 ring-1 ring-emerald-200">Ativo</span>
    ) : null;
  return liberado ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-800 ring-1 ring-amber-200">
      <FlaskConical className="h-3.5 w-3.5" /> Em teste
    </span>
  ) : (
    <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-stone-500 ring-1 ring-stone-200">Em breve</span>
  );
}

/** Cartão menor de acesso rápido. */
function Atalho({ href, Icone, titulo, texto, selo, bloqueado }: { href?: string; Icone: LucideIcon; titulo: string; texto: string; selo?: React.ReactNode; bloqueado?: string }) {
  const corpo = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className={`grid h-12 w-12 place-items-center rounded-xl ${href ? "bg-marca-50 text-marca-700 ring-1 ring-marca-100" : "bg-stone-100 text-stone-400"}`}>
          <Icone className="h-6 w-6" />
        </span>
        {selo}
      </div>
      <h3 className={`mt-5 text-lg font-semibold ${href ? "" : "text-stone-500"}`}>{titulo}</h3>
      <p className="mt-0.5 text-sm text-stone-500">{texto}</p>
      <div className="mt-5 flex items-center justify-between border-t border-stone-100 pt-4 text-sm">
        {href ? (
          <>
            <span className="text-stone-500">Abrir</span>
            <span className="inline-flex items-center gap-1 font-semibold text-marca-700">
              Acessar <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </span>
          </>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-stone-500">
            <Lock className="h-4 w-4" /> {bloqueado}
          </span>
        )}
      </div>
    </>
  );
  return href ? (
    <Link href={href} className="group flex h-full flex-col rounded-2xl border border-stone-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-marca-300 hover:shadow-lg sm:p-6">
      {corpo}
    </Link>
  ) : (
    <div aria-disabled className="flex h-full flex-col rounded-2xl border border-dashed border-stone-300 bg-stone-50/60 p-5 sm:p-6">
      {corpo}
    </div>
  );
}

/** Tela de início do sistema: boas-vindas, números do momento e a escolha do módulo. */
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
  const perfil = eu.perfilProducao && eu.perfil !== "ADMIN" && eu.perfil !== "GERENTE" ? PERFIL_PRODUCAO[eu.perfilProducao] : PERFIL[eu.perfil];
  const primeiro = eu.nome.split(" ")[0];

  const numeros = [
    paradas != null && { href: "/producao/paradas", Icone: OctagonAlert, texto: paradas === 1 ? "1 máquina parada" : `${paradas} máquinas paradas`, alerta: paradas > 0 },
    secando != null && { href: "/producao/estufas", Icone: Flame, texto: secando === 1 ? "1 estufa secando" : `${secando} estufas secando`, alerta: false },
    pacotes != null && { href: "/producao/pacotes", Icone: Package, texto: pacotes === 1 ? "1 pacote em estoque" : `${pacotes} pacotes em estoque`, alerta: false },
    requisicoes != null && { href: "/requisicoes?status=pendentes", Icone: Wrench, texto: requisicoes === 1 ? "1 requisição aberta" : `${requisicoes} requisições abertas`, alerta: false },
  ].filter(Boolean) as { href: string; Icone: LucideIcon; texto: string; alerta: boolean }[];

  // Módulo em destaque: a Serraria (o principal); sem ela, o primeiro liberado
  const ordem: Modulo[] = ["producao", "manutencao"];
  const principal = ordem.find((m) => temModulo(eu, m)) ?? "producao";
  const outros = ordem.filter((m) => m !== principal);
  const totalModulos = ordem.filter((m) => temModulo(eu, m)).length;
  const admin = pode(eu.perfil, "usuarios");

  return (
    <div className="flex min-h-dvh flex-col">
      <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      <TemaApp />

      {/* Topo */}
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/90 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:px-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Artepinus" className="h-10 w-auto dark:hidden" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-branco.svg" alt="Artepinus" className="hidden h-10 w-auto dark:block" />
          <div className="ml-auto flex items-center gap-1">
            <BotaoTema />
            <Link href="/ajuda" aria-label="Manual do usuário" title="Manual do usuário" className="grid h-10 w-10 place-items-center rounded-full text-stone-600 hover:bg-stone-100">
              <CircleHelp className="h-5 w-5" />
            </Link>
            <Sininho naoLidasInicial={naoLidas} />
            <Link href="/perfil" className="ml-1 hidden items-center gap-2.5 rounded-full py-1 pl-1 pr-3 hover:bg-stone-100 sm:flex" title="Meu perfil">
              <span className="fundo-marca grid h-8 w-8 place-items-center rounded-full text-xs font-semibold text-white">{iniciais(eu.nome)}</span>
              <span className="text-sm font-semibold text-stone-800">{primeiro}</span>
            </Link>
            <BotaoSair sair={sair} variante="icone" />
          </div>
        </div>
      </header>

      {/* Boas-vindas */}
      <section className="fundo-marca relative overflow-hidden text-white">
        <div className="pointer-events-none absolute -right-16 -top-24 h-80 w-80 rounded-full bg-white/10" aria-hidden />
        <div className="pointer-events-none absolute right-40 top-24 h-40 w-40 rounded-full bg-white/[0.07]" aria-hidden />
        <div className="relative mx-auto flex max-w-6xl items-center gap-5 px-4 pb-24 pt-10 sm:px-6 sm:pt-12">
          <span className="hidden h-20 w-20 shrink-0 place-items-center rounded-full bg-white/15 ring-4 ring-white/20 sm:grid">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/marca-branca.svg" alt="" className="h-10 w-auto" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/75">{perfil} · Artepinus</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {saudacao()}, {primeiro}
            </h1>
            <p className="mt-1.5 text-white/85">Sistema Artepinus: escolha um módulo para começar.</p>
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-12 sm:px-6">
        {/* Números do momento, por cima da faixa verde */}
        <div className="relative -mt-14 rounded-2xl border border-stone-200 bg-white p-4 shadow-xl shadow-marca-950/5 sm:p-5">
          {numeros.length > 0 ? (
            <ul className="flex flex-wrap justify-center gap-2">
              {numeros.map(({ href, Icone, texto, alerta }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium ring-1 transition ${
                      alerta ? "bg-rose-50 text-rose-800 ring-rose-200 hover:bg-rose-100" : "bg-stone-50 text-stone-700 ring-stone-200 hover:bg-stone-100"
                    }`}
                  >
                    <Icone className="h-4 w-4" /> {texto}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-sm text-stone-500">Seu usuário ainda não tem acesso a nenhum módulo. Fale com o gerente.</p>
          )}
          <p className="mt-2 text-center text-xs text-stone-400">Toque num número para abrir a lista</p>
        </div>

        {!temPergunta && (
          <Link href="/perfil" className="mt-5 flex items-center gap-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200 hover:bg-amber-100">
            <KeyRound className="h-5 w-5 shrink-0" />
            <span className="flex-1">
              <b>Cadastre a sua pergunta de segurança</b>: assim você recupera a senha sozinho, se esquecer.
            </span>
            <ArrowRight className="h-4 w-4 shrink-0" />
          </Link>
        )}

        <div className="mb-3 mt-9 flex items-baseline justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Acesso rápido</h2>
          <span className="text-sm text-stone-500">{totalModulos === 1 ? "1 módulo disponível" : `${totalModulos} módulos disponíveis`}</span>
        </div>

        {/* Módulo principal em destaque */}
        {(() => {
          const liberado = temModulo(eu, principal);
          const { Icone, descricao } = MODULO[principal];
          const corpo = (
            <>
              <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-marca-100/60" aria-hidden />
              <div className="pointer-events-none absolute bottom-6 right-24 h-24 w-24 rounded-full bg-marca-100/50" aria-hidden />
              <div className="relative flex items-start justify-between gap-3">
                <span className="fundo-marca grid h-16 w-16 place-items-center rounded-2xl text-white shadow-lg shadow-marca-900/20">
                  <Icone className="h-8 w-8" />
                </span>
                <Selo modulo={principal} liberado={liberado} />
              </div>
              <p className="relative mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-marca-700">Módulo principal</p>
              <h3 className="relative mt-1 text-2xl font-semibold sm:text-3xl">{MODULOS[principal].nome}</h3>
              <p className="relative mt-1 text-stone-600">{descricao}</p>
              <div className="relative mt-6 flex items-center justify-between border-t border-stone-200/80 pt-4 text-sm">
                <span className="text-stone-500">Abrir módulo completo</span>
                {liberado ? (
                  <span className="inline-flex items-center gap-1 text-base font-semibold text-marca-700">
                    Acessar <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-stone-500">
                    <Lock className="h-4 w-4" /> Sem acesso
                  </span>
                )}
              </div>
            </>
          );
          return liberado ? (
            <Link
              href={MODULOS[principal].inicio}
              className="group relative block overflow-hidden rounded-2xl border border-marca-100 bg-gradient-to-br from-white to-marca-50 p-6 transition hover:border-marca-300 hover:shadow-xl sm:p-7"
            >
              {corpo}
            </Link>
          ) : (
            <div className="relative overflow-hidden rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-6 sm:p-7">{corpo}</div>
          );
        })()}

        {/* Outros módulos e atalhos */}
        <ul className="mt-5 grid gap-5 sm:grid-cols-2">
          {outros.map((m) => {
            const liberado = temModulo(eu, m);
            const emTeste = !MODULOS_ATIVOS.includes(m) && MODULOS_EM_TESTE.includes(m);
            return (
              <li key={m}>
                <Atalho
                  href={liberado ? MODULOS[m].inicio : undefined}
                  Icone={MODULO[m].Icone}
                  titulo={MODULOS[m].nome}
                  texto={MODULO[m].descricao}
                  selo={<Selo modulo={m} liberado={liberado} />}
                  bloqueado={emTeste ? "Disponível em breve" : "Sem acesso: fale com o gerente"}
                />
              </li>
            );
          })}
          {serraria && (
            <>
              <li>
                <Atalho href="/producao/paradas" Icone={OctagonAlert} titulo="Paradas de máquina" texto="Máquina parou? Marque na hora e avise a manutenção" />
              </li>
              <li>
                <Atalho href="/producao/escanear" Icone={QrCode} titulo="Ler etiqueta" texto="Aponte a câmera para o QR de um pacote ou lote" />
              </li>
            </>
          )}
          <li>
            <Atalho href="/ajuda" Icone={BookOpen} titulo="Ajuda" texto="Manual do usuário e roteiros por função para imprimir" />
          </li>
        </ul>

        {/* Administração */}
        {admin && (
          <Link
            href="/usuarios"
            className="group mt-5 flex items-center gap-4 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-white p-4 transition hover:border-amber-300 hover:shadow-md sm:p-5"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-amber-500 text-white shadow-md shadow-amber-900/15">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-amber-800">Painel</span>
              <span className="block font-semibold">Administração</span>
              <span className="block text-sm text-stone-500">Usuários, acessos e histórico de alterações</span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-amber-700 transition group-hover:translate-x-0.5" />
          </Link>
        )}
      </main>
      <Rodape className="mx-auto w-full max-w-6xl px-4 pb-8 sm:px-6" />
    </div>
  );
}
