import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ICONES } from "@/components/icones";
import type { IconeMenu } from "@/lib/menu";

/**
 * Cartão de atalho para uma tela: ícone num quadradinho verde-claro, título, uma linha de descrição
 * e a seta ">". `selo`: número ou etiqueta curta à direita (ex.: quantos esperam); `alerta` deixa o
 * selo âmbar (pede atenção). Sem `selo` (ou vazio), nada aparece: 0 aparece como "0".
 */
export function CartaoAtalho({
  href,
  titulo,
  descricao,
  icone,
  selo,
  alerta = false,
}: {
  href: string;
  titulo: string;
  descricao?: string;
  icone: IconeMenu;
  selo?: string | number;
  alerta?: boolean;
}) {
  const Icone = ICONES[icone];
  const temSelo = selo != null && selo !== "";
  return (
    <Link
      href={href}
      className="group flex h-full items-start gap-3.5 rounded-2xl border border-stone-200 bg-white p-4 shadow-[0_1px_2px_rgb(16_24_16/0.04)] transition hover:border-marca-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-500 active:bg-stone-50 sm:p-[1.125rem]"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-marca-50 text-marca-700 ring-1 ring-marca-100">
        <Icone className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1 pt-0.5">
        <span className="block font-semibold leading-snug text-stone-900">{titulo}</span>
        {descricao && <span className="mt-0.5 block text-sm leading-snug text-stone-500">{descricao}</span>}
      </span>
      {temSelo && (
        <span
          className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ring-1 ${
            alerta ? "bg-amber-50 text-amber-800 ring-amber-200" : "bg-stone-100 text-stone-600 ring-stone-200"
          }`}
        >
          {selo}
        </span>
      )}
      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-stone-400 transition group-hover:translate-x-0.5 group-hover:text-marca-700" aria-hidden />
    </Link>
  );
}
