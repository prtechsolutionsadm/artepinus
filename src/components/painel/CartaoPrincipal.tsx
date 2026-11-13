import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ICONES } from "@/components/icones";
import type { IconeMenu } from "@/lib/menu";

/**
 * Cartão grande de destaque (a tarefa principal da pessoa, ex.: "Apontar serraria"): ícone verde,
 * rótulo em caixa alta ("TAREFA PRINCIPAL"), título, descrição e o rodapé "Abrir →" (ou `acao`).
 * Ocupa a altura toda da célula da grade (ex.: `lg:row-span-2` num invólucro), com o rodapé embaixo.
 */
export function CartaoPrincipal({
  href,
  rotulo,
  titulo,
  descricao,
  icone,
  acao = "Abrir",
}: {
  href: string;
  rotulo?: string;
  titulo: string;
  descricao?: string;
  icone: IconeMenu;
  acao?: string;
}) {
  const Icone = ICONES[icone];
  return (
    <Link
      href={href}
      className="group relative flex h-full min-h-48 flex-col overflow-hidden rounded-2xl border border-marca-100 bg-linear-to-br from-white to-marca-50 p-5 shadow-[0_1px_2px_rgb(16_24_16/0.04)] transition hover:border-marca-300 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-500 sm:p-6"
    >
      {/* Círculos de enfeite */}
      <span aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-marca-100/60" />
      <span aria-hidden className="pointer-events-none absolute bottom-14 right-16 h-16 w-16 rounded-full bg-marca-100/50" />
      <span className="relative flex-1">
        <span className="fundo-marca grid h-14 w-14 place-items-center rounded-2xl text-white shadow-lg shadow-marca-900/20">
          <Icone className="h-7 w-7" aria-hidden />
        </span>
        {rotulo && <span className="mt-5 block text-xs font-semibold uppercase tracking-[0.16em] text-marca-700">{rotulo}</span>}
        <span className={`block text-2xl font-semibold tracking-tight text-stone-900 ${rotulo ? "mt-1" : "mt-5"}`}>{titulo}</span>
        {descricao && <span className="mt-1 block text-stone-600">{descricao}</span>}
      </span>
      <span className="relative mt-6 flex items-center justify-end border-t border-marca-100 pt-4">
        <span className="inline-flex items-center gap-1.5 font-semibold text-marca-700">
          {acao} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
        </span>
      </span>
    </Link>
  );
}
