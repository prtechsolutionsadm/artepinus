"use client";

import { useEffect, type RefObject } from "react";

/** Fecha um menu/popover ao clicar fora dele ou apertar Esc. */
export function useFecharAoClicarFora(aberto: boolean, ref: RefObject<HTMLElement | null>, fechar: () => void) {
  useEffect(() => {
    if (!aberto) return;
    // pointerdown (e não mousedown): no iOS o toque fora de algo "clicável" não gera mousedown
    const fora = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && fechar();
    const esc = (e: KeyboardEvent) => e.key === "Escape" && fechar();
    document.addEventListener("pointerdown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [aberto, ref, fechar]);
}
