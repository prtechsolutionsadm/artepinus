"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CircleHelp } from "lucide-react";

/** Endereço da ajuda da tela `de` (caminho + busca): /ajuda/tela escolhe a parte do manual. */
export function linkAjudaDaTela(de: string) {
  return de.startsWith("/ajuda") ? "/ajuda" : `/ajuda/tela?de=${encodeURIComponent(de)}`;
}

/**
 * Botão "?" do topo: abre a parte do manual que explica a tela atual (com "Voltar para a tela").
 * A busca do endereço (ex.: a aba do cadastro) é lida só no clique, para não depender de useSearchParams.
 */
export function BotaoAjuda({ className = "" }: { className?: string }) {
  const path = usePathname();
  const router = useRouter();
  return (
    <Link
      href={linkAjudaDaTela(path)}
      prefetch={false}
      onClick={(e) => {
        const busca = window.location.search;
        if (!busca || path.startsWith("/ajuda") || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        router.push(linkAjudaDaTela(path + busca));
      }}
      aria-label="Ajuda desta tela"
      title="Ajuda desta tela"
      className={`grid h-10 w-10 place-items-center rounded-full text-stone-600 hover:bg-stone-100 ${className}`}
    >
      <CircleHelp className="h-5 w-5" />
    </Link>
  );
}
