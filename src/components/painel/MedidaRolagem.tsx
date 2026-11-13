"use client";

import { useEffect } from "react";

/**
 * Guarda em `--barra-rolagem` (no <html>) a largura da barra de rolagem da janela (0 no celular e no
 * Mac). O utilitário `sangria` (FaixaPainel) desconta essa largura para a faixa ir só até a borda
 * visível, com os dois cantos arredondados. Sem a medida, a faixa passa por baixo da barra e o
 * excesso é cortado pelo `overflow-x-clip` do layout: o texto continua alinhado.
 */
export function MedidaRolagem() {
  useEffect(() => {
    const raiz = document.documentElement;
    const medir = () => raiz.style.setProperty("--barra-rolagem", `${Math.max(0, window.innerWidth - raiz.clientWidth)}px`);
    medir();
    // A barra aparece/some quando a página cresce ou encolhe: a largura do <html> muda junto
    const obs = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(medir);
    obs?.observe(raiz);
    window.addEventListener("resize", medir);
    return () => {
      obs?.disconnect();
      window.removeEventListener("resize", medir);
      raiz.style.removeProperty("--barra-rolagem");
    };
  }, []);
  return null;
}
