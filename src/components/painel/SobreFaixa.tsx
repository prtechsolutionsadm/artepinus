import type { ReactNode } from "react";

/**
 * Puxa o conteúdo para cima, por cima da parte de baixo da <FaixaPainel> (logo antes dele).
 * É só o invólucro: o conteúdo traz o próprio fundo, normalmente um cartão branco de resumo
 * (ex.: `<SobreFaixa><div className="cartao shadow-xl">…</div></SobreFaixa>`). No papel não sobe.
 */
export function SobreFaixa({ children }: { children: ReactNode }) {
  return <div className="relative z-10 -mt-10 sm:-mt-11 lg:-mt-14 print:mt-0">{children}</div>;
}
