"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/** Área que rola no computador (entre o topo e o rodapé fixos): o #conteudo dos layouts. */
export const ID_CONTEUDO = "conteudo";

/** Rola para o alto da tela: a área do conteúdo no computador, a janela no celular. */
export function rolarParaOTopo() {
  const area = document.getElementById(ID_CONTEUDO);
  if (area && area.scrollHeight > area.clientHeight) area.scrollTo({ top: 0, behavior: "smooth" });
  else window.scrollTo({ top: 0, behavior: "smooth" });
}

/**
 * No computador a página não rola: só a área do conteúdo (o rodapé fica sempre à vista). O navegador só
 * lembra a rolagem da janela, então a da área vai no history.state de cada tela (junto do estado do Next):
 * ao voltar (← Voltar ou o botão do navegador) ou recarregar, a lista reabre onde estava.
 */
export function RolagemConteudo() {
  const path = usePathname();
  const busca = useSearchParams().toString();
  // Ao abrir uma tela, a entrada do histórico já é a dela (o Next grava antes dos efeitos): só as telas
  // já visitadas (voltar/avançar ou recarregar) têm a posição guardada; telas novas abrem no alto.
  useEffect(() => {
    const salvo = (history.state as { rolagemConteudo?: unknown } | null)?.rolagemConteudo;
    const topo = typeof salvo === "number" && salvo > 0 ? salvo : null;
    const area = document.getElementById(ID_CONTEUDO);
    if (topo == null || !area) return;
    // A tela pode chegar aos poucos (carregando…): tenta até ela ter altura para isso, por até 3 s
    const fim = Date.now() + 3000;
    let quadro = 0;
    const tentar = () => {
      if (area.scrollHeight - area.clientHeight >= topo || Date.now() > fim) {
        area.scrollTo({ top: topo });
        return;
      }
      quadro = requestAnimationFrame(tentar);
    };
    quadro = requestAnimationFrame(tentar);
    return () => cancelAnimationFrame(quadro);
  }, [path, busca]);

  // Guarda a posição na entrada atual do histórico (a da tela que está aberta)
  useEffect(() => {
    const area = document.getElementById(ID_CONTEUDO);
    if (!area) return;
    let espera: number | undefined;
    const aoRolar = () => {
      clearTimeout(espera);
      const endereco = location.href;
      espera = window.setTimeout(() => {
        if (location.href !== endereco) return; // trocou de tela no meio: não grava na tela nova
        try {
          history.replaceState({ ...history.state, rolagemConteudo: Math.round(area.scrollTop) }, "");
        } catch {}
      }, 150);
    };
    area.addEventListener("scroll", aoRolar, { passive: true });
    return () => {
      clearTimeout(espera);
      area.removeEventListener("scroll", aoRolar);
    };
  }, []);

  return null;
}
