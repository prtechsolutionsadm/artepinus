import type { ReactNode } from "react";

/**
 * Classes para um botão sobre a faixa verde (ex.: `direita={<Link className={BOTAO_FAIXA} …>}`):
 * vidro claro com texto branco, legível no claro e no escuro.
 */
export const BOTAO_FAIXA =
  "btn bg-white/15 text-white ring-1 ring-white/30 backdrop-blur-sm hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

/**
 * Faixa verde de largura total logo abaixo do topo (telas iniciais e painéis): rótulo em caixa alta
 * espaçada ("MÓDULO · SERRARIA"), título grande ("Bom dia, Pablo") e subtítulo.
 *
 * - Use como o primeiro elemento da página, direto dentro do <main>: encosta no topo (margem negativa
 *   igual ao respiro de cima do <main>) e sai do container até as bordas da janela (utilitário
 *   `sangria`); o texto de dentro fica alinhado ao resto da página.
 * - `direita`: algo ao lado do título (ex.: um botão com `BOTAO_FAIXA`). `children`: conteúdo extra
 *   dentro da faixa, embaixo do subtítulo (painel claro aqui dentro precisa da classe `superficie`).
 * - Para um cartão branco "subir" sobre a parte de baixo da faixa, ponha <SobreFaixa> logo depois.
 * - O verde (`fundo-marca`) é fixo, igual no tema escuro. No papel sai só o texto, sem o fundo.
 */
export function FaixaPainel({
  rotulo,
  titulo,
  subtitulo,
  direita,
  children,
}: {
  rotulo?: ReactNode;
  titulo: ReactNode;
  subtitulo?: ReactNode;
  direita?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <>
      <section className="nao-imprimir sangria fundo-marca relative -mt-5 overflow-hidden rounded-b-[1.75rem] pb-14 pt-7 text-white sm:pb-16 sm:pt-9 lg:-mt-7 lg:rounded-b-[2.5rem] lg:pb-24 lg:pt-10">
        {/* Círculos discretos de enfeite, à direita */}
        <span aria-hidden className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full bg-white/[0.07] sm:right-[6%]" />
        <span aria-hidden className="pointer-events-none absolute -bottom-16 right-[18%] hidden h-44 w-44 rounded-full bg-white/[0.06] sm:block" />
        <div className="relative flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <div className="min-w-0">
            {rotulo && <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/75 sm:text-xs">{rotulo}</p>}
            <h1 className="mt-1 text-[1.75rem] font-semibold leading-tight tracking-tight text-white sm:text-4xl">{titulo}</h1>
            {subtitulo && <p className="mt-1.5 max-w-2xl text-sm text-white/85 sm:text-base">{subtitulo}</p>}
          </div>
          {direita && <div className="flex shrink-0 flex-wrap items-center gap-2">{direita}</div>}
        </div>
        {children && <div className="relative mt-5">{children}</div>}
      </section>
      {/* Impressão: só o título, sem a faixa verde */}
      <div className="mb-5 hidden print:block">
        {rotulo && <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">{rotulo}</p>}
        <h1 className="text-2xl font-semibold text-stone-900">{titulo}</h1>
        {subtitulo && <p className="mt-1 text-sm text-stone-600">{subtitulo}</p>}
      </div>
    </>
  );
}
