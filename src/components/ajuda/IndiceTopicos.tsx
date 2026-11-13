"use client";

import { useEffect, useState } from "react";

/**
 * Índice dos tópicos da seção (computador, ao lado do texto): marca o tópico que está na tela
 * (aria-current) conforme a pessoa rola ou abre um link com #âncora.
 */
export function IndiceTopicos({ topicos }: { topicos: { id: string; titulo: string }[] }) {
  const [atual, setAtual] = useState<string | null>(null);

  useEffect(() => {
    const visiveis = new Set<string>();
    const escolher = () => {
      const primeiro = topicos.find((t) => visiveis.has(t.id));
      if (primeiro) setAtual(primeiro.id);
    };
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (e.isIntersecting) visiveis.add(e.target.id);
          else visiveis.delete(e.target.id);
        }
        escolher();
      },
      // Faixa de cima da tela (abaixo do topo fixo)
      { rootMargin: "-80px 0px -55% 0px" },
    );
    for (const t of topicos) {
      const el = document.getElementById(t.id);
      if (el) observador.observe(el);
    }
    const doHash = () => {
      const id = window.location.hash.slice(1);
      if (topicos.some((t) => t.id === id)) setAtual(id);
    };
    doHash();
    window.addEventListener("hashchange", doHash);
    return () => {
      observador.disconnect();
      window.removeEventListener("hashchange", doHash);
    };
  }, [topicos]);

  return (
    <nav aria-label="Tópicos desta seção">
      <p className="mb-2 px-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-stone-400">Nesta seção</p>
      <ul className="space-y-0.5 border-l border-stone-200">
        {topicos.map((t) => {
          const ativo = t.id === atual;
          return (
            <li key={t.id}>
              <a
                href={`#${t.id}`}
                aria-current={ativo ? "location" : undefined}
                className={`-ml-px block border-l-2 py-1.5 pl-3 pr-2 text-sm leading-snug transition ${
                  ativo ? "border-marca-600 font-semibold text-marca-800" : "border-transparent text-stone-500 hover:border-stone-300 hover:text-stone-800"
                }`}
              >
                {t.titulo}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
