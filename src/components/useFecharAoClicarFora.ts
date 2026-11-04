"use client";

import { useEffect, type RefObject } from "react";

/** Fecha um menu/popover ao clicar fora dele ou apertar Esc. */
export function useFecharAoClicarFora(aberto: boolean, ref: RefObject<HTMLElement | null>, fechar: () => void) {
  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && fechar();
    const esc = (e: KeyboardEvent) => e.key === "Escape" && fechar();
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [aberto, ref, fechar]);
}
