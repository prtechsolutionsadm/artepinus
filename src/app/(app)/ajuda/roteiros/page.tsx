import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpen, Printer } from "lucide-react";
import { MANUTENCAO_EM_TESTE, SeloEmTeste } from "@/components/ajuda/partes";
import { BotaoImprimir } from "@/components/BotaoImprimir";
import { Vazio } from "@/components/ui";
import { EMPRESA } from "@/lib/empresa";
import { MODULOS, type Modulo } from "@/lib/permissoes";
import { qrSvg, urlBase } from "@/lib/qr";
import { roteirosPara } from "@/lib/roteiros";
import { exigirUsuario } from "@/lib/session";

export const metadata: Metadata = { title: "Roteiros por função" };

const chip = (ativo: boolean) =>
  `rounded-full px-3 py-1.5 text-sm font-medium ring-1 ${ativo ? "bg-marca-700 text-white ring-marca-700" : "bg-white text-stone-700 ring-stone-300 hover:bg-stone-50"}`;

/**
 * Roteiros de uma página por função, para imprimir e deixar no posto de trabalho. Só as folhas do
 * módulo e do perfil de quem está vendo; cada folha leva um QR para a parte do manual com as fotos.
 */
export default async function RoteirosPage({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const eu = await exigirUsuario();
  const meus = roteirosPara(eu);
  const f = (await searchParams).f;
  const escolhido = meus.find((r) => r.id === f);
  const lista = escolhido ? [escolhido] : meus;
  const modulos = (Object.keys(MODULOS) as Modulo[]).filter((m) => meus.some((r) => r.modulo === m));

  // QR de cada folha: a seção do manual no endereço público (o papel leva o link para sempre)
  const base = await urlBase();
  const endereco = base.replace(/^https?:\/\//, "");
  const folhas = await Promise.all(lista.map(async (r) => ({ ...r, qr: await qrSvg(`${base}/ajuda/${r.secao}`) })));

  return (
    <div className="mx-auto max-w-4xl">
      <div className="nao-imprimir mb-6">
        <Link href="/ajuda" className="mb-3 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Manual do usuário
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Roteiros por função</h1>
            <p className="text-sm text-stone-500">
              Uma folha por função, com o passo a passo do dia. Imprima e deixe no posto de trabalho: o QR de cada folha abre o manual com as fotos.
            </p>
          </div>
          {lista.length > 0 && <BotaoImprimir rotulo={lista.length === 1 ? "Imprimir esta folha" : "Imprimir todas"} />}
        </div>
        {meus.length > 1 && (
          <nav className="mt-4 space-y-2" aria-label="Funções">
            <div className="flex flex-wrap gap-2">
              <Link href="/ajuda/roteiros" aria-current={!escolhido ? "page" : undefined} className={chip(!escolhido)}>
                Todas
              </Link>
              {modulos.length === 1 &&
                meus.map((r) => (
                  <Link key={r.id} href={`/ajuda/roteiros?f=${r.id}`} aria-current={escolhido?.id === r.id ? "page" : undefined} className={chip(escolhido?.id === r.id)}>
                    {r.funcao}
                  </Link>
                ))}
            </div>
            {modulos.length > 1 &&
              modulos.map((m) => (
                <div key={m} className="flex flex-wrap items-center gap-2">
                  <span className="w-full text-xs font-semibold uppercase tracking-[0.14em] text-stone-400 sm:w-24">{MODULOS[m].nome}</span>
                  {meus
                    .filter((r) => r.modulo === m)
                    .map((r) => (
                      <Link key={r.id} href={`/ajuda/roteiros?f=${r.id}`} aria-current={escolhido?.id === r.id ? "page" : undefined} className={chip(escolhido?.id === r.id)}>
                        {r.funcao}
                      </Link>
                    ))}
                </div>
              ))}
          </nav>
        )}
      </div>

      {folhas.length === 0 ? (
        <Vazio>
          Ainda não há roteiro para imprimir para o seu acesso. Veja o{" "}
          <Link href="/ajuda" className="font-medium text-marca-700 underline">
            Manual do usuário
          </Link>
          .
        </Vazio>
      ) : (
        <div className="space-y-6 print:space-y-0">
          {folhas.map((r) => (
            <article key={r.id} className="roteiro cartao print:rounded-none print:border-0 print:p-0">
              {r.modulo === "manutencao" && MANUTENCAO_EM_TESTE && (
                <div className="nao-imprimir mb-3">
                  <SeloEmTeste />
                </div>
              )}
              <header className="mb-4 flex items-start justify-between gap-4 border-b-2 border-marca-700 pb-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-marca-700">
                    <span className="print:hidden">{MODULOS[r.modulo].nome} · </span>Roteiro · {r.quem}
                  </p>
                  <h2 className="text-2xl font-bold tracking-tight print:text-3xl">{r.funcao}</h2>
                  <p className="mt-1 text-sm text-stone-600 print:text-base">
                    <b>Quando:</b> {r.quando}
                  </p>
                </div>
                <div className="flex shrink-0 items-start gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={EMPRESA.logo} alt="Artepinus" className="h-12 w-auto" />
                  <div
                    role="img"
                    aria-label="QR Code: passo a passo com fotos no manual"
                    className="hidden w-20 sm:block print:block print:w-[22mm] [&_svg]:h-auto [&_svg]:w-full"
                    dangerouslySetInnerHTML={{ __html: r.qr }}
                  />
                </div>
              </header>
              <div className="space-y-5 print:space-y-3">
                {r.passos.map((p) => (
                  <section key={p.titulo}>
                    <h3 className="mb-2 text-lg font-semibold print:text-xl">{p.titulo}</h3>
                    <ol className="space-y-2">
                      {p.itens.map((i, n) => (
                        <li key={n} className="flex gap-3 text-[15px] leading-snug print:text-[16px]">
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
              <footer className="mt-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-stone-200 pt-2 text-xs text-stone-400 print:mt-3">
                <span>
                  {endereco}/ajuda/{r.secao}
                </span>
                <span className="nao-imprimir flex flex-wrap gap-x-4 gap-y-1">
                  <Link href={`/ajuda/${r.secao}`} className="inline-flex items-center gap-1 font-medium text-marca-700 hover:underline">
                    <BookOpen className="h-3.5 w-3.5" aria-hidden /> Ver no manual
                  </Link>
                  {folhas.length > 1 && (
                    <Link href={`/ajuda/roteiros?f=${r.id}`} className="inline-flex items-center gap-1 font-medium text-marca-700 hover:underline">
                      <Printer className="h-3.5 w-3.5" aria-hidden /> Só esta folha
                    </Link>
                  )}
                </span>
                <span className="hidden print:inline">Passo a passo com fotos: aponte a câmera para o QR no alto da folha.</span>
              </footer>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
