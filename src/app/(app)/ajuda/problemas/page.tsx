import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, LifeBuoy } from "lucide-react";
import { Blocos } from "@/components/ajuda/Blocos";
import { CabecalhoImpressao } from "@/components/ajuda/partes";
import { BotaoImprimir } from "@/components/BotaoImprimir";
import { Titulo, Vazio } from "@/components/ui";
import { destinosDoManual, glossarioPara, problemasPara, secoesPara, type Problema } from "@/lib/manual";
import { MODULOS, type Modulo } from "@/lib/permissoes";
import { roteirosPara } from "@/lib/roteiros";
import { exigirUsuario } from "@/lib/session";

export const metadata: Metadata = { title: "Problemas comuns · Manual" };

/** Problemas comuns: cada um escrito como o que a pessoa vê, com âncora (/ajuda/problemas#id). */
export default async function ProblemasPage() {
  const eu = await exigirUsuario();
  const problemas = problemasPara(eu);
  const destinos = destinosDoManual(secoesPara(eu), glossarioPara(eu), problemas, roteirosPara(eu).length > 0);

  // Agrupados: o que vale para todos, depois cada módulo
  const grupos: { nome: string; itens: Problema[] }[] = [
    { nome: "Geral", itens: problemas.filter((p) => !p.modulo) },
    ...(Object.keys(MODULOS) as Modulo[]).map((m) => ({ nome: MODULOS[m].nome, itens: problemas.filter((p) => p.modulo === m) })),
  ].filter((g) => g.itens.length > 0);
  const variosGrupos = grupos.length > 1;

  return (
    <div className="manual-impressao mx-auto max-w-4xl">
      <CabecalhoImpressao titulo="Problemas comuns" />
      <Link href="/ajuda" className="nao-imprimir mb-3 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Manual do usuário
      </Link>
      <Titulo
        subtitulo="Algo não saiu como esperado? Procure o que aparece na sua tela."
        acao={
          <span className="nao-imprimir">
            <BotaoImprimir rotulo="Imprimir" />
          </span>
        }
      >
        Problemas comuns
      </Titulo>

      {problemas.length === 0 ? (
        <Vazio>Nenhum problema comum por aqui ainda.</Vazio>
      ) : (
        <>
          <nav aria-label="Lista de problemas" className="nao-imprimir cartao mb-6">
            {grupos.map((g) => (
              <div key={g.nome} className="mt-3 first:mt-0">
                {variosGrupos && <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">{g.nome}</p>}
                <ul className="space-y-0.5">
                  {g.itens.map((p) => (
                    <li key={p.id}>
                      <a href={`#${p.id}`} className="flex items-start gap-2 rounded-lg px-2 py-1.5 text-[15px] text-stone-700 hover:bg-stone-50 hover:text-marca-800">
                        <LifeBuoy className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" aria-hidden />
                        {p.pergunta}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          <div className="space-y-8">
            {grupos.map((g) => (
              <section key={g.nome} aria-label={g.nome} className="space-y-4">
                {variosGrupos && <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">{g.nome}</h2>}
                {g.itens.map((p) => (
                  <article
                    key={p.id}
                    id={p.id}
                    aria-labelledby={`titulo-${p.id}`}
                    className="cartao scroll-mt-24 target:ring-2 target:ring-marca-400"
                  >
                    <h3 id={`titulo-${p.id}`} className="mb-3 text-lg font-semibold text-stone-900">
                      {p.pergunta}
                    </h3>
                    <Blocos blocos={p.blocos} destinos={destinos} />
                  </article>
                ))}
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
