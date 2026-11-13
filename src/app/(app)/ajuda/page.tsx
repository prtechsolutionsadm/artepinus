import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { ArrowRight, BookA, ChevronRight, LifeBuoy, Printer, Rocket, type LucideIcon } from "lucide-react";
import { BuscaManual } from "@/components/ajuda/BuscaManual";
import { MANUTENCAO_EM_TESTE, SeloEmTeste, iconeDaSecao } from "@/components/ajuda/partes";
import { Titulo, Vazio } from "@/components/ui";
import { rotuloPerfis } from "@/lib/constantes";
import { GRUPOS, GRUPO_DO_MODULO, ORDEM_GRUPOS, glossarioPara, indiceBusca, problemasPara, secoesPara, semLinks, type Grupo } from "@/lib/manual";
import { COOKIE_MODULO, moduloSalvo } from "@/lib/menu";
import { modulosDe } from "@/lib/permissoes";
import { roteirosPara } from "@/lib/roteiros";
import { exigirUsuario } from "@/lib/session";

export const metadata: Metadata = { title: "Manual do usuário" };

const DESCRICAO_GRUPO: Record<Grupo, string> = {
  serraria: "Na ordem do processo: da tora que chega ao pacote expedido.",
  manutencao: "Requisições, atendimento, preventivas e equipamentos.",
  geral: "Conta, navegação, avisos e uso sem internet: vale para os dois módulos.",
};

function AtalhoAjuda({ href, Icone, titulo, texto }: { href: string; Icone: LucideIcon; titulo: string; texto: string }) {
  return (
    <Link href={href} className="group flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 transition hover:border-marca-300 hover:shadow-md">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-stone-100 text-stone-600">
        <Icone className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-stone-900">{titulo}</span>
        <span className="block text-sm text-stone-500">{texto}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-stone-300 transition group-hover:translate-x-0.5 group-hover:text-marca-700" aria-hidden />
    </Link>
  );
}

/**
 * Manual do usuário: busca, "Primeiros passos" em destaque e as seções por grupo (Serraria /
 * Manutenção / Geral), só com o que a pessoa enxerga. A aba aberta de início é a do módulo em uso.
 */
export default async function AjudaPage({ searchParams }: { searchParams: Promise<{ q?: string | string[]; grupo?: string | string[] }> }) {
  const eu = await exigirUsuario();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 100) : "";
  const secoes = secoesPara(eu);
  const termos = glossarioPara(eu);
  const problemas = problemasPara(eu);
  const modulos = modulosDe(eu);
  const salvo = moduloSalvo((await cookies()).get(COOKIE_MODULO)?.value);
  const moduloEmUso = salvo && modulos.includes(salvo) ? salvo : modulos[0];
  const grupoEmUso = moduloEmUso ? GRUPO_DO_MODULO[moduloEmUso] : undefined;

  const primeiros = secoes.find((s) => s.id === "primeiros-passos");
  const lista = secoes.filter((s) => s !== primeiros);
  const grupos = ORDEM_GRUPOS.filter((g) => lista.some((s) => s.grupo === g));
  const aba = grupos.find((g) => g === sp.grupo) ?? grupos.find((g) => g === grupoEmUso) ?? grupos[0];
  const daAba = lista.filter((s) => s.grupo === aba);

  // Atalhos ao lado de "Primeiros passos": só o que a pessoa tem (os roteiros, só com alguma folha do seu perfil)
  const atalhos: { href: string; Icone: LucideIcon; titulo: string; texto: string }[] = [
    ...(problemas.length ? [{ href: "/ajuda/problemas", Icone: LifeBuoy, titulo: "Problemas comuns", texto: "Algo não saiu como esperado? Veja o que fazer." }] : []),
    ...(termos.length ? [{ href: "/ajuda/glossario", Icone: BookA, titulo: "Glossário", texto: "O que quer dizer cada palavra do sistema." }] : []),
    ...(roteirosPara(eu).length
      ? [{ href: "/ajuda/roteiros", Icone: Printer, titulo: "Roteiros para imprimir", texto: "Uma folha por função para o posto de trabalho." }]
      : []),
  ];
  // Colunas dos atalhos fora do computador largo: uma por atalho (até 3)
  const colunas = ["", "sm:grid-cols-1", "sm:grid-cols-2", "sm:grid-cols-3"][atalhos.length];

  const subtitulo = modulos.length
    ? `Como usar o sistema, com o que vale para o seu acesso (${rotuloPerfis(eu)})`
    : "Seu usuário ainda não tem acesso a um módulo: fale com o gerente. Enquanto isso, veja como entrar e cuidar da sua conta.";

  return (
    <div className="manual-impressao mx-auto max-w-5xl">
      <Titulo subtitulo={subtitulo}>Manual do usuário</Titulo>
      <BuscaManual indice={indiceBusca(secoes, termos, problemas)} grupoEmUso={grupoEmUso} inicial={q} glossario={termos.length > 0} problemas={problemas.length > 0}>
        {secoes.length === 0 ? (
          <Vazio>O manual está sendo preparado. Volte daqui a pouco.</Vazio>
        ) : (
          <div className="space-y-8">
            <div className="grid gap-4 lg:grid-cols-3">
              {primeiros && (
                <Link
                  href="/ajuda/primeiros-passos"
                  className={`fundo-marca group relative overflow-hidden rounded-2xl p-5 text-white shadow-lg shadow-marca-900/15 sm:p-6 ${atalhos.length ? "lg:col-span-2" : "lg:col-span-3"}`}
                >
                  <span className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-white/10" aria-hidden />
                  <span className="relative flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/80">
                    <Rocket className="h-4 w-4" aria-hidden /> Comece por aqui
                  </span>
                  <span className="relative mt-2 block text-2xl font-semibold tracking-tight">{primeiros.titulo}</span>
                  <span className="relative mt-1 block text-white/85">{semLinks(primeiros.resumo)}</span>
                  <span className="relative mt-4 flex flex-wrap gap-1.5">
                    {primeiros.topicos.slice(0, 5).map((t) => (
                      <span key={t.id} className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium text-white ring-1 ring-white/20">
                        {t.titulo}
                      </span>
                    ))}
                  </span>
                  <span className="relative mt-5 inline-flex items-center gap-1 font-semibold">
                    Abrir <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </Link>
              )}
              {atalhos.length > 0 && (
                <div className={`grid content-start gap-3 ${colunas} ${primeiros ? "lg:grid-cols-1" : "lg:col-span-3"}`}>
                  {atalhos.map((a) => (
                    <AtalhoAjuda key={a.href} {...a} />
                  ))}
                </div>
              )}
            </div>

            {aba && (
              <section aria-labelledby="titulo-aba">
                {grupos.length > 1 && (
                  <nav aria-label="Partes do manual" className="mb-4 flex gap-1 overflow-x-auto rounded-xl bg-stone-100 p-1 ring-1 ring-stone-200">
                    {grupos.map((g) => (
                      <Link
                        key={g}
                        href={`/ajuda?grupo=${g}`}
                        replace
                        scroll={false}
                        aria-current={g === aba ? "page" : undefined}
                        className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition ${
                          g === aba ? "bg-white text-marca-800 shadow-sm" : "text-stone-500 hover:text-stone-800"
                        }`}
                      >
                        {GRUPOS[g].nome}
                        <span className="text-xs font-medium text-stone-400">{lista.filter((s) => s.grupo === g).length}</span>
                      </Link>
                    ))}
                  </nav>
                )}
                <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h2 id="titulo-aba" className="text-lg font-semibold text-stone-900">
                    {GRUPOS[aba].nome}
                  </h2>
                  {aba === "manutencao" && MANUTENCAO_EM_TESTE && <SeloEmTeste />}
                  <p className="w-full text-sm text-stone-500">{DESCRICAO_GRUPO[aba]}</p>
                </div>
                <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {daAba.map((s) => {
                    const Icone = iconeDaSecao(s.id);
                    return (
                      <li key={s.id}>
                        <Link href={`/ajuda/${s.id}`} className="group flex h-full gap-3.5 rounded-2xl border border-stone-200 bg-white p-4 transition hover:border-marca-300 hover:shadow-md">
                          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-marca-50 text-marca-700 ring-1 ring-marca-100">
                            <Icone className="h-5 w-5" aria-hidden />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-start justify-between gap-2">
                              <span className="font-semibold text-stone-900">{s.titulo}</span>
                              <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-stone-300 transition group-hover:translate-x-0.5 group-hover:text-marca-700" aria-hidden />
                            </span>
                            <span className="mt-0.5 block text-sm text-stone-500">{semLinks(s.resumo)}</span>
                            <span className="mt-2 block text-xs font-medium text-stone-400">{s.topicos.length === 1 ? "1 tópico" : `${s.topicos.length} tópicos`}</span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
          </div>
        )}
      </BuscaManual>
    </div>
  );
}
