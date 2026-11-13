"use client";

import { useEffect, useRef, useState } from "react";
import { ImageOff } from "lucide-react";
import type { Captura } from "@/lib/manual/tipos";

/** Tamanho da captura (só para reservar o espaço antes de carregar). */
const TAMANHO = { celular: [390, 844], computador: [1280, 800] } as const;

/**
 * Captura de tela do manual (public/ajuda/<arquivo>), carregada só quando chega perto da tela.
 * Se o arquivo ainda não existe, aparece um quadro com a legenda no lugar da imagem.
 */
export function ImagemManual({ imagem }: { imagem: Captura }) {
  const ref = useRef<HTMLImageElement>(null);
  const [falhou, setFalhou] = useState(false);
  const tela = imagem.tela ?? "celular";
  const [largura, altura] = TAMANHO[tela];

  // Erro antes de a página ficar interativa não dispara onError: confere na montagem
  useEffect(() => {
    const el = ref.current;
    if (el?.complete && el.naturalWidth === 0) setFalhou(true);
  }, []);

  return (
    <figure className="sem-quebra my-1">
      {falhou ? (
        <div
          role="img"
          aria-label={`Imagem ainda não disponível: ${imagem.legenda}`}
          className={`grid place-items-center gap-2 rounded-xl border border-dashed border-stone-300 bg-stone-50 px-4 py-8 text-center text-sm text-stone-500 ${
            tela === "celular" ? "max-w-xs" : "w-full"
          }`}
        >
          <ImageOff className="h-6 w-6 text-stone-400" aria-hidden />
          <span>Imagem da tela em preparação</span>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={ref}
          src={`/ajuda/${imagem.arquivo}`}
          alt={imagem.legenda}
          width={largura}
          height={altura}
          loading="lazy"
          decoding="async"
          onError={() => setFalhou(true)}
          className={`h-auto rounded-xl border border-stone-200 bg-stone-50 shadow-sm ${tela === "celular" ? "w-full max-w-[17rem]" : "w-full max-w-3xl"}`}
        />
      )}
      <figcaption className="mt-1.5 text-sm text-stone-500">{imagem.legenda}</figcaption>
    </figure>
  );
}
