import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { TextoAjuda } from "@/components/ajuda/Blocos";
import { CabecalhoImpressao } from "@/components/ajuda/partes";
import { BotaoImprimir } from "@/components/BotaoImprimir";
import { Titulo, Vazio } from "@/components/ui";
import { destinosDoManual, glossarioPara, idDoTermo, normalizar, problemasPara, secoesPara, tituloDoDestino, type Termo } from "@/lib/manual";
import { MODULOS, modulosDe, type Modulo } from "@/lib/permissoes";
import { roteirosPara } from "@/lib/roteiros";
import { exigirUsuario } from "@/lib/session";

export const metadata: Metadata = { title: "Glossário · Manual" };

type Filtro = Modulo | "geral";

/** Glossário de A a Z: cada termo com âncora (/ajuda/glossario#lote) e o link para "como fazer". */
export default async function GlossarioPage({ searchParams }: { searchParams: Promise<{ m?: string | string[] }> }) {
  const eu = await exigirUsuario();
  const termos = glossarioPara(eu);
  const destinos = destinosDoManual(secoesPara(eu), termos, problemasPara(eu), roteirosPara(eu).length > 0);
  const modulos = modulosDe(eu);
  const { m } = await searchParams;
  const filtros: Filtro[] = modulos.length > 1 ? [...modulos, "geral"] : [];
  const filtro = filtros.find((f) => f === m) ?? null;
  const lista = termos.filter((t) => !filtro || (filtro === "geral" ? !t.modulo : t.modulo === filtro));

  const letras = new Map<string, Termo[]>();
  for (const t of lista) {
    const l = normalizar(t.termo).charAt(0).toUpperCase() || "#";
    letras.set(l, [...(letras.get(l) ?? []), t]);
  }

  const chip = (ativo: boolean) =>
    `rounded-full px-3 py-1.5 text-sm font-medium ring-1 transition ${ativo ? "bg-marca-700 text-white ring-marca-700" : "bg-white text-stone-700 ring-stone-300 hover:bg-stone-50"}`;

  return (
    <div className="manual-impressao mx-auto max-w-4xl">
      <CabecalhoImpressao titulo="Glossário" />
      <Link href="/ajuda" className="nao-imprimir mb-3 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Manual do usuário
      </Link>
      <Titulo
        subtitulo="O que quer dizer cada palavra usada no sistema e no pátio."
        acao={
          <span className="nao-imprimir">
            <BotaoImprimir rotulo="Imprimir o glossário" />
          </span>
        }
      >
        Glossário
      </Titulo>

      {filtros.length > 0 && (
        <nav aria-label="Filtrar por módulo" className="nao-imprimir mb-4 flex flex-wrap gap-2">
          <Link href="/ajuda/glossario" replace scroll={false} aria-current={!filtro ? "page" : undefined} className={chip(!filtro)}>
            Todos
          </Link>
          {filtros.map((f) => (
            <Link key={f} href={`/ajuda/glossario?m=${f}`} replace scroll={false} aria-current={filtro === f ? "page" : undefined} className={chip(filtro === f)}>
              {f === "geral" ? "Geral" : MODULOS[f].nome}
            </Link>
          ))}
        </nav>
      )}

      {lista.length === 0 ? (
        <Vazio>Nenhum termo por aqui ainda.</Vazio>
      ) : (
        <>
          <nav aria-label="Letras" className="nao-imprimir sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-10 -mx-4 mb-4 flex gap-1 overflow-x-auto border-y border-stone-200 bg-white/95 px-4 py-2 backdrop-blur sm:mx-0 sm:rounded-xl sm:border lg:top-16">
            {[...letras.keys()].map((l) => (
              <a key={l} href={`#letra-${l}`} className="grid h-8 min-w-8 place-items-center rounded-lg text-sm font-semibold text-stone-600 hover:bg-stone-100 hover:text-marca-800">
                {l}
              </a>
            ))}
          </nav>
          <div className="space-y-6">
            {[...letras].map(([l, itens]) => (
              <section key={l} aria-labelledby={`letra-${l}`}>
                <h2 id={`letra-${l}`} className="mb-2 scroll-mt-32 text-xl font-bold text-marca-700">
                  {l}
                </h2>
                <dl className="divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200 bg-white print:rounded-none">
                  {itens.map((t) => {
                    const veja = t.veja && tituloDoDestino(t.veja, destinos) ? t.veja : null;
                    return (
                      <div key={t.termo} id={idDoTermo(t.termo)} className="scroll-mt-32 px-4 py-3 target:bg-amber-50 sm:grid sm:grid-cols-[minmax(9rem,13rem)_1fr] sm:gap-4">
                        <dt className="font-semibold text-stone-900">
                          {t.termo}
                          {t.modulo && <span className="ml-2 align-middle text-[11px] font-medium uppercase tracking-wide text-stone-400">{MODULOS[t.modulo].nome}</span>}
                        </dt>
                        <dd className="mt-0.5 text-[15px] leading-relaxed text-stone-700 sm:mt-0">
                          <TextoAjuda texto={t.definicao} destinos={destinos} />
                          {veja && (
                            <Link href={veja} className="nao-imprimir mt-1 flex w-fit items-center gap-1 text-sm font-medium text-marca-700 hover:underline">
                              Como fazer <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                            </Link>
                          )}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
