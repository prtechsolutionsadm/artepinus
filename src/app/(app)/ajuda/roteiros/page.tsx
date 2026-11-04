import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { BotaoImprimir } from "@/components/BotaoImprimir";
import { EMPRESA } from "@/lib/empresa";
import { ROTEIROS } from "@/lib/roteiros";
import { exigirUsuario } from "@/lib/session";

export const metadata: Metadata = { title: "Roteiros por função" };

/** Roteiros de uma página por função, para imprimir e deixar no posto de trabalho. */
export default async function RoteirosPage({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  await exigirUsuario();
  const f = (await searchParams).f;
  const lista = ROTEIROS.filter((r) => !f || r.id === f);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="nao-imprimir mb-6">
        <Link href="/ajuda" className="mb-3 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800">
          <ArrowLeft className="h-4 w-4" /> Manual do usuário
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Roteiros por função</h1>
            <p className="text-sm text-stone-500">Uma folha por função, com o passo a passo do dia. Imprima e deixe no posto de trabalho.</p>
          </div>
          <BotaoImprimir rotulo={f ? "Imprimir esta folha" : "Imprimir todas"} />
        </div>
        <nav className="mt-4 flex flex-wrap gap-2" aria-label="Funções">
          <Link href="/ajuda/roteiros" className={`rounded-full px-3 py-1.5 text-sm font-medium ring-1 ${!f ? "bg-marca-700 text-white ring-marca-700" : "bg-white text-stone-700 ring-stone-300"}`}>
            Todas
          </Link>
          {ROTEIROS.map((r) => (
            <Link key={r.id} href={`/ajuda/roteiros?f=${r.id}`} className={`rounded-full px-3 py-1.5 text-sm font-medium ring-1 ${f === r.id ? "bg-marca-700 text-white ring-marca-700" : "bg-white text-stone-700 ring-stone-300"}`}>
              {r.funcao}
            </Link>
          ))}
        </nav>
      </div>

      <div className="space-y-6 print:space-y-0">
        {lista.map((r) => (
          <article key={r.id} className="roteiro cartao print:rounded-none print:border-0 print:p-0">
            <header className="mb-4 flex items-start justify-between gap-4 border-b-2 border-marca-700 pb-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-marca-700">Roteiro · {r.quem}</p>
                <h2 className="text-2xl font-bold tracking-tight print:text-3xl">{r.funcao}</h2>
                <p className="mt-1 text-sm text-stone-600 print:text-base">
                  <b>Quando:</b> {r.quando}
                </p>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={EMPRESA.logo} alt="Artepinus" className="h-12 w-auto shrink-0" />
            </header>
            <div className="space-y-5">
              {r.passos.map((p) => (
                <section key={p.titulo}>
                  <h3 className="mb-2 text-lg font-semibold print:text-xl">{p.titulo}</h3>
                  <ol className="space-y-2">
                    {p.itens.map((i, n) => (
                      <li key={n} className="flex gap-3 text-[15px] leading-snug print:text-[17px]">
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-marca-700 text-sm font-bold text-white">{n + 1}</span>
                        <span className="pt-0.5">{i}</span>
                      </li>
                    ))}
                  </ol>
                </section>
              ))}
              <section className="rounded-lg bg-amber-50 p-4 ring-1 ring-amber-200">
                <h3 className="mb-1.5 font-semibold text-amber-900">Atenção</h3>
                <ul className="list-disc space-y-1 pl-5 text-[15px] text-amber-950 print:text-base">
                  {r.atencao.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </section>
            </div>
            <footer className="mt-6 flex justify-between border-t border-stone-200 pt-2 text-xs text-stone-400">
              <span>{EMPRESA.sistema} · {EMPRESA.site.replace("https://", "")}</span>
              <span className="nao-imprimir">
                <Link href={`/ajuda/roteiros?f=${r.id}`} className="inline-flex items-center gap-1 text-marca-700 hover:underline">
                  <Printer className="h-3.5 w-3.5" /> Só esta folha
                </Link>
              </span>
              <span className="hidden print:inline">Dúvidas: manual completo no sistema (Manual do usuário)</span>
            </footer>
          </article>
        ))}
      </div>
    </div>
  );
}
