import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CornerDownLeft, ExternalLink, Hash } from "lucide-react";
import { Blocos } from "@/components/ajuda/Blocos";
import { IndiceTopicos } from "@/components/ajuda/IndiceTopicos";
import { CabecalhoImpressao, MANUTENCAO_EM_TESTE, SeloEmTeste, iconeDaSecao } from "@/components/ajuda/partes";
import { BotaoImprimir } from "@/components/BotaoImprimir";
import { GRUPOS, MANUAL, destinosDoManual, glossarioPara, problemasPara, secoesPara, semLinks } from "@/lib/manual";
import { itemAtivo, menusDoUsuario } from "@/lib/menu";
import { roteirosPara } from "@/lib/roteiros";
import { exigirUsuario } from "@/lib/session";

type Props = { params: Promise<{ secao: string }>; searchParams: Promise<{ de?: string | string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { secao } = await params;
  const s = MANUAL.find((x) => x.id === secao);
  return { title: s ? `${s.titulo} · Manual` : "Manual do usuário" };
}

/** Caminho interno seguro para o "Voltar para a tela" (nada de //outro-site). */
function caminhoInterno(de: string | string[] | undefined) {
  return typeof de === "string" && de.startsWith("/") && !de.startsWith("//") && !de.startsWith("/\\") && de.length <= 300 ? de : null;
}

/** Uma seção do manual: tópicos com âncora (#id), anterior/próxima, voltar e imprimir esta seção. */
export default async function SecaoManualPage({ params, searchParams }: Props) {
  const eu = await exigirUsuario();
  const { secao } = await params;
  const secoes = secoesPara(eu);
  const s = secoes.find((x) => x.id === secao);
  if (!s) notFound();

  const destinos = destinosDoManual(secoes, glossarioPara(eu), problemasPara(eu), roteirosPara(eu).length > 0);
  const doGrupo = secoes.filter((x) => x.grupo === s.grupo);
  const pos = doGrupo.indexOf(s);
  const anterior = doGrupo[pos - 1];
  const proxima = doGrupo[pos + 1];
  const grupo = GRUPOS[s.grupo].nome;
  const Icone = iconeDaSecao(s.id);

  // Itens do menu da pessoa: nome da tela de origem e o botão "Abrir a tela"
  const itens = Object.values(menusDoUsuario(eu)).flatMap((grupos) => grupos.flatMap((g) => g.itens));
  const de = caminhoInterno((await searchParams).de);
  const dePath = de?.split(/[?#]/)[0];
  const daTela = dePath ? itens.filter((i) => itemAtivo(dePath, i.href)).sort((a, b) => b.href.length - a.href.length)[0] : undefined;
  const voltarPara = !de ? null : dePath === "/sistema" ? "a tela de início" : daTela ? daTela.label : "a tela anterior";
  const abrir = (s.rotas ?? []).map((r) => itens.find((i) => i.href === r)).find(Boolean);

  return (
    <div className="manual-impressao mx-auto max-w-5xl">
      <CabecalhoImpressao titulo={s.titulo} />

      <div className="nao-imprimir mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <Link href={`/ajuda?grupo=${s.grupo}`} className="inline-flex items-center gap-1 text-stone-500 hover:text-stone-800">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Manual · {grupo}
        </Link>
        {de && (
          <Link href={de} className="inline-flex items-center gap-1.5 rounded-full bg-marca-50 px-3 py-1 font-medium text-marca-800 ring-1 ring-marca-100 hover:bg-marca-100">
            <CornerDownLeft className="h-4 w-4" aria-hidden /> Voltar para {voltarPara}
          </Link>
        )}
      </div>

      <header className="mb-5">
        <div className="flex items-start gap-3.5">
          <span className="nao-imprimir grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-marca-50 text-marca-700 ring-1 ring-marca-100">
            <Icone className="h-6 w-6" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-marca-700">
              {grupo}
              {s.grupo === "manutencao" && MANUTENCAO_EM_TESTE && <SeloEmTeste />}
            </p>
            <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-stone-900">{s.titulo}</h1>
            <p className="mt-1 text-stone-600">{semLinks(s.resumo)}</p>
          </div>
        </div>
        <div className="nao-imprimir mt-4 flex flex-wrap gap-2">
          {abrir && (
            <Link href={abrir.href} className="btn-primario">
              <ExternalLink className="h-4 w-4" aria-hidden /> Abrir a tela: {abrir.label}
            </Link>
          )}
          <BotaoImprimir rotulo="Imprimir esta seção" />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_14rem]">
        <div className="min-w-0 space-y-4">
          {s.topicos.length > 1 && (
            <nav aria-label="Tópicos desta seção" className="nao-imprimir lg:hidden">
              <ul className="flex flex-wrap gap-1.5">
                {s.topicos.map((t) => (
                  <li key={t.id}>
                    <a href={`#${t.id}`} className="block rounded-full border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-600 hover:border-marca-300 hover:text-marca-800">
                      {t.titulo}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          {s.topicos.map((t) => (
            <section
              key={t.id}
              id={t.id}
              aria-labelledby={`titulo-${t.id}`}
              className="cartao scroll-mt-24 target:ring-2 target:ring-marca-400"
            >
              <h2 id={`titulo-${t.id}`} className="group mb-3 text-lg font-semibold text-stone-900">
                <a href={`#${t.id}`} className="inline-flex items-baseline gap-1.5 hover:text-marca-800">
                  {t.titulo}
                  <Hash className="nao-imprimir h-4 w-4 self-center text-stone-300 opacity-0 transition group-hover:opacity-100" aria-hidden />
                </a>
              </h2>
              <Blocos blocos={t.blocos} destinos={destinos} />
            </section>
          ))}

          {(anterior || proxima) && (
            <nav aria-label="Outras seções" className="nao-imprimir grid gap-3 pt-2 sm:grid-cols-2">
              {anterior ? (
                <Link href={`/ajuda/${anterior.id}`} className="group rounded-2xl border border-stone-200 bg-white p-4 transition hover:border-marca-300">
                  <span className="flex items-center gap-1 text-xs font-medium text-stone-500">
                    <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Anterior
                  </span>
                  <span className="mt-0.5 block font-semibold text-stone-900 group-hover:text-marca-800">{anterior.titulo}</span>
                </Link>
              ) : (
                <span className="hidden sm:block" />
              )}
              {proxima && (
                <Link href={`/ajuda/${proxima.id}`} className="group rounded-2xl border border-stone-200 bg-white p-4 text-right transition hover:border-marca-300">
                  <span className="flex items-center justify-end gap-1 text-xs font-medium text-stone-500">
                    Próxima <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  <span className="mt-0.5 block font-semibold text-stone-900 group-hover:text-marca-800">{proxima.titulo}</span>
                </Link>
              )}
            </nav>
          )}
        </div>

        {s.topicos.length > 1 && (
          <aside className="nao-imprimir hidden lg:block">
            <div className="sticky top-24">
              <IndiceTopicos topicos={s.topicos.map((t) => ({ id: t.id, titulo: t.titulo }))} />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
